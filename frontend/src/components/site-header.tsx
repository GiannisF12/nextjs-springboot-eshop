"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CartBadge } from "@/features/cart/cart-badge";
import { OrdersBadge } from "@/features/orders/orders-badge";
import { UserMenu } from "@/features/auth/user-menu";
import { useAuth } from "@/features/auth/auth-context";

export function SiteHeader() {
    const { user } = useAuth();

    return (
        <header className="border-b">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
                <Link href="/" className="font-semibold">
                    E-Shop
                </Link>

                <nav className="flex items-center gap-2">
                    <Button asChild variant="ghost">
                        <Link href="/products">Products</Link>
                    </Button>

                    {/* Icon-pill actions */}
                    <div className="mx-1 flex items-center gap-2">
                        <CartBadge />
                        {user && <OrdersBadge />}
                    </div>

                    {user ? (
                        <UserMenu />
                    ) : (
                        <Button asChild variant="outline">
                            <Link href="/login">Login</Link>
                        </Button>
                    )}
                </nav>
            </div>
        </header>
    );
}
