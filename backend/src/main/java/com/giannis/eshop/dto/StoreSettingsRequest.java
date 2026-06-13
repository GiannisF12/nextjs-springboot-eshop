package com.giannis.eshop.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * Payload the admin sends when updating shop-wide settings.
 *
 * All fields are mandatory because we'd rather force a deliberate
 * value than try to merge partial updates — keeps the contract simple.
 * `0` is a valid value for the shipping numbers (means "always
 * charge" / "always free"). Low-stock threshold is also valid at 0,
 * which simply disables the dashboard warning.
 */
public record StoreSettingsRequest(
        @NotNull @DecimalMin("0.00") BigDecimal freeShippingThreshold,
        @NotNull @Min(0) Integer lowStockThreshold,
        /** Offer cash-on-delivery at checkout. */
        @NotNull Boolean codEnabled,
        /** Offer card payment (only effective once card is available). */
        @NotNull Boolean cardEnabled
) {
}
