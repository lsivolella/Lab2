package com.lucas.rentacar.service;

import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.lucas.rentacar.dto.auth.RegisterRequest;
import com.lucas.rentacar.dto.user.UserResponse;
import com.lucas.rentacar.enums.Role;
import com.lucas.rentacar.model.User;
import com.lucas.rentacar.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserResponse create(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        String cpf = normalizeCpf(request.cpf());

        ensureUniqueData(email, cpf);

        User user = createUser(request, email, cpf);
        User savedUser = userRepository.save(user);

        return toResponse(savedUser);
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeCpf(String cpf) {
        return cpf.replaceAll("\\D", "");
    }

    private void ensureUniqueData(String email, String cpf) {
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "E-mail já cadastrado.");
        }

        if (userRepository.existsByCpf(cpf)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "CPF já cadastrado.");
        }
    }

    private User createUser(
            RegisterRequest request,
            String email,
            String cpf) {

        User user = new User();

        user.setName(request.name().trim());
        user.setEmail(email);
        user.setCpf(cpf);
        user.setPasswordHash(
                passwordEncoder.encode(request.password()));
        user.setRole(Role.CUSTOMER);

        return user;
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole());
    }
}
