package com.lucas.rentacar.dto.order;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** The agent's financial opinion ("parecer") on a submitted order. */
public record OrderEvaluationRequest(
        @NotNull(message = "Approved is required.")
        Boolean approved,

        @NotBlank(message = "Opinion is required.")
        @Size(max = 1000, message = "Opinion must be at most 1000 characters.")
        String opinion) {
}
