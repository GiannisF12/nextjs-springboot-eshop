"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    UserRound,
    ShieldCheck,
    MapPin,
    Package,
} from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils";

type NavItem = {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
    { href: "/account", label: "Overview", icon: LayoutDashboard },
    { href: "/account/profile", label: "Profile", icon: UserRound },
    { href: "/account/security", label: "Security", icon: ShieldCheck },
    { href: "/account/addresses", label: "Addresses", icon: MapPin },
    { href: "/account/orders", label: "Orders", icon: Package },
];

export default function AccountLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, loading } = useAuth();

    // Centralized auth guard for the whole /account area.
    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return <p className="text-sm text-muted-foreground">Loading...</p>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">My Account</h1>
                <p className="text-sm text-muted-foreground">
                    Welcome back, {user.name || user.email}.
                </p>
            </div>

            {/* Sub-navbar */}
            <div className="sticky top-0 z-10 -mx-4 border-b bg-background/80 px-4 backdrop-blur">
                <nav className="flex gap-1 overflow-x-auto">
                    {NAV_ITEMS.map((item) => {
                        const active =
                            item.href === "/account"
                                ? pathname === "/account"
                                : pathname.startsWith(item.href);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors",
                                    active
                                        ? "border-primary text-foreground"
                                        : "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Page content */}
            <div>{children}</div>
        </div>
    );
}
