package com.lucas.rentacar.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UserController {
    @GetMapping("/api/users/me")
    public ResponseEntity<?> me(Authentication authentication) {
        return ResponseEntity.ok(
                Map.of("email", authentication.getName()));
    }
}
