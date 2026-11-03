package com.lucas.rentacar.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lucas.rentacar.model.Agent;

public interface AgentRepository extends JpaRepository<Agent, Long> {
    boolean existsByCnpj(String cnpj);
}
