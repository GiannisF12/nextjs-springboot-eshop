import Link from "next/link";
import { ProductCard } from "@/features/products/product-card";
import { Button } from "@/components/ui/button";
import { ProductsControls } from "./products-controls";
import { getCategories, getProducts } from "@/lib/api";

type SP = {
    page?: string;
    size?: string;
    sort?: string;
    categoryId?: string;
    q?: string;
};

type Props = {
    searchParams?: Promise<SP>;
};

function clamp(n: number, min: number, max: number) {
    return Math.min(max, Math.max(min, n));
}

function buildHref(
    page: number,
    size: number,
    sort: string,
    categoryId?: number,
    q?: string
) {
    const sp = new URLSearchParams({
        page: String(page),
        size: String(size),
        sort,
    });

    if (typeof categoryId === "number") sp.set("categoryId", String(categoryId));
    if (q && q.trim().length > 0) sp.set("q", q.trim());

    return `/products?${sp.toString()}`;
}

function pageRange(current: number, totalPages: number, windowSize = 5) {
    if (totalPages <= 0) return [];
    const half = Math.floor(windowSize / 2);

    let start = Math.max(0, current - half);
    const end = Math.min(totalPages - 1, start + windowSize - 1);
    start = Math.max(0, end - windowSize + 1);

    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
}

export default async function ProductsPage({ searchParams }: Props) {
    const sp = (await searchParams) ?? {};

    const size = clamp(Number(sp.size ?? "12") || 12, 1, 48);
    const sort = (sp.sort ?? "id,asc").toString();
    const requestedPage = Math.max(0, Number(sp.page ?? "0") || 0);

    const categoryIdRaw = sp.categoryId;
    const categoryId =
        categoryIdRaw && !Number.isNaN(Number(categoryIdRaw))
            ? Number(categoryIdRaw)
            : undefined;

    const q = (sp.q ?? "").toString().trim();

    const [data, categories] = await Promise.all([
        getProducts(requestedPage, size, sort, categoryId, q),
        getCategories(),
    ]);

    const current = clamp(data.number, 0, Math.max(0, data.totalPages - 1));
    const canPrev = current > 0;
    const canNext = current + 1 < data.totalPages;

    const pages = pageRange(current, data.totalPages, 5);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Products</h1>
                    <p className="text-sm text-muted-foreground">
                        Loaded from Spring Boot API. ({data.totalElements} total)
                    </p>
                </div>

                <ProductsControls
                    currentSize={size}
                    currentSort={sort}
                    currentCategoryId={categoryId}
                    categories={categories}
                    currentQuery={q}
                />
            </div>

            {data.content.length === 0 ? (
                <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
                    No products found.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {data.content.map((p) => (
                        <ProductCard key={p.id} {...p} />
                    ))}
                </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                    Page {current + 1} of {data.totalPages}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button asChild variant="secondary" disabled={!canPrev}>
                        <Link
                            href={buildHref(current - 1, size, sort, categoryId, q)}
                            aria-disabled={!canPrev}
                            tabIndex={!canPrev ? -1 : 0}
                        >
                            Prev
                        </Link>
                    </Button>

                    {current > 2 && data.totalPages > 5 && (
                        <>
                            <Button asChild variant="outline" size="sm">
                                <Link href={buildHref(0, size, sort, categoryId, q)}>1</Link>
                            </Button>
                            <span className="px-1 text-muted-foreground">…</span>
                        </>
                    )}

                    {pages.map((p) => {
                        const isActive = p === current;
                        return (
                            <Button
                                key={p}
                                asChild
                                variant={isActive ? "default" : "outline"}
                                size="sm"
                            >
                                <Link href={buildHref(p, size, sort, categoryId, q)}>{p + 1}</Link>
                            </Button>
                        );
                    })}

                    {current < data.totalPages - 3 && data.totalPages > 5 && (
                        <>
                            <span className="px-1 text-muted-foreground">…</span>
                            <Button asChild variant="outline" size="sm">
                                <Link href={buildHref(data.totalPages - 1, size, sort, categoryId, q)}>
                                    {data.totalPages}
                                </Link>
                            </Button>
                        </>
                    )}

                    <Button asChild variant="secondary" disabled={!canNext}>
                        <Link
                            href={buildHref(current + 1, size, sort, categoryId, q)}
                            aria-disabled={!canNext}
                            tabIndex={!canNext ? -1 : 0}
                        >
                            Next
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}