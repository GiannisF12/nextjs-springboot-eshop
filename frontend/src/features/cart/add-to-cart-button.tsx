"use client";

import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-store";
import type { Product } from "@/lib/api";
import { useState } from "react";

export function AddToCartButton({ product }: { product: Product }) {
    const add = useCart((s) => s.add);
    const [added, setAdded] = useState(false);

    return (
        <Button
            type="button"
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();

                add({
                    id: product.id,
                    title: product.title,
                    price: product.price,
                    image: product.image,
                    category: product.category,
                    qty: 1,
                });

                setAdded(true);
                setTimeout(() => setAdded(false), 800);
            }}
        >
            {added ? "Added ✓" : "Add to cart"}
        </Button>
    );
}