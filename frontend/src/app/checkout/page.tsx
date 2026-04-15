"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/lib/cart-store";
import { createOrder } from "@/lib/api";

type FormState = {
    customerName: string;
    phone: string;
    addressLine: string;
    city: string;
    zip: string;
};

/**
 * Turn the raw error message thrown by apiFetch into something we can
 * actually show to a customer. Three shapes we care about:
 *
 *   1) "Backend is unreachable..." → real network failure, show the
 *      Docker hint so the dev/admin knows what to fix.
 *   2) "409 {...}" with a JSON body → HTTP error from the backend,
 *      extract the human message out of the body.
 *   3) Anything else → show raw, no hint.
 */
function formatCheckoutError(raw: string): {
    message: string;
    showDockerHint: boolean;
} {
    if (raw.toLowerCase().includes("unreachable")) {
        return { message: raw, showDockerHint: true };
    }

    // apiFetch throws "<status> <body>" for HTTP errors. Spring's error
    // body is JSON, so try to pull out a friendlier field.
    const httpMatch = raw.match(/^(\d{3})\s+([\s\S]*)$/);
    if (httpMatch) {
        const [, , body] = httpMatch;
        try {
            const parsed = JSON.parse(body) as {
                error?: string;
                message?: string;
            };
            return {
                message: parsed.error ?? parsed.message ?? body,
                showDockerHint: false,
            };
        } catch {
            return { message: body, showDockerHint: false };
        }
    }

    return { message: raw, showDockerHint: false };
}

export default function CheckoutPage() {
    const router = useRouter();

    const items = useCart((s) => s.items);
    const total = useCart((s) => s.totalPrice());
    const clear = useCart((s) => s.clear);

    const [form, setForm] = useState<FormState>({
        customerName: "",
        phone: "",
        addressLine: "",
        city: "",
        zip: "",
    });

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canSubmit = useMemo(() => {
        if (items.length === 0) return false;
        if (!form.customerName.trim()) return false;
        if (!form.phone.trim()) return false;
        if (!form.addressLine.trim()) return false;
        if (!form.city.trim()) return false;
        if (!form.zip.trim()) return false;
        return true;
    }, [items.length, form]);

    if (items.length === 0) {
        return (
            <div className="space-y-3">
                <h1 className="text-2xl font-semibold">Checkout</h1>
                <p className="text-sm text-muted-foreground">Your cart is empty.</p>
                <Button asChild variant="secondary">
                    <Link href="/products">Go to products</Link>
                </Button>
            </div>
        );
    }

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);

        if (!canSubmit || submitting) return;

        try {
            setSubmitting(true);

            const payload = {
                customerName: form.customerName.trim(),
                phone: form.phone.trim(),
                addressLine: form.addressLine.trim(),
                city: form.city.trim(),
                zip: form.zip.trim(),
                items: items.map((it) => ({
                    productId: it.id,
                    size: it.size, // required — backend rejects orders without a size
                    price: it.price, // JSON number -> backend BigDecimal OK
                    qty: it.qty,
                })),
            };

            const created = await createOrder(payload);

            // clear cart AFTER successful order
            clear();

            router.push(`/orders/${created.id}`);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to create order");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Checkout</h1>
                    <p className="text-sm text-muted-foreground">Total €{total.toFixed(2)}</p>
                </div>

                {/* Optional: disable back button while submitting */}
                <Button asChild variant="ghost" disabled={submitting}>
                    <Link href="/cart" aria-disabled={submitting} tabIndex={submitting ? -1 : 0}>
                        Back to cart
                    </Link>
                </Button>
            </div>

            <form
                onSubmit={onSubmit}
                className={`grid gap-6 lg:grid-cols-2 ${submitting ? "opacity-60" : ""}`}
                aria-busy={submitting}
            >
                <div className="space-y-3 rounded-xl border p-4">
                    <h2 className="font-semibold">Customer details</h2>

                    <div className="grid gap-3">
                        <Input
                            disabled={submitting}
                            value={form.customerName}
                            onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                            placeholder="Full name"
                        />
                        <Input
                            disabled={submitting}
                            value={form.phone}
                            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                            placeholder="Phone"
                        />
                    </div>
                </div>

                <div className="space-y-3 rounded-xl border p-4">
                    <h2 className="font-semibold">Shipping address</h2>

                    <div className="grid gap-3">
                        <Input
                            disabled={submitting}
                            value={form.addressLine}
                            onChange={(e) => setForm((f) => ({ ...f, addressLine: e.target.value }))}
                            placeholder="Address line"
                        />
                        <Input
                            disabled={submitting}
                            value={form.city}
                            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                            placeholder="City"
                        />
                        <Input
                            disabled={submitting}
                            value={form.zip}
                            onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))}
                            placeholder="ZIP"
                        />
                    </div>

                    {error &&
                        (() => {
                            const { message, showDockerHint } =
                                formatCheckoutError(error);
                            return (
                                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    {message}
                                    {showDockerHint && (
                                        <div className="mt-1 text-xs text-red-700/80">
                                            If you&apos;re using Docker, make sure the
                                            backend is running:{" "}
                                            <code>docker compose up -d backend</code>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                    <Button type="submit" disabled={!canSubmit || submitting} className="w-full">
                        {submitting ? "Placing order..." : "Place order"}
                    </Button>

                    <p className="text-xs text-muted-foreground">
                        This will create an order in your Spring Boot backend.
                    </p>
                </div>
            </form>
        </div>
    );
}