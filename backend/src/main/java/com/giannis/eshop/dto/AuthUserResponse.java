package com.giannis.eshop.dto;

import com.giannis.eshop.model.Gender;
import com.giannis.eshop.model.Role;

import java.time.LocalDate;

public record AuthUserResponse(
        Long id,
        String email,
        String name,
        Role role,
        Gender gender,
        LocalDate birthday
) {}
