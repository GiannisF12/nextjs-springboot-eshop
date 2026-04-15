package com.giannis.eshop.dto;

import com.giannis.eshop.model.SizeType;

import java.math.BigDecimal;
import java.util.List;

/**
 * What we return to the frontend when it asks for a product.
 *
 * sizeType tells the UI which picker to show (S/M/L vs 38-48),
 * variants tells it which specific sizes are available and how many
 * are in stock so out-of-stock sizes can be greyed out.
 */
public record ProductResponse(
        Long id,
        String title,
        BigDecimal price,
        String image,
        Long categoryId,
        String categoryName,
        SizeType sizeType,
        List<Variant> variants
) {
    public record Variant(
            Long id,
            String size,
            Integer stock
    ) {}
}
