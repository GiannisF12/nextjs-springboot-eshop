package com.giannis.eshop.dto;

import com.giannis.eshop.model.AppUser;
import com.giannis.eshop.model.Gender;
import com.giannis.eshop.model.Role;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AdminUserResponse(
        Long id,
        String email,
        String name,
        Role role,
        Gender gender,
        LocalDate birthday,
        long ordersCount,
        BigDecimal totalSpent
) {
    public static AdminUserResponse of(AppUser u, long ordersCount, BigDecimal totalSpent) {
        return new AdminUserResponse(
                u.getId(),
                u.getEmail(),
                u.getName(),
                u.getRole(),
                u.getGender(),
                u.getBirthday(),
                ordersCount,
                totalSpent == null ? BigDecimal.ZERO : totalSpent
        );
    }
}
