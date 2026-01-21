export const API_INTERNAL_BASE_URL =
    process.env.API_INTERNAL_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://localhost:8080";

export type Product = {
    id: number;
    title: string;
    price: number;
    image: string;
    category: string;
};

type ProductResponse = {
    id: number;
    title: string;
    price: number;
    image: string;
    categoryId: number;
    categoryName: string;
};

export type Page<T> = {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
};

function toProduct(p: ProductResponse): Product {
    return {
        id: p.id,
        title: p.title,
        price: Number(p.price),
        image: p.image,
        category: p.categoryName,
    };
}

export async function getProducts(
    page = 0,
    size = 12,
    sort = "id,asc"
): Promise<Page<Product>> {
    const res = await fetch(
        `${API_INTERNAL_BASE_URL}/api/products?page=${page}&size=${size}&sort=${encodeURIComponent(sort)}`,
        { cache: "no-store" }
    );
    if (!res.ok) throw new Error("Failed to fetch products");

    const data: Page<ProductResponse> = await res.json();

    return {
        ...data,
        content: data.content.map(toProduct),
    };
}

export async function getProduct(id: string): Promise<Product | null> {
    const res = await fetch(`${API_INTERNAL_BASE_URL}/api/products/${id}`, { cache: "no-store" });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed to fetch product");

    const p: ProductResponse = await res.json();
    return toProduct(p);
}