import { getProducts } from "@/lib/api";
import { ProductCard } from "@/features/products/product-card";

export default async function ProductsPage() {
    const products = await getProducts();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Products</h1>
                <p className="text-sm text-muted-foreground">
                    Loaded from Spring Boot API.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {products.map((p) => (
                    <ProductCard key={p.id} {...p} />
                ))}
            </div>
        </div>
    );
}