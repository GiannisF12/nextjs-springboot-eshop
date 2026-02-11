"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
    const router = useRouter();
    const { role } = useAuth();

    useEffect(() => {
        if (role !== "ADMIN") router.replace("/login");
    }, [role, router]);

    if (role !== "ADMIN") {
        return (
            <div className="space-y-3">
                <h1 className="text-2xl font-semibold">Not authorized</h1>
                <p className="text-sm text-muted-foreground">
                    You must be an admin to view this page.
                </p>
                <Button asChild variant="secondary">
                    <Link href="/login">Go to login</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">You are an admin ✅</p>
        </div>
    );
}