"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-store";
import type { Product } from "@/lib/api";

/**
 * Size-aware "add to cart" panel shown on the product detail page.
 *
 * The customer MUST pick a size before we let them add to cart, because
 * the backend stores stock per-variant and will reject an order without
 * a size. Sold-out sizes are shown but disabled so the customer can see
 * at a glance what exists.
 *
 * The customer can also pick a quantity with +/- before adding. We cap
 * the + button at whatever stock is left after subtracting what's
 * already in their cart, so the cart never holds more than the variant
 * actually has — preventing a 409-at-checkout embarrassment.
 */
export function AddToCartButton({ product }: { product: Product }) {
    const add = useCart((s) => s.add);
    const cartItems = useCart((s) => s.items);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [qty, setQty] = useState(1);

    // Look up the variant object for whichever size the user picked.
    // We use this both to check stock and to pass its exact size string
    // (not some derived value) into the cart.
    const selectedVariant =
        product.variants.find((v) => v.size === selectedSize) ?? null;

    // How many of this (product, size) are already in the user's cart?
    // 0 if they haven't added this variant yet.
    const inCartQty = selectedVariant
        ? (cartItems.find(
              (x) => x.id === product.id && x.size === selectedVariant.size
          )?.qty ?? 0)
        : 0;

    const remainingInStock = selectedVariant
        ? selectedVariant.stock - inCartQty
        : 0;

    const hasAnyStock = product.variants.some((v) => v.stock > 0);
    // Clamp the user's chosen qty against the cap. This stops the +
    // button from going past stock if the user switches to a smaller-
    // stock size after picking a high quantity on the previous one.
    const cappedQty = Math.min(Math.max(qty, 1), Math.max(remainingInStock, 1));
    const canAdd = selectedVariant !== null && remainingInStock > 0;

    function handleSelectSize(size: string) {
        setSelectedSize(size);
        // Reset qty when switching size so the cap re-applies cleanly.
        setQty(1);
    }

    function handleAdd() {
        if (!canAdd || !selectedVariant) return;

        add({
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
            category: product.category,
            size: selectedVariant.size,
            maxStock: selectedVariant.stock,
            qty: cappedQty,
        });

        toast.success(
            `Added ${cappedQty}× ${product.title} (size ${selectedVariant.size}) to cart`
        );

        // Reset qty back to 1 — common pattern, customer probably wants
        // 1 of the next thing they add, not whatever they just picked.
        setQty(1);
    }

    // Edge cases first — no variants at all, or every variant at zero stock.
    if (product.variants.length === 0) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                This product has no sizes available yet.
            </div>
        );
    }

    if (!hasAnyStock) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                Sold out. Please check back later.
            </div>
        );
    }

    // Pick the right button label based on state.
    let buttonLabel: string;
    if (selectedSize === null) {
        buttonLabel = "Pick a size first";
    } else if (remainingInStock <= 0) {
        buttonLabel = `Max in cart (${inCartQty})`;
    } else {
        buttonLabel = `Add ${cappedQty} to cart`;
    }

    return (
        <div className="space-y-3">
            <div>
                <p className="mb-2 text-sm font-medium">
                    Select size
                    {selectedSize && (
                        <span className="text-muted-foreground">
                            {" "}
                            · {selectedSize}
                        </span>
                    )}
                </p>
                <div className="flex flex-wrap gap-2">
                    {product.variants.map((variant) => {
                        const outOfStock = variant.stock === 0;
                        const isSelected = selectedSize === variant.size;

                        return (
                            <button
                                key={variant.id}
                                type="button"
                                disabled={outOfStock}
                                onClick={() => handleSelectSize(variant.size)}
                                title={
                                    outOfStock
                                        ? "Out of stock"
                                        : `${variant.stock} in stock`
                                }
                                className={[
                                    "min-w-[3rem] rounded-md border px-3 py-2 text-sm transition",
                                    isSelected &&
                                        "border-foreground bg-foreground text-background",
                                    !isSelected &&
                                        !outOfStock &&
                                        "hover:border-foreground",
                                    outOfStock &&
                                        "cursor-not-allowed text-muted-foreground line-through opacity-50",
                                ]
                                    .filter(Boolean)
                                    .join(" ")}
                            >
                                {variant.size}
                            </button>
                        );
                    })}
                </div>

                {/* Low-stock nudge. Shown only when the user has picked a
                    size and that size has 3 or fewer in stock. */}
                {selectedVariant &&
                    selectedVariant.stock > 0 &&
                    selectedVariant.stock <= 3 && (
                        <p className="mt-2 text-xs text-amber-600">
                            Only {selectedVariant.stock} left in size{" "}
                            {selectedVariant.size}
                        </p>
                    )}

                {/* "You already have N in your cart" hint — only shown when
                    it matters (the user has already put some of this variant
                    in their cart). */}
                {selectedVariant && inCartQty > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                        You have {inCartQty} in your cart
                        {remainingInStock <= 0 && " (max reached)"}
                    </p>
                )}
            </div>

            {/* Quantity stepper — only meaningful once a size is picked
                and there's stock left. The +/- buttons cap themselves at
                remainingInStock so the customer can't overshoot. */}
            {selectedVariant && remainingInStock > 0 && (
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">Quantity</span>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={cappedQty <= 1}
                            onClick={() => setQty((q) => Math.max(1, q - 1))}
                            aria-label="Decrease quantity"
                        >
                            −
                        </Button>
                        <span className="w-8 text-center text-sm font-semibold">
                            {cappedQty}
                        </span>
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={cappedQty >= remainingInStock}
                            onClick={() =>
                                setQty((q) =>
                                    Math.min(remainingInStock, q + 1)
                                )
                            }
                            aria-label="Increase quantity"
                        >
                            +
                        </Button>
                    </div>
                    {cappedQty >= remainingInStock && (
                        <span className="text-xs text-amber-600">
                            max {remainingInStock} available
                        </span>
                    )}
                </div>
            )}

            <Button
                type="button"
                disabled={!canAdd}
                onClick={handleAdd}
                className="w-full sm:w-auto"
            >
                {buttonLabel}
            </Button>
        </div>
    );
}
