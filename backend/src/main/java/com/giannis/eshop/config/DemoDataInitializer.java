package com.giannis.eshop.config;

import com.giannis.eshop.model.Category;
import com.giannis.eshop.model.Product;
import com.giannis.eshop.model.ProductVariant;
import com.giannis.eshop.repository.CategoryRepository;
import com.giannis.eshop.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Seeds a handful of demo products on startup so the shop isn't empty
 * after a fresh database reset (e.g. `docker compose down -v && up`).
 *
 * This only runs when BOTH of these are true:
 *   1) The property `eshop.seed.demo-products` is set to `true`. We enable
 *      it in docker-compose.yml for local dev; production leaves it off.
 *   2) The `products` table is currently empty. That makes the seeder
 *      idempotent — restarting the app a second time is a no-op, and
 *      the shop owner's real products (created via the admin UI) are
 *      never touched.
 *
 * If either check fails, nothing happens.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(
        name = "eshop.seed.demo-products",
        havingValue = "true"
)
public class DemoDataInitializer implements ApplicationRunner {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {

        if (productRepository.count() > 0) {
            log.info("Demo seed: products table already has data — skipping.");
            return;
        }

        log.info("Demo seed: products table is empty — inserting demo data.");

        // Categories are seeded by V2 migration. We just look them up by name.
        // If a category is missing (shop owner renamed it), we skip that product
        // rather than crash — the seeder is best-effort convenience, not core
        // application logic.
        Optional<Category> shoes    = categoryRepository.findByNameIgnoreCase("Shoes");
        Optional<Category> tshirts  = categoryRepository.findByNameIgnoreCase("T-Shirts");
        Optional<Category> hoodies  = categoryRepository.findByNameIgnoreCase("Hoodies");

        // --- 1) T-Shirt: healthy stock across all sizes ---
        tshirts.ifPresent(cat -> createProduct(
                "Classic White Tee",
                new BigDecimal("19.90"),
                "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
                cat,
                List.of(
                        variant("S", 8),
                        variant("M", 15),
                        variant("L", 12),
                        variant("XL", 6),
                        variant("XXL", 4)
                )
        ));

        // --- 2) Hoodie: low stock on one size (tests "only N left" nudge) ---
        hoodies.ifPresent(cat -> createProduct(
                "Black Pullover Hoodie",
                new BigDecimal("49.00"),
                "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800",
                cat,
                List.of(
                        variant("S", 5),
                        variant("M", 2),      // low stock → triggers "Only 2 left"
                        variant("L", 7),
                        variant("XL", 0)      // out of stock → chip disabled
                )
        ));

        // --- 3) Shoe: EU sizes, a couple sold out (tests disabled chips) ---
        shoes.ifPresent(cat -> createProduct(
                "Running Sneakers",
                new BigDecimal("89.90"),
                "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
                cat,
                List.of(
                        variant("40", 3),
                        variant("41", 5),
                        variant("42", 0),     // sold out
                        variant("43", 4),
                        variant("44", 2),
                        variant("45", 0)      // sold out
                )
        ));

        // --- 4) Shoe: a second shoe so the category has variety ---
        shoes.ifPresent(cat -> createProduct(
                "Leather Boots",
                new BigDecimal("129.00"),
                "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800",
                cat,
                List.of(
                        variant("41", 2),
                        variant("42", 3),
                        variant("43", 1),     // low stock
                        variant("44", 4)
                )
        ));

        long count = productRepository.count();
        log.info("Demo seed: inserted {} demo product(s).", count);
    }

    // ---------- helpers ----------

    private ProductVariant variant(String size, int stock) {
        return ProductVariant.builder()
                .size(size)
                .stock(stock)
                .build();
    }

    private void createProduct(
            String title,
            BigDecimal price,
            String image,
            Category category,
            List<ProductVariant> variants
    ) {
        Product product = Product.builder()
                .title(title)
                .price(price)
                .image(image)
                .category(category)
                .build();

        // Wire the back-reference so cascade=ALL can persist both sides
        // (ProductVariant has a required product_id column).
        for (ProductVariant v : variants) {
            v.setProduct(product);
            product.getVariants().add(v);
        }

        productRepository.save(product);
    }
}
