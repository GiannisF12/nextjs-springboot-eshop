"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/form-field";
import { useAuth } from "@/features/auth/auth-context";
import type { Gender } from "@/lib/auth-types";
import { type ProfileFormValues, profileSchema } from "@/lib/validation";

export default function ProfilePage() {
    const router = useRouter();
    const { user, updateProfile, logout } = useAuth();

    /**
     * react-hook-form with zod. Defaults are filled in once the auth
     * context has the user, via reset() inside an effect. The 16-year
     * minimum and birthday-not-in-future rules live in profileSchema,
     * not in this component.
     */
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        mode: "onBlur",
        defaultValues: {
            name: "",
            email: "",
            // Empty string maps to "Not specified" in the <select>;
            // converted to null at submit time before the API call.
            gender: "",
            birthday: "",
        },
    });

    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Users must be at least 16 → set max date on the input to 16y ago.
    // The schema double-checks this, but the picker UI helps too.
    const maxBirthday = useMemo(() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 16);
        return d.toISOString().slice(0, 10);
    }, []);

    // Once the auth context loads, hydrate the form with the user's
    // existing values. reset() vs setValue() because we want this to
    // count as the new "default" — going back to it shouldn't mark
    // anything dirty.
    useEffect(() => {
        if (user) {
            reset({
                name: user.name ?? "",
                email: user.email,
                // user.gender comes back as Gender | null from /me;
                // map null → "" so the <select> shows "Not specified".
                gender: user.gender ?? "",
                birthday: user.birthday ?? "",
            });
        }
    }, [user, reset]);

    if (!user) return null; // layout handles loading/redirect

    async function onValid(values: ProfileFormValues) {
        setServerError(null);
        setSuccess(null);
        setSaving(true);

        const oldEmail = user?.email;
        const birthdayToSend =
            !values.birthday || values.birthday.trim() === ""
                ? null
                : values.birthday;

        // Map "" (the "Not specified" option in the <select>) back to
        // null for the API; backend treats both the same but null is
        // the canonical "no value" for an optional field.
        const genderToSend: Gender | null =
            !values.gender ? null : values.gender;

        try {
            await updateProfile(
                values.name,
                values.email,
                genderToSend,
                birthdayToSend
            );

            // Email change always logs the user out — the JWT is keyed
            // off the old email, so we kick them back to /login with a
            // friendly notice.
            if (
                oldEmail &&
                oldEmail.toLowerCase() !== values.email.toLowerCase()
            ) {
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
                setServerError("This email is already in use.");
            } else if (msg.includes("at least 16") || msg.includes("16 years")) {
                setServerError("You must be at least 16 years old.");
            } else if (msg.includes("future")) {
                setServerError("Birthday cannot be in the future.");
            } else if (msg.startsWith("400")) {
                setServerError(
                    "Something is wrong with the data you entered."
                );
            } else {
                setServerError(msg || "Update failed.");
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
                    Update your personal details. Gender and birthday are
                    optional.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form
                    className="space-y-4"
                    onSubmit={handleSubmit(onValid)}
                    noValidate
                >
                    <FormField
                        label="Username"
                        disabled={saving}
                        error={errors.name?.message}
                        helper="Your display name. Your real name goes on your shipping address."
                        {...register("name")}
                    />

                    <FormField
                        label="Email"
                        type="email"
                        autoComplete="email"
                        disabled={saving}
                        error={errors.email?.message}
                        helper="Changing your email will log you out."
                        {...register("email")}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block space-y-1">
                            <span className="text-sm font-medium">Gender</span>
                            <select
                                className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={saving}
                                {...register("gender")}
                            >
                                <option value="">Not specified</option>
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                                <option value="OTHER">Other</option>
                                <option value="PREFER_NOT_TO_SAY">
                                    Prefer not to say
                                </option>
                            </select>
                        </label>

                        <FormField
                            label="Birthday"
                            type="date"
                            max={maxBirthday}
                            disabled={saving}
                            error={errors.birthday?.message}
                            helper="You must be at least 16 years old."
                            {...register("birthday")}
                        />
                    </div>

                    <Button type="submit" disabled={saving}>
                        {saving ? "Saving..." : "Save changes"}
                    </Button>

                    {serverError && (
                        <p className="text-sm text-red-600">{serverError}</p>
                    )}
                    {success && (
                        <p className="text-sm text-green-700">{success}</p>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}
