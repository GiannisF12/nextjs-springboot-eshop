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

type CartState = {
    items: CartItem[];
    add: (payload: AddPayload) => void;
    remove: (id: number, size: string) => void;
    setQty: (id: number, size: string, qty: number) => void;
    clear: () => void;

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
