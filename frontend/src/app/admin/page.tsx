"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminGuard } from "@/features/admin/admin-guard";
import { AdminNav } from "@/features/admin/admin-nav";
import { AnalyticsSection } from "@/features/admin/analytics-section";
import {
    type AdminStats,
    type OrderResponse,
    getAdminStats,
    getAdminOrders,
} from "@/lib/api";
import { STATUS_COLORS } from "@/lib/order-status-colors";

export default function AdminPage() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [recentOrders, setRecentOrders] = useState<OrderResponse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [statsData, ordersData] = await Promise.all([
                    getAdminStats(),
                    getAdminOrders(),
                ]);
                setStats(statsData);
                setRecentOrders(ordersData.slice(0, 5));
            } catch {
                // stats will stay null — cards just show "—"
            } finally {
                setLoading(false);
            }
        }

        void load();
    }, []);

    return (
        <AdminGuard>
            <div className="space-y-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
                    <p className="text-sm text-muted-foreground">
                        Overview of your store.
                    </p>
                </div>

                <AdminNav />

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Orders"
                        value={stats?.totalOrders}
                        loading={loading}
                    />
                    <StatCard
                        title="Revenue"
                        value={
                            stats
                                ? `$${Number(stats.totalRevenue).toFixed(2)}`
                                : undefined
                        }
                        loading={loading}
                    />
                    <StatCard
                        title="Products"
                        value={stats?.totalProducts}
                        loading={loading}
                    />
                    <StatCard
                        title="Users"
                        value={stats?.totalUsers}
                        loading={loading}
                    />
                </div>

                <AnalyticsSection />

                <div className="rounded-lg border">
                    <div className="border-b px-4 py-3">
                        <h2 className="text-lg font-semibold">Recent Orders</h2>
                    </div>

                    <div className="divide-y">
                        {loading ? (
                            <p className="px-4 py-4 text-sm text-muted-foreground">
                                Loading...
                            </p>
                        ) : recentOrders.length === 0 ? (
                            <p className="px-4 py-4 text-sm text-muted-foreground">
                                No orders yet.
                            </p>
                        ) : (
                            recentOrders.map((order) => (
                                <Link
                                    key={order.id}
                                    href="/admin/orders"
                                    className="flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-muted/50 md:flex-row md:items-center md:justify-between"
                                >
                                    <div>
                                        <p className="font-medium">
                                            #{order.id} &middot;{" "}
                                            {order.customerName}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(
                                                order.createdAt
                                            ).toLocaleDateString()}{" "}
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
        </AdminGuard>
    );
}

function StatCard({
    title,
    value,
    loading,
}: {
    title: string;
    value?: string | number;
    loading: boolean;
}) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">
                    {loading ? "..." : value ?? "\u2014"}
                </p>
            </CardContent>
        </Card>
    );
}
