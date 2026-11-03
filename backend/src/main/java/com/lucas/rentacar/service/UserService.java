package com.lucas.rentacar.service;

import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.lucas.rentacar.dto.user.ChangePasswordRequest;
import com.lucas.rentacar.dto.user.UserResponse;
import com.lucas.rentacar.model.Agent;
import com.lucas.rentacar.model.Customer;
import com.lucas.rentacar.model.User;
import com.lucas.rentacar.repository.AgentRepository;
import com.lucas.rentacar.repository.CustomerRepository;
import com.lucas.rentacar.repository.UserRepository;

/**
 * Account data shared by customers and agents (login identity and password).
 * Customer registration and profile live in CustomerService.
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final AgentRepository agentRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            CustomerRepository customerRepository,
            AgentRepository agentRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.agentRepository = agentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public UserResponse findByEmail(String email) {
        User user = findUser(email);

        return new UserResponse(
                user.getId(),
                findProfileName(user),
                user.getEmail(),
                user.getRole());
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = findUser(email);

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Current password is incorrect.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
    }

    public static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private User findUser(String email) {
        return userRepository.findByEmail(normalizeEmail(email))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found."));
    }

    private String findProfileName(User user) {
        return switch (user.getRole()) {
            case CUSTOMER -> customerRepository.findByUserId(user.getId())
                    .map(Customer::getName)
                    .orElseThrow(() -> missingProfile(user));
            case AGENT -> agentRepository.findByUserId(user.getId())
                    .map(Agent::getName)
                    .orElseThrow(() -> missingProfile(user));
        };
    }

    private IllegalStateException missingProfile(User user) {
        return new IllegalStateException(
                "No " + user.getRole() + " profile for user " + user.getId() + ".");
    }
}
