import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Cookie Policy",
};

/**
 * Cookie Policy — TEMPLATE, not legal advice.
 *
 * Fill the [bracketed] placeholders with the client's real details and have
 * it reviewed before launch (see the project pre-deploy checklist). Update
 * the "cookies we use" list whenever a new cookie/script is added, and bump
 * CONSENT_VERSION in lib/consent.ts when the policy materially changes.
 */
export default function CookiePolicyPage() {
    return (
        <article className="mx-auto max-w-3xl space-y-6">
            <header className="space-y-1">
                <h1 className="text-2xl font-semibold">Cookie Policy</h1>
                <p className="text-sm text-muted-foreground">
                    Last updated: [DATE]
                </p>
            </header>

            <section className="space-y-2 text-sm leading-relaxed">
                <p>
                    This Cookie Policy explains how [Business legal name]
                    (&ldquo;we&rdquo;, &ldquo;us&rdquo;) uses cookies and
                    similar technologies on this website. Cookies are small
                    text files stored on your device that help a website
                    function and remember your preferences.
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-lg font-semibold">Cookies we use</h2>
                <div className="space-y-1 text-sm leading-relaxed">
                    <p className="font-medium">Strictly necessary cookies</p>
                    <p className="text-muted-foreground">
                        These are required for the website to work and cannot
                        be switched off. They do not require your consent. We
                        currently use one such cookie:
                    </p>
                    <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                        <li>
                            <span className="font-mono">JSESSIONID</span> —
                            keeps you signed in to your account during your
                            visit. It is removed when you log out or your
                            session expires.
                        </li>
                    </ul>
                </div>
            </section>

            <section className="space-y-2">
                <h2 className="text-lg font-semibold">
                    Analytics &amp; marketing cookies
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    With your consent, we may in the future use analytics or
                    marketing cookies (for example, to understand which
                    countries our visitors come from, or to measure the
                    performance of our social-media campaigns). These are
                    <span className="font-medium"> not</span> active unless you
                    click &ldquo;Accept&rdquo; on our cookie banner. If you
                    choose &ldquo;Reject&rdquo;, only the strictly necessary
                    cookie above is used.
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-lg font-semibold">
                    Managing your choice
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    You can accept or reject non-essential cookies using the
                    banner shown on your first visit. To change your choice at
                    any time, use the <span className="font-medium">Cookie
                    settings</span> link in the footer. You can also clear
                    cookies through your browser settings.
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-lg font-semibold">Contact</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Data controller: [Business legal name], [registered
                    address], VAT/ΑΦΜ [ΑΦΜ number]. For any questions about
                    this policy or your data, contact us at{" "}
                    <span className="font-medium">[contact email]</span>.
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-lg font-semibold">
                    Changes to this policy
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    We may update this policy as our use of cookies changes.
                    When we make material changes, we will ask for your consent
                    again.
                </p>
            </section>
        </article>
    );
}
