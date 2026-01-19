package com.giannis.eshop.controller;

import com.giannis.eshop.model.Category;
import com.giannis.eshop.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;

    @GetMapping
    public List<Category> getAlL() {
        return categoryRepository.findAll();
    }
}
