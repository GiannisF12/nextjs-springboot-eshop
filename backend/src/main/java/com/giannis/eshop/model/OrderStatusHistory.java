package com.giannis.eshop.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Audit log row capturing a single status transition on an Order.
 *
 * The first row for any order is the "NEW" entry created when the order
 * is placed. Every subsequent admin status change appends one more row.
 * Nothing is ever updated or deleted here — so the history on the order
 * page is a true timeline.
 */
@Entity
@Table(name = "order_status_history")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Stored as the FK column directly — we never need to walk back to
    // the Order entity from here, so a full @ManyToOne would just be
    // ceremony (and extra queries).
    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @Column(name = "changed_at", nullable = false)
    private Instant changedAt;
}
