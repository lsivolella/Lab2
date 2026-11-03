package com.lucas.rentacar.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lucas.rentacar.model.CreditContract;

public interface CreditContractRepository extends JpaRepository<CreditContract, Long> {
}
