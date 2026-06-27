package com.giannis.eshop.service;

import com.giannis.eshop.dto.StoreSettingsRequest;
import com.giannis.eshop.dto.StoreSettingsResponse;
import com.giannis.eshop.model.PaymentMethod;
import com.giannis.eshop.model.StoreSettings;
import com.giannis.eshop.repository.StoreSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Singleton store settings reader/writer. Always operates on id = 1.
 *
 * The row is seeded by Flyway V9, so we should never have to create
 * one — if it's somehow missing we fail loud (500) rather than try to
 * silently re-create and risk masking a real DB problem.
 */
@Service
@RequiredArgsConstructor
public class StoreSettingsService {

    /** The id of the singleton settings row. */
    private static final long SETTINGS_ID = 1L;

    private final StoreSettingsRepository repository;

    /**
     * Whether card payments are actually wired up. Stays false until the
     * Stripe integration ships; until then the admin card toggle has no
     * effect and card shows as "Coming soon" at checkout.
     */
    @Value("${eshop.payments.card-available:false}")
    private boolean cardAvailable;

    /**
     * Fetches the current settings entity. Used by other services
     * (notably OrderService) that need the values for calculation.
     */
    @Transactional(readOnly = true)
    public StoreSettings getEntity() {
        return repository.findById(SETTINGS_ID)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "Store settings row missing — Flyway seed did not run?"));
    }

    @Transactional(readOnly = true)
    public StoreSettingsResponse get() {
        return toResponse(getEntity());
    }

    @Transactional
    public StoreSettingsResponse update(StoreSettingsRequest req) {
        boolean newCod = Boolean.TRUE.equals(req.codEnabled());
        boolean newCard = Boolean.TRUE.equals(req.cardEnabled());
        // At least one USABLE (available AND enabled) payment method must
        // remain, so checkout never dead-ends. Checked before any write.
        if (usablePaymentCount(newCod, newCard) == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "At least one payment method must stay available.");
        }

        StoreSettings settings = getEntity();
        // BigDecimal scale of 2 to keep money tidy regardless of what
        // the client sent (e.g. "3" → "3.00", "3.456" → "3.46").
        settings.setFreeShippingThreshold(
                req.freeShippingThreshold().setScale(2, RoundingMode.HALF_UP));
        settings.setLowStockThreshold(req.lowStockThreshold());
        settings.setCodEnabled(newCod);
        settings.setCardEnabled(newCard);
        // updated_at refreshed by @PreUpdate.
        return toResponse(settings);
    }

    /** How many payment methods would be usable for the given toggles. */
    private int usablePaymentCount(boolean codEnabled, boolean cardEnabled) {
        int n = 0;
        if (codEnabled) n++;                      // COD is always "available"
        if (cardAvailable && cardEnabled) n++;
        return n;
    }

    /**
     * Whether a payment method can currently be used — i.e. it is both
     * available (the code supports charging through it) AND enabled by the
     * admin. COD is always available; card depends on the config flag.
     */
    public boolean isPaymentMethodUsable(PaymentMethod method) {
        StoreSettings s = getEntity();
        return switch (method) {
            case COD -> Boolean.TRUE.equals(s.getCodEnabled());
            case STRIPE -> cardAvailable && Boolean.TRUE.equals(s.getCardEnabled());
        };
    }

    /** Rejects (400) an order whose chosen payment method isn't usable. */
    public void assertPaymentMethodUsable(PaymentMethod method) {
        if (!isPaymentMethodUsable(method)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Payment method is not available: " + method);
        }
    }

    /**
     * Applies the global free-shipping threshold to any base rate.
     * Returns €0.00 when the threshold is set (> 0) and the pre-discount
     * subtotal reaches it; otherwise returns the base rate (scaled to 2dp).
     * Shared by the flat-rate path and the per-courier path.
     */
    public BigDecimal applyFreeShipping(BigDecimal subtotal, BigDecimal baseRate) {
        BigDecimal threshold = getEntity().getFreeShippingThreshold();
        if (threshold.signum() > 0 && subtotal.compareTo(threshold) >= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return baseRate.setScale(2, RoundingMode.HALF_UP);
    }

    private StoreSettingsResponse toResponse(StoreSettings s) {
        return new StoreSettingsResponse(
                s.getFreeShippingThreshold(),
                s.getLowStockThreshold(),
                Boolean.TRUE.equals(s.getCodEnabled()),
                Boolean.TRUE.equals(s.getCardEnabled()),
                cardAvailable,
                s.getUpdatedAt()
        );
    }
}
