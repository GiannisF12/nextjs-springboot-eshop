import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getOrder } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

type Props = {
    params: Promise<{ id: string }>;
};

function formatDate(iso: string) {
    // Safer + consistent formatting in Server Components
    return new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(iso));
}

export default async function OrderPage({ params }: Props) {
    const { id } = await params;

    const order = await getOrder(id);

    if (!order) {
        return (
            <div className="space-y-4">
                <h1 className="text-2xl font-semibold">Order not found</h1>
                <p className="text-sm text-muted-foreground">
                    The order you’re looking for doesn’t exist (or was deleted).
                </p>
                <Button asChild variant="secondary">
                    <Link href="/products">Back to products</Link>
                </Button>
            </div>
        );
    }

    const itemsCount = order.items.reduce((sum, it) => sum + (it.qty ?? 0), 0);

    return (
        <div className="space-y-6">
            {/* Success header */}
            <div className="rounded-xl border p-4 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="text-sm text-muted-foreground">Order placed</div>
                        <h1 className="mt-1 text-2xl font-semibold">Thank you 🎉</h1>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="secondary">Order #{order.id}</Badge>
                            <span>Created {formatDate(order.createdAt)}</span>
                        </div>
                    </div>

                    <div className="text-left sm:text-right">
                        <div className="text-sm text-muted-foreground">Total</div>
                        <div className="text-2xl font-semibold">
                            €{Number(order.total).toFixed(2)}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                            {itemsCount} item(s)
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    <Button asChild variant="secondary">
                        <Link href="/products">Continue shopping</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/cart">Go to cart</Link>
                    </Button>
                </div>
            </div>

            {/* Details */}
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="rounded-xl border p-4 lg:col-span-1">
                    <h2 className="font-semibold">Customer</h2>
                    <div className="mt-2 space-y-1 text-sm">
                        <div>{order.customerName}</div>
                        <div className="text-muted-foreground">{order.phone}</div>
                    </div>

                    <h2 className="mt-4 font-semibold">Shipping</h2>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                        <div>{order.addressLine}</div>
                        <div>
                            {order.city}, {order.zip}
                        </div>
                    </div>
                </div>

                <div className="space-y-3 lg:col-span-2">
                    <h2 className="font-semibold">Items</h2>

                    {order.items.length === 0 ? (
                        <div className="rounded-xl border p-6 text-sm text-muted-foreground">
                            No items found for this order.
                        </div>
                    ) : (
                        order.items.map((it) => (
                            <div
                                key={it.productId}
                                className="flex items-center justify-between gap-4 rounded-xl border p-3"
                            >
                                <div className="min-w-0">
                                    <div className="font-medium">{it.title}</div>
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                        <Badge variant="secondary">{it.category}</Badge>
                                        <span>Qty: {it.qty}</span>
                                        <span>€{Number(it.price).toFixed(2)} each</span>
                                    </div>
                                </div>

                                <div className="font-semibold">
                                    €{Number(it.lineTotal).toFixed(2)}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}