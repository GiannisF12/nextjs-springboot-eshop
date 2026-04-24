"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

const links = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/products", label: "Products" },
    { href: "/admin/categories", label: "Categories" },
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/discounts", label: "Discounts" },
];

export function AdminNav() {
    const pathname = usePathname();

    return (
        <div className="flex flex-wrap gap-2">
            {links.map((link) => {
                const active = pathname === link.href;

                return (
                    <Button key={link.href} asChild variant={active ? "default" : "outline"}>
                        <Link href={link.href}>{link.label}</Link>
                    </Button>
                );
            })}
        </div>
    );
}
