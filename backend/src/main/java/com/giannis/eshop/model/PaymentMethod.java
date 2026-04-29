package com.giannis.eshop.model;

/**
 * How the customer pays for an order.
 *
 * COD ("Cash on delivery" / αντικαταβολή) — the courier collects cash
 * when the package is delivered. The shop owner remits the takings
 * after the courier hands them over (typically weekly).
 *
 * STRIPE — paid online via Stripe Checkout before the order is fulfilled.
 * Reserved for the upcoming Stripe integration; not selectable in the UI
 * yet, but the column exists so the data shape is final and we don't
 * need a follow-up migration when Stripe lands.
 */
public enum PaymentMethod {
    COD,
    STRIPE
}
