package com.giannis.eshop.service;

import com.giannis.eshop.model.Order;
import com.giannis.eshop.model.OrderItem;
import com.giannis.eshop.model.OrderStatus;
import com.giannis.eshop.model.PaymentMethod;
import com.giannis.eshop.model.PaymentStatus;
import com.giannis.eshop.model.Product;
import com.giannis.eshop.model.ProductVariant;
import com.giannis.eshop.repository.DiscountCodeRepository;
import com.giannis.eshop.repository.OrderRepository;
import com.giannis.eshop.repository.OrderStatusHistoryRepository;
import com.giannis.eshop.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock OrderRepository orderRepository;
    @Mock ProductRepository productRepository;
    @Mock OrderStatusHistoryRepository statusHistoryRepository;
    @Mock DiscountCodeRepository discountCodeRepository;
    @Mock StoreSettingsService storeSettingsService;
    @Mock CourierService courierService;

    @InjectMocks
    OrderService service;

    @Test
    void cancelling_restocksReservedItems_andExpiresPendingPayment() {
        ProductVariant variant =
                ProductVariant.builder().size("M").stock(2).build();
        Product product = Product.builder().title("Bag").build();
        product.getVariants().add(variant);

        OrderItem item = OrderItem.builder()
                .productId(10L).size("M").qty(1).build();
        Order order = Order.builder()
                .id(5L)
                .status(OrderStatus.NEW)
                .paymentMethod(PaymentMethod.STRIPE)
                .paymentStatus(PaymentStatus.PENDING)
                .build();
        order.getItems().add(item);

        when(orderRepository.findByIdWithItems(5L)).thenReturn(Optional.of(order));
        when(productRepository.findByIdForOrder(10L)).thenReturn(Optional.of(product));
        when(statusHistoryRepository.findByOrderIdOrderByChangedAtAsc(5L))
                .thenReturn(List.of());

        service.updateStatus(5L, OrderStatus.CANCELLED);

        assertThat(variant.getStock()).isEqualTo(3); // +1 returned
        assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(order.getPaymentStatus()).isEqualTo(PaymentStatus.EXPIRED);
    }

    @Test
    void cancellingAlreadyCancelledOrder_doesNotRestockAgain() {
        Order order = Order.builder()
                .id(6L)
                .status(OrderStatus.CANCELLED)
                .paymentStatus(PaymentStatus.EXPIRED)
                .build();

        when(orderRepository.findByIdWithItems(6L)).thenReturn(Optional.of(order));
        when(statusHistoryRepository.findByOrderIdOrderByChangedAtAsc(6L))
                .thenReturn(List.of());

        service.updateStatus(6L, OrderStatus.CANCELLED);

        // No transition → no restock lookup at all.
        verify(productRepository, never()).findByIdForOrder(anyLong());
    }
}
