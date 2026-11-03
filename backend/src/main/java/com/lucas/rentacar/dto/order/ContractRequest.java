package com.lucas.rentacar.dto.order;

import com.lucas.rentacar.enums.OwnershipType;

import jakarta.validation.constraints.NotNull;

/**
 * Executes the contract of an approved order. BANK ownership requires a credit
 * contract (checked in RentalOrderService).
 */
public record ContractRequest(
        @NotNull(message = "Ownership type is required.")
        OwnershipType ownershipType) {
}
