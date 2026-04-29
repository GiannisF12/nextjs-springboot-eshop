package com.giannis.eshop.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * Payload the admin sends when updating shop-wide settings.
 *
 * Both fields are mandatory because we'd rather force a deliberate
 * value than try to merge partial updates — keeps the contract simple.
 * `0` is a valid value for either: it means "shipping is always
 * charged" / "shipping is always free".
 */
public record StoreSettingsRequest(
        @NotNull @DecimalMin("0.00") BigDecimal shippingFlatRate,
        @NotNull @DecimalMin("0.00") BigDecimal freeShippingThreshold
) {
}
