package com.lucas.rentacar.dto.auth;

import org.hibernate.validator.constraints.br.CPF;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Name is required.")
        @Size(max = 150, message = "Name must be at most 150 characters.")
        String name,

        @NotBlank(message = "CPF is required.")
        @Pattern(regexp = "\\d{11}", message = "CPF must contain exactly 11 digits.")
        @CPF(message = "Invalid CPF.")
        String cpf,

        @NotBlank(message = "Email is required.")
        @Email(message = "Invalid email.")
        @Size(max = 254, message = "Email must be at most 254 characters.")
        String email,

        @NotBlank(message = "Password is required.")
        @Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters.")
        String password) {
}
