package com.giannis.eshop.controller;

import com.giannis.eshop.dto.CourierResponse;
import com.giannis.eshop.dto.UpdateCourierRequest;
import com.giannis.eshop.service.CourierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Public listing of enabled couriers for the checkout picker, plus
 * admin endpoints to list all and update price/availability.
 * Authorisation is wired in SecurityConfig.
 */
@RestController
@RequiredArgsConstructor
public class CourierController {

    private final CourierService service;

    /** Public — checkout shows only enabled couriers. */
    @GetMapping("/api/couriers")
    public List<CourierResponse> listEnabled() {
        return service.findEnabled();
    }

    /** Admin — full list for the management table. */
    @GetMapping("/api/admin/couriers")
    public List<CourierResponse> listAll() {
        return service.findAll();
    }

    /** Admin — update one courier's price + enabled flag. */
    @PatchMapping("/api/admin/couriers/{id}")
    public CourierResponse update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCourierRequest req
    ) {
        return service.update(id, req);
    }
}
