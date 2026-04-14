"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/auth-context";

export default function AccountPage() {
    const router = useRouter();
    const { user, loading: authLoading, updateProfile } = useAuth();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push("/login");
            return;
        }
        setName(user.name ?? "");
        setEmail(user.email);
    }, [user, authLoading, router]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setSaving(true);

        try {
            await updateProfile(name, email);
            setSuccess("Profile updated.");
        } catch (err: unknown) {
            if (err instanceof Error && err.message.includes("409")) {
                setError("This email is already in use.");
            } else {
                setError(err instanceof Error ? err.message : "Update failed.");
            }
        } finally {
            setSaving(false);
        }
    }

    if (authLoading || !user) {
        return <p className="text-sm text-muted-foreground">Loading...</p>;
    }

    return (
        <div className="mx-auto max-w-md space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold">My Account</h1>
                <p className="text-sm text-muted-foreground">
                    Manage your profile information.
                </p>
            </div>

            <div className="rounded-lg border p-4">
                <h2 className="text-lg font-semibold">Profile</h2>
                <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
                    <div>
                        <label className="text-sm font-medium">Name</label>
                        <Input
                            className="mt-1"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Email</label>
                        <Input
                            className="mt-1"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <Button type="submit" disabled={saving}>
                        {saving ? "Saving..." : "Save changes"}
                    </Button>
                </form>

                {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
                {success && (
                    <p className="mt-3 text-sm text-green-700">{success}</p>
                )}
            </div>

            <div className="rounded-lg border p-4">
                <h2 className="text-lg font-semibold">Quick Links</h2>
                <div className="mt-3 flex gap-2">
                    <Button asChild variant="outline">
                        <Link href="/account/orders">My Orders</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/products">Browse Products</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
