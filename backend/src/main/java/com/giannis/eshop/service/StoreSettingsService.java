package com.giannis.eshop.service;

import com.giannis.eshop.dto.StoreSettingsRequest;
import com.giannis.eshop.dto.StoreSettingsResponse;
import com.giannis.eshop.model.StoreSettings;
import com.giannis.eshop.repository.StoreSettingsRepository;
import lombok.RequiredArgsConstructor;
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
        StoreSettings settings = getEntity();
        // BigDecimal scale of 2 to keep money tidy regardless of what
        // the client sent (e.g. "3" → "3.00", "3.456" → "3.46").
        settings.setShippingFlatRate(
                req.shippingFlatRate().setScale(2, RoundingMode.HALF_UP));
        settings.setFreeShippingThreshold(
                req.freeShippingThreshold().setScale(2, RoundingMode.HALF_UP));
        settings.setLowStockThreshold(req.lowStockThreshold());
        // updated_at refreshed by @PreUpdate.
        return toResponse(settings);
    }

    /**
     * Computes the shipping cost for a given pre-discount subtotal.
     * Lives here so OrderService and any future quote endpoint share
     * one source of truth.
     */
    public BigDecimal computeShippingFor(BigDecimal subtotal) {
        StoreSettings s = getEntity();
        // Threshold of 0 means "no free-shipping tier" — always charge.
        // Threshold > 0 and subtotal >= threshold → free.
        BigDecimal threshold = s.getFreeShippingThreshold();
        if (threshold.signum() > 0 && subtotal.compareTo(threshold) >= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return s.getShippingFlatRate();
    }

    private StoreSettingsResponse toResponse(StoreSettings s) {
        return new StoreSettingsResponse(
                s.getShippingFlatRate(),
                s.getFreeShippingThreshold(),
                s.getLowStockThreshold(),
                s.getUpdatedAt()
        );
    }
}
