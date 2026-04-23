package com.giannis.eshop.service;

import com.giannis.eshop.dto.CreateProductRequest;
import com.giannis.eshop.dto.ProductResponse;
import com.giannis.eshop.dto.UpdateProductRequest;
import com.giannis.eshop.model.Category;
import com.giannis.eshop.model.Product;
import com.giannis.eshop.model.ProductVariant;
import com.giannis.eshop.model.SizeType;
import com.giannis.eshop.repository.CategoryRepository;
import com.giannis.eshop.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
// Class-level read-only transaction: every method runs inside a Hibernate
// session, which is what lets toResponse() safely iterate the LAZY
// `variants` collection without tripping LazyInitializationException.
// Methods that modify data (create/update/delete) override this with
// their own @Transactional, which defaults to read-write.
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository repository;
    private final CategoryRepository categoryRepository;

    public Page<ProductResponse> findAll(Long categoryId, String q, Pageable pageable) {
        String query = (q == null || q.isBlank()) ? null : q.trim();

        Page<Product> page;

        if (categoryId == null && query == null) {
            page = repository.findAll(pageable);
        } else if (categoryId != null && query == null) {
            page = repository.findByCategory_Id(categoryId, pageable);
        } else if (categoryId == null) { // query != null
            page = repository.findByTitleContainingIgnoreCase(query, pageable);
        } else { // categoryId != null && query != null
            page = repository.findByCategory_IdAndTitleContainingIgnoreCase(categoryId, query, pageable);
        }

        return page.map(this::toResponse);
    }

    public ProductResponse findById(Long id) {
        Product p = repository.findByIdWithCategory(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        return toResponse(p);
    }

    @Transactional
    public ProductResponse create(CreateProductRequest req) {
        Category category = categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));

        List<String> incomingSizes = req.variants().stream()
                .map(CreateProductRequest.VariantInput::size)
                .toList();
        validateSizes(category, incomingSizes);

        Product product = Product.builder()
                .title(req.title())
                .price(req.price())
                .image(req.image())
                .category(category)
                .build();

        // Attach variants to the new product. Because of cascade = ALL,
        // saving the product will also INSERT the variant rows in the same
        // transaction.
        for (CreateProductRequest.VariantInput in : req.variants()) {
            product.getVariants().add(
                    ProductVariant.builder()
                            .product(product)
                            .size(in.size())
                            .stock(in.stock())
                            .build()
            );
        }

        return toResponse(repository.save(product));
    }

    @Transactional
    public ProductResponse update(Long id, UpdateProductRequest req) {
        Product product = repository.findByIdWithCategory(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        Category category = categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));

        List<String> incomingSizes = req.variants().stream()
                .map(UpdateProductRequest.VariantInput::size)
                .toList();
        validateSizes(category, incomingSizes);

        product.setTitle(req.title());
        product.setPrice(req.price());
        product.setImage(req.image());
        product.setCategory(category);

        // Reconcile the variants collection in place so JPA's dirty-checking
        // produces the minimum number of SQL statements:
        //   1) remove variants that are no longer in the new list (orphanRemoval deletes them)
        //   2) update stock on variants that still exist
        //   3) add brand-new variants

        Set<String> newSizes = new HashSet<>(incomingSizes);
        product.getVariants().removeIf(v -> !newSizes.contains(v.getSize()));

        Map<String, ProductVariant> existingBySize = product.getVariants().stream()
                .collect(Collectors.toMap(ProductVariant::getSize, v -> v));

        for (UpdateProductRequest.VariantInput in : req.variants()) {
            ProductVariant existing = existingBySize.get(in.size());
            if (existing != null) {
                existing.setStock(in.stock());
            } else {
                product.getVariants().add(
                        ProductVariant.builder()
                                .product(product)
                                .size(in.size())
                                .stock(in.stock())
                                .build()
                );
            }
        }

        return toResponse(repository.save(product));
    }

    /**
     * Inline stock update from the admin products list — the admin clicks a
     * size:stock pill and types a new number without opening the full form.
     * Verifies the variant actually belongs to the given product so callers
     * can't update arbitrary variants by guessing IDs.
     */
    @Transactional
    public ProductResponse updateVariantStock(Long productId, Long variantId, Integer stock) {
        Product product = repository.findByIdWithCategory(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        ProductVariant variant = product.getVariants().stream()
                .filter(v -> v.getId().equals(variantId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Variant not found for this product"));

        variant.setStock(stock);
        return toResponse(product);
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found");
        }
        repository.deleteById(id);
    }

    /**
     * Rejects invalid size labels (e.g. "M" for a SHOE category) and
     * duplicates (e.g. two "M" rows for the same product).
     */
    private void validateSizes(Category category, List<String> sizes) {
        SizeType sizeType = category.getSizeType();

        for (String size : sizes) {
            if (!sizeType.isValidSize(size)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid size '" + size + "' for " + sizeType + " category. "
                                + "Allowed: " + sizeType.sizes()
                );
            }
        }

        if (new HashSet<>(sizes).size() != sizes.size()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Duplicate sizes in variants list"
            );
        }
    }

    private ProductResponse toResponse(Product p) {
        SizeType sizeType = p.getCategory().getSizeType();

        // Sort variants in the "natural" order of the size type
        // (S,M,L,XL,XXL for clothing — 38,39,...,48 for shoes)
        // regardless of how they were stored in the DB.
        List<String> order = sizeType.sizes();
        Comparator<ProductVariant> bySizeOrder = Comparator.comparingInt(v -> {
            int i = order.indexOf(v.getSize());
            return i < 0 ? Integer.MAX_VALUE : i;
        });

        List<ProductResponse.Variant> variants = p.getVariants().stream()
                .sorted(bySizeOrder)
                .map(v -> new ProductResponse.Variant(v.getId(), v.getSize(), v.getStock()))
                .toList();

        return new ProductResponse(
                p.getId(),
                p.getTitle(),
                p.getPrice(),
                p.getImage(),
                p.getCategory().getId(),
                p.getCategory().getName(),
                sizeType,
                variants
        );
    }
}
