package com.giannis.eshop.repository;

import com.giannis.eshop.model.Courier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CourierRepository extends JpaRepository<Courier, Long> {

    /** Enabled couriers for the checkout picker, in display order. */
    List<Courier> findByEnabledTrueOrderBySortOrderAsc();

    /** All couriers for the admin table, in display order. */
    List<Courier> findAllByOrderBySortOrderAsc();

    /** How many couriers are currently enabled — used to enforce the
     *  "at least one enabled" invariant before disabling one. */
    long countByEnabledTrue();
}
