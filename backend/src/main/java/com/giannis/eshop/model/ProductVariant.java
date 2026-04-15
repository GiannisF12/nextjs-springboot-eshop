package com.giannis.eshop.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * A single (product, size) combination with its own stock count.
 *
 * Example: a Red Hoodie product has 5 variants — one for each of
 * S, M, L, XL, XXL, each with its own stock number.
 *
 * Price is NOT stored here — it stays on the parent Product, because
 * in this shop every size of a given product costs the same.
 */
@Entity
@Table(
        name = "product_variants",
        uniqueConstraints = @UniqueConstraint(
                name = "product_variants_unique_size",
                columnNames = {"product_id", "size"}
        )
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    /** Size label, e.g. "M" or "42". */
    @Column(nullable = false, length = 10)
    private String size;

    /** How many units of this exact (product, size) we have in stock. */
    @Column(nullable = false)
    private Integer stock;
}
