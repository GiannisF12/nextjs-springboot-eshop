package com.giannis.eshop.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.BatchSize;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private String image;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    /**
     * Per-size stock rows. cascade=ALL + orphanRemoval=true means that
     * when the admin saves the product with a different list of variants,
     * JPA will insert/update/delete variant rows to match.
     *
     * @BatchSize prevents N+1 queries when listing many products:
     * Hibernate loads variants for up to 50 products in a single SELECT
     * the first time any of them are accessed.
     */
    @OneToMany(
            mappedBy = "product",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @BatchSize(size = 50)
    @Builder.Default
    private List<ProductVariant> variants = new ArrayList<>();
}