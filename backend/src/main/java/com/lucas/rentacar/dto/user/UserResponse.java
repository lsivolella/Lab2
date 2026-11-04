package com.lucas.rentacar.dto.user;

import com.lucas.rentacar.enums.AgentType;
import com.lucas.rentacar.enums.Role;

/**
 * The logged-in user. agent is null for customers; for agents it tells the
 * frontend which actions apply (banks evaluate credit, companies own cars).
 */
public record UserResponse(
        Long id,
        String name,
        String email,
        Role role,
        AgentProfile agent) {

    /** Agent id (as in car.owner.id) and whether it is a company or a bank. */
    public record AgentProfile(Long id, AgentType type) {
    }
}
