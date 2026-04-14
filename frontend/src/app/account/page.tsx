"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/auth-context";
import { changePasswordApi } from "@/lib/api";

export default function AccountPage() {
    const router = useRouter();
    const { user, loading: authLoading, updateProfile, logout } = useAuth();

    // Profile form state
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

    // Password form state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [savingPassword, setSavingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push("/login");
            return;
        }
        setName(user.name ?? "");
        setEmail(user.email);
    }, [user, authLoading, router]);

    async function handleProfileSubmit(e: React.FormEvent) {
        e.preventDefault();
        setProfileError(null);
        setProfileSuccess(null);
        setSavingProfile(true);

        const oldEmail = user?.email;

        try {
            await updateProfile(name, email);

            // If the email actually changed, the session principal is now stale.
            // Log out and bounce to login so the user can re-authenticate.
            if (oldEmail && oldEmail.toLowerCase() !== email.trim().toLowerCase()) {
                sessionStorage.setItem(
                    "loginNotice",
                    "Your email was updated. Please log in again."
                );
                await logout();
                router.push("/login");
                return;
            }

            setProfileSuccess("Profile updated.");
        } catch (err: unknown) {
            if (err instanceof Error && err.message.startsWith("409")) {
                setProfileError("This email is already in use.");
            } else {
                setProfileError(err instanceof Error ? err.message : "Update failed.");
            }
        } finally {
            setSavingProfile(false);
        }
    }

    async function handlePasswordSubmit(e: React.FormEvent) {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(null);

        if (newPassword !== confirmPassword) {
            setPasswordError("New passwords do not match.");
            return;
        }
        if (newPassword.length < 6) {
            setPasswordError("New password must be at least 6 characters.");
            return;
        }

        setSavingPassword(true);
        try {
            await changePasswordApi(currentPassword, newPassword);
            setPasswordSuccess("Password changed successfully.");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: unknown) {
            if (err instanceof Error && err.message.startsWith("400")) {
                setPasswordError("Current password is incorrect.");
            } else {
                setPasswordError(err instanceof Error ? err.message : "Password change failed.");
            }
        } finally {
            setSavingPassword(false);
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

            {/* Profile form */}
            <div className="rounded-lg border p-4">
                <h2 className="text-lg font-semibold">Profile</h2>
                <form className="mt-4 space-y-3" onSubmit={handleProfileSubmit}>
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
                        <p className="mt-1 text-xs text-muted-foreground">
                            Changing your email will log you out.
                        </p>
                    </div>

                    <Button type="submit" disabled={savingProfile}>
                        {savingProfile ? "Saving..." : "Save changes"}
                    </Button>
                </form>

                {profileError && (
                    <p className="mt-3 text-sm text-red-600">{profileError}</p>
                )}
                {profileSuccess && (
                    <p className="mt-3 text-sm text-green-700">{profileSuccess}</p>
                )}
            </div>

            {/* Password form */}
            <div className="rounded-lg border p-4">
                <h2 className="text-lg font-semibold">Change Password</h2>
                <form className="mt-4 space-y-3" onSubmit={handlePasswordSubmit}>
                    <div>
                        <label className="text-sm font-medium">
                            Current password
                        </label>
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
                        <label className="text-sm font-medium">
                            Confirm new password
                        </label>
                        <Input
                            className="mt-1"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    <Button type="submit" disabled={savingPassword}>
                        {savingPassword ? "Saving..." : "Update password"}
                    </Button>
                </form>

                {passwordError && (
                    <p className="mt-3 text-sm text-red-600">{passwordError}</p>
                )}
                {passwordSuccess && (
                    <p className="mt-3 text-sm text-green-700">{passwordSuccess}</p>
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
