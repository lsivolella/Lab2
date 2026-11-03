package com.lucas.rentacar.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lucas.rentacar.model.Customer;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    boolean existsByCpf(String cpf);
}
