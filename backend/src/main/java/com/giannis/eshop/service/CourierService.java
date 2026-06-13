package com.giannis.eshop.service;

import com.giannis.eshop.dto.CourierResponse;
import com.giannis.eshop.dto.UpdateCourierRequest;
import com.giannis.eshop.model.Courier;
import com.giannis.eshop.repository.CourierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CourierService {

    private final CourierRepository repository;

    /** Enabled couriers for the checkout picker. */
    public List<CourierResponse> findEnabled() {
        return repository.findByEnabledTrueOrderBySortOrderAsc()
                .stream().map(this::toResponse).toList();
    }

    /** All couriers for the admin table. */
    public List<CourierResponse> findAll() {
        return repository.findAllByOrderBySortOrderAsc()
                .stream().map(this::toResponse).toList();
    }

    /**
     * Loads a courier the customer is allowed to select. Used by
     * OrderService at checkout — never trusts the client's price.
     * 404 if the id is unknown, 400 if the courier is disabled.
     */
    public Courier getSelectableCourier(Long id) {
        Courier courier = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Courier not found: " + id));
        if (!Boolean.TRUE.equals(courier.getEnabled())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Courier is not available: " + courier.getName());
        }
        return courier;
    }

    /**
     * Admin update of price + availability. Enforces the invariant that
     * at least one courier stays enabled, so checkout always has an option.
     */
    @Transactional
    public CourierResponse update(Long id, UpdateCourierRequest req) {
        Courier courier = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Courier not found: " + id));

        boolean disablingThisOne =
                Boolean.TRUE.equals(courier.getEnabled()) && !req.enabled();
        if (disablingThisOne && repository.countByEnabledTrue() <= 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "At least one courier must stay enabled.");
        }

        courier.setPrice(req.price().setScale(2, RoundingMode.HALF_UP));
        courier.setEnabled(req.enabled());
        return toResponse(repository.save(courier));
    }

    private CourierResponse toResponse(Courier c) {
        return new CourierResponse(
                c.getId(), c.getName(),
                c.getPrice(), Boolean.TRUE.equals(c.getEnabled()),
                c.getSortOrder() == null ? 0 : c.getSortOrder());
    }
}
