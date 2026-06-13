package com.giannis.eshop.service;

import com.giannis.eshop.dto.StoreSettingsRequest;
import com.giannis.eshop.dto.StoreSettingsResponse;
import com.giannis.eshop.model.PaymentMethod;
import com.giannis.eshop.model.StoreSettings;
import com.giannis.eshop.repository.StoreSettingsRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StoreSettingsServiceTest {

    @Mock
    StoreSettingsRepository repository;

    @InjectMocks
    StoreSettingsService service;

    private void stubThreshold(String threshold) {
        StoreSettings s = StoreSettings.builder()
                .id(1L)
                .freeShippingThreshold(new BigDecimal(threshold))
                .lowStockThreshold(5)
                .build();
        when(repository.findById(1L)).thenReturn(Optional.of(s));
    }

    /** Settings with default toggles (codEnabled=true, cardEnabled=false). */
    private void stubSettings() {
        when(repository.findById(1L)).thenReturn(Optional.of(
                StoreSettings.builder()
                        .id(1L)
                        .freeShippingThreshold(new BigDecimal("50.00"))
                        .lowStockThreshold(5)
                        .build()));
    }

    private StoreSettingsRequest req(boolean cod, boolean card) {
        return new StoreSettingsRequest(new BigDecimal("50.00"), 5, cod, card);
    }

    // --- free shipping -------------------------------------------------

    @Test
    void chargesBaseRate_whenSubtotalBelowThreshold() {
        stubThreshold("50.00");
        BigDecimal result = service.applyFreeShipping(
                new BigDecimal("49.99"), new BigDecimal("3.00"));
        assertThat(result).isEqualByComparingTo("3.00");
    }

    @Test
    void freeShipping_whenSubtotalAtOrAboveThreshold() {
        stubThreshold("50.00");
        BigDecimal result = service.applyFreeShipping(
                new BigDecimal("50.00"), new BigDecimal("3.00"));
        assertThat(result).isEqualByComparingTo("0.00");
    }

    @Test
    void chargesBaseRate_whenThresholdIsZero() {
        stubThreshold("0.00");
        BigDecimal result = service.applyFreeShipping(
                new BigDecimal("999.00"), new BigDecimal("3.00"));
        assertThat(result).isEqualByComparingTo("3.00");
    }

    // --- payment-method toggles ----------------------------------------

    @Test
    void update_throws409_whenNoUsablePaymentMethodWouldRemain() {
        // cardAvailable defaults false in this unit test, so disabling COD
        // leaves nothing usable.
        assertThatThrownBy(() -> service.update(req(false, false)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("409");
    }

    @Test
    void update_persistsToggles_whenCodStaysEnabled() {
        stubSettings();
        StoreSettingsResponse res = service.update(req(true, false));
        assertThat(res.codEnabled()).isTrue();
        assertThat(res.cardEnabled()).isFalse();
    }

    @Test
    void cod_isUsable_whenEnabled() {
        stubSettings();
        assertThat(service.isPaymentMethodUsable(PaymentMethod.COD)).isTrue();
    }

    @Test
    void card_isNotUsable_whenNotAvailable() {
        stubSettings(); // cardAvailable defaults false
        assertThat(service.isPaymentMethodUsable(PaymentMethod.STRIPE)).isFalse();
    }

    @Test
    void card_isUsable_whenAvailableAndEnabled() {
        ReflectionTestUtils.setField(service, "cardAvailable", true);
        when(repository.findById(1L)).thenReturn(Optional.of(
                StoreSettings.builder()
                        .id(1L)
                        .freeShippingThreshold(new BigDecimal("50.00"))
                        .lowStockThreshold(5)
                        .codEnabled(true)
                        .cardEnabled(true)
                        .build()));
        assertThat(service.isPaymentMethodUsable(PaymentMethod.STRIPE)).isTrue();
    }

    @Test
    void assertPaymentMethodUsable_throws400_forUnavailableCard() {
        stubSettings();
        assertThatThrownBy(() ->
                service.assertPaymentMethodUsable(PaymentMethod.STRIPE))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("400");
    }
}
