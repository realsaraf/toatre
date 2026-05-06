/**
 * Single source of truth for toat visual/icon resolution.
 *
 * All screens (timeline, detail, capture) import from here.
 * Fields:
 *   label     — short human label shown as kicker/chip text
 *   emoji     — emoji icon for compact chip surfaces (capture)
 *   gradient  — full card / hero gradient
 *   tint      — lighter accent (rail dot, icon background)
 *   accent    — darker accent (text, action buttons, chip text)
 *   soft      — soft rgba overlay (action button bg, tint shadow)
 *   chipBg    — light solid bg for capture emoji chips
 *   chipColor — text/icon color for capture emoji chips
 *   Icon      — SVG glyph component (timeline / detail)
 */

import type { ComponentType } from "react";
import type { Enrichments } from "@/types";
import {
  BulbGlyph,
  CarGlyph,
  CartGlyph,
  CheckGlyph,
  ForkGlyph,
  MedGlyph,
  MessageGlyph,
  PhoneGlyph,
  SchoolGlyph,
  SportGlyph,
  TicketGlyph,
  VideoGlyph,
} from "@/components/mobile-ui";

export interface ToatVisual {
  label: string;
  emoji: string;
  gradient: string;
  tint: string;
  accent: string;
  soft: string;
  chipBg: string;
  chipColor: string;
  Icon: ComponentType<{ size?: number; color?: string }>;
}

export const TOAT_VISUAL: Record<string, ToatVisual> = {
  communication_call: {
    label: "Call", emoji: "📞",
    gradient: "linear-gradient(135deg, #F43F5E, #EC4899)",
    tint: "#EC4899", accent: "#DB2777", soft: "rgba(236,72,153,0.12)",
    chipBg: "#FCE7F3", chipColor: "#DB2777",
    Icon: PhoneGlyph,
  },
  communication_message: {
    label: "Message", emoji: "✉️",
    gradient: "linear-gradient(135deg, #06B6D4, #0891B2)",
    tint: "#06B6D4", accent: "#0891B2", soft: "rgba(6,182,212,0.12)",
    chipBg: "#CFFAFE", chipColor: "#0891B2",
    Icon: MessageGlyph,
  },
  communication_meeting: {
    label: "Meeting", emoji: "📹",
    gradient: "linear-gradient(135deg, #3B82F6, #2563EB)",
    tint: "#3B82F6", accent: "#2563EB", soft: "rgba(59,130,246,0.12)",
    chipBg: "#DBEAFE", chipColor: "#2563EB",
    Icon: VideoGlyph,
  },
  event: {
    label: "Event", emoji: "🎫",
    gradient: "linear-gradient(135deg, #7C3AED, #5B3DF5)",
    tint: "#7C3AED", accent: "#6D28D9", soft: "rgba(124,58,237,0.12)",
    chipBg: "#F3E8FF", chipColor: "#7C3AED",
    Icon: TicketGlyph,
  },
  checklist: {
    label: "Checklist", emoji: "🛒",
    gradient: "linear-gradient(135deg, #22C55E, #16A34A)",
    tint: "#22C55E", accent: "#16A34A", soft: "rgba(34,197,94,0.12)",
    chipBg: "#DCFCE7", chipColor: "#16A34A",
    Icon: CartGlyph,
  },
  errand: {
    label: "Errand", emoji: "📍",
    gradient: "linear-gradient(135deg, #8B5CF6, #7C3AED)",
    tint: "#8B5CF6", accent: "#6D28D9", soft: "rgba(139,92,246,0.12)",
    chipBg: "#FEF3C7", chipColor: "#D97706",
    Icon: CartGlyph,
  },
  thought: {
    label: "Idea", emoji: "💡",
    gradient: "linear-gradient(135deg, #F59E0B, #FBBF24)",
    tint: "#F59E0B", accent: "#D97706", soft: "rgba(245,158,11,0.12)",
    chipBg: "#D1FAE5", chipColor: "#059669",
    Icon: BulbGlyph,
  },
  school: {
    label: "School", emoji: "🏫",
    gradient: "linear-gradient(135deg, #6366F1, #4F46E5)",
    tint: "#6366F1", accent: "#4338CA", soft: "rgba(99,102,241,0.12)",
    chipBg: "#EDE9FE", chipColor: "#4338CA",
    Icon: SchoolGlyph,
  },
  transport: {
    label: "Drive", emoji: "🚗",
    gradient: "linear-gradient(135deg, #0EA5E9, #0284C7)",
    tint: "#0EA5E9", accent: "#0369A1", soft: "rgba(14,165,233,0.12)",
    chipBg: "#E0F2FE", chipColor: "#0369A1",
    Icon: CarGlyph,
  },
  dining: {
    label: "Dining", emoji: "🍽️",
    gradient: "linear-gradient(135deg, #F97316, #EA580C)",
    tint: "#F97316", accent: "#C2410C", soft: "rgba(249,115,22,0.12)",
    chipBg: "#FFF7ED", chipColor: "#C2410C",
    Icon: ForkGlyph,
  },
  medical: {
    label: "Medical", emoji: "🏥",
    gradient: "linear-gradient(135deg, #EF4444, #DC2626)",
    tint: "#EF4444", accent: "#B91C1C", soft: "rgba(239,68,68,0.12)",
    chipBg: "#FEF2F2", chipColor: "#B91C1C",
    Icon: MedGlyph,
  },
  sports: {
    label: "Sports", emoji: "⚽",
    gradient: "linear-gradient(135deg, #10B981, #059669)",
    tint: "#10B981", accent: "#047857", soft: "rgba(16,185,129,0.12)",
    chipBg: "#ECFDF5", chipColor: "#047857",
    Icon: SportGlyph,
  },
  task: {
    label: "Task", emoji: "✅",
    gradient: "linear-gradient(135deg, #F97316, #FB923C)",
    tint: "#F97316", accent: "#EA580C", soft: "rgba(249,115,22,0.12)",
    chipBg: "#FFF7ED", chipColor: "#EA580C",
    Icon: CheckGlyph,
  },
};

/**
 * Resolves a visual key from title + enrichments.
 * Enrichment-based dispatch takes priority; title keywords are the fallback.
 */
export function resolveVisualKey(title: string, enrichments: Enrichments | undefined): string {
  if (enrichments) {
    if (enrichments.communication?.channel === "call" || (enrichments.communication?.phone && !enrichments.communication?.joinUrl))
      return "communication_call";
    if (enrichments.communication?.joinUrl) return "communication_meeting";
    if (enrichments.communication) return "communication_message";
    if (enrichments.event) return "event";
    if (enrichments.action?.type === "checklist") return "checklist";
    if (enrichments.action?.type === "errand") return "errand";
    if (enrichments.thought) return "thought";
  }
  const t = title.toLowerCase();
  // Communication
  if (/\b(call|phone|ring|dial)\b/.test(t)) return "communication_call";
  if (/\b(zoom|google meet|teams|webex|standup|stand.?up|video.?call|video chat|scrum|1.?on.?1)\b/.test(t)) return "communication_meeting";
  if (/\b(meeting|catch.?up|check.?in|sync)\b/.test(t)) return "communication_meeting";
  if (/\b(email|text|message|reply|send|follow.?up|dm)\b/.test(t)) return "communication_message";
  // Shopping / errands
  if (/\b(groceri|supermarket|walmart|target|costco|aldi|trader joe|whole foods)\b/.test(t)) return "checklist";
  if (/\b(errand|drop.?off|pharmacy|drugstore|hardware|post office)\b/.test(t)) return "errand";
  if (/\b(buy|purchase|order|shop|store|mall|pick up|pickup)\b/.test(t)) return "errand";
  // School / education
  if (/\b(school|class|lesson|tutor|study|homework|exam|test|lecture|college|university|campus)\b/.test(t)) return "school";
  if (/\b(bring son|bring daughter|bring kid|drop son|drop daughter|pick son|pick daughter|bring child)\b/.test(t)) return "school";
  // Transport
  if (/\b(drive|driving|airport|flight|plane|travel|trip)\b/.test(t)) return "transport";
  if (/\b(train|subway|metro|bus|transit|uber|lyft|cab|taxi)\b/.test(t)) return "transport";
  // Dining / food
  if (/\b(restaurant|dinner|lunch|breakfast|brunch|eat out|dine|cafe|coffee|starbucks)\b/.test(t)) return "dining";
  // Medical / health
  if (/\b(doctor|physician|hospital|clinic|dentist|dental|checkup|appointment|health)\b/.test(t)) return "medical";
  if (/\b(gym|workout|fitness|exercise|yoga|pilates|training|run|jog|swim|hike)\b/.test(t)) return "sports";
  // Sports / recreation
  if (/\b(soccer|football|basketball|baseball|tennis|golf|volleyball|hockey|cricket|rugby)\b/.test(t)) return "sports";
  if (/\b(game|match|tournament|practice|rehearsal|sport)\b/.test(t)) return "sports";
  // Events / occasions
  if (/\b(party|wedding|concert|ceremony|gala|festival|show|birthday|graduation)\b/.test(t)) return "event";
  // Ideas
  if (/\b(idea|brainstorm|thought|note|remember|concept|reflect|insight)\b/.test(t)) return "thought";
  return "task";
}

/** Returns the full visual config for a toat given its title and enrichments. */
export function getToatVisual(title: string, enrichments: Enrichments | undefined): ToatVisual {
  return TOAT_VISUAL[resolveVisualKey(title, enrichments)] ?? TOAT_VISUAL.task;
}
