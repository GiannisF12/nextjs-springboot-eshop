package com.giannis.eshop.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private AppUser user;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(nullable = false)
    private String customerName;

    @Column(nullable = false)
    private String phone;

    @Column(nullable = false)
    private String addressLine;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private String zip;

    @Column(nullable = false)
    private BigDecimal total;

    /**
     * Shipping fee snapshot. Stored on the order so historical orders
     * still show the price the customer actually paid even if the
     * admin later changes the rate in store_settings.
     */
    @Column(name = "shipping_cost", nullable = false)
    @Builder.Default
    private BigDecimal shippingCost = BigDecimal.ZERO;

    /**
     * Snapshot of the courier name chosen at checkout. Null for legacy
     * orders and for any non-courier path. Stored as a name (not an FK)
     * so the order still reads correctly if a courier is later edited.
     */
    @Column(name = "shipping_courier", length = 100)
    private String shippingCourier;

    /**
     * Snapshot of the discount code applied at checkout. Null if none.
     * Stored so order history reads correctly even if the admin later
     * deletes the code from discount_codes.
     */
    @Column(name = "discount_code", length = 50)
    private String discountCode;

    /** Snapshot of the percent-off at the time of checkout. Null if no code. */
    @Column(name = "discount_percent")
    private Integer discountPercent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private OrderStatus status = OrderStatus.NEW;

    /**
     * How the customer is paying. Defaults to COD; Stripe is reserved
     * for the upcoming online-payments integration. Stored as VARCHAR
     * so adding a new payment method later is just an enum addition,
     * no schema change.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 16)
    @Builder.Default
    private PaymentMethod paymentMethod = PaymentMethod.COD;

    /**
     * Payment state. COD orders are NOT_REQUIRED (nothing to collect online);
     * card orders go PENDING → PAID, or PENDING → EXPIRED if the Stripe
     * session lapses unpaid.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 16)
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.NOT_REQUIRED;

    /** Stripe Checkout session id for a card order — how webhooks find it. */
    @Column(name = "stripe_session_id", length = 255)
    private String stripeSessionId;

    @PrePersist
    void onCreate() {
        if (this.createdAt == null) this.createdAt = Instant.now();
        if (this.status == null) this.status = OrderStatus.NEW;
        if (this.paymentMethod == null) this.paymentMethod = PaymentMethod.COD;
    }

    @OneToMany(
            mappedBy = "order",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();
}