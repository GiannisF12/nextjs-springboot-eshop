import { z } from "zod";

/**
 * Shared zod schemas for every form in the app.
 *
 * Each field schema owns one piece of validation; the page-level
 * schemas at the bottom compose them. Keep field rules here, not
 * duplicated across pages — when we add new validators on the
 * backend (e.g. tighter phone format) we update *one* place.
 *
 * Backend duplicates the rules with @NotBlank / @Pattern / etc.
 * The frontend's job is to give the customer a fast, kind error
 * before the request is even sent — never to be the source of truth.
 */

/* -------------------------- Field building blocks ------------------- */

export const nameSchema = z
    .string()
    .trim()
    .min(2, "At least 2 characters")
    .max(50, "Keep it under 50 characters");

export const emailSchema = z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .email("Doesn't look like a valid email");

/**
 * Password rules — same checks the <PasswordChecklist> component
 * displays so the user sees exactly what's missing as they type.
 *
 * 72-char ceiling is bcrypt's max (the backend hashes with bcrypt;
 * extra characters past 72 are silently truncated, which feels broken
 * to the user — we fail fast instead).
 *
 * Special character rule = "anything that isn't a letter or digit",
 * so accents, punctuation and even spaces all count. Friendlier than
 * forcing a fixed shortlist of symbols.
 */
export const PASSWORD_RULES = {
    minLength: 8,
    hasLetter: /[A-Za-z]/,
    hasNumber: /\d/,
    hasSpecial: /[^A-Za-z0-9]/,
} as const;

export const passwordSchema = z
    .string()
    .min(PASSWORD_RULES.minLength, "At least 8 characters")
    .max(72, "Too long — keep it under 72 characters")
    .regex(PASSWORD_RULES.hasLetter, "Must include a letter")
    .regex(PASSWORD_RULES.hasNumber, "Must include a number")
    .regex(PASSWORD_RULES.hasSpecial, "Must include a special character");

/**
 * Phone numbers are surprisingly varied — Greek mobiles are 10 digits,
 * landlines 10 digits with a leading 2, international has +country.
 * We accept digits, optional leading +, and the usual separators
 * (spaces, dashes). 6..20 covers everything from a 4-digit short code
 * to a long international number.
 *
 * Rejecting emojis / letters here is what kills the "phone field has
 * a heart emoji" class of bug.
 */
export const phoneSchema = z
    .string()
    .trim()
    .min(6, "Phone number is too short")
    .max(20, "Phone number is too long")
    .regex(
        /^\+?[\d\s\-]+$/,
        "Phone number can only contain digits, spaces and dashes"
    );

/**
 * Address line: collapsed to a single line (no newlines), trimmed,
 * 5..200 chars. Pasted-in addresses with newlines are normalised
 * server-side too, but we strip here so the form preview and the
 * stored value match.
 */
export const addressLineSchema = z
    .string()
    .trim()
    .min(5, "Address is too short")
    .max(200, "Address is too long")
    .refine(
        (v) => !/[\n\r]/.test(v),
        "Address must be on a single line"
    );

export const citySchema = z
    .string()
    .trim()
    .min(2, "City is too short")
    .max(50, "City is too long");

/**
 * Postal code. Greek ZIPs are 5 digits, but other countries vary
 * (Germany 5, UK alphanumeric...). For now: 4..10 digits — covers
 * the entire EU plus most of the rest. Tightenable per-country
 * later if we ever ship to non-EU markets.
 */
export const zipSchema = z
    .string()
    .trim()
    .min(4, "Postal code is too short")
    .max(10, "Postal code is too long")
    .regex(/^\d+$/, "Postal code must be digits only");

/**
 * Optional gender enum that survives the "Not specified" choice from
 * the native <select>. The select value is the empty string for that
 * option, so we accept literal "" as a valid input. The submit
 * handler converts "" to null before sending to the API.
 */
export const genderSchema = z
    .union([
        z.literal(""),
        z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]),
    ])
    .optional();

/**
 * Birthday: YYYY-MM-DD or empty. If supplied, must be at least 16
 * years ago. Empty string maps to "not specified" and skips the age
 * check — gender + birthday are both optional fields on the profile.
 */
export const birthdaySchema = z
    .string()
    .optional()
    .refine(
        (v) => {
            if (!v) return true;
            // Quick shape check first — date input gives YYYY-MM-DD.
            if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
            const d = new Date(v);
            if (Number.isNaN(d.getTime())) return false;
            // Must be at least 16y old AND not in the future.
            const sixteenYearsAgo = new Date();
            sixteenYearsAgo.setFullYear(sixteenYearsAgo.getFullYear() - 16);
            return d <= sixteenYearsAgo;
        },
        { message: "You must be at least 16 years old" }
    );

/* ------------------------ Page-level form schemas ------------------- */

export const checkoutSchema = z.object({
    customerName: nameSchema,
    phone: phoneSchema,
    addressLine: addressLineSchema,
    city: citySchema,
    zip: zipSchema,
});
export type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export const signupSchema = z
    .object({
        name: nameSchema,
        email: emailSchema,
        password: passwordSchema,
        confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, {
        // path tells RHF which field gets the error border so the
        // mismatch is reported under the confirm input, not the original.
        path: ["confirmPassword"],
        message: "Passwords don't match",
    });
export type SignupFormValues = z.infer<typeof signupSchema>;

export const passwordChangeSchema = z
    .object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: passwordSchema,
        confirmPassword: z.string(),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
        path: ["confirmPassword"],
        message: "Passwords don't match",
    });
export type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;

export const profileSchema = z.object({
    name: nameSchema,
    email: emailSchema,
    gender: genderSchema,
    birthday: birthdaySchema,
});
export type ProfileFormValues = z.infer<typeof profileSchema>;
