"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            const user = await login(email, password);
            router.push(user.role === "ADMIN" ? "/admin" : "/");
        } catch {
            setError("Invalid email or password.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="max-w-md space-y-4">
            <h1 className="text-2xl font-semibold">Login</h1>

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
        </div>
    );
}
