"use client";

import { useEffect, useState } from "react";
import { getProduct } from "@/lib/api";
import { type CartSyncIssue, useCart } from "@/lib/cart-store";

/**
 * Reconciles the local cart with the latest price / stock from the
 * server. Runs once on mount on whichever page calls it (cart page,
 * checkout page, ...). Returns both the pending state and the list of
 * issues so each caller can render its own notice.
 *
 * Kept as a hook so the logic stays in one place — the two pages that
 * need it render differently but should behave identically.
 */
export function useCartSync(): {
    syncing: boolean;
    issues: CartSyncIssue[];
} {
    const syncWithServer = useCart((s) => s.syncWithServer);
    const [issues, setIssues] = useState<CartSyncIssue[]>([]);
    const [syncing, setSyncing] = useState(true);

    useEffect(() => {
        async function reconcile() {
            // Read items off the store directly so this effect doesn't
            // depend on React state — it should only run once on mount.
            const currentItems = useCart.getState().items;
            const uniqueIds = Array.from(
                new Set(currentItems.map((i) => i.id))
            );
            if (uniqueIds.length === 0) {
                setSyncing(false);
                return;
            }
            try {
                const fresh = await Promise.all(
                    uniqueIds.map((id) => getProduct(String(id)))
                );
                const missingIds = uniqueIds.filter(
                    (_, i) => fresh[i] === null
                );
                const products = fresh
                    .filter(
                        (p): p is NonNullable<typeof p> => p !== null
                    )
                    .map((p) => ({
                        id: p.id,
                        price: p.price,
                        variants: p.variants,
                    }));
                setIssues(syncWithServer(products, missingIds));
            } finally {
                setSyncing(false);
            }
        }
        void reconcile();
        // Intentionally empty: run once on mount. `syncWithServer` is a
        // stable zustand action reference, safe to leave out.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { syncing, issues };
}
