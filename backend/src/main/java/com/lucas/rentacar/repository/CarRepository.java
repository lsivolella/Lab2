package com.lucas.rentacar.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.lucas.rentacar.model.Car;

public interface CarRepository extends JpaRepository<Car, Long> {
    boolean existsByPlate(String plate);

    boolean existsByRegistration(String registration);

    boolean existsByPlateAndIdNot(String plate, Long id);

    boolean existsByRegistrationAndIdNot(String registration, Long id);

    Optional<Car> findByIdAndDeletedAtIsNull(Long id);

    Page<Car> findAllByDeletedAtIsNull(Pageable pageable);

    Page<Car> findAllByOwnerIdAndDeletedAtIsNull(Long ownerId, Pageable pageable);
}
