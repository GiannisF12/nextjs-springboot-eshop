import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getOrder } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

type Props = {
    params: Promise<{ id: string }>;
};

export default async function OrderPage({ params }: Props) {
    const { id } = await params;

    const order = await getOrder(id);

    if (!order) {
        return (
            <div className="space-y-4">
                <h1 className="text-2xl font-semibold">Order not found</h1>
                <Button asChild variant="secondary">
                    <Link href="/products">Back to products</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Order #{order.id}</h1>
                    <p className="text-sm text-muted-foreground">
                        Created at {new Date(order.createdAt).toLocaleString()}
                    </p>
                </div>

                <div className="text-right">
                    <div className="text-sm text-muted-foreground">Total</div>
                    <div className="text-xl font-semibold">€{Number(order.total).toFixed(2)}</div>
                </div>
            </div>

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

                    {order.items.map((it) => (
                        <div
                            key={it.productId}
                            className="flex items-center gap-4 rounded-xl border p-3"
                        >
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                                <Image
                                    src={it.image}
                                    alt={it.title}
                                    fill
                                    className="object-cover"
                                    sizes="64px"
                                />
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="font-medium truncate">{it.title}</div>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                    <Badge variant="secondary">{it.category}</Badge>
                                    <span>Qty: {it.qty}</span>
                                    <span>€{Number(it.price).toFixed(2)} each</span>
                                </div>
                            </div>

                            <div className="font-semibold">€{Number(it.lineTotal).toFixed(2)}</div>
                        </div>
                    ))}

                    <div className="flex gap-2 pt-2">
                        <Button asChild variant="secondary">
                            <Link href="/products">Continue shopping</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}