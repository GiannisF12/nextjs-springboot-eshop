package com.giannis.eshop.config;

import com.giannis.eshop.model.*;
import com.giannis.eshop.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Seeds demo customer users and historical orders so the admin analytics
 * charts have data on a fresh deploy.
 *
 * Runs only when eshop.seed.demo-products=true AND the orders table is empty.
 * Delete this file when handing the project to a real client.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "eshop.seed.demo-products", havingValue = "true")
public class DemoOrderSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final OrderStatusHistoryRepository orderStatusHistoryRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String DEMO_PASSWORD = "customer1234";

    // Orders per month, oldest month first. Total = 30.
    private static final int[] ORDERS_PER_MONTH = {1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4};

    // 30 statuses in order: older orders are more likely delivered.
    private static final OrderStatus[] STATUSES = {
        OrderStatus.DELIVERED, OrderStatus.DELIVERED, OrderStatus.DELIVERED,
        OrderStatus.DELIVERED, OrderStatus.DELIVERED, OrderStatus.DELIVERED,
        OrderStatus.DELIVERED, OrderStatus.DELIVERED, OrderStatus.DELIVERED,
        OrderStatus.DELIVERED,
        OrderStatus.SHIPPED, OrderStatus.SHIPPED, OrderStatus.SHIPPED,
        OrderStatus.SHIPPED, OrderStatus.SHIPPED, OrderStatus.SHIPPED,
        OrderStatus.SHIPPED,
        OrderStatus.PROCESSING, OrderStatus.PROCESSING, OrderStatus.PROCESSING,
        OrderStatus.PROCESSING, OrderStatus.PROCESSING, OrderStatus.PROCESSING,
        OrderStatus.NEW, OrderStatus.NEW, OrderStatus.NEW, OrderStatus.NEW,
        OrderStatus.CANCELLED, OrderStatus.CANCELLED, OrderStatus.CANCELLED
    };

    private static final String[] EMAILS  = {
        "alex@demo.com", "maria@demo.com", "nikos@demo.com",
        "elena@demo.com", "dimitris@demo.com"
    };
    private static final String[] NAMES   = {
        "Alex Papadopoulos", "Maria Georgiou", "Nikos Stavros",
        "Elena Kostaki", "Dimitris Alexiou"
    };
    private static final String[] PHONES  = {"6901234567", "6977654321", "6955001122", "6988776655", "6933445566"};
    private static final String[] STREETS = {"Ermou 25", "Stadiou 12", "Panepistimiou 8", "Kolonaki 5", "Kifisias 100"};
    private static final String[] CITIES  = {"Athens", "Thessaloniki", "Patras", "Heraklion", "Larissa"};
    private static final String[] ZIPS    = {"10562", "54621", "26221", "71201", "41222"};

    private static final String[] CLOTHING_SIZES = {"S", "M", "L", "XL", "M", "L", "M"};
    private static final String[] SHOE_SIZES     = {"41", "42", "43", "42", "41", "43", "42"};

    private static final int[]    DISCOUNT_AT       = {2, 7, 12, 18, 24};
    private static final String[] DISCOUNT_CODES    = {"WELCOME10", "WELCOME10", "WELCOME10", "SAVE20", "SAVE20"};
    private static final int[]    DISCOUNT_PERCENTS = {10, 10, 10, 20, 20};

    private static final BigDecimal SHIPPING_FEE        = new BigDecimal("3.50");
    private static final BigDecimal FREE_SHIP_THRESHOLD = new BigDecimal("50.00");

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (orderRepository.count() > 0) {
            log.info("Demo seed (orders): orders already exist — skipping.");
            return;
        }
        if (productRepository.count() == 0) {
            log.warn("Demo seed (orders): no products found — DemoDataInitializer may not have run yet. Skipping.");
            return;
        }

        log.info("Demo seed (orders): seeding customers and orders.");
        List<AppUser> customers = seedCustomers();
        seedOrders(customers);
        log.info("Demo seed (orders): complete.");
    }

    private List<AppUser> seedCustomers() {
        String hash = passwordEncoder.encode(DEMO_PASSWORD);
        List<AppUser> result = new ArrayList<>();
        for (int i = 0; i < EMAILS.length; i++) {
            if (userRepository.existsByEmail(EMAILS[i])) {
                userRepository.findByEmail(EMAILS[i]).ifPresent(result::add);
                continue;
            }
            result.add(userRepository.save(AppUser.builder()
                    .email(EMAILS[i])
                    .name(NAMES[i])
                    .passwordHash(hash)
                    .role(Role.USER)
                    .banned(false)
                    .build()));
        }
        return result;
    }

    private void seedOrders(List<AppUser> customers) {
        List<Product> products = productRepository.findAll();
        Random rng = new Random(42);
        Instant now = Instant.now();

        int orderIdx = 0;
        int discountCursor = 0;

        for (int monthOffset = 0; monthOffset < 12; monthOffset++) {
            int monthsAgo = 11 - monthOffset;
            int count = ORDERS_PER_MONTH[monthOffset];

            for (int i = 0; i < count; i++) {
                AppUser customer = customers.get(orderIdx % customers.size());
                OrderStatus status = STATUSES[orderIdx];
                int addrIdx = orderIdx % NAMES.length;

                long dayOffset = rng.nextInt(28);
                Instant createdAt = now.minus(monthsAgo * 30L + dayOffset, ChronoUnit.DAYS);

                int itemCount = 1 + rng.nextInt(3);
                List<Product> picked = pickProducts(products, itemCount, rng);

                boolean hasDiscount = contains(DISCOUNT_AT, orderIdx);
                String discountCode = null;
                Integer discountPercent = null;
                if (hasDiscount && discountCursor < DISCOUNT_CODES.length) {
                    discountCode = DISCOUNT_CODES[discountCursor];
                    discountPercent = DISCOUNT_PERCENTS[discountCursor];
                    discountCursor++;
                }

                BigDecimal subtotal = BigDecimal.ZERO;
                for (Product p : picked) {
                    int qty = 1 + rng.nextInt(2);
                    subtotal = subtotal.add(p.getPrice().multiply(BigDecimal.valueOf(qty)));
                }

                BigDecimal shipping = subtotal.compareTo(FREE_SHIP_THRESHOLD) >= 0
                        ? BigDecimal.ZERO : SHIPPING_FEE;

                BigDecimal discount = BigDecimal.ZERO;
                if (discountPercent != null) {
                    discount = subtotal.multiply(BigDecimal.valueOf(discountPercent))
                            .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                }

                BigDecimal total = subtotal.add(shipping).subtract(discount).max(BigDecimal.ZERO);

                Order order = Order.builder()
                        .user(customer)
                        .createdAt(createdAt)
                        .customerName(NAMES[addrIdx])
                        .phone(PHONES[addrIdx])
                        .addressLine(STREETS[addrIdx])
                        .city(CITIES[addrIdx])
                        .zip(ZIPS[addrIdx])
                        .total(total)
                        .shippingCost(shipping)
                        .discountCode(discountCode)
                        .discountPercent(discountPercent)
                        .status(status)
                        .paymentMethod(PaymentMethod.COD)
                        .build();

                Random sizeRng = new Random(orderIdx);
                for (Product p : picked) {
                    int qty = 1 + sizeRng.nextInt(2);
                    String size = isShoeCategory(p.getCategory().getName())
                            ? SHOE_SIZES[orderIdx % SHOE_SIZES.length]
                            : CLOTHING_SIZES[orderIdx % CLOTHING_SIZES.length];

                    order.getItems().add(OrderItem.builder()
                            .order(order)
                            .productId(p.getId())
                            .title(p.getTitle())
                            .price(p.getPrice())
                            .image(p.getImage())
                            .category(p.getCategory().getName())
                            .qty(qty)
                            .size(size)
                            .lineTotal(p.getPrice().multiply(BigDecimal.valueOf(qty)))
                            .build());
                }

                orderRepository.save(order);

                orderStatusHistoryRepository.save(OrderStatusHistory.builder()
                        .orderId(order.getId())
                        .status(status)
                        .changedAt(createdAt)
                        .build());

                orderIdx++;
            }
        }
    }

    private List<Product> pickProducts(List<Product> all, int count, Random rng) {
        List<Product> copy = new ArrayList<>(all);
        List<Product> result = new ArrayList<>();
        for (int i = 0; i < Math.min(count, copy.size()); i++) {
            result.add(copy.remove(rng.nextInt(copy.size())));
        }
        return result;
    }

    private boolean isShoeCategory(String name) {
        return name != null && name.equalsIgnoreCase("Shoes");
    }

    private boolean contains(int[] arr, int val) {
        for (int v : arr) if (v == val) return true;
        return false;
    }
}
