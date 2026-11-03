package com.lucas.rentacar.dto.order;

import java.time.LocalDate;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;

/**
 * Create or change an order. endDate is the return date and must be after
 * startDate (checked in RentalOrderService).
 */
public record RentalOrderRequest(
        @NotNull(message = "Car is required.")
        Long carId,

        @NotNull(message = "Start date is required.")
        @FutureOrPresent(message = "Start date must be today or later.")
        LocalDate startDate,

        @NotNull(message = "End date is required.")
        LocalDate endDate) {
}
