"use client";

import { useEffect, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    type OrderStatusCount,
    type RevenueByMonth,
    type TopProduct,
    getOrderStatusCounts,
    getRevenueByMonth,
    getTopProducts,
} from "@/lib/api";
import { STATUS_HEX } from "@/lib/order-status-colors";

export function AnalyticsSection() {
    const [revenue, setRevenue] = useState<RevenueByMonth[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [statusCounts, setStatusCounts] = useState<OrderStatusCount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                // Fire all three in parallel — they're independent read endpoints,
                // no need to wait sequentially.
                const [r, p, s] = await Promise.all([
                    getRevenueByMonth(),
                    getTopProducts(),
                    getOrderStatusCounts(),
                ]);
                setRevenue(r);
                setTopProducts(p);
                setStatusCounts(s);
            } catch (e: unknown) {
                setError(
                    e instanceof Error ? e.message : "Failed to load analytics."
                );
            } finally {
                setLoading(false);
            }
        }
        void load();
    }, []);

    if (loading) {
        return (
            <p className="text-sm text-muted-foreground">Loading analytics...</p>
        );
    }

    if (error) {
        return <p className="text-sm text-red-600">{error}</p>;
    }

    return (
        <div className="grid gap-4 lg:grid-cols-2">
            {/* Revenue line chart spans full width on lg */}
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="text-base">
                        Revenue — last 12 months
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {revenue.length === 0 ? (
                        <EmptyState message="No orders yet — revenue chart will appear once sales start." />
                    ) : (
                        <ResponsiveContainer width="100%" height={260}>
                            <LineChart
                                data={revenue.map((r) => ({
                                    ...r,
                                    revenue: Number(r.revenue),
                                }))}
                                margin={{ top: 10, right: 20, bottom: 0, left: 0 }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#e5e7eb"
                                />
                                <XAxis dataKey="month" fontSize={12} />
                                <YAxis fontSize={12} />
                                <Tooltip
                                    formatter={(v) =>
                                        `$${Number(v).toFixed(2)}`
                                    }
                                />
                                <Line
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#2563eb"
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Top 5 products</CardTitle>
                </CardHeader>
                <CardContent>
                    {topProducts.length === 0 ? (
                        <EmptyState message="No products sold yet." />
                    ) : (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart
                                data={topProducts.map((p) => ({
                                    ...p,
                                    qtySold: Number(p.qtySold),
                                }))}
                                layout="vertical"
                                margin={{ top: 10, right: 20, bottom: 0, left: 0 }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#e5e7eb"
                                />
                                <XAxis type="number" fontSize={12} />
                                <YAxis
                                    type="category"
                                    dataKey="title"
                                    width={120}
                                    fontSize={11}
                                />
                                <Tooltip />
                                <Bar
                                    dataKey="qtySold"
                                    name="Units sold"
                                    fill="#8b5cf6"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">
                        Orders by status
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {statusCounts.length === 0 ? (
                        <EmptyState message="No orders yet." />
                    ) : (
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie
                                    data={statusCounts.map((s) => ({
                                        ...s,
                                        count: Number(s.count),
                                    }))}
                                    dataKey="count"
                                    nameKey="status"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                >
                                    {statusCounts.map((s) => (
                                        <Cell
                                            key={s.status}
                                            fill={STATUS_HEX[s.status]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend
                                    formatter={(value, entry) => {
                                        // Entry payload carries our row; pull
                                        // the count out so the legend shows
                                        // e.g. "DELIVERED (3)".
                                        const payload = (
                                            entry as unknown as {
                                                payload?: { count?: number };
                                            }
                                        ).payload;
                                        const count = payload?.count ?? 0;
                                        return `${value} (${count})`;
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
            {message}
        </div>
    );
}
