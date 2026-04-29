"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminGuard } from "@/features/admin/admin-guard";
import { AdminNav } from "@/features/admin/admin-nav";
import {
    type OrderResponse,
    type OrderStatus,
    type OrderStatusChange,
    getAdminOrders,
    updateOrderStatus,
} from "@/lib/api";
import { STATUS_COLORS } from "@/lib/order-status-colors";

/** "all" sentinel = no status filter applied. */
type StatusFilter = OrderStatus | "all";

const STATUS_OPTIONS: OrderStatus[] = [
    "NEW",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
];

const STATUS_LABELS: Record<OrderStatus, string> = {
    NEW: "Placed",
    PROCESSING: "Processing",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
};

/** Short, locale-aware timestamp used in the status timeline. */
function formatStep(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

/**
 * Reusable "field" row with a fixed-width label on the left and the
 * value on the right. Keeps the Ship-to card and the packing slip
 * aligned the same way — admins scanning a stack of orders shouldn't
 * have to guess which value is which.
 */
function Field({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex gap-2 text-sm">
            <span className="w-20 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
            </span>
            <span className="font-medium">{value}</span>
        </div>
    );
}

/**
 * Compact per-order timeline. Lists every status change the order went
 * through with its timestamp. Simpler than the stepper on the customer
 * page — the admin mostly cares about "when did I ship this?".
 */
function AdminTimeline({ history }: { history: OrderStatusChange[] }) {
    if (history.length === 0) {
        return (
            <p className="text-xs text-muted-foreground">
                No status history recorded.
            </p>
        );
    }
    return (
        <ol className="space-y-1 text-xs">
            {history.map((h, idx) => (
                <li
                    key={`${h.status}-${h.changedAt}-${idx}`}
                    className="flex items-center justify-between gap-3"
                >
                    <span
                        className={`inline-block rounded-full px-2 py-0.5 font-medium ${STATUS_COLORS[h.status]}`}
                    >
                        {STATUS_LABELS[h.status]}
                    </span>
                    <span className="text-muted-foreground">
                        {formatStep(h.changedAt)}
                    </span>
                </li>
            ))}
        </ol>
    );
}

/**
 * Black-and-white packing slip rendered into the hidden .print-only
 * container. Styled to be legible on a B&W printer — no coloured
 * badges, no shadows. Includes everything a warehouse person needs:
 * order number, ship-to, pick list with sizes and quantities, and a
 * signature line.
 */
function PackingSlip({ order }: { order: OrderResponse }) {
    return (
        <div className="text-black">
            <div className="mb-6 flex items-start justify-between border-b-2 border-black pb-3">
                <div>
                    <h1 className="text-2xl font-bold">Packing Slip</h1>
                    <p className="text-sm">
                        Order <strong>#{order.id}</strong> &middot;{" "}
                        {new Date(order.createdAt).toLocaleString()}
                    </p>
                </div>
                <div className="text-right text-sm">
                    <p>Status: {order.status}</p>
                </div>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-6">
                <div>
                    <h2 className="mb-2 text-xs font-bold uppercase tracking-wide">
                        Ship to
                    </h2>
                    <div className="space-y-0.5 text-sm leading-relaxed">
                        <p className="text-base font-bold">
                            {order.customerName}
                        </p>
                        <p>Phone: {order.phone}</p>
                        <p>{order.addressLine}</p>
                        <p>
                            {order.city}, {order.zip}
                        </p>
                    </div>
                </div>
                <div className="text-right text-sm">
                    <h2 className="mb-2 text-xs font-bold uppercase tracking-wide">
                        From
                    </h2>
                    <p>Your Shop</p>
                    <p>Warehouse</p>
                </div>
            </div>

            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide">
                Items
            </h2>
            <table className="mb-6 w-full border-collapse text-sm">
                <thead>
                    <tr className="border-b-2 border-black text-left">
                        <th className="py-2 pr-2">Item</th>
                        <th className="py-2 px-2">Size</th>
                        <th className="py-2 px-2 text-center">Qty</th>
                        <th className="py-2 pl-2 text-right">Line total</th>
                    </tr>
                </thead>
                <tbody>
                    {order.items.map((item, idx) => (
                        <tr
                            key={`${item.productId}|${item.size ?? "-"}|${idx}`}
                            className="border-b border-black/50"
                        >
                            <td className="py-2 pr-2">{item.title}</td>
                            <td className="py-2 px-2 font-mono">
                                {item.size ?? "—"}
                            </td>
                            <td className="py-2 px-2 text-center font-bold">
                                {item.qty}
                            </td>
                            <td className="py-2 pl-2 text-right">
                                ${item.lineTotal.toFixed(2)}
                            </td>
                        </tr>
                    ))}
                    <tr className="border-b-2 border-black font-bold">
                        <td colSpan={3} className="py-2 pr-2 text-right">
                            Total
                        </td>
                        <td className="py-2 pl-2 text-right">
                            ${order.total.toFixed(2)}
                        </td>
                    </tr>
                </tbody>
            </table>

            <div className="mt-12 grid grid-cols-2 gap-12 text-sm">
                <div>
                    <p className="border-t border-black pt-1">
                        Picked by (signature / date)
                    </p>
                </div>
                <div>
                    <p className="border-t border-black pt-1">
                        Received by (signature / date)
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<OrderResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [copiedId, setCopiedId] = useState<number | null>(null);
    // Which order to render into the .print-only slot. Set just before
    // window.print() fires, cleared after.
    const [printingId, setPrintingId] = useState<number | null>(null);

    // Filter state. All client-side — the admin endpoint returns the
    // full list and we slice it locally. If the order count ever grows
    // past a few hundred we can move this server-side, but the current
    // dataset is small enough that re-filtering on every keystroke is
    // imperceptible.
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const printingOrder =
        printingId !== null
            ? orders.find((o) => o.id === printingId) ?? null
            : null;

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

    /**
     * Apply all active filters in one pass:
     *  - text query matches against id, customer name, phone, city
     *    (case-insensitive). One field a typical admin would search by.
     *  - status filter narrows to a single state, or "all" lets through.
     *  - date range compares the order's created-at *date* (not time) to
     *    the from/to bounds, so the "to" day is fully inclusive without
     *    forcing the admin to think in 23:59:59 terms.
     */
    const filteredOrders = useMemo(() => {
        const q = query.trim().toLowerCase();

        return orders.filter((o) => {
            if (statusFilter !== "all" && o.status !== statusFilter) {
                return false;
            }

            if (q) {
                const haystack = [
                    String(o.id),
                    o.customerName,
                    o.phone,
                    o.city,
                ]
                    .join(" ")
                    .toLowerCase();
                if (!haystack.includes(q)) return false;
            }

            // ISO timestamps sort/compare correctly as strings, so we
            // just slice off the "YYYY-MM-DD" prefix to compare against
            // the date-input value verbatim.
            const orderDate = o.createdAt.slice(0, 10);
            if (dateFrom && orderDate < dateFrom) return false;
            if (dateTo && orderDate > dateTo) return false;

            return true;
        });
    }, [orders, query, statusFilter, dateFrom, dateTo]);

    const hasActiveFilters =
        query !== "" ||
        statusFilter !== "all" ||
        dateFrom !== "" ||
        dateTo !== "";

    function clearFilters() {
        setQuery("");
        setStatusFilter("all");
        setDateFrom("");
        setDateTo("");
    }

    async function handleStatusChange(orderId: number, newStatus: OrderStatus) {
        setUpdatingId(orderId);
        try {
            const updated = await updateOrderStatus(orderId, newStatus);
            setOrders((prev) =>
                prev.map((o) => (o.id === updated.id ? updated : o))
            );
            toast.success(`Order #${orderId} → ${newStatus}`);
        } catch (e: unknown) {
            toast.error(
                e instanceof Error ? e.message : "Failed to update status."
            );
        } finally {
            setUpdatingId(null);
        }
    }

    /**
     * Copies a pre-formatted "courier-ready" block to the clipboard —
     * each field labelled so the admin can paste it into any shipping
     * form without having to reorder the lines.
     */
    async function handleCopyAddress(order: OrderResponse) {
        const block = [
            `Name: ${order.customerName}`,
            `Phone: ${order.phone}`,
            `Address: ${order.addressLine}`,
            `City: ${order.city}`,
            `Postal code: ${order.zip}`,
        ].join("\n");

        try {
            await navigator.clipboard.writeText(block);
            setCopiedId(order.id);
            toast.success("Shipping address copied");
            setTimeout(() => {
                setCopiedId((cur) => (cur === order.id ? null : cur));
            }, 1500);
        } catch {
            toast.error("Could not copy to clipboard.");
        }
    }

    /**
     * Sets the print target, waits one paint so React applies the
     * update, then opens the browser's print dialog. Clearing the id
     * runs inside an afterprint listener so a cancelled dialog also
     * resets state.
     */
    function handlePrint(orderId: number) {
        setPrintingId(orderId);

        const onAfterPrint = () => {
            setPrintingId(null);
            window.removeEventListener("afterprint", onAfterPrint);
        };
        window.addEventListener("afterprint", onAfterPrint);

        // Two rAFs: one so React commits the state change, one so the
        // browser lays out the now-visible print slip before snapshotting.
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                window.print();
            });
        });
    }

    return (
        <AdminGuard>
            {/* Hidden on screen — only .print-only children are painted
                when the print dialog opens. Populated with the currently
                selected order right before window.print() fires. */}
            <div className="print-only">
                {printingOrder && <PackingSlip order={printingOrder} />}
            </div>

            <div className="space-y-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold">Admin Orders</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage customer orders, copy shipping addresses, and
                        print packing slips for dispatch.
                    </p>
                </div>

                <AdminNav />

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="rounded-lg border">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                        <h2 className="text-lg font-semibold">
                            Orders
                            {!loading && (
                                <span className="ml-2 text-sm font-normal text-muted-foreground">
                                    ({filteredOrders.length}
                                    {hasActiveFilters &&
                                        ` of ${orders.length}`}
                                    )
                                </span>
                            )}
                        </h2>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => void loadOrders()}
                        >
                            Refresh
                        </Button>
                    </div>

                    {/* Filter bar — search by id/name/phone/city, narrow by
                        status, narrow by date range. All client-side, all
                        clearable in one click. */}
                    <div className="border-b bg-muted/30 px-4 py-3">
                        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto] md:items-end">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                    Search
                                </label>
                                <Input
                                    type="search"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Order #, name, phone, city"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                    Status
                                </label>
                                <select
                                    className="h-9 rounded-md border bg-background px-2 text-sm"
                                    value={statusFilter}
                                    onChange={(e) =>
                                        setStatusFilter(
                                            e.target.value as StatusFilter
                                        )
                                    }
                                >
                                    <option value="all">All</option>
                                    {STATUS_OPTIONS.map((s) => (
                                        <option key={s} value={s}>
                                            {STATUS_LABELS[s]}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                    From
                                </label>
                                <Input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) =>
                                        setDateFrom(e.target.value)
                                    }
                                    max={dateTo || undefined}
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                    To
                                </label>
                                <Input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    min={dateFrom || undefined}
                                />
                            </div>

                            <Button
                                type="button"
                                variant="ghost"
                                onClick={clearFilters}
                                disabled={!hasActiveFilters}
                            >
                                Clear
                            </Button>
                        </div>
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
                        ) : filteredOrders.length === 0 ? (
                            <p className="px-4 py-4 text-sm text-muted-foreground">
                                No orders match your filters.{" "}
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="underline hover:no-underline"
                                >
                                    Clear filters
                                </button>
                            </p>
                        ) : (
                            filteredOrders.map((order) => (
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
                                        <div className="mt-3 grid gap-3 rounded-md border bg-muted/30 p-4 md:grid-cols-3">
                                            {/* Ship-to card with labelled
                                                fields so the admin doesn't
                                                have to guess which line is
                                                the name vs. the phone. */}
                                            <div className="rounded-md border bg-background p-4 md:col-span-1">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                        Ship to
                                                    </p>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="h-7 px-2 text-xs"
                                                        onClick={() =>
                                                            void handleCopyAddress(
                                                                order
                                                            )
                                                        }
                                                    >
                                                        {copiedId === order.id
                                                            ? "✓ Copied"
                                                            : "Copy"}
                                                    </Button>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Field
                                                        label="Name"
                                                        value={order.customerName}
                                                    />
                                                    <Field
                                                        label="Phone"
                                                        value={order.phone}
                                                    />
                                                    <Field
                                                        label="Address"
                                                        value={order.addressLine}
                                                    />
                                                    <Field
                                                        label="City"
                                                        value={order.city}
                                                    />
                                                    <Field
                                                        label="Postal"
                                                        value={order.zip}
                                                    />
                                                </div>
                                                <div className="mt-3 border-t pt-2 text-xs text-muted-foreground">
                                                    Order #{order.id} &middot;{" "}
                                                    {new Date(
                                                        order.createdAt
                                                    ).toLocaleString()}
                                                </div>
                                            </div>

                                            {/* Pick list — size and qty are
                                                what the warehouse person
                                                cares about, so they get
                                                their own columns. */}
                                            <div className="rounded-md border bg-background p-3 md:col-span-2">
                                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                    Pick list
                                                </p>
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="text-left text-xs text-muted-foreground">
                                                            <th className="py-1 pr-2 font-medium">
                                                                Item
                                                            </th>
                                                            <th className="py-1 px-2 font-medium">
                                                                Size
                                                            </th>
                                                            <th className="py-1 px-2 text-center font-medium">
                                                                Qty
                                                            </th>
                                                            <th className="py-1 pl-2 text-right font-medium">
                                                                Line
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {order.items.map(
                                                            (item, idx) => (
                                                                <tr
                                                                    key={`${item.productId}|${item.size ?? "-"}|${idx}`}
                                                                    className="border-t"
                                                                >
                                                                    <td className="py-1.5 pr-2">
                                                                        {item.title}
                                                                    </td>
                                                                    <td className="py-1.5 px-2 font-mono">
                                                                        {item.size ??
                                                                            "—"}
                                                                    </td>
                                                                    <td className="py-1.5 px-2 text-center font-semibold">
                                                                        {item.qty}
                                                                    </td>
                                                                    <td className="py-1.5 pl-2 text-right">
                                                                        $
                                                                        {item.lineTotal.toFixed(
                                                                            2
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            )
                                                        )}
                                                        {order.discountCode && (
                                                            <tr className="border-t text-green-700">
                                                                <td
                                                                    colSpan={3}
                                                                    className="py-1.5 pr-2 text-right text-xs"
                                                                >
                                                                    Discount
                                                                    applied:{" "}
                                                                    <span className="font-mono font-semibold">
                                                                        {
                                                                            order.discountCode
                                                                        }
                                                                    </span>{" "}
                                                                    (−
                                                                    {
                                                                        order.discountPercent
                                                                    }
                                                                    %)
                                                                </td>
                                                                <td className="py-1.5 pl-2 text-right text-xs">
                                                                    (already in
                                                                    total)
                                                                </td>
                                                            </tr>
                                                        )}
                                                        <tr className="border-t font-semibold">
                                                            <td
                                                                colSpan={3}
                                                                className="py-1.5 pr-2 text-right"
                                                            >
                                                                Total
                                                            </td>
                                                            <td className="py-1.5 pl-2 text-right">
                                                                $
                                                                {order.total.toFixed(
                                                                    2
                                                                )}
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Timeline + actions row. */}
                                            <div className="rounded-md border bg-background p-3 md:col-span-3">
                                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                    Status timeline
                                                </p>
                                                <AdminTimeline
                                                    history={
                                                        order.statusHistory ??
                                                        []
                                                    }
                                                />
                                                <div className="mt-3 flex gap-2 border-t pt-3">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() =>
                                                            handlePrint(order.id)
                                                        }
                                                    >
                                                        🖨️ Print packing slip
                                                    </Button>
                                                </div>
                                            </div>
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
