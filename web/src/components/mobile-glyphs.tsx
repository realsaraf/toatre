"use client";

import { PhoneIcon, MessageIcon, TicketIcon, VideoIcon } from "./mobile-icons";

export function ToothGlyph({ size = 28, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path d="M10.1 5.7c2.2 0 3.6 1.1 5.9 1.1 2.1 0 3.7-1.1 5.8-1.1 3.6 0 6.2 2.8 6.2 6.8 0 3.5-1.4 6.1-2.7 8.1-1.3 2-2.6 3.5-4 3.5-1.1 0-1.8-.7-2.1-1.9l-1-3.7c-.3-1.1-.9-1.7-2-1.7s-1.8.6-2.1 1.7l-1 3.7c-.3 1.2-1 1.9-2.1 1.9-1.4 0-2.7-1.5-4-3.5-1.3-2-2.7-4.6-2.7-8.1 0-4 2.6-6.8 5.8-6.8Z" fill={color} />
    </svg>
  );
}

export function PhoneGlyph({ size = 28, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return <span style={{ color, display: "inline-flex" }}><PhoneIcon size={size} /></span>;
}

export function MessageGlyph({ size = 28, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return <span style={{ color, display: "inline-flex" }}><MessageIcon size={size} /></span>;
}

export function CartGlyph({ size = 28, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 4h2l2 10h9.5l2.2-7H7" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="19" r="1.6" fill={color} />
      <circle cx="17" cy="19" r="1.6" fill={color} />
    </svg>
  );
}

export function BulbGlyph({ size = 28, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M8 14c-1.4-1.1-2.3-2.9-2.3-4.8A6.3 6.3 0 0 1 12 3a6.3 6.3 0 0 1 6.3 6.2c0 2-.9 3.7-2.3 4.8-.9.7-1.4 1.7-1.4 2.8H9.4c0-1.1-.5-2.1-1.4-2.8Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9.5 19h5M10.4 22h3.2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function EnvelopeGlyph({ size = 28, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="6" width="16" height="12" rx="3" stroke={color} strokeWidth="1.8" />
      <path d="m6 8 6 5 6-5" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export function TicketGlyph({ size = 28, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return <span style={{ color, display: "inline-flex" }}><TicketIcon size={size} /></span>;
}

export function VideoGlyph({ size = 28, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return <span style={{ color, display: "inline-flex" }}><VideoIcon size={size} /></span>;
}

export function KeyboardIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3.5" y="6" width="17" height="12" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 10h.01M10.5 10h.01M14 10h.01M17 10h.01M7 13.5h.01M10.5 13.5h7M7 16h10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function PlusIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function GrabHandleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function CheckGlyph({ size = 28, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <path d="M8 12.5l2.5 2.5 5-5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SchoolGlyph({ size = 28, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3L2 8l10 5 10-5-10-5Z" fill={color} />
      <path d="M6 10.5V16c1.5 1.5 8.5 1.5 12 0v-5.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M20 8v5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function FlightGlyph({ size = 28, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5L21 16Z" fill={color} />
    </svg>
  );
}

export function CarGlyph({ size = 28, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12l1.5-4h11L19 12" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3" y="12" width="18" height="6" rx="2" stroke={color} strokeWidth="1.8" />
      <circle cx="8" cy="18" r="1.5" fill={color} />
      <circle cx="16" cy="18" r="1.5" fill={color} />
    </svg>
  );
}

export function ForkGlyph({ size = 28, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M8 3v5a3 3 0 0 0 3 3v8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 3v14" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 3v3M10 3v3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function MedGlyph({ size = 28, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="4" stroke={color} strokeWidth="1.8" />
      <path d="M12 8v8M8 12h8" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function SportGlyph({ size = 28, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <path d="M12 3c0 4-3.5 7-9 7M12 3c0 4 3.5 7 9 7M12 21c0-4-3.5-7-9-7M12 21c0-4 3.5-7 9-7" stroke={color} strokeWidth="1.3" />
    </svg>
  );
}