import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getProduct } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {AddToCartButton} from "@/features/cart/add-to-cart-button";

type Props = {
    params: Promise<{ id: string }>;
    searchParams?: Promise<{
        page?: string;
        size?: string;
        sort?: string;
        categoryId?: string;
        q?: string;
    }>;
};

function buildBackHref(sp: {
    page?: string;
    size?: string;
    sort?: string;
    categoryId?: string;
    q?: string;
}) {
    const params = new URLSearchParams();

    if (sp.page) params.set("page", sp.page);
    if (sp.size) params.set("size", sp.size);
    if (sp.sort) params.set("sort", sp.sort);
    if (sp.categoryId) params.set("categoryId", sp.categoryId);
    if (sp.q) params.set("q", sp.q);

    const qs = params.toString();
    return qs ? `/products?${qs}` : "/products";
}

export default async function ProductDetailsPage({ params, searchParams }: Props) {
    const { id } = await params;
    const sp = (await searchParams) ?? {};
    const backHref = buildBackHref(sp);

    const product = await getProduct(id);

    if (!product) {
        return (
            <div className="space-y-4">
                <h1 className="text-2xl font-semibold">Product not found</h1>
                <Button asChild variant="secondary">
                    <Link href={backHref}>Back to products</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Button asChild variant="secondary">
                <Link href={backHref}>← Back to products</Link>
            </Button>

            <div className="grid gap-8 lg:grid-cols-2">
                <div className="aspect-square overflow-hidden rounded-xl bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={product.image}
                        alt={product.title}
                        className="h-full w-full object-cover"
                    />
                </div>

                <div className="space-y-4">
                    <div>
                        <h1 className="text-3xl font-semibold">{product.title}</h1>
                        <div className="mt-2">
                            <Badge variant="secondary">{product.category}</Badge>
                        </div>
                    </div>

                    <div className="text-2xl font-semibold">€{Number(product.price).toFixed(2)}</div>

                    <div className="flex gap-2">
                        <AddToCartButton product={product} />
                    </div>
                </div>
            </div>
        </div>
    );
}