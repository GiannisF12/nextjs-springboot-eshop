package com.giannis.eshop.repository;

import com.giannis.eshop.model.DiscountCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DiscountCodeRepository extends JpaRepository<DiscountCode, Long> {

    /** Exact lookup — callers upper-case the input first. */
    Optional<DiscountCode> findByCode(String code);
}
