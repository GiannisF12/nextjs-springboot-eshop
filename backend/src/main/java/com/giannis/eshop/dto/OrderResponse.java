package com.giannis.eshop.dto;

import com.giannis.eshop.model.OrderStatus;
import com.giannis.eshop.model.PaymentMethod;

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
        /**
         * Shipping fee snapshot included inside `total`. Stored so the
         * order detail page can show a Subtotal / Shipping / Total
         * breakdown that lines up with what the customer paid.
         */
        BigDecimal shippingCost,
        /** Discount code applied at checkout, or null. */
        String discountCode,
        /** Percent-off snapshot at checkout, or null. */
        Integer discountPercent,
        OrderStatus status,
        /** How the customer paid (COD or STRIPE). */
        PaymentMethod paymentMethod,
        List<Item> items,
        /**
         * Timeline of status transitions, oldest first. Always contains at
         * least one entry (the "NEW" row written when the order is placed).
         * The frontend uses this to stamp each step of the progress bar.
         */
        List<StatusChange> statusHistory
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

    public record StatusChange(
            OrderStatus status,
            Instant changedAt
    ) {}
}
