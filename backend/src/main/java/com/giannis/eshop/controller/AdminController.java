package com.giannis.eshop.controller;

import com.giannis.eshop.dto.AdminUserResponse;
import com.giannis.eshop.dto.OrderStatusCountResponse;
import com.giannis.eshop.dto.RevenueByMonthResponse;
import com.giannis.eshop.dto.TopProductResponse;
import com.giannis.eshop.model.AppUser;
import com.giannis.eshop.model.Role;
import com.giannis.eshop.repository.OrderItemRepository;
import com.giannis.eshop.repository.OrderRepository;
import com.giannis.eshop.repository.ProductRepository;
import com.giannis.eshop.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
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

    @GetMapping("/users")
    public List<AdminUserResponse> listUsers() {
        return userRepository.findAll().stream()
                .map(u -> AdminUserResponse.of(
                        u,
                        orderRepository.countByUserId(u.getId()),
                        orderRepository.sumTotalByUserId(u.getId())
                ))
                .toList();
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<AdminUserResponse> getUser(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(u -> AdminUserResponse.of(
                        u,
                        orderRepository.countByUserId(u.getId()),
                        orderRepository.sumTotalByUserId(u.getId())
                ))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Toggle the banned flag on a user. Guardrails:
     * <ul>
     *   <li>Cannot ban another admin (prevents lockout).</li>
     *   <li>Cannot ban yourself.</li>
     * </ul>
     */
    @PatchMapping("/users/{id}/ban")
    public AdminUserResponse setBanned(@PathVariable Long id,
                                       @RequestBody BanRequest req,
                                       Authentication auth) {
        AppUser target = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (target.getRole() == Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot ban another admin.");
        }

        if (auth != null && target.getEmail().equalsIgnoreCase(auth.getName())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot ban yourself.");
        }

        target.setBanned(req.banned());
        userRepository.save(target);

        return AdminUserResponse.of(
                target,
                orderRepository.countByUserId(target.getId()),
                orderRepository.sumTotalByUserId(target.getId())
        );
    }

    record BanRequest(boolean banned) {}

    @GetMapping("/analytics/revenue-by-month")
    public List<RevenueByMonthResponse> revenueByMonth() {
        return orderRepository.findRevenueByMonthRaw().stream()
                .map(row -> new RevenueByMonthResponse(
                        (String) row[0],
                        (BigDecimal) row[1]
                ))
                .toList();
    }

    @GetMapping("/analytics/top-products")
    public List<TopProductResponse> topProducts() {
        return orderItemRepository.findTopProducts(PageRequest.of(0, 5));
    }

    @GetMapping("/analytics/order-status")
    public List<OrderStatusCountResponse> orderStatusCounts() {
        return orderRepository.countByStatusGrouped();
    }

    record StatsResponse(
            long totalOrders,
            long totalProducts,
            long totalUsers,
            BigDecimal totalRevenue
    ) {}
}
