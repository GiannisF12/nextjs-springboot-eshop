import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AuthProvider } from "@/features/auth/auth-context";
import { CookieConsent } from "@/features/consent/cookie-consent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "E-Shop",
  description: "Next.js + Spring Boot E-Shop",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
            <div className="flex min-h-screen flex-col">
                <SiteHeader />
                <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
                    {children}
                </main>
                <SiteFooter />
            </div>
            {/* Global toast outlet — bottom-right so it doesn't cover
                the header nav (Cart, Orders, etc.) on smaller windows.
                richColors gives green/red variants for success/error
                without us styling each call. */}
            <Toaster richColors position="bottom-right" />
            <CookieConsent />
        </AuthProvider>
        </body>
        </html>
    );
}