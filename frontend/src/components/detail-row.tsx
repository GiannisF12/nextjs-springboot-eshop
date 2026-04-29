/**
 * Labelled key/value row used on order detail pages — both the
 * customer-facing /orders/[id] and the admin /admin/orders ship-to
 * card. Fixed-width label so a stack of these aligns into a tidy
 * two-column block without a real <table>.
 *
 *   <DetailRow label="Phone" value="+30 6912345678" />
 *
 * Server-component-safe — no client-only APIs used here, so it can
 * be imported from server pages too.
 */
export function DetailRow({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="flex gap-2 text-sm">
            <span className="w-20 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
            </span>
            <span className="font-medium">{value}</span>
        </div>
    );
}
