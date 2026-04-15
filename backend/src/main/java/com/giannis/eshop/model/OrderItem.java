package com.giannis.eshop.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "order_id")
    private Order order;

    private Long productId;
    private String title;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    private String image;
    private String category;

    private Integer qty;

    /**
     * Which size was bought, snapshot at order time.
     * Nullable on purpose: historical orders (placed before the
     * sizes feature) simply don't have a size.
     */
    @Column(length = 10)
    private String size;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal lineTotal;
}