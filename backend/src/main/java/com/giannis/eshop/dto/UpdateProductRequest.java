package com.giannis.eshop.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.List;

/**
 * What the admin sends when updating an existing product.
 *
 * The service layer reconciles the incoming variants list with the
 * existing rows: adds new sizes, updates stock on existing sizes,
 * and deletes variants the admin removed from the list.
 */
public record UpdateProductRequest(

        @NotBlank(message = "Title is required")
        String title,

        @NotNull(message = "Price is required")
        @Positive(message = "Price must be positive")
        BigDecimal price,

        @NotBlank(message = "Image is required")
        String image,

        @NotNull(message = "Category id is required")
        Long categoryId,

        @NotEmpty(message = "At least one size variant is required")
        @Valid
        List<VariantInput> variants
) {
    public record VariantInput(
            @NotBlank(message = "Size is required")
            String size,

            @NotNull(message = "Stock is required")
            @Min(value = 0, message = "Stock cannot be negative")
            Integer stock
    ) {}
}
