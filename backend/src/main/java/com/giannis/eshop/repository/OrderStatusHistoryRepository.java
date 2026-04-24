package com.giannis.eshop.repository;

import com.giannis.eshop.model.OrderStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderStatusHistoryRepository
        extends JpaRepository<OrderStatusHistory, Long> {

    /** Oldest first — matches how the order page renders the timeline. */
    List<OrderStatusHistory> findByOrderIdOrderByChangedAtAsc(Long orderId);
}
