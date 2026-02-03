"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CartItem = {
    id: number;
    title: string;
    price: number;
    image: string;
    category: string;
    qty: number;
};

type AddPayload = Omit<CartItem, "qty"> & { qty?: number };

type CartState = {
    items: CartItem[];
    add: (payload: AddPayload) => void;
    remove: (id: number) => void;
    setQty: (id: number, qty: number) => void;
    clear: () => void;

    totalItems: () => number;
    totalPrice: () => number;
};

export const useCart = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],

            add: ({ qty = 1, ...p }) =>
                set((state) => {
                    const existing = state.items.find((x) => x.id === p.id);
                    if (existing) {
                        return {
                            items: state.items.map((x) =>
                                x.id === p.id ? { ...x, qty: x.qty + qty } : x
                            ),
                        };
                    }
                    return { items: [...state.items, { ...p, qty }] };
                }),

            remove: (id: number) =>
                set((state) => ({
                    items: state.items.filter((x) => x.id !== id),
                })),

            setQty: (id: number, qty: number) =>
                set((state) => ({
                    items: state.items
                        .map((x) => (x.id === id ? { ...x, qty } : x))
                        .filter((x) => x.qty > 0),
                })),

            clear: () => set({ items: [] }),

            totalItems: () => get().items.reduce((sum, x) => sum + x.qty, 0),
            totalPrice: () => get().items.reduce((sum, x) => sum + x.qty * x.price, 0),
        }),
        {
            name: "eshop-cart",
            storage: createJSONStorage(() => localStorage),
        }
    )
);