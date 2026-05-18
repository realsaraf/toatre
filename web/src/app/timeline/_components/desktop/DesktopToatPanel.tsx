"use client";

import { useEffect } from "react";
import { ToatDetailView } from "@/app/toats/[id]/ToatDetailView";

interface DesktopToatPanelProps {
  toatId: string;
  onClose: () => void;
}

export function DesktopToatPanel({ toatId, onClose }: DesktopToatPanelProps) {
  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="dtp-panel"
      role="dialog"
      aria-modal="true"
      aria-label="Toat detail"
    >
      <ToatDetailView id={toatId} onClose={onClose} embedded />
    </div>
  );
}
