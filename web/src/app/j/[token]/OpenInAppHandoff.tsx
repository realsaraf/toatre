"use client";

import { useEffect, useMemo } from "react";
import type { CSSProperties } from "react";

interface OpenInAppHandoffProps {
  token: string;
}

const MOBILE_USER_AGENT = /Android|iPhone|iPad|iPod/i;

export function OpenInAppHandoff({ token }: OpenInAppHandoffProps) {
  const appHref = useMemo(() => `toatre://j/${encodeURIComponent(token)}`, [token]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !MOBILE_USER_AGENT.test(navigator.userAgent)) {
      return;
    }

    const timer = window.setTimeout(() => {
      window.location.href = appHref;
    }, 180);

    return () => window.clearTimeout(timer);
  }, [appHref]);

  return (
    <div style={styles.wrap}>
      <a href={appHref} style={styles.button}>Open in Toatre app</a>
      <p style={styles.caption}>
        If Toatre is installed, your phone should switch into the app. If it stays here,
        you can keep using the web preview below.
      </p>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  wrap: {
    margin: "0 0 16px",
  },
  button: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "14px 18px",
    borderRadius: 16,
    background: "linear-gradient(135deg, var(--color-gradient-start), var(--color-gradient-end))",
    color: "#FFFFFF",
    fontWeight: 800,
    textDecoration: "none",
  },
  caption: {
    margin: "12px 0 0",
    color: "var(--color-text-secondary)",
    fontSize: 14,
    lineHeight: 1.5,
  },
};