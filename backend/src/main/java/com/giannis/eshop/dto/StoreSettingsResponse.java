package com.giannis.eshop.dto;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Public-facing settings DTO. The frontend calls GET /api/settings on
 * the checkout page to know how much shipping to display.
 */
public record StoreSettingsResponse(
        BigDecimal shippingFlatRate,
        BigDecimal freeShippingThreshold,
        Integer lowStockThreshold,
        Instant updatedAt
) {
}
