package com.lucas.rentacar.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lucas.rentacar.dto.auth.LoginRequest;
import com.lucas.rentacar.dto.auth.RegisterRequest;
import com.lucas.rentacar.dto.user.UserResponse;
import com.lucas.rentacar.service.CustomerService;
import com.lucas.rentacar.service.UserService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

/**
 * Registration and login. Logout is handled by Spring Security's logout
 * filter at POST /api/auth/logout (see SecurityConfig).
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final CustomerService customerService;
    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;

    public AuthController(
            CustomerService customerService,
            UserService userService,
            AuthenticationManager authenticationManager,
            SecurityContextRepository securityContextRepository) {
        this.customerService = customerService;
        this.userService = userService;
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(
            @Valid
            @RequestBody
            RegisterRequest request) {

        UserResponse user = customerService.create(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(user);

    }

    @PostMapping("/login")
    public UserResponse login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        // Throws AuthenticationException on bad credentials (handled as 401).
        Authentication authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(
                        UserService.normalizeEmail(request.email()),
                        request.password()));

        // Prevent session fixation: never reuse a session id from before login.
        if (httpRequest.getSession(false) != null) {
            httpRequest.changeSessionId();
        }

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, httpRequest, httpResponse);

        return userService.findByEmail(authentication.getName());
    }
}
