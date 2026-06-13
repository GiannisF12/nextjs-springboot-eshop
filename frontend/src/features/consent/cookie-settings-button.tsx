"use client";

import { useConsent } from "./use-consent";

/**
 * Footer control that re-opens the consent banner so a visitor can change
 * their earlier choice. Kept as its own client component so the footer can
 * stay a server component.
 */
export function CookieSettingsButton() {
    const { reopen } = useConsent();
    return (
        <button type="button" onClick={reopen} className="hover:text-white">
            Cookie settings
        </button>
    );
}
