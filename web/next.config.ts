import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy Firebase Auth handler to the same origin so popup sign-in works
  // regardless of Cross-Origin-Opener-Policy (same pattern as Mutqin Web).
  async rewrites() {
    return [
      {
        source: "/__/auth/:path*",
        destination: "https://toatre-prod.firebaseapp.com/__/auth/:path*",
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            // Belt-and-suspenders: also allow popups to close themselves.
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
