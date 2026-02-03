package com.giannis.eshop.repository;

import com.giannis.eshop.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    @Query("""
        select distinct o from Order o
        left join fetch o.items
        where o.id = :id
    """)
    Optional<Order> findByIdWithItems(@Param("id") Long id);

    @Query("""
        select distinct o from Order o
        left join fetch o.items
        order by o.id desc
    """)
    List<Order> findAllWithItems();
}