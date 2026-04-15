package com.giannis.eshop.repository;

import com.giannis.eshop.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    @EntityGraph(attributePaths = "category")
    Page<Product> findAll(Pageable pageable);

    @EntityGraph(attributePaths = "category")
    Page<Product> findByCategory_Id(Long categoryId, Pageable pageable);

    @EntityGraph(attributePaths = "category")
    Page<Product> findByTitleContainingIgnoreCase(String q, Pageable pageable);

    @EntityGraph(attributePaths = "category")
    Page<Product> findByCategory_IdAndTitleContainingIgnoreCase(Long categoryId, String q, Pageable pageable);

    @Query("select p from Product p join fetch p.category where p.id = :id")
    Optional<Product> findByIdWithCategory(@Param("id") Long id);

    /**
     * Loads a product with its category AND variants in ONE query.
     * Used by the order service so checkout can validate/decrement
     * stock without triggering N extra SELECTs per line item.
     */
    @Query("""
        select p from Product p
        join fetch p.category
        left join fetch p.variants
        where p.id = :id
    """)
    Optional<Product> findByIdForOrder(@Param("id") Long id);
}