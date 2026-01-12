import Link from "next/link";
import { Button } from "@/components/ui/button";

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
                    <Button asChild variant="ghost">
                        <Link href="/cart">Cart</Link>
                    </Button>
                </nav>
            </div>
        </header>
    );
}