"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
    type ConsentRecord,
    clearConsent,
    getConsentSnapshot,
    subscribeConsent,
    writeConsent,
} from "@/lib/consent";

/** Server / pre-hydration sentinel: we don't know the choice yet, so the
 *  banner stays hidden (no SSR flash) until the client snapshot resolves. */
const UNKNOWN = "unknown" as const;

export type ConsentState = ConsentRecord | null | typeof UNKNOWN;

/**
 * React access to the stored cookie-consent choice via useSyncExternalStore.
 *
 * `consent` is:
 *   - "unknown" during SSR and the first hydration render (banner hidden),
 *   - null when the visitor has made no choice yet (banner shown),
 *   - a ConsentRecord once a choice exists (banner hidden).
 */
export function useConsent() {
    const consent = useSyncExternalStore<ConsentState>(
        subscribeConsent,
        getConsentSnapshot,
        () => UNKNOWN,
    );

    const accept = useCallback(() => writeConsent("accepted"), []);
    const reject = useCallback(() => writeConsent("rejected"), []);
    const reopen = useCallback(() => clearConsent(), []);

    return { consent, accept, reject, reopen };
}
