"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminGuard } from "@/features/admin/admin-guard";
import { AdminNav } from "@/features/admin/admin-nav";
import { LocalTime } from "@/components/local-time";
import {
    type StoreSettings,
    getStoreSettings,
    updateStoreSettings,
} from "@/lib/api";

/**
 * Local form shape — both numbers held as strings so the inputs can
 * be empty mid-typing without React complaining about NaN. Parsed to
 * floats only at submit time, validated on the backend either way.
 */
type FormState = {
    freeShippingThreshold: string;
    lowStockThreshold: string;
    codEnabled: boolean;
    cardEnabled: boolean;
};

export default function AdminSettingsPage() {
    const [current, setCurrent] = useState<StoreSettings | null>(null);
    const [form, setForm] = useState<FormState>({
        freeShippingThreshold: "",
        lowStockThreshold: "",
        codEnabled: true,
        cardEnabled: false,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    async function load() {
        setLoading(true);
        try {
            const s = await getStoreSettings();
            setCurrent(s);
            setForm({
                freeShippingThreshold: s.freeShippingThreshold.toFixed(2),
                lowStockThreshold: String(s.lowStockThreshold),
                codEnabled: s.codEnabled,
                cardEnabled: s.cardEnabled,
            });
        } catch (e: unknown) {
            toast.error(
                e instanceof Error
                    ? e.message
                    : "Failed to load store settings"
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
    }, []);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (saving) return;

        const threshold = Number(form.freeShippingThreshold);
        const lowStock = Number(form.lowStockThreshold);

        if (Number.isNaN(threshold) || threshold < 0) {
            toast.error("Free-shipping threshold must be a number ≥ 0");
            return;
        }
        if (
            Number.isNaN(lowStock) ||
            lowStock < 0 ||
            !Number.isInteger(lowStock)
        ) {
            toast.error("Low-stock threshold must be a whole number ≥ 0");
            return;
        }

        setSaving(true);
        try {
            const updated = await updateStoreSettings({
                freeShippingThreshold: threshold,
                lowStockThreshold: lowStock,
                codEnabled: form.codEnabled,
                cardEnabled: form.cardEnabled,
            });
            setCurrent(updated);
            setForm({
                freeShippingThreshold: updated.freeShippingThreshold.toFixed(2),
                lowStockThreshold: String(updated.lowStockThreshold),
                codEnabled: updated.codEnabled,
                cardEnabled: updated.cardEnabled,
            });
            toast.success("Settings saved");
        } catch (e: unknown) {
            toast.error(
                e instanceof Error ? e.message : "Failed to save settings"
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <AdminGuard>
            <div className="space-y-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold">Store settings</h1>
                    <p className="text-sm text-muted-foreground">
                        Live knobs for the storefront — no redeploy needed.
                        These values apply to every new order from the moment
                        you save them. Existing orders keep their original
                        snapshots.
                    </p>
                </div>

                <AdminNav />

                {loading ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                ) : (
                    <form
                        onSubmit={handleSubmit}
                        className="max-w-xl space-y-6 rounded-xl border p-6"
                    >
                        <div className="space-y-1">
                            <h2 className="text-lg font-semibold">Shipping</h2>
                            <p className="text-xs text-muted-foreground">
                                Per-courier prices are managed on the{" "}
                                <span className="font-medium">Couriers</span>{" "}
                                page. This threshold makes shipping free once
                                the cart subtotal reaches it, for any courier.
                                Set it to 0 to disable free shipping entirely.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="space-y-1">
                                <span className="text-sm font-medium">
                                    Free-shipping threshold (€)
                                </span>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    inputMode="decimal"
                                    value={form.freeShippingThreshold}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            freeShippingThreshold:
                                                e.target.value,
                                        }))
                                    }
                                    disabled={saving}
                                />
                                <span className="block text-xs text-muted-foreground">
                                    Cart subtotal at or above this number
                                    ships for free. 0 disables.
                                </span>
                            </label>
                        </div>

                        <div className="space-y-1 border-t pt-6">
                            <h2 className="text-lg font-semibold">Inventory</h2>
                            <p className="text-xs text-muted-foreground">
                                Drives the &ldquo;Low stock&rdquo; warning on
                                the dashboard. Set to 0 to switch the warning
                                off entirely.
                            </p>
                        </div>

                        <label className="block max-w-xs space-y-1">
                            <span className="text-sm font-medium">
                                Low-stock threshold (units)
                            </span>
                            <Input
                                type="number"
                                step="1"
                                min="0"
                                inputMode="numeric"
                                value={form.lowStockThreshold}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        lowStockThreshold: e.target.value,
                                    }))
                                }
                                disabled={saving}
                            />
                            <span className="block text-xs text-muted-foreground">
                                Variants with this much stock or fewer
                                count as &ldquo;low&rdquo;. Typical: 3 – 10.
                            </span>
                        </label>

                        <div className="space-y-1 border-t pt-6">
                            <h2 className="text-lg font-semibold">
                                Payment methods
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Which methods customers can use at checkout.
                                At least one must stay on. Turning a method off
                                hides it immediately — handy if a method has an
                                issue you need to pause.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <label className="flex items-center justify-between gap-3 rounded-md border p-3">
                                <span>
                                    <span className="text-sm font-medium">
                                        Cash on delivery
                                    </span>
                                    <span className="block text-xs text-muted-foreground">
                                        Pay the courier in cash on delivery.
                                    </span>
                                </span>
                                <input
                                    type="checkbox"
                                    checked={form.codEnabled}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            codEnabled: e.target.checked,
                                        }))
                                    }
                                    disabled={saving}
                                />
                            </label>

                            <label
                                className={`flex items-center justify-between gap-3 rounded-md border p-3 ${
                                    current?.cardAvailable ? "" : "opacity-60"
                                }`}
                            >
                                <span>
                                    <span className="flex items-center gap-2 text-sm font-medium">
                                        Card payment
                                        {!current?.cardAvailable && (
                                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                                                Coming soon
                                            </span>
                                        )}
                                    </span>
                                    <span className="block text-xs text-muted-foreground">
                                        {current?.cardAvailable
                                            ? "Pay online by debit or credit card."
                                            : "Available once card payments are set up."}
                                    </span>
                                </span>
                                <input
                                    type="checkbox"
                                    checked={form.cardEnabled}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            cardEnabled: e.target.checked,
                                        }))
                                    }
                                    disabled={saving || !current?.cardAvailable}
                                />
                            </label>
                        </div>

                        <div className="flex items-center justify-between border-t pt-4">
                            <div className="text-xs text-muted-foreground">
                                {current && (
                                    <>
                                        Last updated{" "}
                                        <LocalTime
                                            iso={current.updatedAt}
                                            format="short"
                                        />
                                    </>
                                )}
                            </div>
                            <Button type="submit" disabled={saving}>
                                {saving ? "Saving..." : "Save settings"}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </AdminGuard>
    );
}
