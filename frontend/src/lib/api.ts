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

export type Category = {
    id: number;
    name: string;
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
    sort = "id,desc",
    categoryId?: number,
    q?: string
): Promise<Page<Product>> {
    const params = new URLSearchParams({
        page: String(page),
        size: String(size),
        sort,
    });

    if (typeof categoryId === "number") params.set("categoryId", String(categoryId));
    if (q && q.trim().length > 0) params.set("q", q.trim());

    const res = await fetch(`${API_INTERNAL_BASE_URL}/api/products?${params.toString()}`, {
        cache: "no-store",
    });

    if (!res.ok) throw new Error("Failed to fetch products");

    const data: Page<ProductResponse> = await res.json();

    return {
        ...data,
        content: data.content.map(toProduct),
    };
}

export async function getProduct(id: string): Promise<Product | null> {
    const res = await fetch(`${API_INTERNAL_BASE_URL}/api/products/${id}`, {
        cache: "no-store",
    });

    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed to fetch product");

    const p: ProductResponse = await res.json();
    return toProduct(p);
}

export async function getCategories(): Promise<Category[]> {
    const res = await fetch(`${API_INTERNAL_BASE_URL}/api/categories`, {
        cache: "no-store",
    });

    if (!res.ok) throw new Error("Failed to fetch categories");
    return res.json();
}

// --- Orders (Checkout) ---

export type CreateOrderItem = {
    productId: number;
    price: number; // backend expects BigDecimal, JSON number is OK
    qty: number;
};

export type CreateOrderRequest = {
    customerName: string;
    phone: string;
    addressLine: string;
    city: string;
    zip: string;
    items: CreateOrderItem[];
};

export type OrderItem = {
    productId: number;
    title: string;
    price: number;
    image: string;
    category: string;
    qty: number;
    lineTotal: number;
};
export type OrderStatus =
    | "NEW"
    | "PROCESSING"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED";

export type OrderResponse = {
    id: number;
    createdAt: string;
    customerName: string;
    phone: string;
    addressLine: string;
    city: string;
    zip: string;
    total: number;
    status: OrderStatus
    items: OrderItem[];
};

export async function createOrder(payload: CreateOrderRequest): Promise<OrderResponse> {
    let res: Response;

    try {
        res = await fetch(`${API_INTERNAL_BASE_URL}/api/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    } catch {
        // Network-level error (backend down, DNS, refused connection, etc.)
        throw new Error("Backend is unreachable. Is the Spring Boot backend running?");
    }

    if (!res.ok) {
        let message = `Failed to create order (${res.status})`;

        try {
            const contentType = res.headers.get("content-type") ?? "";
            if (contentType.includes("application/json")) {
                const json = await res.json();
                message = json?.message ?? json?.error ?? json?.detail ?? message;
            } else {
                const txt = await res.text();
                if (txt?.trim()) message = txt;
            }
        } catch {
            // ignore parsing errors
        }

        throw new Error(message);
    }

    return res.json();
}

export async function getOrder(id: string): Promise<OrderResponse | null> {
    const res = await fetch(`${API_INTERNAL_BASE_URL}/api/orders/${id}`, { cache: "no-store" });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed to fetch order");
    return res.json();
}
