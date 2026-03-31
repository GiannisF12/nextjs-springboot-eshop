package com.giannis.eshop.controller;

import com.giannis.eshop.dto.CreateOrderRequest;
import com.giannis.eshop.dto.OrderResponse;
import com.giannis.eshop.model.AppUser;
import com.giannis.eshop.model.OrderStatus;
import com.giannis.eshop.repository.UserRepository;
import com.giannis.eshop.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;



@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class OrderController {

    private final OrderService service;
    private final UserRepository userRepository;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse create(@Valid @RequestBody CreateOrderRequest req,
                                Authentication auth) {
        AppUser user = null;
        if (auth != null && auth.isAuthenticated()) {
            user = userRepository.findByEmail(auth.getName()).orElse(null);
        }
        return service.create(req, user);
    }

    @GetMapping("/mine")
    public java.util.List<OrderResponse> getMyOrders(Authentication auth) {
        AppUser user = userRepository.findByEmail(auth.getName())
                .orElseThrow();
        return service.findByUser(user.getId());
    }

    @GetMapping("/{id}")
    public OrderResponse getById(@PathVariable Long id) {
        return service.findById(id);
    }

    @GetMapping
    public java.util.List<OrderResponse> getAll() {
        return service.findAll();
    }

    @PatchMapping("/{id}/status")
    public OrderResponse updateStatus(
            @PathVariable Long id,
            @RequestParam OrderStatus status) {
        return service.updateStatus(id,status);
    }
}