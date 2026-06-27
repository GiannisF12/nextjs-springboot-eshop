package com.giannis.eshop.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * Admin update payload. Both fields required — the admin form always
 * sends the current values for the row, so we avoid partial-merge logic.
 * Price must be >= 0.
 */
public record UpdateCourierRequest(
        @NotNull @DecimalMin("0.00") BigDecimal price,
        @NotNull Boolean enabled
) {
}
