package com.giannis.eshop.dto;

import com.giannis.eshop.validation.StrongPassword;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record RegisterRequest(
        @NotBlank @Email String email,
        @NotBlank @StrongPassword String password,
        @NotBlank String name
) {}
