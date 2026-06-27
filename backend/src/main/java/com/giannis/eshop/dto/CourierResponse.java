package com.giannis.eshop.dto;

import java.math.BigDecimal;

/** What the API returns for a courier (public list and admin list). */
public record CourierResponse(
        Long id,
        String name,
        BigDecimal price,
        boolean enabled,
        int sortOrder
) {
}
