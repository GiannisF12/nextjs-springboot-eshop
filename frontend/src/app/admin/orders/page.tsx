"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminGuard } from "@/features/admin/admin-guard";
import { AdminNav } from "@/features/admin/admin-nav";

export default function AdminOrdersPage() {
    return (
        <AdminGuard>
            <div className="space-y-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold">Admin Orders</h1>
                    <p className="text-sm text-muted-foreground">
                        Orders management will be implemented next.
                    </p>
                </div>

                <AdminNav />

                <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">
                        Next step: list all orders and update statuses.
                    </p>
                    <div className="mt-3">
                        <Button asChild variant="outline">
                            <Link href="/admin/products">Go to products</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </AdminGuard>
    );
}
