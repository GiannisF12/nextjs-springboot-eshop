"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-store";
import { resolveImageUrl } from "@/lib/http";

export default function CartPage() {
    const items = useCart((s) => s.items);
    const totalItems = useCart((s) => s.totalItems());
    const totalPrice = useCart((s) => s.totalPrice());
    const setQty = useCart((s) => s.setQty);
    const remove = useCart((s) => s.remove);
    const clear = useCart((s) => s.clear);

    if (items.length === 0) {
        return (
            <div className="space-y-3">
                <h1 className="text-2xl font-semibold">Cart</h1>
                <p className="text-sm text-muted-foreground">Your cart is empty.</p>
                <Button asChild variant="secondary">
                    <Link href="/products">Go to products</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Cart</h1>
                    <p className="text-sm text-muted-foreground">
                        {totalItems} item(s) • Total €{totalPrice.toFixed(2)}
                    </p>
                </div>

                <Button variant="outline" onClick={clear}>
                    Clear cart
                </Button>
            </div>

            <div className="space-y-3">
                {items.map((it) => (
                    <div key={it.id} className="flex gap-4 rounded-xl border p-3">
                        <div className="relative h-20 w-20 overflow-hidden rounded-lg">
                            <Image src={resolveImageUrl(it.image)} alt={it.title} fill className="object-cover" />
                        </div>

                        <div className="flex-1">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <div className="font-medium">{it.title}</div>
                                    <div className="text-sm text-muted-foreground">{it.category}</div>
                                </div>
                                <div className="font-semibold">€{it.price.toFixed(2)}</div>
                            </div>

                            <div className="mt-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setQty(it.id, it.qty - 1)}
                                    >
                                        −
                                    </Button>
                                    <span className="w-8 text-center text-sm">{it.qty}</span>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setQty(it.id, it.qty + 1)}
                                    >
                                        +
                                    </Button>
                                </div>

                                <Button variant="ghost" onClick={() => remove(it.id)}>
                                    Remove
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-col items-end gap-3">
                <div className="rounded-xl border p-4 text-right">
                    <div className="text-sm text-muted-foreground">Subtotal</div>
                    <div className="text-xl font-semibold">€{totalPrice.toFixed(2)}</div>
                </div>

                <Button asChild variant="secondary">
                    <Link href="/checkout">Checkout</Link>
                </Button>
            </div>
        </div>
    );
}
