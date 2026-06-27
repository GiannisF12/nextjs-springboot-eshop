package com.giannis.eshop.dto;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Public-facing settings DTO. The frontend calls GET /api/settings on
 * the checkout page to know shipping + which payment methods to show.
 */
public record StoreSettingsResponse(
        BigDecimal freeShippingThreshold,
        Integer lowStockThreshold,
        /** Admin toggle: COD offered. */
        boolean codEnabled,
        /** Admin toggle: card offered (effective only when cardAvailable). */
        boolean cardEnabled,
        /** Whether card payments are wired up at all (config flag). When
         *  false, checkout shows card as "Coming soon". */
        boolean cardAvailable,
        Instant updatedAt
) {
}
