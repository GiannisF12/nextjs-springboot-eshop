"use client";

import Link from "next/link";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import { UserRound, ShieldCheck, MapPin, Package } from "lucide-react";

function getInitials(name: string | null | undefined, email: string) {
    if (name && name.trim().length > 0) {
        const parts = name.trim().split(/\s+/);
        const first = parts[0]?.[0] ?? "";
        const second = parts[1]?.[0] ?? "";
        return (first + second).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
}

export default function AccountOverviewPage() {
    const { user } = useAuth();
    if (!user) return null; // layout handles loading/redirect

    const initials = getInitials(user.name, user.email);

    return (
        <div className="space-y-6">
            {/* Profile summary card */}
            <Card>
                <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-2xl font-semibold text-primary ring-2 ring-primary/10">
                        {initials}
                    </div>
                    <div className="flex-1 space-y-1">
                        <p className="text-lg font-semibold">
                            {user.name || "No username set"}
                        </p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                            Role: <span className="font-medium">{user.role}</span>
                        </p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href="/account/profile">Edit profile</Link>
                    </Button>
                </CardContent>
            </Card>

            {/* Quick action grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <QuickLinkCard
                    href="/account/profile"
                    icon={UserRound}
                    title="Profile"
                    description="Update your username and email"
                />
                <QuickLinkCard
                    href="/account/security"
                    icon={ShieldCheck}
                    title="Security"
                    description="Change your password"
                />
                <QuickLinkCard
                    href="/account/addresses"
                    icon={MapPin}
                    title="Addresses"
                    description="Manage shipping addresses"
                />
                <QuickLinkCard
                    href="/account/orders"
                    icon={Package}
                    title="Orders"
                    description="View your order history"
                />
            </div>
        </div>
    );
}

function QuickLinkCard({
    href,
    icon: Icon,
    title,
    description,
}: {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
}) {
    return (
        <Link href={href} className="group">
            <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md">
                <CardHeader>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                        <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="mt-3 text-base">{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
            </Card>
        </Link>
    );
}
