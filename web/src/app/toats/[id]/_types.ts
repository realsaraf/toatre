import type { Enrichments } from "@/types";
import type { ToatVisual } from "@/components/toat-visual";
import type { SerializedAttachment, SerializedLink } from "@/types/documents";
export type { ToatVisual as DetailVisual };

export type ToatTier = "urgent" | "important" | "regular";
export type ToatState = "open" | "done" | "archived";

export interface ToatDetail {
  id: string;
  tier: ToatTier;
  state: ToatState;
  title: string;
  notes: string | null;
  enrichments: Enrichments | null;
  attachments?: SerializedAttachment[];
  links?: SerializedLink[];
  captureId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SavedConnection {
  id: string;
  name: string;
  relationship: string;
  phone: string | null;
  email: string | null;
  handle: string | null;
}

export interface ActionConfig {
  label: string;
  href: string;
  external: boolean;
}


export type ChecklistItem = { id: string; text: string; done: boolean };

export interface ToatLayout {
  isMeeting: boolean;
  isEvent: boolean;
  isChecklist: boolean;
  loc: string | null;
  maps: string | null;
  phone: string | null;
  joinUrl: string | null;
  people: string[];
  startDate: Date | null;
  endDate: Date | null;
  ticketUrl: string | null;
  visual: ToatVisual;
  heroChip: { text: string; style: "solid" | "soft" | "outline" } | null;
  primaryAction: ActionConfig;
  reminders: Array<{ title: string; subtitle: string }>;
  agenda: string[];
}
