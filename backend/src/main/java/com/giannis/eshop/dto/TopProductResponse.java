package com.giannis.eshop.dto;

import java.math.BigDecimal;

/**
 * A row in the "top products" analytics chart — aggregated over
 * every {@code order_items} row for a given product.
 */
public record TopProductResponse(
        Long productId,
        String title,
        long qtySold,
        BigDecimal revenue
) {
}
