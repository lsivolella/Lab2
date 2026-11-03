package com.lucas.rentacar.dto.car;

import java.math.BigDecimal;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CarRequest(
        @NotBlank(message = "Registration is required.")
        @Pattern(regexp = "\\d{11}", message = "Registration (RENAVAM) must contain exactly 11 digits.")
        String registration,

        @NotNull(message = "Year is required.")
        @Min(value = 1950, message = "Year must be 1950 or later.")
        @Max(value = 2100, message = "Year must be 2100 or earlier.")
        Integer year,

        @NotBlank(message = "Brand is required.")
        @Size(max = 50, message = "Brand must be at most 50 characters.")
        String brand,

        @NotBlank(message = "Model is required.")
        @Size(max = 50, message = "Model must be at most 50 characters.")
        String model,

        // Old (ABC1234) or Mercosul (ABC1D23) format, uppercase, no hyphen.
        @NotBlank(message = "Plate is required.")
        @Pattern(regexp = "[A-Z]{3}\\d[A-Z0-9]\\d{2}", message = "Plate must look like ABC1234 or ABC1D23.")
        String plate,

        @NotNull(message = "Daily rate is required.")
        @Positive(message = "Daily rate must be greater than zero.")
        @Digits(integer = 8, fraction = 2, message = "Daily rate must have up to 8 digits and 2 decimals.")
        BigDecimal dailyRate) {
}
