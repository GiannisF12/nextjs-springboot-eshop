package com.giannis.eshop.service;

import com.giannis.eshop.dto.DiscountCodeRequest;
import com.giannis.eshop.dto.DiscountCodeResponse;
import com.giannis.eshop.model.DiscountCode;
import com.giannis.eshop.repository.DiscountCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DiscountCodeService {

    private final DiscountCodeRepository repository;

    public List<DiscountCodeResponse> findAll() {
        return repository.findAll().stream()
                // Newest first — the admin almost always wants the most
                // recently-created codes at the top of the list.
                .sorted(Comparator.comparing(DiscountCode::getCreatedAt).reversed())
                .map(this::toResponse)
                .toList();
    }

    /**
     * Public validation used by the checkout flow. Returns the code only
     * if it exists AND is active. Inactive / unknown codes both return
     * empty so the public endpoint can't be used as an enumeration oracle.
     */
    public Optional<DiscountCodeResponse> findActiveByCode(String rawCode) {
        return repository.findByCode(normalise(rawCode))
                .filter(DiscountCode::getActive)
                .map(this::toResponse);
    }

    @Transactional
    public DiscountCodeResponse create(DiscountCodeRequest req) {
        DiscountCode entity = DiscountCode.builder()
                .code(normalise(req.code()))
                .percentOff(req.percentOff())
                .active(req.active() == null ? true : req.active())
                .build();

        try {
            return toResponse(repository.save(entity));
        } catch (DataIntegrityViolationException e) {
            // Unique constraint on `code`. Translate the raw Hibernate
            // error into a friendly 409 for the admin UI.
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A discount code with this name already exists.");
        }
    }

    @Transactional
    public DiscountCodeResponse update(Long id, DiscountCodeRequest req) {
        DiscountCode existing = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Discount code not found"));

        existing.setCode(normalise(req.code()));
        existing.setPercentOff(req.percentOff());
        if (req.active() != null) existing.setActive(req.active());

        try {
            return toResponse(repository.save(existing));
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A discount code with this name already exists.");
        }
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Discount code not found");
        }
        repository.deleteById(id);
    }

    /** Trim + upper-case so "save10" and "SAVE10 " collide as duplicates. */
    private String normalise(String raw) {
        return raw == null ? null : raw.trim().toUpperCase();
    }

    private DiscountCodeResponse toResponse(DiscountCode d) {
        return new DiscountCodeResponse(
                d.getId(),
                d.getCode(),
                d.getPercentOff(),
                d.getActive(),
                d.getCreatedAt()
        );
    }
}
