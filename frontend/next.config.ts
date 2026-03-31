import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "picsum.photos",
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