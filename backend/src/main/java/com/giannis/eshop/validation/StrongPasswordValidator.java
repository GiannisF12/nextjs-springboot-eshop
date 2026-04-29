package com.giannis.eshop.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

/**
 * Validator behind {@link StrongPassword}. Rules:
 *
 * <ul>
 *   <li>8–72 characters (72 is bcrypt's hard limit).</li>
 *   <li>At least one letter (any case).</li>
 *   <li>At least one digit.</li>
 *   <li>At least one non-alphanumeric character (counts spaces,
 *       punctuation, accented letters... matches the frontend's
 *       friendly "anything that isn't a–z or 0–9" rule).</li>
 * </ul>
 *
 * Null is treated as invalid because every place this annotation is
 * used the field is also annotated {@code @NotBlank}; this stays
 * consistent with that intent.
 */
public class StrongPasswordValidator
        implements ConstraintValidator<StrongPassword, String> {

    private static final int MIN_LENGTH = 8;
    private static final int MAX_LENGTH = 72;
    private static final Pattern HAS_LETTER = Pattern.compile("[A-Za-z]");
    private static final Pattern HAS_NUMBER = Pattern.compile("\\d");
    private static final Pattern HAS_SPECIAL = Pattern.compile("[^A-Za-z0-9]");

    @Override
    public boolean isValid(String value, ConstraintValidatorContext ctx) {
        if (value == null) return false;
        int len = value.length();
        if (len < MIN_LENGTH || len > MAX_LENGTH) return false;
        if (!HAS_LETTER.matcher(value).find()) return false;
        if (!HAS_NUMBER.matcher(value).find()) return false;
        if (!HAS_SPECIAL.matcher(value).find()) return false;
        return true;
    }
}
