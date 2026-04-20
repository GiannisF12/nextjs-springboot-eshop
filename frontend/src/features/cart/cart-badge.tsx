"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-store";

export function CartBadge() {
    const total = useCart((s) => s.totalItems());

    return (
        <Link
            href="/cart"
            aria-label="Cart"
            className="group relative inline-flex h-10 items-center gap-2 rounded-full border bg-background pl-3 pr-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
        >
            <ShoppingCart className="h-4 w-4 text-primary" />
            <span className="tabular-nums">{total}</span>
        </Link>
    );
}
