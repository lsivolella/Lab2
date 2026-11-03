package com.lucas.rentacar.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.web.PagedModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lucas.rentacar.dto.order.OrderEvaluationRequest;
import com.lucas.rentacar.dto.order.RentalOrderRequest;
import com.lucas.rentacar.dto.order.RentalOrderResponse;
import com.lucas.rentacar.enums.OrderStatus;
import com.lucas.rentacar.service.RentalOrderService;

import jakarta.validation.Valid;

/**
 * Rental orders. Customers see only their own orders; agents see all of them.
 * Who can call each action is set in SecurityConfig.
 */
@RestController
@RequestMapping("/api/orders")
public class RentalOrderController {

    private final RentalOrderService rentalOrderService;

    public RentalOrderController(RentalOrderService rentalOrderService) {
        this.rentalOrderService = rentalOrderService;
    }

    @PostMapping
    public ResponseEntity<RentalOrderResponse> create(
            Authentication authentication,
            @Valid @RequestBody RentalOrderRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(rentalOrderService.create(authentication.getName(), request));
    }

    @GetMapping
    public PagedModel<RentalOrderResponse> findAll(
            Authentication authentication,
            @RequestParam(required = false) OrderStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {

        return new PagedModel<>(rentalOrderService.findAll(
                authentication.getName(),
                isAgent(authentication),
                status,
                pageable));
    }

    @GetMapping("/{id}")
    public RentalOrderResponse findById(
            Authentication authentication,
            @PathVariable Long id) {

        return rentalOrderService.findById(
                authentication.getName(),
                isAgent(authentication),
                id);
    }

    @PutMapping("/{id}")
    public RentalOrderResponse update(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody RentalOrderRequest request) {

        return rentalOrderService.update(
                authentication.getName(),
                isAgent(authentication),
                id,
                request);
    }

    @PostMapping("/{id}/cancel")
    public RentalOrderResponse cancel(
            Authentication authentication,
            @PathVariable Long id) {

        return rentalOrderService.cancel(authentication.getName(), id);
    }

    @PostMapping("/{id}/evaluation")
    public RentalOrderResponse evaluate(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody OrderEvaluationRequest request) {

        return rentalOrderService.evaluate(authentication.getName(), id, request);
    }

    @PostMapping("/{id}/contract")
    public RentalOrderResponse contract(
            Authentication authentication,
            @PathVariable Long id) {

        return rentalOrderService.contract(authentication.getName(), id);
    }

    private boolean isAgent(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_AGENT".equals(authority.getAuthority()));
    }
}
