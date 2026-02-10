"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({error, reset,}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-semibold">Couldn’t load order</h1>
            <p className="text-sm text-muted-foreground">
                {error.message || "Something went wrong while fetching the order."}
            </p>

            <div className="flex gap-2">
                <Button variant="secondary" onClick={reset}>
                    Try again
                </Button>
                <Button asChild variant="outline">
                    <Link href="/products">Back to products</Link>
                </Button>
            </div>
        </div>
    );
}