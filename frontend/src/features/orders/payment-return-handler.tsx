"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { cancelCheckout, syncPayment } from "@/lib/api";

/**
 * Handles the customer's return from Stripe to the order page:
 *  - ?payment=success  → reconcile with Stripe (self-heal a missed webhook)
 *  - ?payment=cancelled → release the pending order's reserved stock
 *
 * Then refreshes so the order's status badge reflects the result. Runs once;
 * renders nothing. Both calls are best-effort — the webhook is still the
 * primary path.
 */
export function PaymentReturnHandler({ orderId }: { orderId: number }) {
    const router = useRouter();
    const ran = useRef(false);

    useEffect(() => {
        if (ran.current) return;
        const outcome = new URLSearchParams(window.location.search).get(
            "payment"
        );
        if (outcome !== "success" && outcome !== "cancelled") return;
        ran.current = true;
        void (async () => {
            try {
                if (outcome === "cancelled") {
                    await cancelCheckout(orderId);
                } else {
                    await syncPayment(orderId);
                }
            } catch {
                // Best-effort — the webhook / 30-min expiry are the fallbacks.
            }
            router.refresh();
        })();
    }, [orderId, router]);

    return null;
}
