package com.giannis.eshop.dto;

import com.giannis.eshop.model.OrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderResponse(
        Long id,
        Instant createdAt,
        String customerName,
        String phone,
        String addressLine,
        String city,
        String zip,
        BigDecimal total,
        OrderStatus status,
        List<Item> items
) {
    public record Item(
            Long productId,
            String title,
            BigDecimal price,
            String image,
            String category,
            /** Size snapshot — null for orders placed before the sizes feature. */
            String size,
            Integer qty,
            BigDecimal lineTotal
    ) {}
}
