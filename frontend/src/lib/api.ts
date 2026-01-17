export const API_INTERNAL_BASE_URL =
    process.env.API_INTERNAL_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export const API_PUBLIC_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export type Product = {
    id: number;
    title: string;
    price: number;
    image: string;
    category: string;
};

export async function getProducts(): Promise<Product[]> {
    const res = await fetch(`${API_INTERNAL_BASE_URL}/api/products`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch products");
    return res.json();
}

export async function getProduct(id: string): Promise<Product | null> {
    const res = await fetch(`${API_INTERNAL_BASE_URL}/api/products/${id}`, { cache: "no-store" });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed to fetch product");
    return res.json();
}