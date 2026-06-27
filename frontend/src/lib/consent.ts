/**
 * Cookie-consent storage + the marketing-consent seam.
 *
 * The site currently sets only an essential login cookie (exempt from
 * consent), so nothing is gated today. This module exists so that when an
 * analytics/marketing script (Google Analytics, Meta/TikTok pixel) is added
 * later, it can call `hasMarketingConsent()` and load ONLY when the visitor
 * has accepted. Choice is stored in localStorage, versioned so we can
 * re-prompt everyone if the policy materially changes.
 */

export type ConsentChoice = "accepted" | "rejected";

export type ConsentRecord = {
    version: number;
    choice: ConsentChoice;
    /** ISO timestamp of when the choice was made. */
    at: string;
};

/** Bump when the cookie policy materially changes — invalidates old choices. */
export const CONSENT_VERSION = 1;

const STORAGE_KEY = "eshop-cookie-consent";
const EVENT_NAME = "eshop-consent-change";

function parseRaw(raw: string | null): ConsentRecord | null {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as Partial<ConsentRecord>;
        if (
            parsed.version === CONSENT_VERSION &&
            (parsed.choice === "accepted" || parsed.choice === "rejected") &&
            typeof parsed.at === "string"
        ) {
            return parsed as ConsentRecord;
        }
        return null;
    } catch {
        // Unparseable → treat as no choice.
        return null;
    }
}

/**
 * Reads the stored choice, or null when there is none / it's outdated /
 * unreadable. Any of those means "ask again", which is the safe default.
 */
export function readConsent(): ConsentRecord | null {
    if (typeof window === "undefined") return null;
    try {
        return parseRaw(window.localStorage.getItem(STORAGE_KEY));
    } catch {
        // Disabled storage → treat as no choice.
        return null;
    }
}

// Cached snapshot for useSyncExternalStore: it compares snapshots by
// reference, so we must return the SAME object until the underlying raw
// string actually changes — otherwise React loops re-rendering.
let cachedRaw: string | null = null;
let cachedSnapshot: ConsentRecord | null = null;
let cacheInitialised = false;

/** Stable-reference snapshot of the current choice for useSyncExternalStore. */
export function getConsentSnapshot(): ConsentRecord | null {
    if (typeof window === "undefined") return null;
    let raw: string | null = null;
    try {
        raw = window.localStorage.getItem(STORAGE_KEY);
    } catch {
        raw = null;
    }
    if (!cacheInitialised || raw !== cachedRaw) {
        cachedRaw = raw;
        cachedSnapshot = parseRaw(raw);
        cacheInitialised = true;
    }
    return cachedSnapshot;
}

/** Persists a choice and notifies subscribers. Safe if storage throws. */
export function writeConsent(choice: ConsentChoice): ConsentRecord {
    const record: ConsentRecord = {
        version: CONSENT_VERSION,
        choice,
        at: new Date().toISOString(),
    };
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch {
        // Failing to persist just means we'll re-ask next visit — safe.
    }
    notify();
    return record;
}

/** Clears the stored choice (used by "Cookie settings" to re-prompt). */
export function clearConsent(): void {
    try {
        window.localStorage.removeItem(STORAGE_KEY);
    } catch {
        // ignore
    }
    notify();
}

/**
 * The seam future tracking scripts check before initialising. Returns true
 * ONLY when a current-version choice exists and it is "accepted". Fails
 * closed: storage errors / no choice → false (no tracking without consent).
 */
export function hasMarketingConsent(): boolean {
    return readConsent()?.choice === "accepted";
}

function notify(): void {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event(EVENT_NAME));
}

/**
 * Subscribe to consent changes (in-tab via our event, cross-tab via the
 * native storage event). Returns an unsubscribe function.
 */
export function subscribeConsent(listener: () => void): () => void {
    if (typeof window === "undefined") return () => {};
    window.addEventListener(EVENT_NAME, listener);
    window.addEventListener("storage", listener);
    return () => {
        window.removeEventListener(EVENT_NAME, listener);
        window.removeEventListener("storage", listener);
    };
}
