package com.giannis.eshop.dto;

import java.time.Instant;

/**
 * What we return for a discount code. Used by both the admin CRUD
 * endpoints and the public "validate code at checkout" endpoint.
 */
public record DiscountCodeResponse(
        Long id,
        String code,
        Integer percentOff,
        Boolean active,
        Instant createdAt
) {}
