"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import type { Category } from "@/lib/api";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    currentQuery: string;
};

export function ProductsControls({
                                     currentSize,
                                     currentSort,
                                     currentCategoryId,
                                     categories,
                                     currentQuery,
                                 }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [query, setQuery] = useState(currentQuery);

    // Keep input in sync when URL changes (e.g., back/forward navigation)
    useEffect(() => {
        setQuery(currentQuery);
    }, [currentQuery]);

    function go(next: {
        page?: number;
        size?: number;
        sort?: string;
        categoryId?: number;
        q?: string;
    }) {
        const sp = new URLSearchParams(searchParams.toString());

        if (typeof next.page === "number") sp.set("page", String(next.page));
        if (typeof next.size === "number") sp.set("size", String(next.size));
        if (typeof next.sort === "string") sp.set("sort", next.sort);

        if (typeof next.categoryId === "number") {
            sp.set("categoryId", String(next.categoryId));
        }

        if (typeof next.q === "string") {
            const trimmed = next.q.trim();
            if (trimmed.length === 0) sp.delete("q");
            else sp.set("q", trimmed);
        }

        router.push(`/products?${sp.toString()}`);
    }

    function clearCategory() {
        const sp = new URLSearchParams(searchParams.toString());
        sp.delete("categoryId");
        sp.set("page", "0");
        router.push(`/products?${sp.toString()}`);
    }

    function clearSearch() {
        setQuery("");
        go({ page: 0, q: "" });
    }

    const activeCategory =
        typeof currentCategoryId === "number"
            ? categories.find((c) => c.id === currentCategoryId)
            : undefined;

    const hasSearch = currentQuery.trim().length > 0;

    return (
        <div className="flex flex-col gap-3">
            {/* Active chips */}
            {(activeCategory || hasSearch) && (
                <div className="flex flex-wrap items-center gap-2">
                    <div className="text-xs text-muted-foreground">Active filters:</div>

                    {activeCategory && (
                        <div className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm">
                            <span>{activeCategory.name}</span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={clearCategory}
                                aria-label="Clear category filter"
                                title="Clear category"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {hasSearch && (
                        <div className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm">
                            <span>“{currentQuery}”</span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={clearSearch}
                                aria-label="Clear search"
                                title="Clear search"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Search */}
            <form
                className="flex w-full items-end gap-2"
                onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                    e.preventDefault();
                    go({ page: 0, q: query });
                }}
            >
                <div className="w-full sm:w-80">
                    <div className="mb-1 text-xs text-muted-foreground">Search</div>
                    <Input
                        value={query}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                        placeholder="Search by title (e.g. Nike)"
                    />
                </div>

                <Button type="submit" variant="secondary">
                    Search
                </Button>

                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={clearSearch}
                    aria-label="Clear search input"
                    title="Clear"
                >
                    <X className="h-4 w-4" />
                </Button>
            </form>

            {/* Dropdowns */}
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