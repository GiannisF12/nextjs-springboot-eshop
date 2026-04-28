"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CartItem = {
    id: number;
    title: string;
    price: number;
    image: string;
    category: string;
    /**
     * Size variant the customer picked (e.g. "M" or "42").
     * A product added in size M and the same product added in size L are
     * two separate cart lines.
     */
    size: string;
    /**
     * Stock available for this (product, size) captured the last time it
     * was added to the cart. We use this to cap the + button on the cart
     * page so the customer can't try to check out 16 units of a shirt we
     * only have 15 of. Not real-time — the backend still validates on
     * checkout as the final safety net.
     */
    maxStock: number;
    qty: number;
};

type AddPayload = Omit<CartItem, "qty"> & { qty?: number };

/**
 * A fresh product fetched from the server — the shape we need to
 * reconcile the cart with the latest prices / stock before checkout.
 * Kept minimal so any product-like object from /api/products works.
 */
export type FreshProduct = {
    id: number;
    price: number;
    variants: { size: string; stock: number }[];
};

/**
 * What changed when the cart was reconciled with the server. The
 * checkout page surfaces these to the customer so they can't get
 * surprised by a price bump between browsing and paying.
 */
export type CartSyncIssue =
    | {
          kind: "price_changed";
          id: number;
          size: string;
          title: string;
          oldPrice: number;
          newPrice: number;
      }
    | {
          kind: "stock_reduced";
          id: number;
          size: string;
          title: string;
          oldQty: number;
          newQty: number;
      }
    | { kind: "removed"; id: number; size: string; title: string };

type CartState = {
    items: CartItem[];
    add: (payload: AddPayload) => void;
    remove: (id: number, size: string) => void;
    setQty: (id: number, size: string, qty: number) => void;
    clear: () => void;

    /**
     * Reconciles cart lines with what's currently in the DB:
     *  - updates price and maxStock for each line
     *  - clamps qty down if stock is now lower
     *  - drops the line entirely if the product/size no longer exists
     *
     * Returns the list of changes so the UI can warn the customer.
     * `missingIds` lists product IDs that came back as null (deleted).
     */
    syncWithServer: (
        fresh: FreshProduct[],
        missingIds: number[]
    ) => CartSyncIssue[];

    totalItems: () => number;
    totalPrice: () => number;
};

// Two items are the "same cart line" only if BOTH their product id AND
// their size match. That's what lets a customer buy the same shirt in
// both M and L and see two lines in the cart.
const sameLine = (a: CartItem, id: number, size: string) =>
    a.id === id && a.size === size;

export const useCart = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],

            add: ({ qty = 1, ...p }) =>
                set((state) => {
                    const existing = state.items.find((x) =>
                        sameLine(x, p.id, p.size)
                    );
                    if (existing) {
                        // Refresh maxStock in case the admin changed the stock
                        // on the server since the line was first added, then
                        // clamp so the new total can never exceed it.
                        const newMax = p.maxStock;
                        const newQty = Math.min(existing.qty + qty, newMax);
                        return {
                            items: state.items.map((x) =>
                                sameLine(x, p.id, p.size)
                                    ? { ...x, qty: newQty, maxStock: newMax }
                                    : x
                            ),
                        };
                    }
                    // Brand new line. Still clamp in case the caller passed
                    // qty > maxStock for any reason.
                    const clampedQty = Math.min(qty, p.maxStock);
                    return {
                        items: [...state.items, { ...p, qty: clampedQty }],
                    };
                }),

            remove: (id, size) =>
                set((state) => ({
                    items: state.items.filter((x) => !sameLine(x, id, size)),
                })),

            setQty: (id, size, qty) =>
                set((state) => ({
                    items: state.items
                        .map((x) => {
                            if (!sameLine(x, id, size)) return x;
                            // Clamp the requested qty against the stock
                            // snapshot taken at add-time. Prevents the + button
                            // on the cart page from pushing past available stock.
                            const clamped = Math.min(qty, x.maxStock);
                            return { ...x, qty: clamped };
                        })
                        .filter((x) => x.qty > 0),
                })),

            clear: () => set({ items: [] }),

            syncWithServer: (fresh, missingIds) => {
                const issues: CartSyncIssue[] = [];
                const byId = new Map(fresh.map((p) => [p.id, p]));

                set((state) => {
                    const next: CartItem[] = [];

                    for (const item of state.items) {
                        // Product was deleted on the server.
                        if (missingIds.includes(item.id)) {
                            issues.push({
                                kind: "removed",
                                id: item.id,
                                size: item.size,
                                title: item.title,
                            });
                            continue;
                        }

                        const server = byId.get(item.id);
                        if (!server) {
                            // Shouldn't happen — caller passes either the
                            // product or flags its id as missing. Treat as
                            // "keep as-is" to avoid data loss.
                            next.push(item);
                            continue;
                        }

                        // Variant may have been removed too (e.g. admin
                        // dropped size M from a product).
                        const variant = server.variants.find(
                            (v) => v.size === item.size
                        );
                        if (!variant) {
                            issues.push({
                                kind: "removed",
                                id: item.id,
                                size: item.size,
                                title: item.title,
                            });
                            continue;
                        }

                        const newItem = { ...item };

                        if (server.price !== item.price) {
                            issues.push({
                                kind: "price_changed",
                                id: item.id,
                                size: item.size,
                                title: item.title,
                                oldPrice: item.price,
                                newPrice: server.price,
                            });
                            newItem.price = server.price;
                        }

                        if (variant.stock < item.qty) {
                            issues.push({
                                kind: "stock_reduced",
                                id: item.id,
                                size: item.size,
                                title: item.title,
                                oldQty: item.qty,
                                newQty: variant.stock,
                            });
                            newItem.qty = variant.stock;
                        }
                        newItem.maxStock = variant.stock;

                        // Only push lines that still have a positive qty
                        // — a stock drop to 0 effectively removes the line.
                        if (newItem.qty > 0) next.push(newItem);
                    }

                    return { items: next };
                });

                return issues;
            },

            totalItems: () => get().items.reduce((sum, x) => sum + x.qty, 0),
            totalPrice: () =>
                get().items.reduce((sum, x) => sum + x.qty * x.price, 0),
        }),
        {
            // Bumped again: old carts (v2) don't have `maxStock` on their
            // lines, and a missing maxStock would make the new clamp logic
            // clamp to NaN / undefined. Drop them on upgrade.
            name: "eshop-cart-v3",
            storage: createJSONStorage(() => localStorage),
        }
    )
);
