package com.lucas.rentacar.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lucas.rentacar.dto.address.AddressLookupResponse;
import com.lucas.rentacar.service.AddressLookupService;

/**
 * ZIP code (CEP) lookup used to fill in address forms. Public, because the
 * registration form needs it before the user has an account.
 */
@RestController
@RequestMapping("/api/addresses")
public class AddressController {

    private final AddressLookupService addressLookupService;

    public AddressController(AddressLookupService addressLookupService) {
        this.addressLookupService = addressLookupService;
    }

    @GetMapping("/{zipCode}")
    public AddressLookupResponse findByZipCode(@PathVariable String zipCode) {
        return addressLookupService.findByZipCode(zipCode);
    }
}
