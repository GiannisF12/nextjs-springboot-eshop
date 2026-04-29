package com.giannis.eshop.controller;

import com.giannis.eshop.dto.StoreSettingsRequest;
import com.giannis.eshop.dto.StoreSettingsResponse;
import com.giannis.eshop.service.StoreSettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * Public read of store-wide settings (the storefront needs the
 * shipping rate to display on checkout) plus admin-only update.
 *
 * Authorisation is wired in SecurityConfig — the controller stays
 * unaware of who's calling.
 */
@RestController
@RequiredArgsConstructor
public class StoreSettingsController {

    private final StoreSettingsService service;

    @GetMapping("/api/settings")
    public StoreSettingsResponse get() {
        return service.get();
    }

    @PutMapping("/api/admin/settings")
    public StoreSettingsResponse update(@Valid @RequestBody StoreSettingsRequest req) {
        return service.update(req);
    }
}
