package com.giannis.eshop.service;

import com.giannis.eshop.model.Order;
import com.giannis.eshop.model.OrderStatus;
import com.giannis.eshop.model.PaymentMethod;
import com.giannis.eshop.model.PaymentStatus;
import com.giannis.eshop.payment.PaymentGateway;
import com.giannis.eshop.payment.PaymentGateway.PaymentEvent;
import com.giannis.eshop.repository.OrderRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    OrderRepository orderRepository;

    @Mock
    OrderService orderService;

    @Mock
    PaymentGateway gateway;

    @InjectMocks
    PaymentService service;

    private Order pendingCardOrder() {
        return Order.builder()
                .id(1L)
                .paymentMethod(PaymentMethod.STRIPE)
                .paymentStatus(PaymentStatus.PENDING)
                .status(OrderStatus.NEW)
                .stripeSessionId("cs_test_123")
                .build();
    }

    @Test
    void completedEvent_marksOrderPaid() {
        Order order = pendingCardOrder();
        when(gateway.parseEvent("body", "sig"))
                .thenReturn(new PaymentEvent(PaymentEvent.Type.COMPLETED, "cs_test_123"));
        when(orderRepository.findByStripeSessionId("cs_test_123"))
                .thenReturn(Optional.of(order));

        service.handleWebhook("body", "sig");

        assertThat(order.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        verify(orderRepository).save(order);
        verifyNoInteractions(orderService); // no restock on completion
    }

    @Test
    void completedEvent_onAlreadyPaidOrder_isNoOp() {
        Order order = pendingCardOrder();
        order.setPaymentStatus(PaymentStatus.PAID);
        when(gateway.parseEvent("body", "sig"))
                .thenReturn(new PaymentEvent(PaymentEvent.Type.COMPLETED, "cs_test_123"));
        when(orderRepository.findByStripeSessionId("cs_test_123"))
                .thenReturn(Optional.of(order));

        service.handleWebhook("body", "sig");

        verify(orderRepository, never()).save(any());
    }

    @Test
    void expiredEvent_cancelsAndRestocksOrder() {
        Order order = pendingCardOrder();
        when(gateway.parseEvent("body", "sig"))
                .thenReturn(new PaymentEvent(PaymentEvent.Type.EXPIRED, "cs_test_123"));
        when(orderRepository.findByStripeSessionId("cs_test_123"))
                .thenReturn(Optional.of(order));

        service.handleWebhook("body", "sig");

        verify(orderService).cancelAndRestock(1L);
    }

    @Test
    void ignoredEvent_isNoOp() {
        when(gateway.parseEvent("body", "sig"))
                .thenReturn(new PaymentEvent(PaymentEvent.Type.IGNORED, null));

        service.handleWebhook("body", "sig");

        verify(orderRepository, never()).findByStripeSessionId(any());
        verify(orderRepository, never()).save(any());
    }

    @Test
    void createSession_returnsUrl_andStoresSessionId() {
        Order order = Order.builder()
                .id(5L)
                .paymentMethod(PaymentMethod.STRIPE)
                .paymentStatus(PaymentStatus.PENDING)
                .total(new BigDecimal("42.00"))
                .build();
        when(orderRepository.findById(5L)).thenReturn(Optional.of(order));
        when(gateway.createCheckoutSession(eq(order), anyString(), anyString()))
                .thenReturn(new PaymentGateway.CheckoutSession("cs_new", "https://stripe/cs_new"));

        String url = service.createSessionForOrder(5L);

        assertThat(url).isEqualTo("https://stripe/cs_new");
        assertThat(order.getStripeSessionId()).isEqualTo("cs_new");
        verify(orderRepository).save(order);
    }

    @Test
    void createSession_rejectsNonCardOrder() {
        Order order = Order.builder()
                .id(6L)
                .paymentMethod(PaymentMethod.COD)
                .paymentStatus(PaymentStatus.NOT_REQUIRED)
                .build();
        when(orderRepository.findById(6L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> service.createSessionForOrder(6L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("400");
    }

    @Test
    void createSession_rejectsOrderNotAwaitingPayment() {
        Order order = Order.builder()
                .id(7L)
                .paymentMethod(PaymentMethod.STRIPE)
                .paymentStatus(PaymentStatus.PAID)
                .build();
        when(orderRepository.findById(7L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> service.createSessionForOrder(7L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("409");
    }

    @Test
    void cancelPendingOrder_expiresSession_forPendingCardOrder() {
        Order order = pendingCardOrder();
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        service.cancelPendingOrder(1L);

        verify(gateway).expireSession("cs_test_123");
        verify(orderService).cancelAndRestock(1L);
    }

    @Test
    void cancelPendingOrder_noOp_forPaidOrder() {
        Order order = pendingCardOrder();
        order.setPaymentStatus(PaymentStatus.PAID);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        service.cancelPendingOrder(1L);

        verify(gateway, never()).expireSession(anyString());
        verify(orderService, never()).cancelAndRestock(anyLong());
    }

    @Test
    void syncOrderPayment_marksPaid_whenStripeSaysPaid() {
        Order order = pendingCardOrder();
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(gateway.isSessionPaid("cs_test_123")).thenReturn(true);

        service.syncOrderPayment(1L);

        assertThat(order.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        verify(orderRepository).save(order);
    }

    @Test
    void syncOrderPayment_noOp_whenStripeSaysUnpaid() {
        Order order = pendingCardOrder();
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(gateway.isSessionPaid("cs_test_123")).thenReturn(false);

        service.syncOrderPayment(1L);

        assertThat(order.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);
        verify(orderRepository, never()).save(any());
    }
}
