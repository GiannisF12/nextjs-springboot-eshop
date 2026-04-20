"use client";

import { useState } from "react";
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
import { changePasswordApi } from "@/lib/api";

export default function SecurityPage() {
    const { user } = useAuth();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    if (!user) return null; // layout handles loading/redirect

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }
        if (newPassword.length < 6) {
            setError("New password must be at least 6 characters.");
            return;
        }

        setSaving(true);
        try {
            await changePasswordApi(currentPassword, newPassword);
            setSuccess("Password changed successfully.");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: unknown) {
            if (err instanceof Error && err.message.startsWith("400")) {
                setError("Current password is incorrect.");
            } else {
                setError(err instanceof Error ? err.message : "Password change failed.");
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <Card className="max-w-2xl">
            <CardHeader>
                <CardTitle>Change password</CardTitle>
                <CardDescription>
                    Use a strong password you don&apos;t reuse elsewhere.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="text-sm font-medium">Current password</label>
                        <Input
                            className="mt-1"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">New password</label>
                        <Input
                            className="mt-1"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Confirm new password</label>
                        <Input
                            className="mt-1"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    <Button type="submit" disabled={saving}>
                        {saving ? "Saving..." : "Update password"}
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
