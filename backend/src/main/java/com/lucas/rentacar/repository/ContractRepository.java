package com.lucas.rentacar.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lucas.rentacar.model.Contract;

public interface ContractRepository extends JpaRepository<Contract, Long> {
}
