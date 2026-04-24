package com.giannis.eshop.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Payload the admin sends when creating or updating a discount code.
 * Code is trimmed and upper-cased by the service before storage.
 */
public record DiscountCodeRequest(
        @NotBlank(message = "Code is required")
        @Size(max = 50, message = "Code is too long")
        String code,

        @NotNull(message = "Percent off is required")
        @Min(value = 1, message = "Percent off must be at least 1")
        @Max(value = 100, message = "Percent off cannot exceed 100")
        Integer percentOff,

        /** Null on create defaults to true; required on update. */
        Boolean active
) {}
