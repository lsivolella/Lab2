package com.lucas.rentacar.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lucas.rentacar.model.Agent;

public interface AgentRepository extends JpaRepository<Agent, Long> {
    boolean existsByCnpj(String cnpj);

    Optional<Agent> findByUserId(Long userId);

    Optional<Agent> findByUserEmail(String email);

    Optional<Agent> findByCnpj(String cnpj);
}
