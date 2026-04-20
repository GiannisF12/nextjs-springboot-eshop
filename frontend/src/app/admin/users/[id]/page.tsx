"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminGuard } from "@/features/admin/admin-guard";
import { AdminNav } from "@/features/admin/admin-nav";
import { type AdminUser, getAdminUser } from "@/lib/api";

const GENDER_LABELS: Record<string, string> = {
    MALE: "Male",
    FEMALE: "Female",
    OTHER: "Other",
    PREFER_NOT_TO_SAY: "Prefer not to say",
};

export default function AdminUserDetailPage() {
    const params = useParams<{ id: string }>();
    const id = Number(params.id);

    const [user, setUser] = useState<AdminUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!Number.isFinite(id)) {
            setError("Invalid user id.");
            setLoading(false);
            return;
        }
        async function load() {
            try {
                setUser(await getAdminUser(id));
            } catch (e: unknown) {
                setError(e instanceof Error ? e.message : "Failed to load user.");
            } finally {
                setLoading(false);
            }
        }
        void load();
    }, [id]);

    return (
        <AdminGuard>
            <div className="space-y-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold">User Details</h1>
                    <Link
                        href="/admin/users"
                        className="text-sm text-muted-foreground hover:underline"
                    >
                        ← Back to users
                    </Link>
                </div>

                <AdminNav />

                {error && <p className="text-sm text-red-600">{error}</p>}

                {loading ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                ) : user ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-lg border">
                            <div className="border-b px-4 py-3">
                                <h2 className="text-lg font-semibold">Profile</h2>
                            </div>
                            <dl className="divide-y text-sm">
                                <Row label="ID" value={`#${user.id}`} />
                                <Row label="Name" value={user.name || "—"} />
                                <Row label="Email" value={user.email} />
                                <Row label="Role" value={user.role} />
                                <Row
                                    label="Gender"
                                    value={
                                        user.gender
                                            ? GENDER_LABELS[user.gender] ?? user.gender
                                            : "—"
                                    }
                                />
                                <Row
                                    label="Birthday"
                                    value={
                                        user.birthday
                                            ? new Date(user.birthday).toLocaleDateString()
                                            : "—"
                                    }
                                />
                            </dl>
                        </div>

                        <div className="rounded-lg border">
                            <div className="border-b px-4 py-3">
                                <h2 className="text-lg font-semibold">Activity</h2>
                            </div>
                            <dl className="divide-y text-sm">
                                <Row
                                    label="Total orders"
                                    value={String(user.ordersCount)}
                                />
                                <Row
                                    label="Total spent"
                                    value={`$${Number(user.totalSpent).toFixed(2)}`}
                                />
                            </dl>
                        </div>
                    </div>
                ) : null}
            </div>
        </AdminGuard>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium">{value}</dd>
        </div>
    );
}
