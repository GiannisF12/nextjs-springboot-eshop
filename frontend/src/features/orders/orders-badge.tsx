"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { getMyOrders } from "@/lib/api";

// "Active" = not yet delivered or cancelled.
const ACTIVE_STATUSES = new Set(["NEW", "PROCESSING", "SHIPPED"]);

export function OrdersBadge() {
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        let alive = true;
        getMyOrders()
            .then((orders) => {
                if (!alive) return;
                const active = orders.filter((o) => ACTIVE_STATUSES.has(o.status));
                setCount(active.length);
            })
            .catch(() => {
                if (alive) setCount(0);
            });
        return () => {
            alive = false;
        };
    }, []);

    return (
        <Link
            href="/account/orders"
            aria-label="My orders"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border bg-background shadow-sm transition-colors hover:bg-accent"
        >
            <Package className="h-4 w-4 text-primary" />
            {count !== null && count > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground">
                    {count}
                </span>
            )}
        </Link>
    );
}
