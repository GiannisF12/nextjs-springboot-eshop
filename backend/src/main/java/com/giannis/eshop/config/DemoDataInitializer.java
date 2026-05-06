package com.giannis.eshop.config;

import com.giannis.eshop.model.Category;
import com.giannis.eshop.model.DiscountCode;
import com.giannis.eshop.model.Product;
import com.giannis.eshop.model.ProductVariant;
import com.giannis.eshop.model.SizeType;
import com.giannis.eshop.repository.CategoryRepository;
import com.giannis.eshop.repository.DiscountCodeRepository;
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
 * Seeds a populated demo shop on startup so the live demo / a fresh
 * dev environment looks like a real shop, not a sandbox.
 *
 * Runs only when BOTH:
 *   1) `eshop.seed.demo-products` is true (env-driven; on for dev,
 *      OFF for any client production deploy — they don't want our
 *      placeholder catalog).
 *   2) The products table is empty. Restarting the app a second time
 *      is a no-op and never touches a real shop owner's data.
 *
 * Inserts:
 *   - 5 extra categories (alongside the 3 from V2 migration)
 *   - 30 products with realistic prices, varied stock, real Unsplash
 *     photos
 *   - 3 demo discount codes (one inactive, to show the toggle)
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
    private final DiscountCodeRepository discountCodeRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {

        if (productRepository.count() > 0) {
            log.info("Demo seed: products table already has data — skipping.");
            return;
        }

        log.info("Demo seed: products table is empty — inserting demo data.");

        seedCategories();
        seedProducts();
        seedDiscountCodes();

        log.info(
                "Demo seed complete: {} products, {} categories, {} discount codes.",
                productRepository.count(),
                categoryRepository.count(),
                discountCodeRepository.count()
        );
    }

    /* --------------------------- Categories -------------------------- */

    /**
     * Adds the categories the demo products need, on top of the three
     * (Shoes, T-Shirts, Hoodies) seeded by the V2 migration. Idempotent
     * via {@code existsByNameIgnoreCase}.
     */
    private void seedCategories() {
        ensureCategory("Sweatshirts", SizeType.CLOTHING);
        ensureCategory("Jackets", SizeType.CLOTHING);
        ensureCategory("Pants", SizeType.CLOTHING);
        ensureCategory("Shorts", SizeType.CLOTHING);
        ensureCategory("Caps", SizeType.CLOTHING);
    }

    private void ensureCategory(String name, SizeType sizeType) {
        if (categoryRepository.existsByNameIgnoreCase(name)) return;
        categoryRepository.save(Category.builder()
                .name(name)
                .sizeType(sizeType)
                .build());
    }

    /* ---------------------------- Products --------------------------- */

    /**
     * Inserts every demo product. Each call to {@link #addProduct} is a
     * single product → one image → a list of (size, stock) variants.
     *
     * Stock numbers are deliberately varied: some products have all
     * sizes well stocked, some have a "Only N left" trigger (≤ 3),
     * some have a sold-out variant — exercises every UI branch
     * (low-stock nudge, disabled chip, out-of-stock badge).
     */
    private void seedProducts() {

        // ============== T-Shirts (5) ==============
        Optional<Category> tshirts = categoryRepository.findByNameIgnoreCase("T-Shirts");
        tshirts.ifPresent(cat -> {
            addProduct("Classic White Tee",
                    "19.90",
                    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
                    cat,
                    clothing(8, 15, 12, 6, 4));

            addProduct("Black Cotton Tee",
                    "19.90",
                    "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800",
                    cat,
                    clothing(10, 18, 15, 9, 5));

            addProduct("Vintage Graphic Tee",
                    "24.90",
                    "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800",
                    cat,
                    clothing(0, 6, 4, 2, 0));   // sold out S + XXL, low stock M/L/XL

            addProduct("Striped Long-sleeve",
                    "29.90",
                    "https://images.unsplash.com/photo-1622445275576-721325763afe?w=800",
                    cat,
                    clothing(7, 12, 10, 8, 3));

            addProduct("Pocket Henley",
                    "27.90",
                    "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800",
                    cat,
                    clothing(5, 9, 11, 6, 2));
        });

        // ============== Hoodies (4) ==============
        Optional<Category> hoodies = categoryRepository.findByNameIgnoreCase("Hoodies");
        hoodies.ifPresent(cat -> {
            addProduct("Black Pullover Hoodie",
                    "49.00",
                    "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800",
                    cat,
                    clothing(5, 2, 7, 0, 4));   // M low, XL sold out

            addProduct("Grey Zip-up Hoodie",
                    "54.90",
                    "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800",
                    cat,
                    clothing(6, 10, 8, 5, 3));


            addProduct("Athletic Performance Hoodie",
                    "64.90",
                    "https://images.unsplash.com/photo-1611911813383-67769b37a149?w=800",
                    cat,
                    clothing(3, 8, 12, 7, 4));
        });

        // ============== Sweatshirts (3) ==============
        Optional<Category> sweatshirts = categoryRepository.findByNameIgnoreCase("Sweatshirts");
        sweatshirts.ifPresent(cat -> {
            addProduct("Crew Neck Sweatshirt",
                    "39.90",
                    "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800",
                    cat,
                    clothing(8, 14, 11, 6, 3));

            addProduct("Embroidered Logo Sweatshirt",
                    "44.90",
                    "https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?w=800",
                    cat,
                    clothing(5, 10, 8, 4, 2));

            addProduct("Pastel Pink Sweatshirt",
                    "42.90",
                    "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800",
                    cat,
                    clothing(0, 3, 6, 2, 1));   // S sold out, rest low
        });

        // ============== Jackets (3) ==============
        Optional<Category> jackets = categoryRepository.findByNameIgnoreCase("Jackets");
        jackets.ifPresent(cat -> {
            addProduct("Denim Trucker Jacket",
                    "89.00",
                    "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800",
                    cat,
                    clothing(4, 7, 9, 5, 2));

            addProduct("Bomber Jacket",
                    "99.00",
                    "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800",
                    cat,
                    clothing(3, 6, 8, 4, 1));

            addProduct("Lightweight Windbreaker",
                    "69.00",
                    "https://images.unsplash.com/photo-1606112219348-204d7d8b94ee?w=800",
                    cat,
                    clothing(6, 9, 11, 7, 4));
        });

        // ============== Pants (4) ==============
        Optional<Category> pants = categoryRepository.findByNameIgnoreCase("Pants");
        pants.ifPresent(cat -> {
            addProduct("Slim Fit Chinos",
                    "54.90",
                    "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800",
                    cat,
                    clothing(5, 12, 14, 8, 4));

            addProduct("Cargo Joggers",
                    "64.90",
                    "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800",
                    cat,
                    clothing(7, 10, 9, 5, 3));

            addProduct("Black Skinny Jeans",
                    "69.90",
                    "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800",
                    cat,
                    clothing(4, 8, 11, 6, 2));

            addProduct("Tapered Track Pants",
                    "49.90",
                    "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800",
                    cat,
                    clothing(0, 5, 7, 3, 0));   // S + XXL sold out
        });

        // ============== Shorts (3) ==============
        Optional<Category> shorts = categoryRepository.findByNameIgnoreCase("Shorts");
        shorts.ifPresent(cat -> {
            addProduct("Athletic Shorts",
                    "29.90",
                    "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800",
                    cat,
                    clothing(8, 14, 12, 7, 4));


            addProduct("Linen Beach Shorts",
                    "34.90",
                    "https://images.unsplash.com/photo-1604176354204-9268737828e4?w=800",
                    cat,
                    clothing(3, 6, 8, 4, 2));
        });

        // ============== Caps (3) ==============
        // Caps don't really come in S/M/L in the real world, but the
        // category schema requires a size_type and the demo's job is to
        // exercise the UI, not to ship a perfect taxonomy. CLOTHING gives
        // it five size chips to play with.
        Optional<Category> caps = categoryRepository.findByNameIgnoreCase("Caps");
        caps.ifPresent(cat -> {
            addProduct("Classic Snapback",
                    "24.90",
                    "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800",
                    cat,
                    clothing(10, 15, 12, 8, 4));

            addProduct("Dad Cap",
                    "19.90",
                    "https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800",
                    cat,
                    clothing(8, 12, 10, 6, 3));

            addProduct("Wool Beanie",
                    "22.90",
                    "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=800",
                    cat,
                    clothing(5, 9, 7, 4, 2));
        });

        // ============== Shoes (5) ==============
        Optional<Category> shoes = categoryRepository.findByNameIgnoreCase("Shoes");
        shoes.ifPresent(cat -> {
            addProduct("Running Sneakers",
                    "89.90",
                    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
                    cat,
                    shoesStock(3, 5, 0, 4, 2, 0));   // 42 + 45 sold out

            addProduct("Leather Boots",
                    "129.00",
                    "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800",
                    cat,
                    shoesStock(2, 3, 1, 4, 0, 0));   // 44 + 45 sold out, 42 low

            addProduct("White Canvas Sneakers",
                    "59.90",
                    "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800",
                    cat,
                    shoesStock(6, 8, 7, 5, 4, 2));

            addProduct("High-top Basketball Shoe",
                    "119.00",
                    "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800",
                    cat,
                    shoesStock(3, 5, 6, 4, 2, 1));

            addProduct("Trail Hiking Boots",
                    "149.00",
                    "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800",
                    cat,
                    shoesStock(0, 4, 5, 3, 2, 0));   // 40 + 45 sold out
        });
    }

    /* ------------------------ Discount codes ------------------------ */

    /**
     * Three demo codes covering the three states the admin can land in:
     *   - active general code
     *   - active aggressive sale code
     *   - inactive code (so the admin sees the toggle in action)
     */
    private void seedDiscountCodes() {
        addDiscount("WELCOME10", 10, true);
        addDiscount("SAVE20", 20, true);
        addDiscount("BLACKFRIDAY50", 50, false);
    }

    private void addDiscount(String code, int percentOff, boolean active) {
        if (discountCodeRepository.findByCode(code).isPresent()) return;
        discountCodeRepository.save(DiscountCode.builder()
                .code(code)
                .percentOff(percentOff)
                .active(active)
                .build());
    }

    /* ----------------------------- Helpers --------------------------- */

    /**
     * Builds a five-variant list (S, M, L, XL, XXL) with the given
     * stock numbers. A `0` makes that size sold out — a sanity-check
     * the storefront should render with a disabled chip.
     */
    private List<ProductVariant> clothing(int s, int m, int l, int xl, int xxl) {
        return List.of(
                variant("S", s),
                variant("M", m),
                variant("L", l),
                variant("XL", xl),
                variant("XXL", xxl)
        );
    }

    /**
     * Six-variant list for shoes (40-45). We pick a slice of the
     * available shoe sizes (38-48) since most products don't stock
     * the entire range.
     */
    private List<ProductVariant> shoesStock(int s40, int s41, int s42, int s43, int s44, int s45) {
        return List.of(
                variant("40", s40),
                variant("41", s41),
                variant("42", s42),
                variant("43", s43),
                variant("44", s44),
                variant("45", s45)
        );
    }

    private ProductVariant variant(String size, int stock) {
        return ProductVariant.builder()
                .size(size)
                .stock(stock)
                .build();
    }

    private void addProduct(
            String title,
            String price,
            String image,
            Category category,
            List<ProductVariant> variants
    ) {
        Product product = Product.builder()
                .title(title)
                .price(new BigDecimal(price))
                .image(image)
                .category(category)
                .build();

        // Wire the back-reference so cascade=ALL persists both sides
        // (ProductVariant has a required product_id column).
        for (ProductVariant v : variants) {
            v.setProduct(product);
            product.getVariants().add(v);
        }

        productRepository.save(product);
    }
}
