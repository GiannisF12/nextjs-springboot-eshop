"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAuth } from "@/features/auth/auth-context";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/form-field";
import { PasswordChecklist } from "@/components/password-checklist";
import { type SignupFormValues, signupSchema } from "@/lib/validation";

export default function SignupPage() {
    const router = useRouter();
    const { register: registerUser } = useAuth();

    /**
     * Validation runs on blur (so the user gets feedback when they tab
     * out of a field) plus on submit. Re-validation while typing is
     * left default — RHF only re-runs after the field has been
     * touched, so a fresh page doesn't yell about empty fields.
     */
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
        mode: "onBlur",
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    // Live-watched password value drives the strength checklist below
    // the field. RHF's `watch` re-renders only this component, so it
    // stays cheap.
    const passwordValue = watch("password");

    const [submitting, setSubmitting] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    async function onValid(values: SignupFormValues) {
        setServerError(null);
        setSubmitting(true);
        try {
            await registerUser(values.email, values.password, values.name);
            router.push("/");
        } catch (err: unknown) {
            // Server-side errors that the client can't predict (email
            // already taken, network issues). Inline validation has
            // already filtered out shape mistakes.
            if (err instanceof Error && err.message.includes("409")) {
                setServerError("An account with this email already exists.");
            } else {
                setServerError("Registration failed. Please try again.");
            }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="max-w-md space-y-4">
            <h1 className="text-2xl font-semibold">Create an account</h1>

            <form onSubmit={handleSubmit(onValid)} className="space-y-3" noValidate>
                <FormField
                    label="Username"
                    placeholder="Pick a display name"
                    disabled={submitting}
                    error={errors.name?.message}
                    {...register("name")}
                />
                <FormField
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={submitting}
                    error={errors.email?.message}
                    {...register("email")}
                />
                <div>
                    <FormField
                        label="Password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="At least 8 characters"
                        disabled={submitting}
                        error={errors.password?.message}
                        {...register("password")}
                    />
                    <PasswordChecklist value={passwordValue} />
                </div>
                <FormField
                    label="Confirm password"
                    type="password"
                    autoComplete="new-password"
                    disabled={submitting}
                    error={errors.confirmPassword?.message}
                    {...register("confirmPassword")}
                />

                <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? "Creating account..." : "Sign up"}
                </Button>
            </form>

            {serverError && (
                <p className="text-sm text-red-600">{serverError}</p>
            )}

            <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="underline">
                    Log in
                </Link>
            </p>
        </div>
    );
}
