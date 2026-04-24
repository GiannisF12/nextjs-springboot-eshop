package com.giannis.eshop.controller;

import com.giannis.eshop.dto.DiscountCodeRequest;
import com.giannis.eshop.dto.DiscountCodeResponse;
import com.giannis.eshop.service.DiscountCodeService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Two surfaces:
 *
 *   - /api/admin/discounts  — admin CRUD (gated to ROLE_ADMIN in SecurityConfig)
 *   - /api/discounts/validate — public lookup the checkout page hits
 *                               before placing the order. Server validates
 *                               again on order creation; this endpoint
 *                               exists only to show the customer the
 *                               discount preview.
 */
@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class DiscountCodeController {

    private final DiscountCodeService service;

    // --- Admin CRUD -------------------------------------------------

    @GetMapping("/api/admin/discounts")
    public List<DiscountCodeResponse> findAll() {
        return service.findAll();
    }

    @PostMapping("/api/admin/discounts")
    @ResponseStatus(HttpStatus.CREATED)
    public DiscountCodeResponse create(@Valid @RequestBody DiscountCodeRequest req) {
        return service.create(req);
    }

    @PutMapping("/api/admin/discounts/{id}")
    public DiscountCodeResponse update(
            @PathVariable Long id,
            @Valid @RequestBody DiscountCodeRequest req
    ) {
        return service.update(id, req);
    }

    @DeleteMapping("/api/admin/discounts/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    // --- Public validation -----------------------------------------

    /** Body: {"code": "SAVE10"}. 404 when the code is unknown or inactive. */
    public record ValidateRequest(@NotBlank String code) {}

    @PostMapping("/api/discounts/validate")
    public ResponseEntity<DiscountCodeResponse> validate(
            @Valid @RequestBody ValidateRequest req
    ) {
        return service.findActiveByCode(req.code())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
