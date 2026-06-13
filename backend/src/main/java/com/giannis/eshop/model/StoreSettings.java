package com.giannis.eshop.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Singleton settings row — there is always exactly one row, with id = 1.
 *
 * Held in its own table (rather than a key/value blob) so each setting
 * gets its own column with the right type, validations and defaults.
 * The service layer is what enforces the singleton invariant: it
 * fetches/updates id = 1, never inserts a new row.
 *
 * Designed to grow: when we add store name, contact email, currency
 * code, banner image etc, they slot into this table as new columns
 * via Flyway migrations.
 */
@Entity
@Table(name = "store_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreSettings {

    /** Always 1 — this table is a singleton. */
    @Id
    private Long id;

    /**
     * If the cart subtotal (before discount) reaches this number,
     * shipping drops to 0. A value of 0 means "always charge shipping",
     * which is also a valid configuration.
     */
    @Column(name = "free_shipping_threshold", nullable = false)
    private BigDecimal freeShippingThreshold;

    /**
     * Variants whose stock is at or below this number show up in the
     * "Low stock" dashboard widget and (later) trigger an email to the
     * admin when an order pushes a variant below it.
     */
    @Column(name = "low_stock_threshold", nullable = false)
    private Integer lowStockThreshold;

    /** Admin toggle: offer cash-on-delivery at checkout. */
    @Column(name = "cod_enabled", nullable = false)
    @Builder.Default
    private Boolean codEnabled = true;

    /**
     * Admin toggle: offer card payment at checkout. Only has an effect once
     * card payments are actually available (eshop.payments.card-available);
     * until then card shows as "Coming soon" regardless of this flag.
     */
    @Column(name = "card_enabled", nullable = false)
    @Builder.Default
    private Boolean cardEnabled = false;

    /** Bumped on every save — useful for cache busting later. */
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        this.updatedAt = Instant.now();
    }
}
