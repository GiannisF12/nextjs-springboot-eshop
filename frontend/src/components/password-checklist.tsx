"use client";

import { PASSWORD_RULES } from "@/lib/validation";

/**
 * Live "your password needs..." checklist. Each rule turns green and
 * its bullet flips to a check the moment the typed value satisfies
 * it. Reads from the same `PASSWORD_RULES` object the zod schema
 * uses — single source of truth.
 *
 * Renders nothing until the user has typed at least one character so
 * the form looks clean on first paint, then progressively appears
 * as they engage with the field.
 */
export function PasswordChecklist({ value }: { value: string }) {
    if (!value) return null;

    const checks = [
        {
            ok: value.length >= PASSWORD_RULES.minLength,
            label: `At least ${PASSWORD_RULES.minLength} characters`,
        },
        {
            ok: PASSWORD_RULES.hasLetter.test(value),
            label: "A letter (a–z or A–Z)",
        },
        {
            ok: PASSWORD_RULES.hasNumber.test(value),
            label: "A number (0–9)",
        },
        {
            ok: PASSWORD_RULES.hasSpecial.test(value),
            label: "A special character (e.g. ! @ # $)",
        },
    ];

    return (
        <ul className="mt-2 space-y-0.5 text-xs">
            {checks.map((c) => (
                <li
                    key={c.label}
                    className={
                        c.ok ? "text-green-700" : "text-muted-foreground"
                    }
                >
                    <span aria-hidden="true" className="mr-1">
                        {c.ok ? "✓" : "•"}
                    </span>
                    {c.label}
                </li>
            ))}
        </ul>
    );
}
