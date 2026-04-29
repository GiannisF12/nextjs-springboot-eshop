"use client";

import { useState } from "react";
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
import { PasswordChecklist } from "@/components/password-checklist";
import { useAuth } from "@/features/auth/auth-context";
import { changePasswordApi } from "@/lib/api";
import {
    type PasswordChangeFormValues,
    passwordChangeSchema,
} from "@/lib/validation";

export default function SecurityPage() {
    const { user } = useAuth();

    /**
     * Same react-hook-form + zod pattern as the rest of the forms.
     * Reuses passwordChangeSchema from lib/validation, which in turn
     * shares the same `passwordSchema` rules signup uses — change the
     * rules in one place and every form picks them up.
     */
    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<PasswordChangeFormValues>({
        resolver: zodResolver(passwordChangeSchema),
        mode: "onBlur",
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    const newPasswordValue = watch("newPassword");

    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    if (!user) return null; // layout handles loading/redirect

    async function onValid(values: PasswordChangeFormValues) {
        setServerError(null);
        setSuccess(null);
        setSaving(true);
        try {
            await changePasswordApi(
                values.currentPassword,
                values.newPassword
            );
            setSuccess("Password changed successfully.");
            // Clear all three fields so the form is ready for another
            // change without leaving the new password sitting in the DOM.
            reset({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        } catch (err: unknown) {
            // Backend returns 400 when the *current* password is wrong.
            // Anything else is treated as a generic failure.
            if (err instanceof Error && err.message.startsWith("400")) {
                setServerError("Current password is incorrect.");
            } else {
                setServerError(
                    err instanceof Error
                        ? err.message
                        : "Password change failed."
                );
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
                <form
                    className="space-y-4"
                    onSubmit={handleSubmit(onValid)}
                    noValidate
                >
                    <FormField
                        label="Current password"
                        type="password"
                        autoComplete="current-password"
                        disabled={saving}
                        error={errors.currentPassword?.message}
                        {...register("currentPassword")}
                    />

                    <div>
                        <FormField
                            label="New password"
                            type="password"
                            autoComplete="new-password"
                            placeholder="At least 8 characters"
                            disabled={saving}
                            error={errors.newPassword?.message}
                            {...register("newPassword")}
                        />
                        <PasswordChecklist value={newPasswordValue} />
                    </div>

                    <FormField
                        label="Confirm new password"
                        type="password"
                        autoComplete="new-password"
                        disabled={saving}
                        error={errors.confirmPassword?.message}
                        {...register("confirmPassword")}
                    />

                    <Button type="submit" disabled={saving}>
                        {saving ? "Saving..." : "Update password"}
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
