package com.giannis.eshop.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * A shipping courier the admin offers at checkout. The catalog is seeded
 * in Flyway; price + enabled are edited from the admin panel. Disabled
 * couriers stay in the table (so historical orders still resolve) but
 * can't be selected for new orders.
 */
@Entity
@Table(
        name = "couriers",
        uniqueConstraints = @UniqueConstraint(
                name = "couriers_name_unique",
                columnNames = "name"
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Courier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    /** Flat fee for this courier, before the free-shipping threshold. */
    @Column(nullable = false)
    private BigDecimal price;

    /** Admin on/off toggle. */
    @Column(nullable = false)
    @Builder.Default
    private Boolean enabled = true;

    /** Display order at checkout and in the admin table (ascending). */
    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        this.updatedAt = Instant.now();
    }
}
