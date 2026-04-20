"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/features/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignupPage() {
    const router = useRouter();
    const { register } = useAuth();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            await register(email, password, name);
            router.push("/");
        } catch (err: unknown) {
            if (err instanceof Error && err.message.includes("409")) {
                setError("An account with this email already exists.");
            } else {
                setError("Registration failed. Please try again.");
            }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="max-w-md space-y-4">
            <h1 className="text-2xl font-semibold">Create an account</h1>

            <form onSubmit={handleSubmit} className="space-y-3">
                <Input
                    placeholder="Username"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                <Input
                    placeholder="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <Input
                    placeholder="Password (min 6 characters)"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                />

                <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? "Creating account..." : "Sign up"}
                </Button>
            </form>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="underline">
                    Log in
                </Link>
            </p>
        </div>
    );
}
