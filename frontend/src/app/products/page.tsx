import { mockProducts } from "@/features/products/products.mock";
import { ProductCard } from "@/features/products/product-card";

export default function ProductsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Products</h1>
                <p className="text-sm text-muted-foreground">
                    Mock products for now — will be served from Spring Boot later.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {mockProducts.map((p) => (
                    <ProductCard key={p.id} {...p} />
                ))}
            </div>
        </div>
    );
}