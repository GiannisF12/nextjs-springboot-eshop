"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminGuard } from "@/features/admin/admin-guard";
import { AdminNav } from "@/features/admin/admin-nav";
import {
    type Category,
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
} from "@/lib/api";

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [newName, setNewName] = useState("");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingName, setEditingName] = useState("");

    async function loadCategories() {
        setLoading(true);
        setError(null);
        try {
            const data = await getCategories();
            setCategories(data);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to load categories.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadCategories();
    }, []);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!newName.trim()) return;

        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            await createCategory(newName.trim());
            setNewName("");
            setSuccess("Category created.");
            await loadCategories();
        } catch (e: unknown) {
            if (e instanceof Error && e.message.includes("409")) {
                setError("A category with this name already exists.");
            } else {
                setError(e instanceof Error ? e.message : "Failed to create category.");
            }
        } finally {
            setSaving(false);
        }
    }

    function startEdit(category: Category) {
        setEditingId(category.id);
        setEditingName(category.name);
        setError(null);
        setSuccess(null);
    }

    function cancelEdit() {
        setEditingId(null);
        setEditingName("");
    }

    async function handleUpdate(id: number) {
        if (!editingName.trim()) return;

        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            await updateCategory(id, editingName.trim());
            setSuccess("Category updated.");
            cancelEdit();
            await loadCategories();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to update category.");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: number) {
        if (!confirm("Delete this category? Products using it will need a new category.")) return;

        setError(null);
        setSuccess(null);

        try {
            await deleteCategory(id);
            setSuccess("Category deleted.");
            if (editingId === id) cancelEdit();
            await loadCategories();
        } catch (e: unknown) {
            if (e instanceof Error && e.message.includes("409")) {
                setError("Cannot delete — products are still using this category.");
            } else {
                setError(e instanceof Error ? e.message : "Failed to delete category.");
            }
        }
    }

    return (
        <AdminGuard>
            <div className="space-y-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold">Admin Categories</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage product categories.
                    </p>
                </div>

                <AdminNav />

                <div className="rounded-lg border p-4">
                    <h2 className="text-lg font-semibold">Create category</h2>
                    <form
                        className="mt-3 flex gap-2"
                        onSubmit={handleCreate}
                    >
                        <Input
                            placeholder="Category name"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="max-w-xs"
                        />
                        <Button type="submit" disabled={saving || !newName.trim()}>
                            {saving ? "Creating..." : "Create"}
                        </Button>
                    </form>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}
                {success && <p className="text-sm text-green-700">{success}</p>}

                <div className="rounded-lg border">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                        <h2 className="text-lg font-semibold">Categories</h2>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => void loadCategories()}
                        >
                            Refresh
                        </Button>
                    </div>

                    <div className="divide-y">
                        {loading ? (
                            <p className="px-4 py-4 text-sm text-muted-foreground">
                                Loading...
                            </p>
                        ) : categories.length === 0 ? (
                            <p className="px-4 py-4 text-sm text-muted-foreground">
                                No categories yet.
                            </p>
                        ) : (
                            categories.map((category) => (
                                <div
                                    key={category.id}
                                    className="flex items-center justify-between gap-3 px-4 py-3"
                                >
                                    {editingId === category.id ? (
                                        <div className="flex flex-1 items-center gap-2">
                                            <Input
                                                value={editingName}
                                                onChange={(e) =>
                                                    setEditingName(e.target.value)
                                                }
                                                className="max-w-xs"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        void handleUpdate(category.id);
                                                    }
                                                    if (e.key === "Escape") cancelEdit();
                                                }}
                                            />
                                            <Button
                                                type="button"
                                                disabled={saving}
                                                onClick={() =>
                                                    void handleUpdate(category.id)
                                                }
                                            >
                                                Save
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={cancelEdit}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <div>
                                                <p className="font-medium">
                                                    {category.name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    #{category.id}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => startEdit(category)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    onClick={() =>
                                                        void handleDelete(category.id)
                                                    }
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AdminGuard>
    );
}
