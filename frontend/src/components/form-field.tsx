"use client";

import { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Tiny wrapper around <Input> that keeps the label + helper + error
 * triplet consistent across the app. Designed for react-hook-form:
 * `register("foo")` returns the props (ref + onChange + name) which
 * spread straight onto this component.
 *
 *   <FormField label="Phone" error={errors.phone?.message}
 *              {...register("phone")} placeholder="+30 ..." />
 *
 * When `error` is set the input gets a red border. We keep the helper
 * text rendered when there's no error so the layout doesn't jump as
 * the user types.
 */
type FormFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    error?: string;
    helper?: string;
};

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
    function FormField({ label, error, helper, className, ...inputProps }, ref) {
        return (
            <label className="block space-y-1">
                <span className="text-sm font-medium">{label}</span>
                <Input
                    ref={ref}
                    aria-invalid={error ? true : undefined}
                    className={cn(
                        error &&
                            "border-red-500 focus-visible:ring-red-500/30",
                        className
                    )}
                    {...inputProps}
                />
                {error ? (
                    <span className="block text-xs text-red-600">{error}</span>
                ) : helper ? (
                    <span className="block text-xs text-muted-foreground">
                        {helper}
                    </span>
                ) : null}
            </label>
        );
    }
);
