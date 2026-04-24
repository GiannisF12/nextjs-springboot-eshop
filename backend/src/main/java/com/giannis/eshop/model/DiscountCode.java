package com.giannis.eshop.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * An admin-created promotional code that knocks a percentage off the
 * order total at checkout.
 *
 * The canonical `code` is stored upper-case — we normalise on create —
 * so lookups can be exact while the customer-facing input stays
 * case-insensitive.
 */
@Entity
@Table(
        name = "discount_codes",
        uniqueConstraints = @UniqueConstraint(
                name = "discount_codes_code_unique",
                columnNames = "code"
        )
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiscountCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String code;

    /** 1..100 (DB-enforced via check constraint). */
    @Column(name = "percent_off", nullable = false)
    private Integer percentOff;

    /**
     * Admin toggle — disabled codes stay in the DB for reporting but
     * can't be applied to new orders.
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (this.createdAt == null) this.createdAt = Instant.now();
        if (this.active == null) this.active = true;
    }
}
