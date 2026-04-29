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
    shippingFlatRate: string;
    freeShippingThreshold: string;
    lowStockThreshold: string;
};

export default function AdminSettingsPage() {
    const [current, setCurrent] = useState<StoreSettings | null>(null);
    const [form, setForm] = useState<FormState>({
        shippingFlatRate: "",
        freeShippingThreshold: "",
        lowStockThreshold: "",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    async function load() {
        setLoading(true);
        try {
            const s = await getStoreSettings();
            setCurrent(s);
            setForm({
                shippingFlatRate: s.shippingFlatRate.toFixed(2),
                freeShippingThreshold: s.freeShippingThreshold.toFixed(2),
                lowStockThreshold: String(s.lowStockThreshold),
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

        const flat = Number(form.shippingFlatRate);
        const threshold = Number(form.freeShippingThreshold);
        const lowStock = Number(form.lowStockThreshold);

        if (Number.isNaN(flat) || flat < 0) {
            toast.error("Shipping flat rate must be a number ≥ 0");
            return;
        }
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
                shippingFlatRate: flat,
                freeShippingThreshold: threshold,
                lowStockThreshold: lowStock,
            });
            setCurrent(updated);
            setForm({
                shippingFlatRate: updated.shippingFlatRate.toFixed(2),
                freeShippingThreshold: updated.freeShippingThreshold.toFixed(2),
                lowStockThreshold: String(updated.lowStockThreshold),
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
                                Flat rate charged on every order whose
                                product subtotal is below the free-shipping
                                threshold. Set the threshold to 0 to disable
                                free shipping entirely.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="space-y-1">
                                <span className="text-sm font-medium">
                                    Flat rate (€)
                                </span>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    inputMode="decimal"
                                    value={form.shippingFlatRate}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            shippingFlatRate: e.target.value,
                                        }))
                                    }
                                    disabled={saving}
                                />
                                <span className="block text-xs text-muted-foreground">
                                    Typical: €3.00 – €4.50 for a Greek
                                    courier.
                                </span>
                            </label>

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
