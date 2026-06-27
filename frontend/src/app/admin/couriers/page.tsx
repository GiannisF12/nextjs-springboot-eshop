"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminGuard } from "@/features/admin/admin-guard";
import { AdminNav } from "@/features/admin/admin-nav";
import {
    type Courier,
    getAdminCouriers,
    updateCourier,
} from "@/lib/api";

/** Per-row editable state — price kept as a string so the input can be
 *  empty mid-typing without NaN warnings. */
type RowState = { price: string; enabled: boolean };

export default function AdminCouriersPage() {
    const [couriers, setCouriers] = useState<Courier[]>([]);
    const [rows, setRows] = useState<Record<number, RowState>>({});
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<number | null>(null);

    async function load() {
        setLoading(true);
        try {
            const list = await getAdminCouriers();
            setCouriers(list);
            setRows(
                Object.fromEntries(
                    list.map((c) => [
                        c.id,
                        { price: c.price.toFixed(2), enabled: c.enabled },
                    ])
                )
            );
        } catch (e: unknown) {
            toast.error(
                e instanceof Error ? e.message : "Failed to load couriers"
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
    }, []);

    async function save(id: number) {
        const row = rows[id];
        if (!row) return;

        const price = Number(row.price);
        if (Number.isNaN(price) || price < 0) {
            toast.error("Price must be a number ≥ 0");
            return;
        }

        setSavingId(id);
        try {
            const updated = await updateCourier(id, {
                price,
                enabled: row.enabled,
            });
            setCouriers((cs) =>
                cs.map((c) => (c.id === id ? updated : c))
            );
            setRows((r) => ({
                ...r,
                [id]: {
                    price: updated.price.toFixed(2),
                    enabled: updated.enabled,
                },
            }));
            toast.success(`${updated.name} saved`);
        } catch (e: unknown) {
            // Backend returns 409 when disabling the last enabled courier.
            toast.error(
                e instanceof Error ? e.message : "Failed to save courier"
            );
            // Revert only THIS row to its last-saved server value, so any
            // unsaved edits the admin has in other rows aren't wiped.
            const original = couriers.find((c) => c.id === id);
            if (original) {
                setRows((r) => ({
                    ...r,
                    [id]: {
                        price: original.price.toFixed(2),
                        enabled: original.enabled,
                    },
                }));
            }
        } finally {
            setSavingId(null);
        }
    }

    return (
        <AdminGuard>
            <div className="space-y-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold">Couriers</h1>
                    <p className="text-sm text-muted-foreground">
                        Set each courier&apos;s delivery price and turn it on
                        or off. At least one courier must stay enabled. The
                        free-shipping threshold (Settings) still applies on
                        top of these prices.
                    </p>
                </div>

                <AdminNav />

                {loading ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                ) : (
                    <div className="max-w-xl space-y-3">
                        {couriers.map((c) => {
                            const row = rows[c.id];
                            const saving = savingId === c.id;
                            return (
                                <div
                                    key={c.id}
                                    className="flex flex-wrap items-center gap-3 rounded-xl border p-4"
                                >
                                    <div className="min-w-[10rem] flex-1 font-medium">
                                        {c.name}
                                    </div>

                                    <label className="flex items-center gap-1 text-sm">
                                        <span className="text-muted-foreground">
                                            €
                                        </span>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            inputMode="decimal"
                                            className="w-24"
                                            value={row?.price ?? ""}
                                            onChange={(e) =>
                                                setRows((r) => ({
                                                    ...r,
                                                    [c.id]: {
                                                        ...r[c.id],
                                                        price: e.target.value,
                                                    },
                                                }))
                                            }
                                            disabled={saving}
                                        />
                                    </label>

                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={row?.enabled ?? false}
                                            onChange={(e) =>
                                                setRows((r) => ({
                                                    ...r,
                                                    [c.id]: {
                                                        ...r[c.id],
                                                        enabled:
                                                            e.target.checked,
                                                    },
                                                }))
                                            }
                                            disabled={saving}
                                        />
                                        Enabled
                                    </label>

                                    <Button
                                        onClick={() => void save(c.id)}
                                        disabled={saving}
                                    >
                                        {saving ? "Saving..." : "Save"}
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AdminGuard>
    );
}
