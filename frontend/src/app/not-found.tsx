import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/40" />
            <div className="space-y-2">
                <h1 className="text-7xl font-bold tracking-tight">404</h1>
                <p className="text-xl font-medium text-muted-foreground">
                    This page doesn&apos;t exist
                </p>
                <p className="text-sm text-muted-foreground">
                    The link might be broken, or the page may have been removed.
                </p>
            </div>
            <Button asChild>
                <Link href="/">Back to shop</Link>
            </Button>
        </div>
    );
}
