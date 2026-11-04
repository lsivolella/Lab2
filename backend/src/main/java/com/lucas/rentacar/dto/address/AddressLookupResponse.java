package com.lucas.rentacar.dto.address;

/** Address found for a ZIP code (CEP), in the same shape as AddressRequest. */
public record AddressLookupResponse(
        String zipCode,
        String street,
        String district,
        String city,
        String state) {
}
