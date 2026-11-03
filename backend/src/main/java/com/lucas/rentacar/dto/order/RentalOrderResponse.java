package com.lucas.rentacar.dto.order;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import com.lucas.rentacar.dto.car.CarResponse;
import com.lucas.rentacar.enums.OrderStatus;

public record RentalOrderResponse(
        Long id,
        OrderStatus status,
        LocalDate startDate,
        LocalDate endDate,
        long days,
        BigDecimal dailyRate,
        BigDecimal totalAmount,
        CarResponse car,
        PartyResponse customer,
        String agentOpinion,
        PartyResponse evaluatedBy,
        Instant evaluatedAt,
        Instant createdAt,
        Instant updatedAt) {

    /** Id and name of a customer or agent. */
    public record PartyResponse(Long id, String name) {
    }
}
