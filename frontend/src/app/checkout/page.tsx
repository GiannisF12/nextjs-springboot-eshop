"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import { CartSyncNotice } from "@/components/cart-sync-notice";
import { useCart } from "@/lib/cart-store";
import { useCartSync } from "@/lib/use-cart-sync";
import {
    type Courier,
    type DiscountCode,
    type PaymentMethod,
    type StoreSettings,
    computeCourierShipping,
    createCheckoutSession,
    createOrder,
    getCouriers,
    getStoreSettings,
    validateDiscountCode,
} from "@/lib/api";
import {
    type CheckoutFormValues,
    checkoutSchema,
} from "@/lib/validation";

/**
 * Turn the raw error message thrown by apiFetch into something we can
 * actually show to a customer. Three shapes we care about:
 *
 *   1) "Backend is unreachable..." → real network failure, show the
 *      Docker hint so the dev/admin knows what to fix.
 *   2) "409 {...}" with a JSON body → HTTP error from the backend,
 *      extract the human message out of the body.
 *   3) Anything else → show raw, no hint.
 */
function formatCheckoutError(raw: string): {
    message: string;
    showDockerHint: boolean;
} {
    if (raw.toLowerCase().includes("unreachable")) {
        return { message: raw, showDockerHint: true };
    }

    // apiFetch throws "<status> <body>" for HTTP errors. Spring's error
    // body is JSON, so try to pull out a friendlier field.
    const httpMatch = raw.match(/^(\d{3})\s+([\s\S]*)$/);
    if (httpMatch) {
        const [, , body] = httpMatch;
        try {
            const parsed = JSON.parse(body) as {
                error?: string;
                message?: string;
            };
            return {
                message: parsed.error ?? parsed.message ?? body,
                showDockerHint: false,
            };
        } catch {
            return { message: body, showDockerHint: false };
        }
    }

    return { message: raw, showDockerHint: false };
}

export default function CheckoutPage() {
    const router = useRouter();

    const items = useCart((s) => s.items);
    const total = useCart((s) => s.totalPrice());
    const clear = useCart((s) => s.clear);

    // Reconciles cart lines with the server on mount. Also runs on
    // /cart — any change there is already visible by the time the
    // customer clicks Checkout, but we re-check here as a safety net.
    const { syncing, issues: syncIssues } = useCartSync();

    /**
     * react-hook-form with a zod resolver. `onBlur` validation gives
     * the customer immediate feedback when they tab out of a field
     * without yelling at them while they're still typing it.
     */
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CheckoutFormValues>({
        resolver: zodResolver(checkoutSchema),
        mode: "onBlur",
        defaultValues: {
            customerName: "",
            phone: "",
            addressLine: "",
            city: "",
            zip: "",
        },
    });

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Payment method. STRIPE is intentionally not selectable yet — the
    // online-payments integration ships in a later phase. Until then,
    // every order placed through the UI is COD.
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");

    // Discount-code state. `applied` holds the validated code from the
    // server once the customer clicks Apply; until then we only have
    // the raw input string. Null after Apply means "tried, invalid".
    const [codeInput, setCodeInput] = useState("");
    const [applied, setApplied] = useState<DiscountCode | null>(null);
    const [codeStatus, setCodeStatus] = useState<
        "idle" | "checking" | "invalid"
    >("idle");

    // Live store settings for the shipping preview. Loaded once on
    // mount; the backend re-runs the same calculation at order creation
    // so this is purely a UI hint, never the source of truth.
    const [settings, setSettings] = useState<StoreSettings | null>(null);
    useEffect(() => {
        let cancelled = false;
        void getStoreSettings()
            .then((s) => {
                if (!cancelled) setSettings(s);
            })
            .catch(() => {
                // Non-fatal: if settings fail to load we just don't show
                // the shipping line. The order will still go through and
                // the backend will compute shipping correctly.
            });
        return () => {
            cancelled = true;
        };
    }, []);

    // Couriers the customer can choose from. Loaded once on mount;
    // default selection is the first enabled courier (ACS by sort order).
    const [couriers, setCouriers] = useState<Courier[]>([]);
    const [courierId, setCourierId] = useState<number | null>(null);
    // Distinguishes "still loading" from "load failed" so the picker can
    // show a real error instead of an endless "Loading..." that silently
    // blocks checkout (the submit button needs a courier selected).
    const [couriersError, setCouriersError] = useState(false);
    useEffect(() => {
        let cancelled = false;
        void getCouriers()
            .then((list) => {
                if (cancelled) return;
                setCouriers(list);
                setCouriersError(false);
                if (list.length > 0) setCourierId(list[0].id);
            })
            .catch(() => {
                if (cancelled) return;
                // Surface the failure so the customer knows to refresh,
                // rather than being stuck behind a disabled Place order
                // button with no explanation.
                setCouriersError(true);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const selectedCourier =
        couriers.find((c) => c.id === courierId) ?? null;

    /**
     * Derived totals — if a code is applied we take the percent off the
     * raw cart total, rounded to 2 decimals (same rounding the backend
     * uses). Shipping is added on top, matching the backend formula:
     *
     *     payable = items*(1 - pct/100) + shipping
     *
     * Free shipping is keyed off the *pre-discount* items subtotal, so
     * the rule reads "free shipping over €X in product value".
     */
    const discountAmount = applied
        ? Math.round(total * applied.percentOff) / 100
        : 0;
    const itemsAfterDiscount = Math.max(0, total - discountAmount);
    const shippingCost =
        settings && selectedCourier
            ? computeCourierShipping(total, selectedCourier.price, settings)
            : 0;
    const payableTotal =
        Math.round((itemsAfterDiscount + shippingCost) * 100) / 100;

    // Payment-method usability, derived from store settings. A method is
    // selectable only when available AND admin-enabled; otherwise it shows
    // greyed with a reason: "Coming soon" until card payments exist, or
    // "Temporarily unavailable" when the admin has turned it off.
    const codUsable = settings ? settings.codEnabled : true;
    const cardUsable = settings
        ? settings.cardAvailable && settings.cardEnabled
        : false;
    const codBadge =
        settings && !settings.codEnabled ? "Temporarily unavailable" : null;
    const cardBadge =
        !settings || !settings.cardAvailable
            ? "Coming soon"
            : !settings.cardEnabled
              ? "Temporarily unavailable"
              : null;

    // Keep the selected method valid as settings load: if the current pick
    // isn't usable, fall back to the first usable method.
    useEffect(() => {
        if (!settings) return;
        const codOk = settings.codEnabled;
        const cardOk = settings.cardAvailable && settings.cardEnabled;
        setPaymentMethod((prev) => {
            if (prev === "COD" && codOk) return prev;
            if (prev === "STRIPE" && cardOk) return prev;
            if (codOk) return "COD";
            if (cardOk) return "STRIPE";
            return prev;
        });
    }, [settings]);

    async function onApplyCode() {
        const code = codeInput.trim();
        if (!code) return;
        setCodeStatus("checking");
        try {
            const result = await validateDiscountCode(code);
            if (result) {
                setApplied(result);
                setCodeStatus("idle");
            } else {
                setApplied(null);
                setCodeStatus("invalid");
            }
        } catch {
            setApplied(null);
            setCodeStatus("invalid");
        }
    }

    function onRemoveCode() {
        setApplied(null);
        setCodeInput("");
        setCodeStatus("idle");
    }

    const paymentUsable = paymentMethod === "COD" ? codUsable : cardUsable;
    const canSubmit =
        items.length > 0 && courierId !== null && paymentUsable;

    if (items.length === 0) {
        return (
            <div className="space-y-3">
                <h1 className="text-2xl font-semibold">Checkout</h1>
                <p className="text-sm text-muted-foreground">Your cart is empty.</p>
                <Button asChild variant="secondary">
                    <Link href="/products">Go to products</Link>
                </Button>
            </div>
        );
    }

    /**
     * Called by RHF *only* after the schema passes — `values` is the
     * already-validated, trimmed, typed object. No need to .trim()
     * anything here, the schema did it.
     */
    async function onValid(values: CheckoutFormValues) {
        setError(null);
        if (!canSubmit || submitting) return;

        try {
            setSubmitting(true);

            const payload = {
                ...values,
                items: items.map((it) => ({
                    productId: it.id,
                    size: it.size, // required — backend rejects orders without a size
                    price: it.price, // JSON number -> backend BigDecimal OK
                    qty: it.qty,
                })),
                // Only include when the customer has successfully
                // applied a code — the backend re-validates anyway.
                ...(applied ? { discountCode: applied.code } : {}),
                paymentMethod,
                courierId: courierId as number, // guaranteed by canSubmit
            };

            const created = await createOrder(payload);

            if (paymentMethod === "STRIPE") {
                // Hand off to Stripe's hosted checkout. The order stays
                // "pending payment" until the webhook confirms it. Create the
                // session BEFORE clearing the cart so a failure here doesn't
                // lose the customer's cart.
                const { url } = await createCheckoutSession(created.id);
                clear();
                window.location.assign(url);
                return;
            }

            // COD: order is placed immediately.
            clear();
            router.push(`/orders/${created.id}`);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to create order");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Checkout</h1>
                    <p className="text-sm text-muted-foreground">
                        Total €{payableTotal.toFixed(2)}
                        {applied && (
                            <span className="text-green-700">
                                {" "}
                                (saved €{discountAmount.toFixed(2)} with{" "}
                                <span className="font-mono">{applied.code}</span>)
                            </span>
                        )}
                    </p>
                </div>

                {/* Optional: disable back button while submitting */}
                <Button asChild variant="ghost" disabled={submitting}>
                    <Link href="/cart" aria-disabled={submitting} tabIndex={submitting ? -1 : 0}>
                        Back to cart
                    </Link>
                </Button>
            </div>

            <CartSyncNotice syncing={syncing} issues={syncIssues} />

            <form
                onSubmit={handleSubmit(onValid)}
                className={`grid gap-6 lg:grid-cols-2 ${submitting ? "opacity-60" : ""}`}
                aria-busy={submitting}
                noValidate
            >
                {/* Left column — customer details + shipping address stacked,
                    so the courier + payment choices sit higher on the right. */}
                <div className="space-y-6">
                    <div className="space-y-3 rounded-xl border p-4">
                        <h2 className="font-semibold">Customer details</h2>

                        <div className="grid gap-3">
                            <FormField
                                label="Full name"
                                placeholder="e.g. Maria Papadopoulou"
                                disabled={submitting}
                                error={errors.customerName?.message}
                                {...register("customerName")}
                            />
                            <FormField
                                label="Phone"
                                placeholder="e.g. +30 6912345678"
                                inputMode="tel"
                                disabled={submitting}
                                error={errors.phone?.message}
                                helper="Digits, spaces and dashes only — no letters or emojis"
                                {...register("phone")}
                            />
                        </div>
                    </div>

                    <div className="space-y-3 rounded-xl border p-4">
                        <h2 className="font-semibold">Shipping address</h2>

                        <div className="grid gap-3">
                            <FormField
                                label="Address line"
                                placeholder="e.g. Ermou 25"
                                disabled={submitting}
                                error={errors.addressLine?.message}
                                {...register("addressLine")}
                            />
                            <FormField
                                label="City"
                                placeholder="e.g. Athens"
                                disabled={submitting}
                                error={errors.city?.message}
                                {...register("city")}
                            />
                            <FormField
                                label="Postal code"
                                placeholder="e.g. 10563"
                                inputMode="numeric"
                                disabled={submitting}
                                error={errors.zip?.message}
                                {...register("zip")}
                            />
                        </div>
                    </div>
                </div>

                {/* Right column — courier, payment, discount, totals, submit. */}
                <div className="space-y-3 rounded-xl border p-4">

                    {/* Courier picker. The customer chooses who delivers;
                        each courier has its own price. Free-shipping over
                        the threshold still applies and is previewed in the
                        totals below. */}
                    <div className="rounded-md border bg-muted/30 p-3">
                        <p className="mb-2 text-sm font-medium">Courier</p>
                        {couriersError ? (
                            <p className="text-xs text-red-600">
                                Couldn&apos;t load delivery options. Please
                                refresh the page and try again.
                            </p>
                        ) : couriers.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                                Loading delivery options...
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {couriers.map((c) => (
                                    <label
                                        key={c.id}
                                        className="flex cursor-pointer items-center justify-between gap-3 rounded-md border bg-background p-3 hover:border-foreground/40"
                                    >
                                        <span className="flex items-center gap-3">
                                            <input
                                                type="radio"
                                                name="courier"
                                                value={c.id}
                                                checked={courierId === c.id}
                                                onChange={() =>
                                                    setCourierId(c.id)
                                                }
                                                disabled={submitting}
                                            />
                                            <span className="text-sm font-medium">
                                                {c.name}
                                            </span>
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            €{c.price.toFixed(2)}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Payment method picker — driven by admin settings. A
                        method is selectable only when usable; otherwise it's
                        greyed with a reason badge ("Coming soon" until card
                        payments exist, or "Temporarily unavailable" when the
                        admin has turned it off). */}
                    <div className="rounded-md border bg-muted/30 p-3">
                        <p className="mb-2 text-sm font-medium">
                            Payment method
                        </p>
                        <div className="space-y-2">
                            <label
                                className={`flex items-start gap-3 rounded-md border bg-background p-3 ${
                                    codUsable
                                        ? "cursor-pointer hover:border-foreground/40"
                                        : "cursor-not-allowed opacity-60"
                                }`}
                                aria-disabled={!codUsable}
                            >
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="COD"
                                    checked={paymentMethod === "COD"}
                                    onChange={() => setPaymentMethod("COD")}
                                    disabled={submitting || !codUsable}
                                    className="mt-0.5"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        Cash on delivery
                                        {codBadge && (
                                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                                                {codBadge}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Pay the courier in cash when your
                                        order arrives.
                                    </div>
                                </div>
                            </label>

                            <label
                                className={`flex items-start gap-3 rounded-md border bg-background p-3 ${
                                    cardUsable
                                        ? "cursor-pointer hover:border-foreground/40"
                                        : "cursor-not-allowed opacity-60"
                                }`}
                                aria-disabled={!cardUsable}
                            >
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="STRIPE"
                                    checked={paymentMethod === "STRIPE"}
                                    onChange={() => setPaymentMethod("STRIPE")}
                                    disabled={submitting || !cardUsable}
                                    className="mt-0.5"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        Card payment
                                        {cardBadge && (
                                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                                                {cardBadge}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Pay securely online with your debit
                                        or credit card.
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Discount code — optional promo, applied right before
                        the total so it reads naturally after the shipping
                        and payment choices. */}
                    <div className="rounded-md border bg-muted/30 p-3">
                        <p className="mb-2 text-sm font-medium">
                            Discount code
                        </p>
                        {applied ? (
                            <div className="flex items-center justify-between gap-2">
                                <div className="text-sm">
                                    <span className="rounded bg-green-100 px-2 py-0.5 font-mono font-semibold text-green-800">
                                        {applied.code}
                                    </span>{" "}
                                    <span className="text-muted-foreground">
                                        applied &middot; −{applied.percentOff}% (−€
                                        {discountAmount.toFixed(2)})
                                    </span>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onRemoveCode}
                                    disabled={submitting}
                                >
                                    Remove
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-start gap-2">
                                <Input
                                    disabled={
                                        submitting ||
                                        codeStatus === "checking"
                                    }
                                    value={codeInput}
                                    onChange={(e) => {
                                        setCodeInput(e.target.value);
                                        if (codeStatus === "invalid") {
                                            setCodeStatus("idle");
                                        }
                                    }}
                                    placeholder="e.g. SAVE10"
                                    className="font-mono uppercase"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => void onApplyCode()}
                                    disabled={
                                        submitting ||
                                        codeStatus === "checking" ||
                                        !codeInput.trim()
                                    }
                                >
                                    {codeStatus === "checking"
                                        ? "Checking..."
                                        : "Apply"}
                                </Button>
                            </div>
                        )}
                        {codeStatus === "invalid" && (
                            <p className="mt-2 text-xs text-red-600">
                                That code isn&apos;t valid or has been disabled.
                            </p>
                        )}
                    </div>

                    {/* Totals summary — subtotal + (optional discount) +
                        shipping + final payable. Shipping comes from the
                        live store settings; backend recomputes server-
                        side at order creation. */}
                    <div className="rounded-md border p-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Subtotal
                            </span>
                            <span>€{total.toFixed(2)}</span>
                        </div>
                        {applied && (
                            <div className="mt-1 flex justify-between text-green-700">
                                <span>
                                    Discount ({applied.code} −{applied.percentOff}%)
                                </span>
                                <span>−€{discountAmount.toFixed(2)}</span>
                            </div>
                        )}
                        {settings && (
                            <div className="mt-1 flex justify-between">
                                <span className="text-muted-foreground">
                                    Shipping
                                    {selectedCourier && (
                                        <span className="ml-1">
                                            ({selectedCourier.name})
                                        </span>
                                    )}
                                    {settings.freeShippingThreshold > 0 &&
                                        shippingCost === 0 && (
                                            <span className="ml-1 text-xs text-green-700">
                                                (free over €
                                                {settings.freeShippingThreshold.toFixed(
                                                    2
                                                )}
                                                )
                                            </span>
                                        )}
                                </span>
                                <span>
                                    {shippingCost === 0 ? (
                                        <span className="text-green-700">
                                            Free
                                        </span>
                                    ) : (
                                        `€${shippingCost.toFixed(2)}`
                                    )}
                                </span>
                            </div>
                        )}
                        <div className="mt-2 flex justify-between border-t pt-2 font-semibold">
                            <span>Total</span>
                            <span>€{payableTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    {error &&
                        (() => {
                            const { message, showDockerHint } =
                                formatCheckoutError(error);
                            return (
                                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    {message}
                                    {showDockerHint && (
                                        <div className="mt-1 text-xs text-red-700/80">
                                            If you&apos;re using Docker, make sure the
                                            backend is running:{" "}
                                            <code>docker compose up -d backend</code>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                    <Button type="submit" disabled={!canSubmit || submitting} className="w-full">
                        {submitting ? "Placing order..." : "Place order"}
                    </Button>
                </div>
            </form>
        </div>
    );
}