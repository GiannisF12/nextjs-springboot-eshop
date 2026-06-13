"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useConsent } from "./use-consent";

/**
 * Bottom-of-viewport consent banner. Shows on first visit (no stored
 * choice) and after the visitor re-opens it via "Cookie settings". Renders
 * nothing once a choice exists, and nothing pre-mount to avoid a hydration
 * flash.
 */
export function CookieConsent() {
    const { consent, accept, reject } = useConsent();

    // Show only when the choice is definitively "none yet". "unknown"
    // (SSR/hydration) and an existing record both render nothing.
    if (consent !== null) return null;

    return (
        <div
            role="dialog"
            aria-label="Cookie consent"
            className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        >
            <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                    We use cookies to keep the site working and — with your
                    consent — to understand traffic and improve your
                    experience. See our{" "}
                    <Link
                        href="/cookie-policy"
                        className="underline hover:text-foreground"
                    >
                        Cookie Policy
                    </Link>
                    .
                </p>
                <div className="flex shrink-0 gap-2">
                    <Button variant="outline" onClick={reject}>
                        Reject
                    </Button>
                    <Button onClick={accept}>Accept</Button>
                </div>
            </div>
        </div>
    );
}
