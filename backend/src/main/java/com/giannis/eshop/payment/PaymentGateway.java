package com.giannis.eshop.payment;

import com.giannis.eshop.model.Order;

/**
 * Provider-agnostic payment seam. Today only Stripe implements it; a future
 * provider (e.g. Viva) would be another implementation, leaving the order /
 * checkout / webhook orchestration untouched.
 */
public interface PaymentGateway {

    /** Creates a hosted checkout session for an order and returns its id + URL. */
    CheckoutSession createCheckoutSession(Order order, String successUrl, String cancelUrl);

    /**
     * Verifies a webhook's signature and normalises it to a {@link PaymentEvent}.
     * Throws if the signature is invalid.
     */
    PaymentEvent parseEvent(String payload, String signature);

    /**
     * Expires (voids) an open checkout session so it can no longer be paid.
     * Best-effort: a session that's already completed or expired is left
     * alone. Expiring triggers a {@code checkout.session.expired} event.
     */
    void expireSession(String sessionId);

    /**
     * Whether the given checkout session has been paid. Used to reconcile an
     * order directly with Stripe when the customer returns, in case the
     * webhook was missed or delayed.
     */
    boolean isSessionPaid(String sessionId);

    /** The hosted-checkout session a customer is redirected to. */
    record CheckoutSession(String id, String url) {}

    /** A normalised payment event — only the cases we act on are distinguished. */
    record PaymentEvent(Type type, String sessionId) {
        public enum Type { COMPLETED, EXPIRED, IGNORED }
    }
}
