package com.giannis.eshop.repository;

import com.giannis.eshop.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query(
            value = """
            select p from Product p
            join fetch p.category c
            where (:categoryId is null or c.id = :categoryId)
        """,
            countQuery = """
            select count(p) from Product p
            where (:categoryId is null or p.category.id = :categoryId)
        """
    )
    Page<Product> findAllWithCategoryFiltered(@Param("categoryId") Long categoryId, Pageable pageable);

    @Query("select p from Product p join fetch p.category where p.id = :id")
    java.util.Optional<Product> findByIdWithCategory(@Param("id") Long id);
}