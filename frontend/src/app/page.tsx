import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProductCard } from "@/features/products/product-card";
import { getCategories, getProducts } from "@/lib/api";

export default async function Home() {
    const [categories, productsPage] = await Promise.all([
        getCategories(),
        getProducts(0, 4, "id,desc"),
    ]);

    const featuredProducts = productsPage.content;

    return (
        <div className="space-y-12">
            {/* Hero */}
            <section className="rounded-xl bg-muted/50 px-6 py-16 text-center">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                    Welcome to E-Shop
                </h1>
                <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
                    Discover quality products at great prices. Browse our catalog
                    and find exactly what you need.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                    <Button asChild size="lg">
                        <Link href="/products">Shop Now</Link>
                    </Button>
                </div>
            </section>

            {/* Categories */}
            {categories.length > 0 && (
                <section>
                    <h2 className="text-2xl font-semibold">Shop by Category</h2>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {categories.map((cat) => (
                            <Link key={cat.id} href={`/products?categoryId=${cat.id}`}>
                                <Card className="transition-colors hover:bg-muted/50">
                                    <CardContent className="flex items-center justify-between p-5">
                                        <span className="text-lg font-medium">
                                            {cat.name}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            Browse &rarr;
                                        </span>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Featured Products */}
            {featuredProducts.length > 0 && (
                <section>
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-semibold">Latest Products</h2>
                        <Button asChild variant="ghost">
                            <Link href="/products">View all &rarr;</Link>
                        </Button>
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {featuredProducts.map((p) => (
                            <ProductCard key={p.id} {...p} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
