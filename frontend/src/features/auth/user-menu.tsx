"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserRound, Package, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";

function getInitials(name: string | null | undefined, email: string) {
    if (name && name.trim().length > 0) {
        const parts = name.trim().split(/\s+/);
        const first = parts[0]?.[0] ?? "";
        const second = parts[1]?.[0] ?? "";
        return (first + second).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
}

export function UserMenu() {
    const router = useRouter();
    const { user, role, logout } = useAuth();
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on outside click or Escape key.
    useEffect(() => {
        if (!open) return;

        function onClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }

        document.addEventListener("mousedown", onClickOutside);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onClickOutside);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    if (!user) return null;

    const initials = getInitials(user.name, user.email);

    async function handleLogout() {
        setOpen(false);
        await logout();
        router.push("/");
    }

    return (
        <div ref={menuRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label="Account menu"
                aria-expanded={open}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/25 to-primary/5 text-sm font-semibold text-primary ring-2 ring-primary/20 transition-transform hover:scale-105"
            >
                {initials}
            </button>

            {open && (
                <div
                    role="menu"
                    className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg"
                >
                    <div className="border-b px-3 py-2">
                        <p className="truncate text-sm font-medium">
                            {user.name || "No username set"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                            {user.email}
                        </p>
                    </div>

                    <div className="py-1">
                        <MenuLink
                            href="/account"
                            icon={UserRound}
                            label="My Account"
                            onClick={() => setOpen(false)}
                        />
                        <MenuLink
                            href="/account/orders"
                            icon={Package}
                            label="My Orders"
                            onClick={() => setOpen(false)}
                        />
                    </div>

                    {role === "ADMIN" && (
                        <div className="border-t py-1">
                            <MenuLink
                                href="/admin"
                                icon={LayoutDashboard}
                                label="Admin Panel"
                                onClick={() => setOpen(false)}
                            />
                        </div>
                    )}

                    <div className="border-t py-1">
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-accent"
                            role="menuitem"
                        >
                            <LogOut className="h-4 w-4" />
                            Log out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function MenuLink({
    href,
    icon: Icon,
    label,
    onClick,
}: {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    onClick: () => void;
}) {
    return (
        <Link
            href={href}
            onClick={onClick}
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
        >
            <Icon className="h-4 w-4" />
            {label}
        </Link>
    );
}
