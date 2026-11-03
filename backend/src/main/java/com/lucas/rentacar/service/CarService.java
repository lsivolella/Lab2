package com.lucas.rentacar.service;

import java.time.Instant;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
 * deletes only its own. Deleting is a soft delete and is refused while the car
 * has orders in progress.
 */
@Service
public class CarService {

    private final CarRepository carRepository;
    private final AgentRepository agentRepository;
    private final RentalOrderRepository rentalOrderRepository;

    public CarService(
            CarRepository carRepository,
            AgentRepository agentRepository,
            RentalOrderRepository rentalOrderRepository) {
        this.carRepository = carRepository;
        this.agentRepository = agentRepository;
        this.rentalOrderRepository = rentalOrderRepository;
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

    @Transactional
    public void delete(String email, Long id) {
        Car car = findOwned(email, id);

        if (rentalOrderRepository.existsByCarIdAndStatusIn(id, OrderStatus.ACTIVE)) {
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

    private ResponseStatusException conflict(String reason) {
        return new ResponseStatusException(HttpStatus.CONFLICT, reason);
    }
}
