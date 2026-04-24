package com.giannis.eshop.service;

import com.giannis.eshop.dto.CreateOrderRequest;
import com.giannis.eshop.dto.OrderResponse;
import com.giannis.eshop.model.AppUser;
import com.giannis.eshop.model.Order;
import com.giannis.eshop.model.OrderItem;
import com.giannis.eshop.model.OrderStatus;
import com.giannis.eshop.model.OrderStatusHistory;
import com.giannis.eshop.model.Product;
import com.giannis.eshop.model.ProductVariant;
import com.giannis.eshop.repository.OrderRepository;
import com.giannis.eshop.repository.OrderStatusHistoryRepository;
import com.giannis.eshop.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final OrderStatusHistoryRepository statusHistoryRepository;

    /**
     * Places an order. All-or-nothing:
     *
     *  - For every line item we look up the matching ProductVariant
     *    (productId + size). Missing variant -> 400. Not enough stock -> 409.
     *  - We decrement variant.stock BEFORE saving the order. Hibernate
     *    dirty-checking writes the UPDATE inside the same transaction.
     *  - If anything throws (bad product, bad size, out of stock), Spring
     *    rolls the transaction back, so no stock gets partially deducted
     *    and no half-placed order lingers in the DB.
     */
    @Transactional
    public OrderResponse create(CreateOrderRequest req, AppUser user) {

        Order order = Order.builder()
                .user(user)
                .customerName(req.customerName())
                .phone(req.phone())
                .addressLine(req.addressLine())
                .city(req.city())
                .zip(req.zip())
                .total(BigDecimal.ZERO)
                .status(OrderStatus.NEW)
                .build();

        BigDecimal total = BigDecimal.ZERO;

        for (CreateOrderRequest.Item it : req.items()) {

            Product p = productRepository.findByIdForOrder(it.productId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Product not found: " + it.productId()
                    ));

            ProductVariant variant = p.getVariants().stream()
                    .filter(v -> v.getSize().equals(it.size()))
                    .findFirst()
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Size '" + it.size() + "' is not available for " + p.getTitle()
                    ));

            if (variant.getStock() < it.qty()) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Not enough stock for " + p.getTitle() + " (size " + it.size()
                                + "): requested " + it.qty() + ", available " + variant.getStock()
                );
            }

            // Decrement stock inside this transaction. If any later item
            // fails, Spring rolls the whole thing back so nothing is lost.
            variant.setStock(variant.getStock() - it.qty());

            BigDecimal lineTotal =
                    p.getPrice().multiply(BigDecimal.valueOf(it.qty()));

            total = total.add(lineTotal);

            OrderItem item = OrderItem.builder()
                    .order(order)
                    .productId(p.getId())
                    .title(p.getTitle())
                    .price(p.getPrice())
                    .image(p.getImage())
                    .category(p.getCategory().getName())
                    .size(it.size())
                    .qty(it.qty())
                    .lineTotal(lineTotal)
                    .build();

            order.getItems().add(item);
        }

        order.setTotal(total);
        Order saved = orderRepository.save(order);

        // First timeline entry. Use the order's own createdAt so the
        // "NEW" stamp on the frontend lines up exactly with the order's
        // shown creation time.
        statusHistoryRepository.save(OrderStatusHistory.builder()
                .orderId(saved.getId())
                .status(OrderStatus.NEW)
                .changedAt(saved.getCreatedAt())
                .build());

        return toResponse(saved);
    }

    public OrderResponse findById(Long id) {
        Order order = orderRepository.findByIdWithItems(id)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        return toResponse(order);
    }

    public List<OrderResponse> findAll() {
        return orderRepository.findAllWithItems()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private OrderResponse toResponse(Order o) {
        var items = o.getItems().stream()
                .map(i -> new OrderResponse.Item(
                        i.getProductId(),
                        i.getTitle(),
                        i.getPrice(),
                        i.getImage(),
                        i.getCategory(),
                        i.getSize(),
                        i.getQty(),
                        i.getLineTotal()
                ))
                .toList();

        // Fetch the timeline (one SELECT per order — acceptable for the
        // order-detail page which shows one order at a time. Listing
        // endpoints don't need the frontend timeline, but the DTO keeps
        // the same shape for consistency).
        var history = statusHistoryRepository.findByOrderIdOrderByChangedAtAsc(o.getId())
                .stream()
                .map(h -> new OrderResponse.StatusChange(h.getStatus(), h.getChangedAt()))
                .toList();

        return new OrderResponse(
                o.getId(),
                o.getCreatedAt(),
                o.getCustomerName(),
                o.getPhone(),
                o.getAddressLine(),
                o.getCity(),
                o.getZip(),
                o.getTotal(),
                o.getStatus(),
                items,
                history
        );
    }

    public List<OrderResponse> findByUser(Long userId) {
        return orderRepository.findByUserIdWithItems(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public OrderResponse updateStatus(Long id, OrderStatus status) {
        Order order = orderRepository.findByIdWithItems(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Order not found"
                ));

        // Only append a history row on an actual transition. Stops the
        // timeline from filling up with duplicates if the admin clicks
        // "Save" on the same status twice.
        if (order.getStatus() != status) {
            order.setStatus(status);
            statusHistoryRepository.save(OrderStatusHistory.builder()
                    .orderId(order.getId())
                    .status(status)
                    .changedAt(Instant.now())
                    .build());
        }

        return toResponse(order);
    }
}
