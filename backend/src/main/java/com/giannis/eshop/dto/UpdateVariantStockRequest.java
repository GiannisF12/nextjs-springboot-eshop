package com.giannis.eshop.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Payload for the inline stock-edit endpoint on the admin products page.
 * Only the stock number changes — size and product stay the same.
 */
public record UpdateVariantStockRequest(
        @NotNull(message = "Stock is required")
        @Min(value = 0, message = "Stock cannot be negative")
        Integer stock
) {}
