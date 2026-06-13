package com.giannis.eshop.controller;

import com.giannis.eshop.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Card-payment endpoints. Authorisation is wired in SecurityConfig
 * (both are public — guests can pay; the webhook is signature-verified).
 */
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService service;

    /** Customer: start a Stripe Checkout session for their pending card order. */
    @PostMapping("/{orderId}/checkout-session")
    public Map<String, String> createSession(@PathVariable Long orderId) {
        return Map.of("url", service.createSessionForOrder(orderId));
    }

    /**
     * Customer backed out of payment — release the pending order's stock
     * immediately instead of waiting for the 30-minute session expiry.
     */
    @PostMapping("/{orderId}/cancel")
    public ResponseEntity<Void> cancel(@PathVariable Long orderId) {
        service.cancelPendingOrder(orderId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Customer returned to the success page — reconcile the order directly
     * with Stripe so a missed/late webhook self-heals to Paid.
     */
    @PostMapping("/{orderId}/sync")
    public ResponseEntity<Void> sync(@PathVariable Long orderId) {
        service.syncOrderPayment(orderId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Stripe → us. The raw body is required for signature verification, so we
     * take it as a String rather than a parsed object.
     */
    @PostMapping("/webhook")
    public ResponseEntity<String> webhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String signature) {
        service.handleWebhook(payload, signature);
        return ResponseEntity.ok("ok");
    }
}
