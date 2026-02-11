"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CartBadge } from "@/features/cart/cart-badge";
import { useAuth } from "@/features/auth/auth-context";

export function SiteHeader() {
    const { user, role, logout } = useAuth();

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

                    {role === "ADMIN" && (
                        <Button asChild variant="ghost">
                            <Link href="/admin">Admin</Link>
                        </Button>
                    )}

                    <CartBadge />

                    {user ? (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                logout();
                            }}
                        >
                            Logout
                        </Button>
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