"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Category } from "@/lib/api";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const SORT_OPTIONS: { value: string; label: string }[] = [
    { value: "id,asc", label: "Newest (id ↑)" },
    { value: "id,desc", label: "Oldest (id ↓)" },
    { value: "title,asc", label: "Title (A → Z)" },
    { value: "title,desc", label: "Title (Z → A)" },
    { value: "price,asc", label: "Price (low → high)" },
    { value: "price,desc", label: "Price (high → low)" },
];

const SIZE_OPTIONS = [12, 24, 48];

type Props = {
    currentSize: number;
    currentSort: string;
    currentCategoryId?: number;
    categories: Category[];
};

export function ProductsControls({
                                     currentSize,
                                     currentSort,
                                     currentCategoryId,
                                     categories,
                                 }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();

    function go(next: { page?: number; size?: number; sort?: string; categoryId?: number }) {
        const sp = new URLSearchParams(searchParams.toString());

        if (typeof next.page === "number") sp.set("page", String(next.page));
        if (typeof next.size === "number") sp.set("size", String(next.size));
        if (typeof next.sort === "string") sp.set("sort", next.sort);

        if (typeof next.categoryId === "number") {
            sp.set("categoryId", String(next.categoryId));
        }

        router.push(`/products?${sp.toString()}`);
    }

    function clearCategory() {
        const sp = new URLSearchParams(searchParams.toString());
        sp.delete("categoryId");
        sp.set("page", "0");
        router.push(`/products?${sp.toString()}`);
    }

    const activeCategory =
        typeof currentCategoryId === "number"
            ? categories.find((c) => c.id === currentCategoryId)
            : undefined;

    return (
        <div className="flex flex-col gap-2">
            {/* Active category chip */}
            {activeCategory && (
                <div className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground">Active filter:</div>

                    <div className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm">
                        <span>{activeCategory.name}</span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={clearCategory}
                            aria-label="Clear category filter"
                            title="Clear"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Controls row */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {/* Category */}
                <div className="w-full sm:w-56">
                    <div className="mb-1 text-xs text-muted-foreground">Category</div>
                    <Select
                        value={currentCategoryId ? String(currentCategoryId) : "all"}
                        onValueChange={(v) => {
                            if (v === "all") return clearCategory();
                            go({ page: 0, categoryId: Number(v) });
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All categories</SelectItem>
                            {categories.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>
                                    {c.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Sort */}
                <div className="w-full sm:w-56">
                    <div className="mb-1 text-xs text-muted-foreground">Sort</div>
                    <Select value={currentSort} onValueChange={(v) => go({ page: 0, sort: v })}>
                        <SelectTrigger>
                            <SelectValue placeholder="Sort" />
                        </SelectTrigger>
                        <SelectContent>
                            {SORT_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                    {o.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Page size */}
                <div className="w-full sm:w-40">
                    <div className="mb-1 text-xs text-muted-foreground">Page size</div>
                    <Select
                        value={String(currentSize)}
                        onValueChange={(v) => go({ page: 0, size: Number(v) })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Size" />
                        </SelectTrigger>
                        <SelectContent>
                            {SIZE_OPTIONS.map((s) => (
                                <SelectItem key={s} value={String(s)}>
                                    {s} / page
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}