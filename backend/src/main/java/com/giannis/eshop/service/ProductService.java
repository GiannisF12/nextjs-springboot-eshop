package com.giannis.eshop.service;

import com.giannis.eshop.dto.ProductResponse;
import com.giannis.eshop.model.Product;
import com.giannis.eshop.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository repository;

    public List<ProductResponse> findAll() {
        return repository.findAll().stream()
                .map(p -> new ProductResponse(
                        p.getId(),
                        p.getTitle(),
                        p.getPrice(),
                        p.getImage(),
                        p.getCategory().getId(),
                        p.getCategory().getName()
                ))
                .toList();
    }

    public ProductResponse findById(Long id) {
        Product p = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        return new ProductResponse(
                p.getId(),
                p.getTitle(),
                p.getPrice(),
                p.getImage(),
                p.getCategory().getId(),
                p.getCategory().getName()
        );
    }
}