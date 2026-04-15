package com.giannis.eshop.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "categories")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    /**
     * Tells us which set of size labels products in this category use.
     * Stored in the DB as a string ("CLOTHING" / "SHOE"), not an ordinal,
     * so renaming/reordering the enum later doesn't corrupt existing rows.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "size_type", nullable = false, length = 20)
    private SizeType sizeType;
}