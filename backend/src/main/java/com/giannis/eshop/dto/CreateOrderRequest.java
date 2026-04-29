package com.giannis.eshop.dto;

import com.giannis.eshop.model.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.List;

public record CreateOrderRequest(
        @NotBlank String customerName,
        @NotBlank String phone,
        @NotBlank String addressLine,
        @NotBlank String city,
        @NotBlank String zip,
        @NotEmpty @Valid List<Item> items,
        /**
         * Optional discount code entered on the checkout page. The server
         * re-validates and re-calculates the discount — the client is
         * never trusted for the percent-off.
         */
        String discountCode,
        /**
         * How the customer wants to pay. Optional in the wire format —
         * if omitted, the service defaults to COD. Stripe isn't selectable
         * yet from the UI, but the field accepts STRIPE so the contract
         * doesn't change when online payments ship.
         */
        PaymentMethod paymentMethod
) {
    public record Item(
            @NotNull Long productId,
            /** Which size variant the customer picked, e.g. "M" or "42". */
            @NotBlank String size,
            @NotNull @Positive BigDecimal price,
            @NotNull @Positive Integer qty
    ) {}
}
