import { mockProducts } from "@/features/products/products.mock";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Props = {
    params: { id: string };
};

export default function ProductDetailsPage({ params }: Props) {
    const product = mockProducts.find((p) => p.id === params.id);

    if (!product) {
        return (
            <div className="space-y-4">
                <h1 className="text-2xl font-semibold">Product not found</h1>
                <Button asChild variant="secondary">
                    <Link href="/products">Back to products</Link>
                </Button>
            </div>
        );
    }

    return (
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
                    <p className="mt-1 text-muted-foreground">{product.category}</p>
                </div>

                <div className="text-2xl font-semibold">€{product.price.toFixed(2)}</div>

                <div className="flex gap-2">
                    <Button>Add to cart</Button>
                    <Button asChild variant="secondary">
                        <Link href="/products">Back</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}