package com.lucas.rentacar.dto.order;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import com.lucas.rentacar.dto.car.CarResponse;
import com.lucas.rentacar.enums.ContractPhase;
import com.lucas.rentacar.enums.OrderStatus;
import com.lucas.rentacar.enums.OwnershipType;

public record RentalOrderResponse(
        Long id,
        OrderStatus status,
        /** Only for CONTRACTED orders (null otherwise); calculated from the dates. */
        ContractPhase contractPhase,
        LocalDate startDate,
        LocalDate endDate,
        long days,
        BigDecimal dailyRate,
        BigDecimal totalAmount,
        boolean creditRequested,
        CarResponse car,
        PartyResponse customer,
        String agentOpinion,
        PartyResponse evaluatedBy,
        Instant evaluatedAt,
        CreditContractResponse creditContract,
        ContractResponse contract,
        Instant createdAt,
        Instant updatedAt) {

    /** Id and name of a customer or agent. */
    public record PartyResponse(Long id, String name) {
    }

    public record CreditContractResponse(
            Long id,
            PartyResponse bank,
            BigDecimal amount,
            BigDecimal monthlyInterestRate,
            Integer installments,
            BigDecimal installmentAmount,
            Instant createdAt) {
    }

    /** owner is who the car is registered to under this contract. */
    public record ContractResponse(
            Long id,
            OwnershipType ownershipType,
            PartyResponse owner,
            PartyResponse executedBy,
            Instant signedAt) {
    }
}
