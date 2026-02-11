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

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        // TEMP FAKE LOGIN
        if (email === "admin@test.com") {
            login({ id: 1, email, role: "ADMIN" });
        } else {
            login({ id: 2, email, role: "USER" });
        }

        router.push("/");
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

                <Button type="submit" className="w-full">
                    Login
                </Button>
            </form>
        </div>
    );
}