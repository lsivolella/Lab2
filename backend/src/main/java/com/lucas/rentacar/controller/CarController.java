package com.lucas.rentacar.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.web.PagedModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.lucas.rentacar.dto.car.CarRequest;
import com.lucas.rentacar.dto.car.CarResponse;
import com.lucas.rentacar.service.CarService;

import jakarta.validation.Valid;

/**
 * Fleet CRUD. Any logged-in user can read; only agents reach the write
 * endpoints (SecurityConfig), and CarService further limits them to the
 * company that owns the car.
 */
@RestController
@RequestMapping("/api/cars")
public class CarController {

    private final CarService carService;

    public CarController(CarService carService) {
        this.carService = carService;
    }

    @PostMapping
    public ResponseEntity<CarResponse> create(
            Authentication authentication,
            @Valid @RequestBody CarRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(carService.create(authentication.getName(), request));
    }

    @GetMapping
    public PagedModel<CarResponse> findAll(
            @PageableDefault(size = 20, sort = { "brand", "model" }) Pageable pageable) {

        return new PagedModel<>(carService.findAll(pageable));
    }

    @GetMapping("/{id}")
    public CarResponse findById(@PathVariable Long id) {
        return carService.findById(id);
    }

    @PutMapping("/{id}")
    public CarResponse update(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody CarRequest request) {

        return carService.update(authentication.getName(), id, request);
    }

    /** Multipart upload with the image in the "file" part (JPEG, PNG or WebP, up to 2 MB). */
    @PutMapping(path = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public CarResponse updateImage(
            Authentication authentication,
            @PathVariable Long id,
            @RequestPart("file") MultipartFile file) {

        return carService.updateImage(authentication.getName(), id, file);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            Authentication authentication,
            @PathVariable Long id) {

        carService.delete(authentication.getName(), id);

        return ResponseEntity.noContent().build();
    }
}
