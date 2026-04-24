"use client";

import type { CartSyncIssue } from "@/lib/cart-store";

/**
 * Yellow warning block listing every change the cart-sync made to the
 * customer's cart. Rendered on both the cart page and the checkout
 * page so the customer sees the same message in both places.
 */
export function CartSyncNotice({
    syncing,
    issues,
}: {
    syncing: boolean;
    issues: CartSyncIssue[];
}) {
    if (syncing) {
        return (
            <div className="rounded-md border bg-muted/30 px-4 py-2 text-sm text-muted-foreground">
                Checking latest prices and stock...
            </div>
        );
    }

    if (issues.length === 0) return null;

    return (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900">
            <p className="font-semibold">⚠️ Your cart was updated</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
                {issues.map((issue, idx) => {
                    const k = `${issue.kind}-${issue.id}-${issue.size}-${idx}`;
                    switch (issue.kind) {
                        case "price_changed":
                            return (
                                <li key={k}>
                                    <strong>{issue.title}</strong> (size{" "}
                                    {issue.size}): price changed from €
                                    {issue.oldPrice.toFixed(2)} to €
                                    {issue.newPrice.toFixed(2)}.
                                </li>
                            );
                        case "stock_reduced":
                            return (
                                <li key={k}>
                                    <strong>{issue.title}</strong> (size{" "}
                                    {issue.size}): only {issue.newQty} left,
                                    reduced from {issue.oldQty}.
                                </li>
                            );
                        case "removed":
                            return (
                                <li key={k}>
                                    <strong>{issue.title}</strong> (size{" "}
                                    {issue.size}) is no longer available and
                                    was removed.
                                </li>
                            );
                    }
                })}
            </ul>
            <p className="mt-2 text-xs text-yellow-900/80">
                Review your totals before continuing.
            </p>
        </div>
    );
}
