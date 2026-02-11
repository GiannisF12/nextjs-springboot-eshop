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

    return res.json() as Promise<T>;
}