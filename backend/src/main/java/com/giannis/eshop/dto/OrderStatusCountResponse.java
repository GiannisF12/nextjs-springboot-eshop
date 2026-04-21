package com.giannis.eshop.dto;

import com.giannis.eshop.model.OrderStatus;

public record OrderStatusCountResponse(OrderStatus status, long count) {
}
