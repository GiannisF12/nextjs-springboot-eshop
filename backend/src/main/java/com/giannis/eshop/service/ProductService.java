package com.giannis.eshop.service;

import com.giannis.eshop.dto.CreateProductRequest;
import com.giannis.eshop.dto.ProductResponse;
import com.giannis.eshop.dto.UpdateProductRequest;
import com.giannis.eshop.model.Category;
import com.giannis.eshop.model.Product;
import com.giannis.eshop.repository.CategoryRepository;
import com.giannis.eshop.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository repository;
    private final CategoryRepository categoryRepository;

    public Page<ProductResponse> findAll(Pageable pageable) {
        return repository.findAllWithCategory(pageable).map(this::toResponse);
    }

    public ProductResponse findById(Long id) {
        Product p = repository.findByIdWithCategory(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        return toResponse(p);
    }

    public ProductResponse create(CreateProductRequest req) {
        Category category = categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));

        Product product = Product.builder()
                .title(req.title())
                .price(req.price())
                .image(req.image())
                .category(category)
                .build();

        return toResponse(repository.save(product));
    }

    public ProductResponse update(Long id, UpdateProductRequest req) {
        Product product = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        Category category = categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));

        product.setTitle(req.title());
        product.setPrice(req.price());
        product.setImage(req.image());
        product.setCategory(category);

        return toResponse(repository.save(product));
    }

    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found");
        }
        repository.deleteById(id);
    }

    private ProductResponse toResponse(Product p) {
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