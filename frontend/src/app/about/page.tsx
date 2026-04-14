import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <h1 className="text-3xl font-bold">About E-Shop</h1>

            <p className="text-muted-foreground leading-relaxed">
                E-Shop is a modern full-stack e-commerce application built as a
                portfolio project. It demonstrates real-world patterns used in
                professional web development, including user authentication,
                product management, order processing, and an admin dashboard.
            </p>

            <h2 className="text-xl font-semibold">Tech Stack</h2>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                <li>
                    <strong className="text-foreground">Frontend:</strong>{" "}
                    Next.js, React, TypeScript, Tailwind CSS, shadcn/ui
                </li>
                <li>
                    <strong className="text-foreground">Backend:</strong>{" "}
                    Spring Boot, Java, Spring Security, Spring Data JPA
                </li>
                <li>
                    <strong className="text-foreground">Database:</strong>{" "}
                    PostgreSQL
                </li>
                <li>
                    <strong className="text-foreground">Infrastructure:</strong>{" "}
                    Docker, Docker Compose
                </li>
            </ul>

            <h2 className="text-xl font-semibold">Features</h2>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                <li>Product browsing with search, filtering, and pagination</li>
                <li>Shopping cart and guest or authenticated checkout</li>
                <li>User registration and session-based authentication</li>
                <li>Order history for logged-in customers</li>
                <li>Admin dashboard with live stats and order management</li>
                <li>Product and category CRUD with image upload</li>
            </ul>

            <div className="pt-2">
                <Button asChild>
                    <Link href="/products">Browse Products</Link>
                </Button>
            </div>
        </div>
    );
}
