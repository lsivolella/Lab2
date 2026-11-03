package com.lucas.rentacar.dto.customer;

import java.math.BigDecimal;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record EmploymentIncomeRequest(
        @NotBlank(message = "Employer is required.")
        @Size(max = 150, message = "Employer must be at most 150 characters.")
        String employer,

        @NotNull(message = "Income amount is required.")
        @Positive(message = "Income amount must be greater than zero.")
        @Digits(integer = 10, fraction = 2, message = "Income amount must have up to 10 digits and 2 decimals.")
        BigDecimal amount) {
}
