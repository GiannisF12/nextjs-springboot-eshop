"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/features/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    // Read one-shot notice stashed in sessionStorage (e.g. after email change)
    useEffect(() => {
        const msg = sessionStorage.getItem("loginNotice");
        if (msg) {
            setNotice(msg);
            sessionStorage.removeItem("loginNotice");
        }
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            const user = await login(email, password);
            router.push(user.role === "ADMIN" ? "/admin" : "/");
        } catch (err: unknown) {
            // Backend returns 403 specifically for banned accounts so we can
            // show a distinct message. Everything else stays generic to avoid
            // leaking whether the email exists (user-enumeration vector).
            if (err instanceof Error && err.message.startsWith("403")) {
                setError(
                    "This account has been banned. Please contact support."
                );
            } else {
                setError("Invalid email or password.");
            }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="max-w-md space-y-4">
            <h1 className="text-2xl font-semibold">Login</h1>

            {notice && (
                <p className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                    {notice}
                </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
                <Input
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? "Logging in..." : "Login"}
                </Button>
            </form>
            {error && <p className="text-sm text-red-600">{error}</p>}

            <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="underline">
                    Sign up
                </Link>
            </p>
        </div>
    );
}
