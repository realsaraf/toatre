import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/lib/auth/auth-context";
import "./globals.css";

const metadataBase = new URL("https://toatre.com");
const defaultDescription =
  "Speak your thoughts, tasks, events, and ideas. Toatre organises them into a smart personal timeline.";
const defaultOpenGraphImage = "/opengraph-image";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase,
  applicationName: "Toatre",
  title: {
    default: "Toatre — mic-first personal timeline",
    template: "%s | Toatre",
  },
  description: defaultDescription,
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Toatre",
    title: "Toatre — mic-first personal timeline",
    description: defaultDescription,
    images: [
      {
        url: defaultOpenGraphImage,
        width: 1200,
        height: 630,
        alt: "Toatre app preview with the Toatre app icon",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Toatre — mic-first personal timeline",
    description: defaultDescription,
    images: [defaultOpenGraphImage],
  },
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    shortcut: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/icon.png", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
