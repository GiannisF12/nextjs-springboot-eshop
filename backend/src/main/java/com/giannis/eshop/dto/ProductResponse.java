package com.giannis.eshop.dto;

import java.math.BigDecimal;

public record ProductResponse(
        Long id,
        String title,
        BigDecimal price,
        String image,
        Long categoryId,
        String categoryName
) {}