package com.lucas.rentacar.config;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.lucas.rentacar.enums.AgentType;
import com.lucas.rentacar.model.Agent;
import com.lucas.rentacar.model.Car;
import com.lucas.rentacar.repository.AgentRepository;
import com.lucas.rentacar.repository.CarRepository;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

/**
 * Creates the initial fleet listed in seed/cars.json on startup, after the
 * agents (see AgentSeeder). Each car belongs to the company agent with the
 * given CNPJ; its image lives in frontend/public/cars and imageUrl is the path
 * the frontend serves it at. Cars whose plate or registration already exists
 * are left untouched.
 */
@Component
@Order(2)
public class CarSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(CarSeeder.class);
    private static final String SEED_FILE = "seed/cars.json";

    private final CarRepository carRepository;
    private final AgentRepository agentRepository;
    private final ObjectMapper objectMapper;

    public CarSeeder(
            CarRepository carRepository,
            AgentRepository agentRepository,
            ObjectMapper objectMapper) {
        this.carRepository = carRepository;
        this.agentRepository = agentRepository;
        this.objectMapper = objectMapper;
    }

    record SeedCar(
            String registration,
            Integer year,
            String brand,
            String model,
            String plate,
            BigDecimal dailyRate,
            String imageUrl,
            String ownerCnpj) {
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws IOException {
        int created = 0;

        for (SeedCar seed : readSeedFile()) {
            if (seed(seed)) {
                created++;
            }
        }

        if (created > 0) {
            log.info("Seed cars created: {}.", created);
        }
    }

    private List<SeedCar> readSeedFile() throws IOException {
        ClassPathResource resource = new ClassPathResource(SEED_FILE);

        if (!resource.exists()) {
            log.warn("Skipping car seed: {} not found.", SEED_FILE);
            return List.of();
        }

        try (InputStream input = resource.getInputStream()) {
            return objectMapper.readValue(input, new TypeReference<List<SeedCar>>() {
            });
        }
    }

    private boolean seed(SeedCar seed) {
        if (carRepository.existsByPlate(seed.plate())
                || carRepository.existsByRegistration(seed.registration())) {
            return false;
        }

        Agent owner = agentRepository.findByCnpj(seed.ownerCnpj())
                .filter(agent -> agent.getType() == AgentType.COMPANY)
                .orElse(null);

        if (owner == null) {
            log.warn("Skipping seed car {}: no company agent with CNPJ {}.", seed.plate(), seed.ownerCnpj());
            return false;
        }

        Car car = new Car();

        car.setOwner(owner);
        car.setRegistration(seed.registration());
        car.setYear(seed.year());
        car.setBrand(seed.brand());
        car.setModel(seed.model());
        car.setPlate(seed.plate());
        car.setDailyRate(seed.dailyRate());
        car.setImageUrl(seed.imageUrl());

        carRepository.save(car);

        return true;
    }
}
