"use client";

import { useEffect, useState } from "react";

/**
 * Formats backend timestamps in the visitor's local timezone.
 *
 * Why a component instead of a plain helper:
 *   The backend stores UTC (`Instant` → "...Z" in JSON) which is
 *   correct, but server-rendered pages format dates inside Node — and
 *   our Docker container runs in UTC. That meant a Greek visitor saw
 *   13:45 instead of 16:45.
 *
 *   `toLocaleString` on the SERVER uses Node's TZ.
 *   `toLocaleString` on the CLIENT uses the browser's TZ (always
 *   correct — the OS knows where the user is).
 *
 *   So we deliberately render once on the server (avoids layout shift
 *   and gives crawlers *something* readable) and re-render in the
 *   browser after hydration. `suppressHydrationWarning` is intentional
 *   here: the text genuinely differs by design.
 */
type Format = "datetime" | "date" | "short";

export function LocalTime({
    iso,
    format = "datetime",
}: {
    iso: string;
    format?: Format;
}) {
    const [text, setText] = useState<string>(() => formatIso(iso, format));

    useEffect(() => {
        // Browser-side re-format. Runs once on mount, and again whenever
        // the iso/format props change (e.g. an order updates in place).
        setText(formatIso(iso, format));
    }, [iso, format]);

    return <span suppressHydrationWarning>{text}</span>;
}

function formatIso(iso: string, format: Format): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;

    switch (format) {
        case "date":
            // "24/04/2026" — date only.
            return d.toLocaleDateString();
        case "short":
            // "Apr 24, 17:01" — compact, used in the timeline.
            return d.toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        case "datetime":
        default:
            // Full date + time + seconds, locale-aware.
            return d.toLocaleString();
    }
}
