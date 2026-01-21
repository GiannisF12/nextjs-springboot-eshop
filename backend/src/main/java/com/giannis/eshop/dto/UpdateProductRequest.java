package com.giannis.eshop.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record UpdateProductRequest(

        @NotBlank(message = "Title is required")
        String title,

        @NotNull(message = "Price is required")
        @Positive(message = "Price must be positive")
        BigDecimal price,

        @NotBlank(message = "Image is required")
        String image,

        @NotNull(message = "Category id is required")
        Long categoryId
) {}