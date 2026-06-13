package com.giannis.eshop.repository;

import com.giannis.eshop.dto.OrderStatusCountResponse;
import com.giannis.eshop.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    @Query("""
        select distinct o from Order o
        left join fetch o.items
        where o.id = :id
    """)
    Optional<Order> findByIdWithItems(@Param("id") Long id);

    /** Used by the Stripe webhook to find the order a session belongs to. */
    @Query("""
        select distinct o from Order o
        left join fetch o.items
        where o.stripeSessionId = :sessionId
    """)
    Optional<Order> findByStripeSessionId(@Param("sessionId") String sessionId);

    @Query("""
        select distinct o from Order o
        left join fetch o.items
        order by o.id desc
    """)
    List<Order> findAllWithItems();

    @Query("""
        select distinct o from Order o
        left join fetch o.items
        where o.user.id = :userId
        order by o.createdAt desc
    """)
    List<Order> findByUserIdWithItems(@Param("userId") Long userId);

    @Query("select sum(o.total) from Order o")
    BigDecimal sumTotalRevenue();

    @Query("select count(o) from Order o where o.user.id = :userId")
    long countByUserId(@Param("userId") Long userId);

    @Query("select sum(o.total) from Order o where o.user.id = :userId")
    BigDecimal sumTotalByUserId(@Param("userId") Long userId);

    /**
     * Revenue grouped by calendar month for the last 12 months.
     * Native query because JPQL doesn't expose {@code date_trunc}, and
     * formatting the month on the DB keeps the response flat and portable.
     * Each row is {@code [month:String, revenue:BigDecimal]}.
     */
    @Query(value = """
        SELECT TO_CHAR(date_trunc('month', created_at), 'YYYY-MM') AS month,
               COALESCE(SUM(total), 0)                              AS revenue
        FROM orders
        WHERE created_at >= (CURRENT_DATE - INTERVAL '12 months')
        GROUP BY 1
        ORDER BY 1
    """, nativeQuery = true)
    List<Object[]> findRevenueByMonthRaw();

    @Query("""
        select new com.giannis.eshop.dto.OrderStatusCountResponse(o.status, count(o))
        from Order o
        group by o.status
    """)
    List<OrderStatusCountResponse> countByStatusGrouped();
}