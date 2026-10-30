package com.lucas.rentacar.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Nome é obrigatório.") @Size(max = 150) String name,
        @NotBlank @Pattern(regexp = "\\d{11}", message = "CPF deve conter 11 dígitos.") String cpf,
        @NotBlank(message = "E-mail é obrigatório.") @Email(message = "E-mail inválido.") @Size(max = 254) String email,
        @NotBlank(message = "Senha é obrigatória") @Size(min = 8, max = 72, message = "A senha deve ter entre 8 e 72 caracteres.") String password) {
}
