package com.giannis.eshop.model;

import java.util.List;

/**
 * What KIND of size labels a category uses.
 *
 * Each constant also carries the exact list of valid size labels, so
 * there is ONE source of truth the whole app agrees on:
 *   - CLOTHING -> S, M, L, XL, XXL
 *   - SHOE     -> 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48
 *
 * Adding/renaming constants here is fine because JPA persists the
 * enum as its NAME (see @Enumerated(EnumType.STRING)), not its ordinal.
 */
public enum SizeType {

    CLOTHING(List.of("S", "M", "L", "XL", "XXL")),
    SHOE(List.of("38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48"));

    private final List<String> sizes;

    SizeType(List<String> sizes) {
        this.sizes = sizes;
    }

    /** The ordered list of size labels this type supports. */
    public List<String> sizes() {
        return sizes;
    }

    /** True if the given label is one of the allowed sizes for this type. */
    public boolean isValidSize(String size) {
        return sizes.contains(size);
    }
}
