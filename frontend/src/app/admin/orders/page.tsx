"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminGuard } from "@/features/admin/admin-guard";
import { AdminNav } from "@/features/admin/admin-nav";
import {
    type OrderResponse,
    type OrderStatus,
    getAdminOrders,
    updateOrderStatus,
} from "@/lib/api";

const STATUS_OPTIONS: OrderStatus[] = [
    "NEW",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
];

const STATUS_COLORS: Record<OrderStatus, string> = {
    NEW: "bg-blue-100 text-blue-800",
    PROCESSING: "bg-yellow-100 text-yellow-800",
    SHIPPED: "bg-purple-100 text-purple-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
};

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<OrderResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    async function loadOrders() {
        setLoading(true);
        setError(null);
        try {
            const data = await getAdminOrders();
            setOrders(data);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to load orders.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadOrders();
    }, []);

    async function handleStatusChange(orderId: number, newStatus: OrderStatus) {
        setUpdatingId(orderId);
        setError(null);
        try {
            const updated = await updateOrderStatus(orderId, newStatus);
            setOrders((prev) =>
                prev.map((o) => (o.id === updated.id ? updated : o))
            );
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to update status.");
        } finally {
            setUpdatingId(null);
        }
    }

    return (
        <AdminGuard>
            <div className="space-y-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold">Admin Orders</h1>
                    <p className="text-sm text-muted-foreground">
                        View and manage customer orders.
                    </p>
                </div>

                <AdminNav />

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="rounded-lg border">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                        <h2 className="text-lg font-semibold">Orders</h2>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => void loadOrders()}
                        >
                            Refresh
                        </Button>
                    </div>

                    <div className="divide-y">
                        {loading ? (
                            <p className="px-4 py-4 text-sm text-muted-foreground">
                                Loading...
                            </p>
                        ) : orders.length === 0 ? (
                            <p className="px-4 py-4 text-sm text-muted-foreground">
                                No orders yet.
                            </p>
                        ) : (
                            orders.map((order) => (
                                <div key={order.id} className="px-4 py-3">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div
                                            className="cursor-pointer"
                                            onClick={() =>
                                                setExpandedId(
                                                    expandedId === order.id
                                                        ? null
                                                        : order.id
                                                )
                                            }
                                        >
                                            <p className="font-medium">
                                                #{order.id} &middot;{" "}
                                                {order.customerName}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {order.phone} &middot;{" "}
                                                {order.city} &middot; $
                                                {order.total.toFixed(2)} &middot;{" "}
                                                {new Date(
                                                    order.createdAt
                                                ).toLocaleDateString()}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status]}`}
                                            >
                                                {order.status}
                                            </span>
                                            <select
                                                className="h-8 rounded-md border bg-transparent px-2 text-sm"
                                                value={order.status}
                                                disabled={
                                                    updatingId === order.id
                                                }
                                                onChange={(e) =>
                                                    void handleStatusChange(
                                                        order.id,
                                                        e.target
                                                            .value as OrderStatus
                                                    )
                                                }
                                            >
                                                {STATUS_OPTIONS.map((s) => (
                                                    <option key={s} value={s}>
                                                        {s}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {expandedId === order.id && (
                                        <div className="mt-3 rounded-md border bg-muted/50 p-3">
                                            <p className="mb-2 text-sm font-medium">
                                                Order Items
                                            </p>
                                            <div className="space-y-1">
                                                {order.items.map((item) => (
                                                    <div
                                                        key={item.productId}
                                                        className="flex justify-between text-sm"
                                                    >
                                                        <span>
                                                            {item.title} x{" "}
                                                            {item.qty}
                                                        </span>
                                                        <span>
                                                            $
                                                            {item.lineTotal.toFixed(
                                                                2
                                                            )}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="mt-2 text-sm text-muted-foreground">
                                                {order.addressLine},{" "}
                                                {order.city} {order.zip}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AdminGuard>
    );
}
