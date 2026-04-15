"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminGuard } from "@/features/admin/admin-guard";
import { AdminNav } from "@/features/admin/admin-nav";
import { resolveImageUrl } from "@/lib/http";
import {
    type AdminProduct,
    type Category,
    type SizeType,
    SIZE_OPTIONS,
    createAdminProduct,
    deleteAdminProduct,
    getAdminProducts,
    getCategories,
    updateAdminProduct,
    uploadImage,
} from "@/lib/api";

type ProductFormState = {
    title: string;
    price: string;
    image: string;
    categoryId: string;
};

// One row per possible size for the selected category.
// `enabled` = the admin ticked this size; `stock` is an input string
// (parsed to a number on submit).
type VariantFormRow = {
    size: string;
    enabled: boolean;
    stock: string;
};

const EMPTY_FORM: ProductFormState = {
    title: "",
    price: "",
    image: "",
    categoryId: "",
};

/** Build a fresh list of variant rows for a given size type. */
function emptyVariantsFor(sizeType: SizeType): VariantFormRow[] {
    return SIZE_OPTIONS[sizeType].map((size) => ({
        size,
        enabled: false,
        stock: "0",
    }));
}

export default function AdminProductsPage() {
    const [products, setProducts] = useState<AdminProduct[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
    const [variants, setVariants] = useState<VariantFormRow[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const editingProduct = useMemo(
        () => products.find((p) => p.id === editingId) ?? null,
        [products, editingId]
    );

    async function loadData() {
        setLoading(true);
        setError(null);

        try {
            const [productsPage, categoriesData] = await Promise.all([
                getAdminProducts(0, 200, "id,desc"),
                getCategories(),
            ]);
            setProducts(productsPage.content);
            setCategories(categoriesData);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to load admin products.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadData();
    }, []);

    function startCreate() {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setVariants([]);
        setError(null);
        setSuccess(null);
    }

    function startEdit(product: AdminProduct) {
        setEditingId(product.id);
        setForm({
            title: product.title,
            price: String(product.price),
            image: product.image,
            categoryId: String(product.categoryId),
        });

        // Prefill the variant rows: every possible size for this product's
        // size type shows as a row, ticked and populated only for sizes
        // the product actually has.
        const existingBySize = new Map(
            product.variants.map((v) => [v.size, v])
        );
        setVariants(
            SIZE_OPTIONS[product.sizeType].map((size) => {
                const existing = existingBySize.get(size);
                return {
                    size,
                    enabled: existing !== undefined,
                    stock: existing ? String(existing.stock) : "0",
                };
            })
        );

        setError(null);
        setSuccess(null);
    }

    /**
     * Category changes wipe + rebuild the variant rows to match the new
     * category's size type (CLOTHING vs SHOE). This prevents the admin
     * from submitting "M" sizes for a SHOE category.
     */
    function handleCategoryChange(newCategoryId: string) {
        setForm((prev) => ({ ...prev, categoryId: newCategoryId }));

        const selected = categories.find((c) => c.id === Number(newCategoryId));
        if (!selected) {
            setVariants([]);
            return;
        }
        setVariants(emptyVariantsFor(selected.sizeType));
    }

    function toggleVariant(size: string) {
        setVariants((prev) =>
            prev.map((row) =>
                row.size === size ? { ...row, enabled: !row.enabled } : row
            )
        );
    }

    function setVariantStock(size: string, stock: string) {
        setVariants((prev) =>
            prev.map((row) => (row.size === size ? { ...row, stock } : row))
        );
    }

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError(null);

        try {
            const url = await uploadImage(file);
            setForm((prev) => ({ ...prev, image: url }));
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Image upload failed.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        const priceNumber = Number(form.price);
        const categoryId = Number(form.categoryId);

        if (!form.title.trim() || !form.image.trim()) {
            setError("Title and image are required.");
            return;
        }
        if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
            setError("Price must be a positive number.");
            return;
        }
        if (!Number.isInteger(categoryId) || categoryId <= 0) {
            setError("Please select a category.");
            return;
        }

        // Collect only the sizes the admin ticked, and parse their stock.
        const enabledVariants = variants.filter((v) => v.enabled);
        if (enabledVariants.length === 0) {
            setError("Please tick at least one size and set its stock.");
            return;
        }
        const variantsPayload: { size: string; stock: number }[] = [];
        for (const v of enabledVariants) {
            const stockNumber = Number(v.stock);
            if (!Number.isInteger(stockNumber) || stockNumber < 0) {
                setError(`Stock for size ${v.size} must be a non-negative whole number.`);
                return;
            }
            variantsPayload.push({ size: v.size, stock: stockNumber });
        }

        setSaving(true);

        try {
            const payload = {
                title: form.title.trim(),
                price: priceNumber,
                image: form.image.trim(),
                categoryId,
                variants: variantsPayload,
            };

            if (editingId === null) {
                await createAdminProduct(payload);
                setSuccess("Product created.");
            } else {
                await updateAdminProduct(editingId, payload);
                setSuccess("Product updated.");
            }

            await loadData();
            startCreate();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Save failed.");
        } finally {
            setSaving(false);
        }
    }

    async function onDelete(id: number) {
        setError(null);
        setSuccess(null);

        if (!confirm("Delete this product?")) return;

        try {
            await deleteAdminProduct(id);
            setSuccess("Product deleted.");
            if (editingId === id) startCreate();
            await loadData();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Delete failed.");
        }
    }

    // Compact summary string shown on each row in the products list.
    function variantSummary(product: AdminProduct): string {
        if (product.variants.length === 0) return "no sizes";
        return product.variants
            .map((v) => `${v.size}:${v.stock}`)
            .join(" · ");
    }

    return (
        <AdminGuard>
            <div className="space-y-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold">Admin Products</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage your product catalog. Pick a category first — the
                        available sizes depend on whether it&apos;s clothing or shoes.
                    </p>
                </div>

                <AdminNav />

                <div className="rounded-lg border p-4">
                    <h2 className="text-lg font-semibold">
                        {editingProduct ? `Edit #${editingProduct.id}` : "Create product"}
                    </h2>
                    <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
                        <Input
                            placeholder="Title"
                            value={form.title}
                            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                        />
                        <Input
                            placeholder="Price"
                            type="number"
                            step="0.01"
                            min="0"
                            value={form.price}
                            onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                        />
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={uploading}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {uploading ? "Uploading..." : "Upload image"}
                                </Button>
                                {form.image && (
                                    <span className="truncate text-sm text-muted-foreground">
                                        {form.image}
                                    </span>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                            <Input
                                placeholder="Or paste image URL"
                                value={form.image}
                                onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
                            />
                        </div>
                        <select
                            className="h-9 rounded-md border bg-transparent px-3 text-sm"
                            value={form.categoryId}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                        >
                            <option value="">Select category</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>

                        {/* Variant editor */}
                        {variants.length > 0 && (
                            <div className="md:col-span-2">
                                <p className="mb-2 text-sm font-medium">
                                    Sizes &amp; stock
                                </p>
                                <p className="mb-3 text-xs text-muted-foreground">
                                    Tick the sizes you stock, then enter the quantity
                                    available for each.
                                </p>
                                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                                    {variants.map((row) => (
                                        <label
                                            key={row.size}
                                            className="flex items-center gap-2 rounded-md border px-3 py-2"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={row.enabled}
                                                onChange={() => toggleVariant(row.size)}
                                            />
                                            <span className="w-10 text-sm font-medium">
                                                {row.size}
                                            </span>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="1"
                                                className="h-8"
                                                disabled={!row.enabled}
                                                value={row.stock}
                                                onChange={(e) =>
                                                    setVariantStock(row.size, e.target.value)
                                                }
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 md:col-span-2">
                            <Button type="submit" disabled={saving}>
                                {saving
                                    ? "Saving..."
                                    : editingProduct
                                      ? "Update product"
                                      : "Create product"}
                            </Button>
                            {editingProduct && (
                                <Button type="button" variant="outline" onClick={startCreate}>
                                    Cancel edit
                                </Button>
                            )}
                        </div>
                    </form>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}
                {success && <p className="text-sm text-green-700">{success}</p>}

                <div className="rounded-lg border">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                        <h2 className="text-lg font-semibold">Products</h2>
                        <Button type="button" variant="outline" onClick={() => void loadData()}>
                            Refresh
                        </Button>
                    </div>

                    <div className="divide-y">
                        {loading ? (
                            <p className="px-4 py-4 text-sm text-muted-foreground">Loading...</p>
                        ) : products.length === 0 ? (
                            <p className="px-4 py-4 text-sm text-muted-foreground">
                                No products found.
                            </p>
                        ) : (
                            products.map((product) => (
                                <div
                                    key={product.id}
                                    className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Thumbnail — helps the admin tell
                                            products apart at a glance when
                                            editing. Plain <img> (not next/Image)
                                            so any URL the shop owner pastes in
                                            renders without next.config tweaks. */}
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={resolveImageUrl(product.image)}
                                            alt={product.title}
                                            className="h-14 w-14 shrink-0 rounded-md border object-cover"
                                            onError={(e) => {
                                                // If the image 404s, hide it so
                                                // we don't show a broken icon.
                                                e.currentTarget.style.visibility =
                                                    "hidden";
                                            }}
                                        />
                                        <div>
                                            <p className="font-medium">{product.title}</p>
                                            <p className="text-sm text-muted-foreground">
                                                #{product.id} · {product.categoryName} · $
                                                {product.price.toFixed(2)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {variantSummary(product)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => startEdit(product)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            onClick={() => void onDelete(product.id)}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AdminGuard>
    );
}
