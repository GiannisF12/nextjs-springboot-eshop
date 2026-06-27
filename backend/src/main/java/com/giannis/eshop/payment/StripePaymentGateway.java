package com.giannis.eshop.payment;

import com.giannis.eshop.model.Order;
import com.stripe.Stripe;
import com.stripe.exception.EventDataObjectDeserializationException;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.math.RoundingMode;
import java.time.Instant;

/**
 * Stripe-backed {@link PaymentGateway} using hosted Checkout. The order total
 * is charged in EUR cents; the amount always comes from the order (server
 * side), never the client.
 */
@Component
public class StripePaymentGateway implements PaymentGateway {

    /** Stripe requires a Checkout session to expire 30 min–24 h from now. */
    private static final long EXPIRY_SECONDS = 30 * 60;

    @Value("${stripe.secret-key:}")
    private String secretKey;

    @Value("${stripe.webhook-secret:}")
    private String webhookSecret;

    @Override
    public CheckoutSession createCheckoutSession(Order order, String successUrl, String cancelUrl) {
        Stripe.apiKey = secretKey;

        long amountCents = order.getTotal()
                .movePointRight(2)
                .setScale(0, RoundingMode.HALF_UP)
                .longValueExact();

        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(successUrl)
                .setCancelUrl(cancelUrl)
                .setExpiresAt(Instant.now().getEpochSecond() + EXPIRY_SECONDS)
                .addLineItem(SessionCreateParams.LineItem.builder()
                        .setQuantity(1L)
                        .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                .setCurrency("eur")
                                .setUnitAmount(amountCents)
                                .setProductData(
                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                .setName("Order #" + order.getId())
                                                .build())
                                .build())
                        .build())
                .build();

        try {
            Session session = Session.create(params);
            return new CheckoutSession(session.getId(), session.getUrl());
        } catch (StripeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Could not start card payment. Please try again.");
        }
    }

    @Override
    public PaymentEvent parseEvent(String payload, String signature) {
        Event event;
        try {
            event = Webhook.constructEvent(payload, signature, webhookSecret);
        } catch (SignatureVerificationException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid Stripe signature");
        }

        PaymentEvent.Type type = switch (event.getType()) {
            case "checkout.session.completed" -> PaymentEvent.Type.COMPLETED;
            case "checkout.session.expired" -> PaymentEvent.Type.EXPIRED;
            default -> PaymentEvent.Type.IGNORED;
        };
        if (type == PaymentEvent.Type.IGNORED) {
            return new PaymentEvent(type, null);
        }

        // Extract the Checkout Session id. getObject() returns empty when the
        // account's pinned API version differs from the SDK's (very common),
        // so fall back to an unsafe deserialize — we only need the id, which
        // is stable across API versions.
        EventDataObjectDeserializer deserializer = event.getDataObjectDeserializer();
        StripeObject obj = deserializer.getObject().orElse(null);
        if (obj == null) {
            try {
                obj = deserializer.deserializeUnsafe();
            } catch (EventDataObjectDeserializationException e) {
                obj = null;
            }
        }
        String sessionId = (obj instanceof Session s) ? s.getId() : null;
        return new PaymentEvent(type, sessionId);
    }

    @Override
    public void expireSession(String sessionId) {
        Stripe.apiKey = secretKey;
        try {
            Session session = Session.retrieve(sessionId);
            // Only "open" sessions can be expired. If it's already
            // "complete" (paid) we leave it — the completed webhook will mark
            // the order paid. "expired" is already done.
            if ("open".equals(session.getStatus())) {
                session.expire();
            }
        } catch (StripeException e) {
            // Best-effort: if we can't expire it now, the 30-minute auto
            // expiry is still the safety net. Never fail the customer's cancel.
        }
    }

    @Override
    public boolean isSessionPaid(String sessionId) {
        Stripe.apiKey = secretKey;
        try {
            Session session = Session.retrieve(sessionId);
            return "paid".equals(session.getPaymentStatus());
        } catch (StripeException e) {
            // Best-effort: fall back to the webhook as the primary path.
            return false;
        }
    }
}
