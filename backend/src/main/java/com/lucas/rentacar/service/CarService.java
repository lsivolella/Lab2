package com.lucas.rentacar.service;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.lucas.rentacar.dto.car.CarRequest;
import com.lucas.rentacar.dto.car.CarResponse;
import com.lucas.rentacar.dto.car.CarResponse.OwnerResponse;
import com.lucas.rentacar.enums.AgentType;
import com.lucas.rentacar.enums.OrderStatus;
import com.lucas.rentacar.model.Agent;
import com.lucas.rentacar.model.Car;
import com.lucas.rentacar.repository.AgentRepository;
import com.lucas.rentacar.repository.CarRepository;
import com.lucas.rentacar.repository.RentalOrderRepository;

/**
 * Fleet CRUD. Only company agents register cars, and each company changes or
 * deletes only its own (including the car image). Deleting is a soft delete
 * and is refused while the car has orders in progress.
 */
@Service
public class CarService {

    private static final long MAX_IMAGE_BYTES = 2L * 1024 * 1024;

    private final CarRepository carRepository;
    private final AgentRepository agentRepository;
    private final RentalOrderRepository rentalOrderRepository;
    private final ImageStorageService imageStorageService;

    public CarService(
            CarRepository carRepository,
            AgentRepository agentRepository,
            RentalOrderRepository rentalOrderRepository,
            ImageStorageService imageStorageService) {
        this.carRepository = carRepository;
        this.agentRepository = agentRepository;
        this.rentalOrderRepository = rentalOrderRepository;
        this.imageStorageService = imageStorageService;
    }

    @Transactional
    public CarResponse create(String email, CarRequest request) {
        Agent company = findCompany(email);

        if (carRepository.existsByPlate(request.plate())) {
            throw conflict("Plate already registered.");
        }

        if (carRepository.existsByRegistration(request.registration())) {
            throw conflict("Registration already registered.");
        }

        Car car = new Car();
        car.setOwner(company);
        apply(car, request);

        return toResponse(carRepository.save(car));
    }

    @Transactional(readOnly = true)
    public Page<CarResponse> findAll(Pageable pageable) {
        return carRepository.findAllByDeletedAtIsNull(pageable)
                .map(CarService::toResponse);
    }

    /** The fleet of the logged-in company. */
    @Transactional(readOnly = true)
    public Page<CarResponse> findMine(String email, Pageable pageable) {
        Agent company = findCompany(email);

        return carRepository.findAllByOwnerIdAndDeletedAtIsNull(company.getId(), pageable)
                .map(CarService::toResponse);
    }

    @Transactional(readOnly = true)
    public CarResponse findById(Long id) {
        return toResponse(findActive(id));
    }

    @Transactional
    public CarResponse update(String email, Long id, CarRequest request) {
        Car car = findOwned(email, id);

        if (carRepository.existsByPlateAndIdNot(request.plate(), id)) {
            throw conflict("Plate already registered.");
        }

        if (carRepository.existsByRegistrationAndIdNot(request.registration(), id)) {
            throw conflict("Registration already registered.");
        }

        apply(car, request);

        return toResponse(car);
    }

    /**
     * Replaces the car's image. Accepts JPEG, PNG or WebP (detected from the
     * file content); the size limit is enforced by spring.servlet.multipart.
     * A previous uploaded image is deleted from storage; seed images are kept.
     */
    @Transactional
    public CarResponse updateImage(String email, Long id, MultipartFile file) {
        Car car = findOwned(email, id);
        byte[] bytes = readImage(file);
        ImageType type = ImageType.detect(bytes)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Image must be a JPEG, PNG or WebP file."));

        String previousUrl = car.getImageUrl();

        car.setImageUrl(imageStorageService.upload("cars/" + car.getId(), bytes, type));
        imageStorageService.deleteIfStored(previousUrl);

        return toResponse(car);
    }

    @Transactional
    public void delete(String email, Long id) {
        Car car = findOwned(email, id);

        // Orders whose rental already ended (e.g. finished contracts) do not block it.
        if (rentalOrderRepository.existsInProgress(id, OrderStatus.ACTIVE, LocalDate.now())) {
            throw conflict("Car has orders in progress.");
        }

        car.setDeletedAt(Instant.now());
    }

    Car findActive(Long id) {
        return carRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Car not found."));
    }

    static CarResponse toResponse(Car car) {
        Agent owner = car.getOwner();

        return new CarResponse(
                car.getId(),
                car.getRegistration(),
                car.getYear(),
                car.getBrand(),
                car.getModel(),
                car.getPlate(),
                car.getDailyRate(),
                car.getImageUrl(),
                new OwnerResponse(owner.getId(), owner.getName()));
    }

    private Car findOwned(String email, Long id) {
        Agent company = findCompany(email);
        Car car = findActive(id);

        if (!car.getOwner().getId().equals(company.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only the owner company can change this car.");
        }

        return car;
    }

    private Agent findCompany(String email) {
        Agent agent = agentRepository.findByUserEmail(UserService.normalizeEmail(email))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Only company agents can manage cars."));

        if (agent.getType() != AgentType.COMPANY) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only company agents can manage cars.");
        }

        return agent;
    }

    private void apply(Car car, CarRequest request) {
        car.setRegistration(request.registration());
        car.setYear(request.year());
        car.setBrand(request.brand().trim());
        car.setModel(request.model().trim());
        car.setPlate(request.plate());
        car.setDailyRate(request.dailyRate());
    }

    private byte[] readImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image file is required.");
        }

        // Same limit as spring.servlet.multipart.max-file-size, checked here too
        // so the rule does not depend only on the servlet configuration.
        if (file.getSize() > MAX_IMAGE_BYTES) {
            throw new ResponseStatusException(HttpStatus.CONTENT_TOO_LARGE, "Image must be at most 2 MB.");
        }

        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image file could not be read.");
        }
    }

    private ResponseStatusException conflict(String reason) {
        return new ResponseStatusException(HttpStatus.CONFLICT, reason);
    }
}
