package com.giannis.eshop.service;

import com.giannis.eshop.dto.CourierResponse;
import com.giannis.eshop.dto.UpdateCourierRequest;
import com.giannis.eshop.model.Courier;
import com.giannis.eshop.repository.CourierRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CourierServiceTest {

    @Mock
    CourierRepository repository;

    @InjectMocks
    CourierService service;

    private Courier courier(Long id, boolean enabled) {
        return Courier.builder()
                .id(id).name("ACS Courier")
                .price(new BigDecimal("3.00"))
                .enabled(enabled).sortOrder(0)
                .build();
    }

    @Test
    void getSelectableCourier_returnsEnabledCourier() {
        when(repository.findById(1L)).thenReturn(Optional.of(courier(1L, true)));
        Courier result = service.getSelectableCourier(1L);
        assertThat(result.getName()).isEqualTo("ACS Courier");
    }

    @Test
    void getSelectableCourier_throws404_whenNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getSelectableCourier(99L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404");
    }

    @Test
    void getSelectableCourier_throws400_whenDisabled() {
        when(repository.findById(2L)).thenReturn(Optional.of(courier(2L, false)));
        assertThatThrownBy(() -> service.getSelectableCourier(2L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("400");
    }

    @Test
    void update_changesPriceAndEnabled() {
        // Staying enabled (enabled=true) never touches the "last enabled"
        // guard, so countByEnabledTrue() is intentionally not stubbed here.
        Courier existing = courier(1L, true);
        when(repository.findById(1L)).thenReturn(Optional.of(existing));
        when(repository.save(any(Courier.class))).thenAnswer(i -> i.getArgument(0));

        CourierResponse res = service.update(1L,
                new UpdateCourierRequest(new BigDecimal("4.25"), true));

        assertThat(res.price()).isEqualByComparingTo("4.25");
        assertThat(res.enabled()).isTrue();
    }

    @Test
    void update_throws409_whenDisablingLastEnabledCourier() {
        Courier existing = courier(1L, true);
        when(repository.findById(1L)).thenReturn(Optional.of(existing));
        when(repository.countByEnabledTrue()).thenReturn(1L);

        assertThatThrownBy(() -> service.update(1L,
                new UpdateCourierRequest(new BigDecimal("3.00"), false)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("409");
    }

    @Test
    void update_allowsDisabling_whenOthersStillEnabled() {
        Courier existing = courier(1L, true);
        when(repository.findById(1L)).thenReturn(Optional.of(existing));
        when(repository.countByEnabledTrue()).thenReturn(3L);
        when(repository.save(any(Courier.class))).thenAnswer(i -> i.getArgument(0));

        CourierResponse res = service.update(1L,
                new UpdateCourierRequest(new BigDecimal("3.00"), false));

        assertThat(res.enabled()).isFalse();
    }
}
