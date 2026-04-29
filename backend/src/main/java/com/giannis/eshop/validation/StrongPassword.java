package com.giannis.eshop.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Bean-validation annotation matching the frontend's password rules:
 * 8–72 characters with at least one letter, one number, and one
 * special character. Mirror of {@code PASSWORD_RULES} in
 * {@code frontend/src/lib/validation.ts}.
 *
 * Using a single custom annotation (vs stacking @Size + @Pattern)
 * keeps the rules co-located: change them in one place on the
 * backend and every DTO that uses {@code @StrongPassword} picks them
 * up.
 *
 * Because the frontend already shows a live checklist, we only
 * surface a single human-readable message here — the user has
 * already had a chance to see exactly what's missing.
 */
@Documented
@Constraint(validatedBy = StrongPasswordValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.METHOD,
        ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
public @interface StrongPassword {

    String message() default
            "Password must be 8–72 characters and contain a letter, a number, and a special character";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
