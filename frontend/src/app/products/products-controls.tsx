"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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
};

export function ProductsControls({ currentSize, currentSort }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();

    function go(next: { page?: number; size?: number; sort?: string }) {
        const sp = new URLSearchParams(searchParams.toString());

        // Always keep paging valid
        if (typeof next.page === "number") sp.set("page", String(next.page));
        if (typeof next.size === "number") sp.set("size", String(next.size));
        if (typeof next.sort === "string") sp.set("sort", next.sort);

        router.push(`/products?${sp.toString()}`);
    }

    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="w-full sm:w-56">
                <div className="mb-1 text-xs text-muted-foreground">Sort</div>
                <Select
                    value={currentSort}
                    onValueChange={(v) => go({ page: 0, sort: v })}
                >
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
    );
}