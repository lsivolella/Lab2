package com.lucas.rentacar.dto.order;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/** Credit conditions set by the bank when it approves an order. */
public record CreditTermsRequest(
        @NotNull(message = "Monthly interest rate is required.")
        @DecimalMin(value = "0.00", message = "Monthly interest rate must be 0 or more.")
        @DecimalMax(value = "20.00", message = "Monthly interest rate must be at most 20%.")
        @Digits(integer = 2, fraction = 2, message = "Monthly interest rate must have up to 2 decimals.")
        BigDecimal monthlyInterestRate,

        @NotNull(message = "Installments are required.")
        @Min(value = 1, message = "Installments must be at least 1.")
        @Max(value = 60, message = "Installments must be at most 60.")
        Integer installments) {
}
