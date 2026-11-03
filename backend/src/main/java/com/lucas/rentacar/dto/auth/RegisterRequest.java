package com.lucas.rentacar.dto.auth;

import java.util.List;

import org.hibernate.validator.constraints.br.CPF;

import com.lucas.rentacar.dto.customer.AddressRequest;
import com.lucas.rentacar.dto.customer.EmploymentIncomeRequest;
import com.lucas.rentacar.model.Customer;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Name is required.")
        @Size(max = 150, message = "Name must be at most 150 characters.")
        String name,

        @NotBlank(message = "RG is required.")
        @Size(max = 20, message = "RG must be at most 20 characters.")
        String rg,

        @NotBlank(message = "CPF is required.")
        @Pattern(regexp = "\\d{11}", message = "CPF must contain exactly 11 digits.")
        @CPF(message = "Invalid CPF.")
        String cpf,

        @NotBlank(message = "Profession is required.")
        @Size(max = 100, message = "Profession must be at most 100 characters.")
        String profession,

        @NotNull(message = "Address is required.")
        @Valid
        AddressRequest address,

        @Size(max = Customer.MAX_INCOMES, message = "At most 3 incomes are allowed.")
        List<@NotNull(message = "Income must not be null.") @Valid EmploymentIncomeRequest> incomes,

        @NotBlank(message = "Email is required.")
        @Email(message = "Invalid email.")
        @Size(max = 254, message = "Email must be at most 254 characters.")
        String email,

        @NotBlank(message = "Password is required.")
        @Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters.")
        String password) {
}
