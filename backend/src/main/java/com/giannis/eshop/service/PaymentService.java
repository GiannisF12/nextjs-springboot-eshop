package com.giannis.eshop.service;

import com.giannis.eshop.model.Order;
import com.giannis.eshop.model.OrderStatus;
import com.giannis.eshop.model.PaymentMethod;
import com.giannis.eshop.model.PaymentStatus;
import com.giannis.eshop.payment.PaymentGateway;
import com.giannis.eshop.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Orchestrates card payments: turns a pending card order into a Stripe
 * Checkout session, and drives the order's payment state from webhooks.
 */
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final PaymentGateway gateway;

    @Value("${eshop.app.base-url:http://localhost:3000}")
    private String baseUrl;

    /**
     * Creates a Stripe Checkout session for a pending card order and returns
     * the redirect URL. Stripe is called OUTSIDE a DB transaction so a slow
     * external call never holds a row lock.
     */
    public String createSessionForOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Order not found"));

        if (order.getPaymentMethod() != PaymentMethod.STRIPE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "This order is not a card order.");
        }
        if (order.getPaymentStatus() != PaymentStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This order is not awaiting payment.");
        }

        String successUrl = baseUrl + "/orders/" + orderId + "?payment=success";
        // Send the customer to their order page on cancel so they see it get
        // cancelled (the cart is already cleared, so /checkout would be empty).
        String cancelUrl = baseUrl + "/orders/" + orderId + "?payment=cancelled";

        PaymentGateway.CheckoutSession session =
                gateway.createCheckoutSession(order, successUrl, cancelUrl);

        order.setStripeSessionId(session.id());
        orderRepository.save(order);
        return session.url();
    }

    /**
     * Customer backed out of the hosted checkout. Expire the Stripe session
     * now (so it can't be paid afterwards) — that fires a
     * checkout.session.expired event, which the webhook handler turns into a
     * restock + cancel. No-op for anything that isn't a pending card order.
     * Falls back to the 30-min auto-expiry if anything here is missed.
     */
    public void cancelPendingOrder(Long orderId) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null
                || order.getPaymentMethod() != PaymentMethod.STRIPE
                || order.getPaymentStatus() != PaymentStatus.PENDING
                || order.getStripeSessionId() == null) {
            return;
        }
        // Void the Stripe session (so it can't be paid afterwards), then
        // cancel + restock the order now so the order page reflects it right
        // away. The cancel_url is only hit when the customer chose to back
        // out, so there's no payment in flight to race with.
        gateway.expireSession(order.getStripeSessionId());
        orderService.cancelAndRestock(orderId);
    }

    /**
     * Reconciles a card order with Stripe — called when the customer returns
     * to the success page. If Stripe confirms the session was paid, marks the
     * order PAID. This self-heals a missed or delayed webhook. Idempotent;
     * the Stripe call runs outside any DB transaction.
     */
    public void syncOrderPayment(Long orderId) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null
                || order.getPaymentMethod() != PaymentMethod.STRIPE
                || order.getPaymentStatus() != PaymentStatus.PENDING
                || order.getStripeSessionId() == null) {
            return;
        }
        if (gateway.isSessionPaid(order.getStripeSessionId())) {
            order.setPaymentStatus(PaymentStatus.PAID);
            orderRepository.save(order);
        }
    }

    /**
     * Verifies and applies a Stripe webhook. Idempotent: it only acts on an
     * order that is still PENDING, so replayed deliveries are no-ops.
     */
    @Transactional
    public void handleWebhook(String payload, String signature) {
        PaymentGateway.PaymentEvent event = gateway.parseEvent(payload, signature);
        if (event.type() == PaymentGateway.PaymentEvent.Type.IGNORED
                || event.sessionId() == null) {
            return;
        }

        Order order = orderRepository.findByStripeSessionId(event.sessionId())
                .orElse(null);
        if (order == null || order.getPaymentStatus() != PaymentStatus.PENDING) {
            return; // unknown order or already settled → no-op
        }

        switch (event.type()) {
            case COMPLETED -> {
                order.setPaymentStatus(PaymentStatus.PAID);
                orderRepository.save(order);
            }
            case EXPIRED -> orderService.cancelAndRestock(order.getId());
            default -> { /* IGNORED handled above */ }
        }
    }
}
