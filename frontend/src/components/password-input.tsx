"use client";

import { useState, forwardRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Drop-in replacement for <Input type="password"> that adds a show/hide
 * toggle button. Accepts all the same props as Input except `type`,
 * which is managed internally.
 */
type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
    function PasswordInput({ className, ...props }, ref) {
        const [show, setShow] = useState(false);

        return (
            <div className="relative">
                <Input
                    ref={ref}
                    type={show ? "text" : "password"}
                    className={cn("pr-10", className)}
                    {...props}
                />
                <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    tabIndex={-1}
                    aria-label={show ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                    {show ? (
                        <EyeOff className="h-4 w-4" />
                    ) : (
                        <Eye className="h-4 w-4" />
                    )}
                </button>
            </div>
        );
    }
);
