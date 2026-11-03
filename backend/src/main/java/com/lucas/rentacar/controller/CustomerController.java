package com.lucas.rentacar.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.web.PagedModel;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lucas.rentacar.dto.customer.CustomerResponse;
import com.lucas.rentacar.dto.customer.CustomerUpdateRequest;
import com.lucas.rentacar.service.CustomerService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

/**
 * Customer CRUD (create is POST /api/auth/register).
 * /me endpoints are for CUSTOMER; list and find by id are for AGENT
 * (access rules in SecurityConfig).
 */
@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @GetMapping("/me")
    public CustomerResponse findMe(Authentication authentication) {
        return customerService.findByEmail(authentication.getName());
    }

    @PutMapping("/me")
    public CustomerResponse updateMe(
            Authentication authentication,
            @Valid @RequestBody CustomerUpdateRequest request) {

        return customerService.update(authentication.getName(), request);
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteMe(
            Authentication authentication,
            HttpServletRequest request,
            HttpServletResponse response) {

        customerService.delete(authentication.getName());

        // The account is gone: end the current session too.
        new SecurityContextLogoutHandler().logout(request, response, authentication);

        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public PagedModel<CustomerResponse> findAll(
            @PageableDefault(size = 20, sort = "name") Pageable pageable) {

        return new PagedModel<>(customerService.findAll(pageable));
    }

    @GetMapping("/{id}")
    public CustomerResponse findById(@PathVariable Long id) {
        return customerService.findById(id);
    }
}
