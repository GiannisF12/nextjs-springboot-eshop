package com.giannis.eshop.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.List;

public record CreateOrderRequest(
        @NotBlank String customerName,
        @NotBlank String phone,
        @NotBlank String addressLine,
        @NotBlank String city,
        @NotBlank String zip,
        @NotEmpty @Valid List<Item> items
) {
    public record Item(
            @NotNull Long productId,
            /** Which size variant the customer picked, e.g. "M" or "42". */
            @NotBlank String size,
            @NotNull @Positive BigDecimal price,
            @NotNull @Positive Integer qty
    ) {}
}
