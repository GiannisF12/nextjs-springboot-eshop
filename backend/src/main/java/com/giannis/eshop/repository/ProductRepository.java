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
}