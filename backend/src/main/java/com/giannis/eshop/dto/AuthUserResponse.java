package com.giannis.eshop.dto;

import com.giannis.eshop.model.Role;

public record AuthUserResponse(
        Long id,
        String email,
        Role role
) {}