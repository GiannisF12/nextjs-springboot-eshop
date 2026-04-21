"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminGuard } from "@/features/admin/admin-guard";
import { AdminNav } from "@/features/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import {
    type AdminUser,
    getAdminUser,
    setAdminUserBanned,
} from "@/lib/api";

const GENDER_LABELS: Record<string, string> = {
    MALE: "Male",
    FEMALE: "Female",
    OTHER: "Other",
    PREFER_NOT_TO_SAY: "Prefer not to say",
};

export default function AdminUserDetailPage() {
    const params = useParams<{ id: string }>();
    const id = Number(params.id);
    const { user: currentAdmin } = useAuth();

    const [user, setUser] = useState<AdminUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [toggling, setToggling] = useState(false);

    const isSelf =
        !!currentAdmin && !!user && currentAdmin.email === user.email;
    const isAdmin = user?.role === "ADMIN";

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

    async function handleToggleBan() {
        if (!user) return;
        const nextBanned = !user.banned;

        const ok = window.confirm(
            nextBanned
                ? `Ban ${user.name || user.email}? They will no longer be able to log in. Their orders and data are preserved.`
                : `Unban ${user.name || user.email}? They will be able to log in again.`
        );
        if (!ok) return;

        setToggling(true);
        setError(null);
        try {
            const updated = await setAdminUserBanned(user.id, nextBanned);
            setUser(updated);
        } catch (e: unknown) {
            setError(
                e instanceof Error ? e.message : "Failed to update ban status."
            );
        } finally {
            setToggling(false);
        }
    }

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
                                <Row
                                    label="Status"
                                    value={user.banned ? "Banned" : "Active"}
                                />
                            </dl>
                        </div>

                        <div className="rounded-lg border md:col-span-2">
                            <div className="border-b px-4 py-3">
                                <h2 className="text-lg font-semibold">
                                    Account actions
                                </h2>
                            </div>
                            <div className="space-y-3 px-4 py-4">
                                {isAdmin ? (
                                    <p className="text-sm text-muted-foreground">
                                        Admins cannot be banned.
                                    </p>
                                ) : isSelf ? (
                                    <p className="text-sm text-muted-foreground">
                                        You cannot ban your own account.
                                    </p>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <Button
                                            type="button"
                                            variant={user.banned ? "default" : "destructive"}
                                            className={
                                                user.banned
                                                    ? "bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500/30"
                                                    : undefined
                                            }
                                            onClick={() => void handleToggleBan()}
                                            disabled={toggling}
                                        >
                                            {toggling
                                                ? "Saving..."
                                                : user.banned
                                                  ? "Unban user"
                                                  : "Ban user"}
                                        </Button>
                                        <p className="text-sm text-muted-foreground">
                                            {user.banned
                                                ? "This user cannot log in. Unbanning will restore access."
                                                : "Banning prevents login but keeps their orders and history intact."}
                                        </p>
                                    </div>
                                )}
                            </div>
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
