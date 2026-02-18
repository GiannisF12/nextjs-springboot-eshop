import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminGuard } from "@/features/admin/admin-guard";
import { AdminNav } from "@/features/admin/admin-nav";

export default function AdminPage() {
    return (
        <AdminGuard>
            <div className="space-y-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage catalog and orders.
                    </p>
                </div>

                <AdminNav />

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Products</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                Create, edit, and delete products.
                            </p>
                            <Button asChild>
                                <Link href="/admin/products">Open products</Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Orders</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                Track and update order status.
                            </p>
                            <Button asChild variant="outline">
                                <Link href="/admin/orders">Open orders</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminGuard>
    );
}
