package com.lucas.rentacar.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lucas.rentacar.model.User;

public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmail(String email);
}
