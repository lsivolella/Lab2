package com.lucas.rentacar.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lucas.rentacar.dto.auth.RegisterRequest;
import com.lucas.rentacar.dto.user.UserResponse;
import com.lucas.rentacar.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/home")
    public String home(
            Authentication authentication) {
        System.out.println("Logged in user: " + authentication.getName());

        return null;
    }

    @GetMapping("/login")
    public String login() {
        return null;
    }

    @PostMapping("/auth/register")
    public ResponseEntity<UserResponse> register(
            @Valid
            @RequestBody
            RegisterRequest request) {

        UserResponse user = userService.create(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(user);

    }
}
