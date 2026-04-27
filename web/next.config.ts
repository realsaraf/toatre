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
  // Firebase signInWithPopup needs the opener page to be able to read
  // window.closed on the popup. Modern browsers default to a strict COOP
  // that blocks this and breaks Google/Apple popup sign-in. Allow popups
  // explicitly while keeping cross-origin isolation otherwise.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
