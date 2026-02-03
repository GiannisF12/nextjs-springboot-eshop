"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-store";

export function CartBadge() {
    const total = useCart((s) => s.totalItems());

    return (
        <Link href="/cart" className="relative inline-flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <span className="text-sm">Cart</span>

            {total > 0 && (
                <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-semibold text-white">
          {total}
        </span>
            )}
        </Link>
    );
}