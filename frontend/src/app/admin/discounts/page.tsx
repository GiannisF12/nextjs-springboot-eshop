"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminGuard } from "@/features/admin/admin-guard";
import { AdminNav } from "@/features/admin/admin-nav";
import {
    type DiscountCode,
    createDiscountCode,
    deleteDiscountCode,
    getAdminDiscountCodes,
    updateDiscountCode,
} from "@/lib/api";

type FormState = {
    code: string;
    /** Percent as a string — parsed to number on submit. */
    percentOff: string;
    active: boolean;
};

const EMPTY_FORM: FormState = {
    code: "",
    percentOff: "10",
    active: true,
};

export default function AdminDiscountsPage() {
    const [codes, setCodes] = useState<DiscountCode[]>([]);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    async function loadData() {
        setLoading(true);
        setError(null);
        try {
            setCodes(await getAdminDiscountCodes());
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to load codes.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadData();
    }, []);

    function startCreate() {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setError(null);
        setSuccess(null);
    }

    function startEdit(code: DiscountCode) {
        setEditingId(code.id);
        setForm({
            code: code.code,
            percentOff: String(code.percentOff),
            active: code.active,
        });
        setError(null);
        setSuccess(null);
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        const percent = Number(form.percentOff);
        if (!form.code.trim()) {
            setError("Code is required.");
            return;
        }
        if (!Number.isInteger(percent) || percent < 1 || percent > 100) {
            setError("Percent off must be a whole number between 1 and 100.");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                code: form.code.trim(),
                percentOff: percent,
                active: form.active,
            };

            if (editingId === null) {
                await createDiscountCode(payload);
                setSuccess("Discount code created.");
            } else {
                await updateDiscountCode(editingId, payload);
                setSuccess("Discount code updated.");
            }

            await loadData();
            startCreate();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Save failed.");
        } finally {
            setSaving(false);
        }
    }

    async function onDelete(id: number) {
        if (!confirm("Delete this discount code? Orders that already used it keep their snapshot.")) {
            return;
        }
        setError(null);
        setSuccess(null);
        try {
            await deleteDiscountCode(id);
            setSuccess("Discount code deleted.");
            if (editingId === id) startCreate();
            await loadData();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Delete failed.");
        }
    }

    /**
     * Shortcut — toggle the active flag without opening the form.
     * Sends a full PUT (the simplest shape the backend accepts) with
     * the other fields preserved.
     */
    async function onToggleActive(code: DiscountCode) {
        setError(null);
        setSuccess(null);
        try {
            await updateDiscountCode(code.id, {
                code: code.code,
                percentOff: code.percentOff,
                active: !code.active,
            });
            await loadData();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Toggle failed.");
        }
    }

    return (
        <AdminGuard>
            <div className="space-y-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold">Discount Codes</h1>
                    <p className="text-sm text-muted-foreground">
                        Create promotional codes customers can apply at
                        checkout. Codes are case-insensitive — stored in
                        upper case.
                    </p>
                </div>

                <AdminNav />

                <div className="rounded-lg border p-4">
                    <h2 className="text-lg font-semibold">
                        {editingId === null ? "Create code" : `Edit code`}
                    </h2>
                    <form
                        className="mt-4 grid gap-3 md:grid-cols-3"
                        onSubmit={onSubmit}
                    >
                        <Input
                            placeholder="Code (e.g. SAVE10)"
                            value={form.code}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    code: e.target.value,
                                }))
                            }
                        />
                        <Input
                            placeholder="% off (1-100)"
                            type="number"
                            min="1"
                            max="100"
                            step="1"
                            value={form.percentOff}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    percentOff: e.target.value,
                                }))
                            }
                        />
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={form.active}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        active: e.target.checked,
                                    }))
                                }
                            />
                            Active (customers can use it)
                        </label>

                        <div className="flex gap-2 md:col-span-3">
                            <Button type="submit" disabled={saving}>
                                {saving
                                    ? "Saving..."
                                    : editingId === null
                                      ? "Create code"
                                      : "Update code"}
                            </Button>
                            {editingId !== null && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={startCreate}
                                >
                                    Cancel edit
                                </Button>
                            )}
                        </div>
                    </form>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}
                {success && <p className="text-sm text-green-700">{success}</p>}

                <div className="rounded-lg border">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                        <h2 className="text-lg font-semibold">
                            Codes{" "}
                            {codes.length > 0 && `(${codes.length})`}
                        </h2>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => void loadData()}
                        >
                            Refresh
                        </Button>
                    </div>

                    <div className="divide-y">
                        {loading ? (
                            <p className="px-4 py-4 text-sm text-muted-foreground">
                                Loading...
                            </p>
                        ) : codes.length === 0 ? (
                            <p className="px-4 py-4 text-sm text-muted-foreground">
                                No discount codes yet. Create one above.
                            </p>
                        ) : (
                            codes.map((c) => (
                                <div
                                    key={c.id}
                                    className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between"
                                >
                                    <div>
                                        <p className="font-mono text-lg font-semibold">
                                            {c.code}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {c.percentOff}% off &middot;
                                            created{" "}
                                            {new Date(
                                                c.createdAt
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span
                                            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                c.active
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-gray-100 text-gray-700"
                                            }`}
                                        >
                                            {c.active ? "ACTIVE" : "INACTIVE"}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => void onToggleActive(c)}
                                        >
                                            {c.active ? "Disable" : "Enable"}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => startEdit(c)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            onClick={() => void onDelete(c.id)}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AdminGuard>
    );
}
