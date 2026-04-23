import { apiFetch } from "@/lib/http";

export const API_INTERNAL_BASE_URL =
    process.env.API_INTERNAL_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://localhost:8080";

// --- Sizes ---
//
// A category is either CLOTHING or SHOE. Each type has a fixed set of
// size labels that the admin can pick from — this mirrors the SizeType
// enum on the backend.
export type SizeType = "CLOTHING" | "SHOE";

export const SIZE_OPTIONS: Record<SizeType, string[]> = {
    CLOTHING: ["S", "M", "L", "XL", "XXL"],
    SHOE: ["38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48"],
};

export type ProductVariant = {
    id: number;
    size: string;
    stock: number;
};

export type Product = {
    id: number;
    title: string;
    price: number;
    image: string;
    category: string;         // category name (kept for backwards compatibility)
    categoryId: number;
    sizeType: SizeType;
    variants: ProductVariant[];
};

type ProductResponse = {
    id: number;
    title: string;
    price: number;
    image: string;
    categoryId: number;
    categoryName: string;
    sizeType: SizeType;
    variants: ProductVariant[];
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
    sizeType: SizeType;
};

export type Gender = "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";

export type AuthUserResponse = {
    id: number;
    email: string;
    name: string | null;
    role: "USER" | "ADMIN";
    gender: Gender | null;
    birthday: string | null; // ISO date (YYYY-MM-DD)
};

export type AdminProduct = {
    id: number;
    title: string;
    price: number;
    image: string;
    categoryId: number;
    categoryName: string;
    sizeType: SizeType;
    variants: ProductVariant[];
};


function toProduct(p: ProductResponse): Product {
    return {
        id: p.id,
        title: p.title,
        price: Number(p.price),
        image: p.image,
        category: p.categoryName,
        categoryId: p.categoryId,
        sizeType: p.sizeType,
        variants: p.variants ?? [],
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

// --- Admin Categories ---

export async function createCategory(name: string, sizeType: SizeType): Promise<Category> {
    return apiFetch<Category>("/api/categories", {
        method: "POST",
        body: JSON.stringify({ name, sizeType }),
    });
}

export async function updateCategory(
    id: number,
    name: string,
    sizeType: SizeType
): Promise<Category> {
    return apiFetch<Category>(`/api/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name, sizeType }),
    });
}

export async function deleteCategory(id: number): Promise<void> {
    await apiFetch(`/api/categories/${id}`, { method: "DELETE" });
}

// --- Orders (Checkout) ---

export type CreateOrderItem = {
    productId: number;
    /** Size variant the customer picked, e.g. "M" or "42". */
    size: string;
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
    /** Size snapshot — null for orders placed before the sizes feature. */
    size: string | null;
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
    status: OrderStatus;
    items: OrderItem[];
};

export async function createOrder(payload: CreateOrderRequest): Promise<OrderResponse> {
    return apiFetch<OrderResponse>("/api/orders", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function getOrder(id: string): Promise<OrderResponse | null> {
    try {
        return await apiFetch<OrderResponse>(`/api/orders/${id}`, { cache: "no-store" });
    } catch (e: unknown) {
        // keep the old behavior for 404
        if (e instanceof Error && e.message.startsWith("404")) return null;
        throw e;
    }
}

// --- Auth ---

export async function loginApi(email: string, password: string): Promise<AuthUserResponse> {
    return apiFetch<AuthUserResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });
}

export async function registerApi(email: string, password: string, name: string): Promise<AuthUserResponse> {
    return apiFetch<AuthUserResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, name }),
    });
}

export async function meApi(): Promise<AuthUserResponse> {
    return apiFetch<AuthUserResponse>("/api/auth/me", { cache: "no-store" });
}

export async function updateProfileApi(
    name: string,
    email: string,
    gender: Gender | null,
    birthday: string | null
): Promise<AuthUserResponse> {
    return apiFetch<AuthUserResponse>("/api/auth/me", {
        method: "PUT",
        body: JSON.stringify({ name, email, gender, birthday }),
    });
}

export async function changePasswordApi(
    currentPassword: string,
    newPassword: string
): Promise<void> {
    await apiFetch("/api/auth/me/password", {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword }),
    });
}

export async function logoutApi(): Promise<void> {
    await apiFetch("/api/auth/logout", { method: "POST" });
}

// --- Admin Products ---

export async function getAdminProducts(
    page = 0,
    size = 100,
    sort = "id,desc"
): Promise<Page<AdminProduct>> {
    const params = new URLSearchParams({
        page: String(page),
        size: String(size),
        sort,
    });

    return apiFetch<Page<AdminProduct>>(`/api/products?${params.toString()}`, {
        cache: "no-store",
    });
}

export async function uploadImage(file: File): Promise<string> {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${base}/api/images`, {
        method: "POST",
        credentials: "include",
        body: formData,
    });

    if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`${res.status} ${txt || res.statusText}`);
    }

    const data: { url: string } = await res.json();
    return data.url;
}

export type AdminProductPayload = {
    title: string;
    price: number;
    image: string;
    categoryId: number;
    /** Per-size stock. Must have at least one entry. */
    variants: { size: string; stock: number }[];
};

export async function createAdminProduct(
    payload: AdminProductPayload
): Promise<AdminProduct> {
    return apiFetch<AdminProduct>("/api/products", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function updateAdminProduct(
    id: number,
    payload: AdminProductPayload
): Promise<AdminProduct> {
    return apiFetch<AdminProduct>(`/api/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export async function deleteAdminProduct(id: number): Promise<void> {
    await apiFetch(`/api/products/${id}`, { method: "DELETE" });
}

/**
 * Inline stock update for a single variant — used by the admin
 * products list so the admin can restock a size without opening
 * the full edit form.
 */
export async function updateAdminProductVariantStock(
    productId: number,
    variantId: number,
    stock: number
): Promise<AdminProduct> {
    return apiFetch<AdminProduct>(
        `/api/products/${productId}/variants/${variantId}`,
        {
            method: "PATCH",
            body: JSON.stringify({ stock }),
        }
    );
}

// --- My Orders (logged-in user) ---

export async function getMyOrders(): Promise<OrderResponse[]> {
    return apiFetch<OrderResponse[]>("/api/orders/mine", { cache: "no-store" });
}

// --- Admin Dashboard ---

export type AdminStats = {
    totalOrders: number;
    totalProducts: number;
    totalUsers: number;
    totalRevenue: number;
};

export type AdminUser = {
    id: number;
    email: string;
    name: string | null;
    role: "USER" | "ADMIN";
    gender: Gender | null;
    birthday: string | null;
    banned: boolean;
    ordersCount: number;
    totalSpent: number;
};

export async function getAdminUsers(): Promise<AdminUser[]> {
    return apiFetch<AdminUser[]>("/api/admin/users", { cache: "no-store" });
}

export async function getAdminUser(id: number): Promise<AdminUser> {
    return apiFetch<AdminUser>(`/api/admin/users/${id}`, { cache: "no-store" });
}

export async function setAdminUserBanned(
    id: number,
    banned: boolean
): Promise<AdminUser> {
    return apiFetch<AdminUser>(`/api/admin/users/${id}/ban`, {
        method: "PATCH",
        body: JSON.stringify({ banned }),
    });
}

// --- Admin Analytics ---

export type RevenueByMonth = {
    month: string; // "YYYY-MM"
    revenue: number;
};

export type TopProduct = {
    productId: number;
    title: string;
    qtySold: number;
    revenue: number;
};

export type OrderStatusCount = {
    status: OrderStatus;
    count: number;
};

export async function getRevenueByMonth(): Promise<RevenueByMonth[]> {
    return apiFetch<RevenueByMonth[]>("/api/admin/analytics/revenue-by-month", {
        cache: "no-store",
    });
}

export async function getTopProducts(): Promise<TopProduct[]> {
    return apiFetch<TopProduct[]>("/api/admin/analytics/top-products", {
        cache: "no-store",
    });
}

export async function getOrderStatusCounts(): Promise<OrderStatusCount[]> {
    return apiFetch<OrderStatusCount[]>("/api/admin/analytics/order-status", {
        cache: "no-store",
    });
}

export async function getAdminStats(): Promise<AdminStats> {
    return apiFetch<AdminStats>("/api/admin/stats", { cache: "no-store" });
}

// --- Admin Orders ---

export async function getAdminOrders(): Promise<OrderResponse[]> {
    return apiFetch<OrderResponse[]>("/api/orders", { cache: "no-store" });
}

export async function updateOrderStatus(
    id: number,
    status: OrderStatus
): Promise<OrderResponse> {
    return apiFetch<OrderResponse>(`/api/orders/${id}/status?status=${status}`, {
        method: "PATCH",
    });
}
