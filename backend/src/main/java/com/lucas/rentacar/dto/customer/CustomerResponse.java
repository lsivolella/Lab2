package com.lucas.rentacar.dto.customer;

import java.math.BigDecimal;
import java.util.List;

public record CustomerResponse(
        Long id,
        String name,
        String email,
        String rg,
        String cpf,
        String profession,
        AddressResponse address,
        List<EmploymentIncomeResponse> incomes) {

    public record AddressResponse(
            String street,
            String number,
            String complement,
            String district,
            String city,
            String state,
            String zipCode) {
    }

    public record EmploymentIncomeResponse(
            String employer,
            BigDecimal amount) {
    }
}
