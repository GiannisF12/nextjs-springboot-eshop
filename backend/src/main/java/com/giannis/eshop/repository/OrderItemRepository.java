package com.giannis.eshop.repository;

import com.giannis.eshop.dto.TopProductResponse;
import com.giannis.eshop.model.OrderItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    /**
     * Aggregates order_items by product to rank them by units sold.
     * The caller passes a {@code Pageable} (e.g. {@code PageRequest.of(0, 5)})
     * to control the limit — avoids hardcoding "top 5" in the query.
     *
     * <p>Uses a constructor expression so JPA returns typed DTOs directly
     * instead of {@code Object[]} rows we'd have to map by hand.
     */
    @Query("""
        select new com.giannis.eshop.dto.TopProductResponse(
            oi.productId,
            oi.title,
            sum(oi.qty),
            sum(oi.lineTotal)
        )
        from OrderItem oi
        group by oi.productId, oi.title
        order by sum(oi.qty) desc
    """)
    List<TopProductResponse> findTopProducts(Pageable pageable);
}
