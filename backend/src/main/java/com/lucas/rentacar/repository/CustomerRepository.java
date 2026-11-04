package com.lucas.rentacar.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.lucas.rentacar.model.Customer;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    boolean existsByCpf(String cpf);

    Optional<Customer> findByUserId(Long userId);

    /** Includes soft-deleted accounts. */
    Optional<Customer> findByUserEmail(String email);

    Optional<Customer> findByUserEmailAndUserDeletedAtIsNull(String email);

    Optional<Customer> findByIdAndUserDeletedAtIsNull(Long id);

    Page<Customer> findAllByUserDeletedAtIsNull(Pageable pageable);
}
