export function resolveImageUrl(path: string): string {
    if (path.startsWith("http")) return path;
    if (path.startsWith("/uploads/")) {
        // Always use the public URL — images are loaded by the browser,
        // not by the server, even when the HTML is server-rendered.
        const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
        return `${base}${path}`;
    }
    return path;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
    const isServer = typeof window === "undefined";

    const base = isServer
        ? process.env.API_INTERNAL_BASE_URL ?? "http://backend:8080"
        : process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

    const url = path.startsWith("http") ? path : `${base}${path}`;

    let res: Response;
    try {
        res = await fetch(url, {
            ...init,
            credentials: init.credentials ?? "include",
            headers: {
                ...(init.headers ?? {}),
                "Content-Type": "application/json",
            },
        });
    } catch {
        throw new Error("Backend is unreachable. Is the Spring Boot backend running?");
    }

    if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`${res.status} ${txt || res.statusText}`);
    }

    if (res.status === 204) {
        return undefined as T;
    }

    return res.json() as Promise<T>;
}
