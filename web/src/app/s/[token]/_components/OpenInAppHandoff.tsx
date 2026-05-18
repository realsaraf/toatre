"use client";

import { useEffect, useMemo } from "react";
import type { CSSProperties } from "react";

interface OpenInAppHandoffProps {
  token: string;
  /** Optional visual gradient — matches the toat's colour scheme. */
  gradient?: string;
}

const MOBILE_USER_AGENT = /Android|iPhone|iPad|iPod/i;

export function OpenInAppHandoff({ token, gradient }: OpenInAppHandoffProps) {
  const appHref = useMemo(() => `toatre://s/${encodeURIComponent(token)}`, [token]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !MOBILE_USER_AGENT.test(navigator.userAgent)) {
      return;
    }

    const timer = window.setTimeout(() => {
      window.location.href = appHref;
    }, 180);

    return () => window.clearTimeout(timer);
  }, [appHref]);

  const bg =
    gradient ??
    "linear-gradient(135deg, var(--color-gradient-start), var(--color-gradient-end))";

  return (
    <div style={styles.wrap}>
      <a href={appHref} style={{ ...styles.button, background: bg }}>
        Open in Toatre app
      </a>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  wrap: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
    width: "100%",
  },
  button: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    minHeight: 49,
    padding: "12px 16px",
    borderRadius: 14,
    color: "#FFFFFF",
    fontWeight: 800,
    fontSize: 13.5,
    textDecoration: "none",
    letterSpacing: "-0.01em",
    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
  },
};
