"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/auth-context";
import type { Gender } from "@/lib/auth-types";

export default function ProfilePage() {
    const router = useRouter();
    const { user, updateProfile, logout } = useAuth();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [gender, setGender] = useState<Gender | null>(null);
    const [birthday, setBirthday] = useState<string>(""); // YYYY-MM-DD
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Users must be at least 16 → set max date on birthday input to 16y ago.
    const maxBirthday = useMemo(() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 16);
        return d.toISOString().slice(0, 10);
    }, []);

    useEffect(() => {
        if (user) {
            setName(user.name ?? "");
            setEmail(user.email);
            setGender(user.gender ?? null);
            setBirthday(user.birthday ?? "");
        }
    }, [user]);

    if (!user) return null; // layout handles loading/redirect

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setSaving(true);

        const oldEmail = user?.email;
        const birthdayToSend = birthday.trim() === "" ? null : birthday;

        try {
            await updateProfile(name, email, gender, birthdayToSend);

            if (oldEmail && oldEmail.toLowerCase() !== email.trim().toLowerCase()) {
                sessionStorage.setItem(
                    "loginNotice",
                    "Your email was updated. Please log in again."
                );
                await logout();
                router.push("/login");
                return;
            }

            setSuccess("Profile updated.");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "";
            if (msg.startsWith("409")) {
                setError("This email is already in use.");
            } else if (msg.includes("at least 16") || msg.includes("16 years")) {
                setError("You must be at least 16 years old.");
            } else if (msg.includes("future")) {
                setError("Birthday cannot be in the future.");
            } else if (msg.startsWith("400")) {
                setError("Something is wrong with the data you entered.");
            } else {
                setError(msg || "Update failed.");
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <Card className="max-w-2xl">
            <CardHeader>
                <CardTitle>Profile information</CardTitle>
                <CardDescription>
                    Update your personal details. Gender and birthday are optional.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="text-sm font-medium">Username</label>
                        <Input
                            className="mt-1"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                            Your display name. Your real name goes on your shipping address.
                        </p>
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
                        <p className="mt-1 text-xs text-muted-foreground">
                            Changing your email will log you out.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="text-sm font-medium">Gender</label>
                            <select
                                className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={gender ?? ""}
                                onChange={(e) =>
                                    setGender(
                                        e.target.value === ""
                                            ? null
                                            : (e.target.value as Gender)
                                    )
                                }
                            >
                                <option value="">Not specified</option>
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                                <option value="OTHER">Other</option>
                                <option value="PREFER_NOT_TO_SAY">
                                    Prefer not to say
                                </option>
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Birthday</label>
                            <Input
                                className="mt-1"
                                type="date"
                                value={birthday}
                                onChange={(e) => setBirthday(e.target.value)}
                                max={maxBirthday}
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                                You must be at least 16 years old.
                            </p>
                        </div>
                    </div>

                    <Button type="submit" disabled={saving}>
                        {saving ? "Saving..." : "Save changes"}
                    </Button>

                    {error && <p className="text-sm text-red-600">{error}</p>}
                    {success && (
                        <p className="text-sm text-green-700">{success}</p>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}
