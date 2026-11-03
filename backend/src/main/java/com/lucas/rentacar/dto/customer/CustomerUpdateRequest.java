package com.lucas.rentacar.dto.customer;

import java.util.List;

import com.lucas.rentacar.model.Customer;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Profile data a customer can change. CPF and email are fixed after
 * registration; the password has its own endpoint.
 */
public record CustomerUpdateRequest(
        @NotBlank(message = "Name is required.")
        @Size(max = 150, message = "Name must be at most 150 characters.")
        String name,

        @NotBlank(message = "RG is required.")
        @Size(max = 20, message = "RG must be at most 20 characters.")
        String rg,

        @NotBlank(message = "Profession is required.")
        @Size(max = 100, message = "Profession must be at most 100 characters.")
        String profession,

        @NotNull(message = "Address is required.")
        @Valid
        AddressRequest address,

        @Size(max = Customer.MAX_INCOMES, message = "At most 3 incomes are allowed.")
        List<@NotNull(message = "Income must not be null.") @Valid EmploymentIncomeRequest> incomes) {
}
