package com.giannis.eshop.model;

/**
 * Where an order stands on payment.
 *
 * NOT_REQUIRED — cash on delivery; there is no online payment to track.
 * PENDING      — card order created, awaiting Stripe confirmation.
 * PAID         — Stripe confirmed the payment (via webhook).
 * EXPIRED      — the Stripe Checkout session expired unpaid; the order was
 *                cancelled and its stock released.
 */
public enum PaymentStatus {
    NOT_REQUIRED,
    PENDING,
    PAID,
    EXPIRED
}
