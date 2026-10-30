package com.lucas.rentacar.dto.user;

import com.lucas.rentacar.enums.Role;

public record UserResponse(
        Long id,
        String name,
        String email,
        Role role) {
}
