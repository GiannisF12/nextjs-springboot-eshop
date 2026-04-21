import type { OrderStatus } from "@/lib/api";

/**
 * Tailwind utility classes per order status — used for the status
 * pills that appear on every admin list/detail view.
 */
export const STATUS_COLORS: Record<OrderStatus, string> = {
    NEW: "bg-blue-100 text-blue-800",
    PROCESSING: "bg-yellow-100 text-yellow-800",
    SHIPPED: "bg-purple-100 text-purple-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
};

/**
 * Raw hex colors for chart fills (recharts can't parse Tailwind classes).
 * Matches the pill palette above visually so the dashboard feels cohesive.
 */
export const STATUS_HEX: Record<OrderStatus, string> = {
    NEW: "#3b82f6",         // blue-500
    PROCESSING: "#eab308",  // yellow-500
    SHIPPED: "#a855f7",     // purple-500
    DELIVERED: "#22c55e",   // green-500
    CANCELLED: "#ef4444",   // red-500
};
