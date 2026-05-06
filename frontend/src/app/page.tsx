import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/features/products/product-card";
import { getCategories, getProducts } from "@/lib/api";
import { ShoppingBag, ArrowRight } from "lucide-react";

export default async function Home() {
    const [categories, productsPage] = await Promise.all([
        getCategories(),
        getProducts(0, 4, "id,desc"),
    ]);

    const featuredProducts = productsPage.content;

    return (
        <div className="space-y-16">

            {/* Hero */}
            <section className="relative overflow-hidden rounded-2xl bg-foreground px-8 py-24 text-center">
                {/* Subtle radial glow */}
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(ellipse 80% 60% at 50% 0%, oklch(0.4 0.08 265 / 0.35), transparent 70%)",
                    }}
                />

                <div className="relative z-10 flex flex-col items-center">
                    {/* Pill label */}
                    <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-white/50">
                        <ShoppingBag className="h-3 w-3" />
                        New arrivals in stock
                    </span>

                    <h1 className="max-w-2xl text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
                        Style that fits{" "}
                        <span className="text-white/30">every moment.</span>
                    </h1>

                    <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-white/50">
                        Quality clothing and footwear at honest prices. Browse our
                        full catalog and find exactly what you need.
                    </p>

                    <div className="mt-10 flex flex-wrap justify-center gap-3">
                        <Button asChild size="lg" variant="secondary">
                            <Link href="/products">Shop Now</Link>
                        </Button>
                        <Button
                            asChild
                            size="lg"
                            variant="ghost"
                            className="border border-white/10 text-white/70 hover:bg-white/5 hover:text-white"
                        >
                            <Link href="/products">View all products</Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Categories */}
            {categories.length > 0 && (
                <section>
                    <div className="mb-6 flex items-end justify-between">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                                Browse
                            </p>
                            <h2 className="text-2xl font-semibold">Shop by Category</h2>
                        </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {categories.map((cat) => (
                            <Link
                                key={cat.id}
                                href={`/products?categoryId=${cat.id}`}
                                className="group flex items-center justify-between rounded-xl border bg-card px-5 py-4 transition-colors hover:bg-muted/60"
                            >
                                <span className="font-medium">{cat.name}</span>
                                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Featured Products */}
            {featuredProducts.length > 0 && (
                <section>
                    <div className="mb-6 flex items-end justify-between">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                                Just in
                            </p>
                            <h2 className="text-2xl font-semibold">Latest Products</h2>
                        </div>
                        <Button asChild variant="ghost" size="sm">
                            <Link href="/products" className="gap-1">
                                View all <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {featuredProducts.map((p) => (
                            <ProductCard key={p.id} {...p} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
