package com.giannis.eshop.controller;

import com.giannis.eshop.repository.OrderRepository;
import com.giannis.eshop.repository.ProductRepository;
import com.giannis.eshop.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @GetMapping("/health")
    public String health() {
        return "ok";
    }

    @GetMapping("/stats")
    public StatsResponse stats() {
        long totalOrders = orderRepository.count();
        long totalProducts = productRepository.count();
        long totalUsers = userRepository.count();

        BigDecimal totalRevenue = orderRepository.sumTotalRevenue();
        if (totalRevenue == null) totalRevenue = BigDecimal.ZERO;

        return new StatsResponse(totalOrders, totalProducts, totalUsers, totalRevenue);
    }

    record StatsResponse(
            long totalOrders,
            long totalProducts,
            long totalUsers,
            BigDecimal totalRevenue
    ) {}
}
