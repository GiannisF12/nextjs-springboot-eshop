import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { resolveImageUrl } from "@/lib/http";
import {getOrder, OrderStatus, OrderStatusChange} from "@/lib/api";
import { Badge } from "@/components/ui/badge";

function statusStyles(status: string) {
    switch (status) {
        case "NEW":
            return "bg-gray-200 text-gray-800";
        case "PROCESSING":
            return "bg-yellow-100 text-yellow-800";
        case "SHIPPED":
            return "bg-blue-100 text-blue-800";
        case "DELIVERED":
            return "bg-green-100 text-green-800";
        case "CANCELLED":
            return "bg-red-100 text-red-800";
        default:
            return "bg-muted text-muted-foreground";
    }
}

const ORDER_FLOW: OrderStatus[] = [
    "NEW",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
];

const STATUS_META: Record<string, { label: string; icon: string }> = {
    NEW: { label: "Order placed", icon: "🛒" },
    PROCESSING: { label: "Processing", icon: "📦" },
    SHIPPED: { label: "Shipped", icon: "🚚" },
    DELIVERED: { label: "Delivered", icon: "✅" },
};

function flowIndex(status: OrderStatus) {
    return ORDER_FLOW.indexOf(status);
}

/**
 * Compact timestamp for the timeline — single line, user's locale.
 * e.g. "Apr 24, 10:42". Year omitted on purpose to keep the step label
 * short; the full created-at is already shown in the order header.
 */
function formatStep(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function StatusTimeline({
    status,
    history,
}: {
    status: OrderStatus;
    history: OrderStatusChange[];
}) {
    // Build a quick lookup: status -> the earliest changedAt we have for
    // it. "Earliest" in case an admin bounces between statuses — we want
    // the first time the order *reached* each step.
    const firstAt = new Map<OrderStatus, string>();
    for (const h of history) {
        if (!firstAt.has(h.status)) firstAt.set(h.status, h.changedAt);
    }

    // The cancellation timestamp lives in history, not on the order row
    // itself — pull it out here so the red banner can show *when* it was
    // cancelled, not just that it was.
    if (status === "CANCELLED") {
        const cancelledAt = firstAt.get("CANCELLED");
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="text-sm font-semibold text-red-700">
                    ❌ Order Cancelled
                </div>
                <div className="mt-1 text-xs text-red-600">
                    This order will not be processed further.
                    {cancelledAt && (
                        <> · Cancelled on {formatStep(cancelledAt)}</>
                    )}
                </div>
            </div>
        );
    }

    const current = flowIndex(status);

    return (
        <div className="rounded-xl border p-6">
            <div className="mb-6 text-sm font-semibold">Order progress</div>

            <div className="relative">
                {/* Connecting Line */}
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted" />

                <div
                    className="absolute top-4 left-0 h-0.5 bg-blue-600 transition-all duration-500"
                    style={{
                        width:
                            current <= 0
                                ? "0%"
                                : `${(current / (ORDER_FLOW.length - 1)) * 100}%`,
                    }}
                />

                <ol className="relative grid grid-cols-4">
                    {ORDER_FLOW.map((step, idx) => {
                        const done = idx < current;
                        const active = idx === current;
                        // Only steps that have actually happened get a
                        // timestamp. Future steps stay blank so it's
                        // obvious they're pending.
                        const reachedAt = firstAt.get(step);

                        return (
                            <li
                                key={step}
                                className="flex flex-col items-center text-center"
                            >
                                {/* Circle */}
                                <div
                                    className={[
                                        "z-10 flex h-8 w-8 items-center justify-center rounded-full border text-sm transition-all duration-300",
                                        done &&
                                        "bg-green-600 border-green-600 text-white",
                                        active &&
                                        "bg-blue-600 border-blue-600 text-white scale-110 shadow-lg",
                                        !done &&
                                        !active &&
                                        "bg-background border-muted-foreground/30 text-muted-foreground",
                                    ]
                                        .filter(Boolean)
                                        .join(" ")}
                                >
                                    {STATUS_META[step].icon}
                                </div>

                                {/* Label */}
                                <div
                                    className={[
                                        "mt-2 text-xs transition-colors duration-300",
                                        done && "text-green-700",
                                        active && "text-blue-700 font-semibold",
                                        !done &&
                                        !active &&
                                        "text-muted-foreground",
                                    ]
                                        .filter(Boolean)
                                        .join(" ")}
                                >
                                    {STATUS_META[step].label}
                                </div>

                                {/* Timestamp — only for steps that have
                                    actually been reached. Fixed min-height
                                    so future-step columns still align. */}
                                <div className="mt-1 min-h-[1rem] text-[10px] text-muted-foreground">
                                    {reachedAt ? formatStep(reachedAt) : ""}
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </div>
        </div>
    );
}

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
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge className={`${statusStyles(order.status)} border-0`}>
                            {order.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                            Created at {new Date(order.createdAt).toLocaleString()}
                        </span>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-sm text-muted-foreground">Total</div>
                    <div className="text-xl font-semibold">€{Number(order.total).toFixed(2)}</div>
                </div>
            </div>

            <StatusTimeline
                status={order.status}
                history={order.statusHistory ?? []}
            />

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

                    {order.items.map((it, idx) => (
                        // Key has to include size + index because one order
                        // can have the same product in two sizes (e.g. shirt
                        // in M and L) which would collide on productId alone.
                        <div
                            key={`${it.productId}|${it.size ?? "-"}|${idx}`}
                            className="flex items-center gap-4 rounded-xl border p-3"
                        >
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                                <Image
                                    src={resolveImageUrl(it.image)}
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
                                    {it.size && (
                                        <Badge variant="outline">Size {it.size}</Badge>
                                    )}
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