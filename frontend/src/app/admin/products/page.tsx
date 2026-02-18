"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminGuard } from "@/features/admin/admin-guard";
import { AdminNav } from "@/features/admin/admin-nav";
import {
    type AdminProduct,
    createAdminProduct,
    deleteAdminProduct,
    getAdminProducts,
    getCategories,
    type Category,
    updateAdminProduct,
} from "@/lib/api";

type ProductFormState = {
    title: string;
    price: string;
    image: string;
    categoryId: string;
};

const EMPTY_FORM: ProductFormState = {
    title: "",
    price: "",
    image: "",
    categoryId: "",
};

export default function AdminProductsPage() {
    const [products, setProducts] = useState<AdminProduct[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

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
        setError(null);
        setSuccess(null);
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

        setSaving(true);

        try {
            const payload = {
                title: form.title.trim(),
                price: priceNumber,
                image: form.image.trim(),
                categoryId,
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

    return (
        <AdminGuard>
            <div className="space-y-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold">Admin Products</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage your product catalog.
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
                        <Input
                            placeholder="Image URL or path"
                            value={form.image}
                            onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
                        />
                        <select
                            className="h-9 rounded-md border bg-transparent px-3 text-sm"
                            value={form.categoryId}
                            onChange={(e) =>
                                setForm((prev) => ({ ...prev, categoryId: e.target.value }))
                            }
                        >
                            <option value="">Select category</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>

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
                                    <div>
                                        <p className="font-medium">{product.title}</p>
                                        <p className="text-sm text-muted-foreground">
                                            #{product.id} · {product.categoryName} · $
                                            {product.price.toFixed(2)}
                                        </p>
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
