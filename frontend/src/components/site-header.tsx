import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CartBadge } from "@/features/cart/cart-badge";

export function SiteHeader() {
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
                    <CartBadge />
                </nav>
            </div>
        </header>
    );
}