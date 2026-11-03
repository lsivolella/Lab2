package com.lucas.rentacar.dto.customer;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AddressRequest(
        @NotBlank(message = "Street is required.")
        @Size(max = 150, message = "Street must be at most 150 characters.")
        String street,

        @NotBlank(message = "Number is required.")
        @Size(max = 10, message = "Number must be at most 10 characters.")
        String number,

        @Size(max = 100, message = "Complement must be at most 100 characters.")
        String complement,

        @NotBlank(message = "District is required.")
        @Size(max = 100, message = "District must be at most 100 characters.")
        String district,

        @NotBlank(message = "City is required.")
        @Size(max = 100, message = "City must be at most 100 characters.")
        String city,

        @NotBlank(message = "State is required.")
        @Pattern(regexp = "[A-Z]{2}", message = "State must be a 2-letter uppercase code.")
        String state,

        @NotBlank(message = "ZIP code is required.")
        @Pattern(regexp = "\\d{8}", message = "ZIP code must contain exactly 8 digits.")
        String zipCode) {
}
