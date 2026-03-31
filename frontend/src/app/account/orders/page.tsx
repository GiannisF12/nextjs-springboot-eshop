"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import { type OrderResponse, type OrderStatus, getMyOrders } from "@/lib/api";

const STATUS_COLORS: Record<OrderStatus, string> = {
    NEW: "bg-blue-100 text-blue-800",
    PROCESSING: "bg-yellow-100 text-yellow-800",
    SHIPPED: "bg-purple-100 text-purple-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
};

export default function MyOrdersPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [orders, setOrders] = useState<OrderResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push("/login");
            return;
        }

        async function load() {
            setLoading(true);
            try {
                const data = await getMyOrders();
                setOrders(data);
            } catch (e: unknown) {
                setError(e instanceof Error ? e.message : "Failed to load orders.");
            } finally {
                setLoading(false);
            }
        }

        void load();
    }, [user, authLoading, router]);

    if (authLoading || !user) {
        return <p className="text-sm text-muted-foreground">Loading...</p>;
    }

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold">My Orders</h1>
                <p className="text-sm text-muted-foreground">
                    Your order history.
                </p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="rounded-lg border">
                <div className="divide-y">
                    {loading ? (
                        <p className="px-4 py-4 text-sm text-muted-foreground">
                            Loading orders...
                        </p>
                    ) : orders.length === 0 ? (
                        <div className="px-4 py-6 text-center">
                            <p className="text-sm text-muted-foreground">
                                You haven&apos;t placed any orders yet.
                            </p>
                            <Button asChild variant="outline" className="mt-3">
                                <Link href="/products">Browse products</Link>
                            </Button>
                        </div>
                    ) : (
                        orders.map((order) => (
                            <Link
                                key={order.id}
                                href={`/orders/${order.id}`}
                                className="flex flex-col gap-2 px-4 py-4 transition-colors hover:bg-muted/50 md:flex-row md:items-center md:justify-between"
                            >
                                <div>
                                    <p className="font-medium">
                                        Order #{order.id}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(order.createdAt).toLocaleDateString()}{" "}
                                        &middot; {order.items.length}{" "}
                                        {order.items.length === 1
                                            ? "item"
                                            : "items"}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span
                                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status]}`}
                                    >
                                        {order.status}
                                    </span>
                                    <span className="font-medium">
                                        ${order.total.toFixed(2)}
                                    </span>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
