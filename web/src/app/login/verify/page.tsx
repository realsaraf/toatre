"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { verifyEmailMagicLink } from "@/lib/firebase/client";
import { useAuth } from "@/components/AuthProvider";

export default function MagicLinkVerifyPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [error, setError] = useState(false);
  const attempted = useRef(false);

  // Step 1: verify the link on mount (once only).
  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;
    verifyEmailMagicLink().catch(() => setError(true));
  }, []);

  // Step 2: once AuthProvider has synced the session (loading:false, user set),
  // navigate to the timeline.
  useEffect(() => {
    if (!loading && user) {
      router.replace("/timeline");
    }
  }, [user, loading, router]);

  if (error) {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ background: "var(--color-bg)" }}
      >
        <p className="text-base mb-4" style={{ color: "var(--color-text)" }}>
          That link has expired or isn&apos;t valid.
        </p>
        <Link
          href="/login"
          className="text-sm font-medium"
          style={{ color: "var(--color-gradient-start)" }}
        >
          Try signing in again
        </Link>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--color-bg)" }}
    >
      <p style={{ color: "var(--color-text-muted)" }}>Just a moment…</p>
    </main>
  );
}
