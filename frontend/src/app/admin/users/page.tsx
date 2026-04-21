"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminGuard } from "@/features/admin/admin-guard";
import { AdminNav } from "@/features/admin/admin-nav";
import { type AdminUser, getAdminUsers } from "@/lib/api";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                setUsers(await getAdminUsers());
            } catch (e: unknown) {
                setError(e instanceof Error ? e.message : "Failed to load users.");
            } finally {
                setLoading(false);
            }
        }
        void load();
    }, []);

    return (
        <AdminGuard>
            <div className="space-y-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold">Admin Users</h1>
                    <p className="text-sm text-muted-foreground">
                        View all registered users.
                    </p>
                </div>

                <AdminNav />

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="rounded-lg border">
                    <div className="border-b px-4 py-3">
                        <h2 className="text-lg font-semibold">
                            Users {users.length > 0 && `(${users.length})`}
                        </h2>
                    </div>

                    <div className="divide-y">
                        {loading ? (
                            <p className="px-4 py-4 text-sm text-muted-foreground">
                                Loading...
                            </p>
                        ) : users.length === 0 ? (
                            <p className="px-4 py-4 text-sm text-muted-foreground">
                                No users yet.
                            </p>
                        ) : (
                            users.map((u) => (
                                <Link
                                    key={u.id}
                                    href={`/admin/users/${u.id}`}
                                    className="flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-muted/50 md:flex-row md:items-center md:justify-between"
                                >
                                    <div>
                                        <p className="font-medium">
                                            {u.name || "—"}{" "}
                                            <span className="text-sm font-normal text-muted-foreground">
                                                &middot; {u.email}
                                            </span>
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            #{u.id} &middot; {u.ordersCount}{" "}
                                            {u.ordersCount === 1 ? "order" : "orders"}{" "}
                                            &middot; ${Number(u.totalSpent).toFixed(2)} spent
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {u.banned && (
                                            <span className="inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                                BANNED
                                            </span>
                                        )}
                                        <span
                                            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                u.role === "ADMIN"
                                                    ? "bg-purple-100 text-purple-800"
                                                    : "bg-gray-100 text-gray-800"
                                            }`}
                                        >
                                            {u.role}
                                        </span>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AdminGuard>
    );
}
