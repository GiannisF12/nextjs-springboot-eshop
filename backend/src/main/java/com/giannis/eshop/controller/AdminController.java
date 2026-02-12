package com.giannis.eshop.controller;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @GetMapping("/health")
    public String health() {
        return "ok";
    }
}