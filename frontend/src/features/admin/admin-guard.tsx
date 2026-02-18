"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";

type AdminGuardProps = {
    children: React.ReactNode;
};

export function AdminGuard({ children }: AdminGuardProps) {
    const router = useRouter();
    const { role, loading } = useAuth();

    useEffect(() => {
        if (!loading && role !== "ADMIN") router.replace("/login");
    }, [loading, role, router]);

    if (loading) {
        return <p className="text-sm text-muted-foreground">Checking access...</p>;
    }

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

    return <>{children}</>;
}
