package com.lucas.rentacar.dto.car;

import java.math.BigDecimal;

public record CarResponse(
        Long id,
        String registration,
        Integer year,
        String brand,
        String model,
        String plate,
        BigDecimal dailyRate,
        OwnerResponse owner) {

    /** Company agent that owns the car. */
    public record OwnerResponse(Long id, String name) {
    }
}
