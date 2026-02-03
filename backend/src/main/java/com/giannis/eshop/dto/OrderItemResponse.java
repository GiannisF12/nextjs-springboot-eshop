package com.giannis.eshop.dto;

public record OrderItemResponse(
        Long productId,
        String title,
        double price,
        int qty
) {}