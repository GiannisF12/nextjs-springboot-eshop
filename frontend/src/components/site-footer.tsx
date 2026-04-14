import Link from "next/link";

export function SiteFooter() {
    return (
        <footer className="mt-16 bg-neutral-900 text-neutral-300">
            <div className="mx-auto max-w-6xl px-4 py-10">
                <div className="grid gap-8 sm:grid-cols-3">
                    <div>
                        <h3 className="text-lg font-semibold text-white">
                            E-Shop
                        </h3>
                        <p className="mt-2 text-sm text-neutral-400">
                            Quality products at great prices. Built with Next.js
                            and Spring Boot.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold text-white">Shop</h3>
                        <ul className="mt-2 space-y-2 text-sm">
                            <li>
                                <Link
                                    href="/products"
                                    className="hover:text-white"
                                >
                                    All Products
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/cart"
                                    className="hover:text-white"
                                >
                                    Cart
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-white">Company</h3>
                        <ul className="mt-2 space-y-2 text-sm">
                            <li>
                                <Link
                                    href="/about"
                                    className="hover:text-white"
                                >
                                    About Us
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 border-t border-neutral-700 pt-6 text-center text-sm text-neutral-500">
                    &copy; {new Date().getFullYear()} E-Shop. All rights
                    reserved.
                </div>
            </div>
        </footer>
    );
}
