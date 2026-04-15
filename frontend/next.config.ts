import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "picsum.photos",
            },
            {
                // Allowed so the demo seeder's Unsplash product photos
                // render in <Image>. The real shop owner will upload
                // images via /api/images, which are served from localhost/backend.
                protocol: "https",
                hostname: "images.unsplash.com",
            },
            {
                protocol: "http",
                hostname: "localhost",
                port: "8080",
            },
            {
                protocol: "http",
                hostname: "backend",
                port: "8080",
            },
        ],
    },
};

export default nextConfig;