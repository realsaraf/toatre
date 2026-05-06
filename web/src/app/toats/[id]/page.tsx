"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import {
  BackIcon,
  BellIcon,
  BulbGlyph,
  CartGlyph,
  ChevronRightIcon,
  CircleIconButton,
  ClockIcon,
  DirectionsIcon,
  DocumentIcon,
  DoneIcon,
  DuplicateIcon,
  EditIcon,
  EnvelopeGlyph,
  GrabHandleIcon,
  LocationIcon,
  MessageGlyph,
  MoreIcon,
  PhoneGlyph,
  PlusIcon,
  RescheduleIcon,
  ShareIcon,
  SnoozeIcon,
  SparkleIcon,
  SteeringWheelIcon,
  TicketGlyph,
  ToothGlyph,
  TrashIcon,
  UserAvatar,
  VideoGlyph,
} from "@/components/mobile-ui";
import type { Enrichments } from "@/types";

type ToatTier = "urgent" | "important" | "regular";
type ToatState = "open" | "done" | "archived";

interface ToatDetail {
  id: string;
  tier: ToatTier;
  state: ToatState;
  title: string;
  notes: string | null;
  enrichments: Enrichments;
  captureId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SavedConnection {
  id: string;
  name: string;
  relationship: string;
  phone: string | null;
  email: string | null;
  handle: string | null;
}

interface ActionConfig {
  label: string;
  href: string;
  external: boolean;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatRelativeChip(toat: ToatDetail, now: Date) {
  const t = toatTime(toat);
  if (!t) return null;

  const start = new Date(t);
  const endStr = toatEndTime(toat);
  const end = endStr ? new Date(endStr) : null;
  const diffMinutes = Math.round((start.getTime() - now.getTime()) / 60000);
  const diffDays = Math.floor((new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86400000);

  if (end && now >= start && now <= end) {
    return { text: "Happening now", style: "solid" as const };
  }

  if (diffMinutes > 0 && diffMinutes <= 90) {
    return { text: `Starting in ${diffMinutes} min`, style: "solid" as const };
  }

  if (diffDays === 0) {
    return { text: `Today, ${formatTime(start)}`, style: "soft" as const };
  }

  if (diffDays === 1) {
    return { text: `Tomorrow, ${formatTime(start)}`, style: "soft" as const };
  }

  if (diffDays > 1 && diffDays <= 7) {
    return { text: `In ${diffDays} days`, style: "outline" as const };
  }

  return { text: formatShortDate(start), style: "outline" as const };
}

function mapHref(location: string | null) {
  if (!location) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

function toatTime(toat: ToatDetail): string | null {
  const t = toat.enrichments?.time;
  return t?.at ?? t?.startAt ?? t?.dueAt ?? null;
}

function toatEndTime(toat: ToatDetail): string | null {
  return toat.enrichments?.time?.endAt ?? null;
}

function toatLocation(toat: ToatDetail): string | null {
  return toat.enrichments?.place?.address ?? toat.enrichments?.place?.placeName
    ?? toat.enrichments?.event?.address ?? toat.enrichments?.event?.venueName ?? null;
}

function toatPeople(toat: ToatDetail): string[] {
  return toat.enrichments?.people ?? [];
}

// ─── Enrichment-based visual + action dispatch ───────────────────────────────

interface DetailVisual {
  kicker: string;
  gradient: string;
  soft: string;
  accent: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
}

function getVisual(toat: ToatDetail): DetailVisual {
  const e = toat.enrichments;
  if (e?.communication?.channel === "call" || (e?.communication?.phone && !e?.communication?.joinUrl))
    return { kicker: "Call", gradient: "linear-gradient(135deg, #F43F5E, #EC4899)", soft: "rgba(236,72,153,0.12)", accent: "#DB2777", Icon: PhoneGlyph };
  if (e?.communication?.joinUrl)
    return { kicker: "Meeting", gradient: "linear-gradient(135deg, #3B82F6, #2563EB)", soft: "rgba(59,130,246,0.12)", accent: "#2563EB", Icon: VideoGlyph };
  if (e?.communication)
    return { kicker: "Message", gradient: "linear-gradient(135deg, #06B6D4, #0891B2)", soft: "rgba(6,182,212,0.12)", accent: "#0891B2", Icon: MessageGlyph };
  if (e?.event)
    return { kicker: "Event", gradient: "linear-gradient(135deg, #7C3AED, #5B3DF5)", soft: "rgba(124,58,237,0.12)", accent: "#6D28D9", Icon: TicketGlyph };
  if (e?.action?.type === "checklist")
    return { kicker: "Checklist", gradient: "linear-gradient(135deg, #22C55E, #16A34A)", soft: "rgba(34,197,94,0.12)", accent: "#16A34A", Icon: CartGlyph };
  if (e?.action?.type === "errand")
    return { kicker: "Errand", gradient: "linear-gradient(135deg, #8B5CF6, #7C3AED)", soft: "rgba(139,92,246,0.12)", accent: "#6D28D9", Icon: CartGlyph };
  if (e?.thought)
    return { kicker: "Idea", gradient: "linear-gradient(135deg, #F59E0B, #FBBF24)", soft: "rgba(245,158,11,0.12)", accent: "#D97706", Icon: BulbGlyph };
  return { kicker: "Task", gradient: "linear-gradient(135deg, #F97316, #FB923C)", soft: "rgba(249,115,22,0.12)", accent: "#EA580C", Icon: EnvelopeGlyph };
}

function getPrimaryAction(toat: ToatDetail): ActionConfig {
  const e = toat.enrichments;
  const loc = toatLocation(toat);
  const directions = mapHref(loc);

  if (e?.communication?.joinUrl) return { label: "Join now", href: e.communication.joinUrl, external: true };
  if (e?.communication?.channel === "call" && e.communication.phone)
    return { label: "Call", href: `tel:${e.communication.phone.replace(/\s+/g, "")}`, external: true };
  if (e?.event?.ticketUrl) return { label: "View tickets", href: e.event.ticketUrl, external: true };
  if (e?.communication?.channel === "email" && e.communication.email)
    return { label: "Email", href: `mailto:${e.communication.email}`, external: true };
  if (e?.communication?.phone)
    return { label: "Call", href: `tel:${e.communication.phone.replace(/\s+/g, "")}`, external: true };
  if (directions) return { label: "Directions", href: directions, external: true };
  return { label: "Open details", href: `/toats/${toat.id}`, external: false };
}

function parseAgenda(notes: string | null) {
  if (!notes) return [];
  return notes
    .split(/\r?\n|•|\u2022|-/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function getAgendaLines(toat: ToatDetail) {
  return parseAgenda(toat.notes);
}

function getChecklistItems(toat: ToatDetail): Array<{ id: string; text: string; done: boolean }> {
  return toat.enrichments?.action?.checklist ?? [];
}

function buildReminderLines(toat: ToatDetail) {
  const t = toatTime(toat);
  if (!t) return [];
  const start = new Date(t);
  const tenMinutesBefore = new Date(start.getTime() - 10 * 60000);
  const dayBefore = new Date(start.getTime() - 24 * 60 * 60000);
  return [
    { title: `Leave by ${formatTime(tenMinutesBefore)}`, subtitle: "10 minutes before" },
    { title: "Day before reminder", subtitle: `${formatShortDate(dayBefore)} at ${formatTime(dayBefore)}` },
  ];
}

function qrDigits(id: string) {
  return id.replace(/[^0-9]/g, "").slice(0, 12).padEnd(12, "0");
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ─── Layout hook ─────────────────────────────────────────────────────────────
interface ToatLayout {
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
  visual: DetailVisual;
  heroChip: ReturnType<typeof formatRelativeChip>;
  primaryAction: ActionConfig;
  reminders: Array<{ title: string; subtitle: string }>;
  agenda: string[];
}

function useToatLayout(toat: ToatDetail, now: Date): ToatLayout {
  const joinUrl = toat.enrichments?.communication?.joinUrl ?? null;
  const phone = toat.enrichments?.communication?.phone ?? null;
  const loc = toatLocation(toat);
  const maps = mapHref(loc);
  const people = toatPeople(toat);
  const startDate = toatTime(toat) ? new Date(toatTime(toat)!) : null;
  const endDate = toatEndTime(toat) ? new Date(toatEndTime(toat)!) : null;
  const ticketUrl = toat.enrichments?.event?.ticketUrl ?? null;
  return {
    isMeeting: !!joinUrl,
    isEvent: !!toat.enrichments?.event,
    isChecklist: toat.enrichments?.action?.type === "checklist",
    loc, maps, phone, joinUrl, people,
    startDate, endDate, ticketUrl,
    visual: getVisual(toat),
    heroChip: formatRelativeChip(toat, now),
    primaryAction: getPrimaryAction(toat),
    reminders: buildReminderLines(toat),
    agenda: getAgendaLines(toat),
  };
}

function DetailBadge({ text, style, accent }: { text: string; style: "solid" | "soft" | "outline"; accent: string }) {
  const badgeStyle =
    style === "solid"
      ? { background: accent, color: "#FFFFFF", border: "none" }
      : style === "outline"
        ? { background: "rgba(255,255,255,0.84)", color: accent, border: `1px solid ${accent}33` }
        : { background: `${accent}14`, color: accent, border: "none" };

  return (
    <span style={{ ...styles.heroChip, ...badgeStyle }}>
      <SparkleIcon size={13} /> {text}
    </span>
  );
}

function SwitchVisual({ on }: { on: boolean }) {
  return (
    <span style={{ ...styles.switchBase, background: on ? "linear-gradient(135deg, #7C3AED, #5B3DF5)" : "rgba(209,213,219,0.8)" }}>
      <span style={{ ...styles.switchThumb, transform: on ? "translateX(19px)" : "translateX(0)" }} />
    </span>
  );
}

function InfoRow({
  icon,
  label,
  title,
  subtitle,
  trailing,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  title: string;
  subtitle?: string | null;
  trailing?: React.ReactNode;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span style={styles.infoRowIcon}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={styles.infoRowLabel}>{label}</p>
        <p style={styles.infoRowTitle}>{title}</p>
        {subtitle ? <p style={styles.infoRowSubtitle}>{subtitle}</p> : null}
      </div>
      {trailing}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} style={{ ...styles.infoRow, ...styles.infoRowButton }}>
        {content}
      </button>
    );
  }

  return (
    <div style={styles.infoRow}>
      {content}
    </div>
  );
}

function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section style={styles.sectionCard}>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionHeading}>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function ActionStripButton({
  icon,
  label,
  onClick,
  tint,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  tint: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles.actionStripButton,
        color: tint,
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <span style={{ ...styles.actionStripIcon, background: `${tint}14` }}>{icon}</span>
      {label}
    </button>
  );
}

export default function ToatDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [toat, setToat] = useState<ToatDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareBusy, setShareBusy] = useState<string | null>(null);
  const [sharePermission, setSharePermission] = useState<"view" | "edit">("view");
  const [shareConnections, setShareConnections] = useState<SavedConnection[]>([]);
  const [selectedConnectionIds, setSelectedConnectionIds] = useState<string[]>([]);

  // Inline checklist editing
  type ChecklistItem = { id: string; text: string; done: boolean };
  const [checklistLocal, setChecklistLocal] = useState<ChecklistItem[]>([]);
  const checklistDragIndex = useRef<number | null>(null);

  // Inline notes editing
  const [notesLocal, setNotesLocal] = useState<string>("");
  const notesSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleValue, setRescheduleValue] = useState("");
  const [locationSearchOpen, setLocationSearchOpen] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<Array<{ placeId: string; description: string }>>([]);
  const [ticketInputOpen, setTicketInputOpen] = useState(false);

  const now = new Date();

  useEffect(() => {
    const updateViewportWidth = () => {
      setViewportWidth(window.innerWidth);
    };

    updateViewportWidth();
    window.addEventListener("resize", updateViewportWidth);

    return () => {
      window.removeEventListener("resize", updateViewportWidth);
    };
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/login?next=/toats/${params.id}`);
    }
  }, [authLoading, params.id, router, user]);

  useEffect(() => {
    if (!params.id) return;
    if (!user) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/toats/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error(response.status === 404 ? "Toat not found" : `Request failed (${response.status})`);
        }

        const data = (await response.json()) as { toat?: ToatDetail };
        if (!cancelled) {
          setToat(data.toat ?? null);
          setError(data.toat ? null : "Toat not found");
          if (data.toat) {
            setNotesLocal(data.toat.notes ?? "");
            setShowNotes(Boolean(data.toat.notes?.trim()));
            setChecklistLocal(data.toat.enrichments?.action?.checklist ?? []);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load this toat.");
        }
      } finally {
        if (!cancelled) {
          setHasLoadedData(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params.id, user]);

  const runMutation = async (label: string, callback: () => Promise<void>) => {
    setActionState(label);
    setFlash(null);
    try {
      await callback();
    } catch (err) {
      setFlash(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setActionState(null);
      setMenuOpen(false);
    }
  };

  const patchToat = async (body: Record<string, unknown>) => {
    if (!user || !toat) return;
    const token = await user.getIdToken();
    const response = await fetch(`/api/toats/${toat.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = (await response.json().catch(() => null)) as { toat?: ToatDetail; error?: string } | null;
    if (!response.ok || !data?.toat) {
      throw new Error(data?.error ?? "Could not update this toat.");
    }

    setToat(data.toat);
    setFlash(labelForPatch(body));
  };

  const saveChecklistItems = useCallback(async (items: Array<{ id: string; text: string; done: boolean }>) => {
    if (!user || !toat) return;
    try {
      const token = await user.getIdToken();
      await fetch(`/api/toats/${toat.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ "enrichments.action": { type: "checklist", checklist: items } }),
      });
    } catch {
      // silently ignore autosave failures
    }
  }, [user, toat]);

  const saveNotesText = useCallback(async (text: string) => {
    if (!user || !toat) return;
    try {
      const token = await user.getIdToken();
      await fetch(`/api/toats/${toat.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ notes: text || null }),
      });
    } catch {
      // silently ignore autosave failures
    }
  }, [user, toat]);

  const deleteToat = async () => {
    if (!user || !toat) return;
    const token = await user.getIdToken();
    const response = await fetch(`/api/toats/${toat.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error ?? "Could not delete this toat.");
    }

    router.replace("/timeline");
  };

  const duplicateToat = async () => {
    if (!user || !toat) return;
    const token = await user.getIdToken();
    const response = await fetch("/api/toats", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tier: toat.tier,
        title: `${toat.title} copy`,
        notes: toat.notes,
        enrichments: toat.enrichments,
      }),
    });

    const data = (await response.json().catch(() => null)) as { toat?: ToatDetail; error?: string } | null;
    if (!response.ok || !data?.toat) {
      throw new Error(data?.error ?? "Could not duplicate this toat.");
    }

    router.push(`/toats/${data.toat.id}`);
  };

  const openShareModal = async () => {
    if (!user || !toat) return;
    setShareOpen(true);
    setShareBusy("load");
    setFlash(null);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/connections", { headers: { Authorization: `Bearer ${token}` } });
      const data = (await response.json().catch(() => null)) as { connections?: SavedConnection[]; error?: string } | null;
      if (!response.ok) {
        throw new Error(data?.error ?? "Could not load your connections.");
      }
      const nextConnections = data?.connections ?? [];
      setShareConnections(nextConnections);
      setSelectedConnectionIds(nextConnections.slice(0, 2).map((connection) => connection.id));
    } catch (err) {
      setFlash(err instanceof Error ? err.message : "Could not open sharing.");
    } finally {
      setShareBusy(null);
    }
  };

  const createShare = async (linkOnly: boolean) => {
    if (!user || !toat) return;
    setShareBusy(linkOnly ? "link" : "send");
    setFlash(null);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/toats/${toat.id}/share`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connectionIds: linkOnly ? [] : selectedConnectionIds,
          permission: sharePermission,
          linkOnly,
        }),
      });
      const data = (await response.json().catch(() => null)) as { shareUrl?: string; error?: string } | null;
      if (!response.ok || !data?.shareUrl) {
        throw new Error(data?.error ?? "Could not create that share link.");
      }

      if (navigator.share) {
        await navigator.share({ title: toat.title, text: toat.title, url: data.shareUrl });
      } else {
        await navigator.clipboard.writeText(data.shareUrl);
      }
      setFlash(linkOnly ? "Share link ready." : "Share invite ready.");
      setShareOpen(false);
    } catch (err) {
      setFlash(err instanceof Error ? err.message : "Could not share this toat.");
    } finally {
      setShareBusy(null);
    }
  };

  const toggleShareConnection = (connectionId: string) => {
    setSelectedConnectionIds((current) => (
      current.includes(connectionId)
        ? current.filter((id) => id !== connectionId)
        : [...current, connectionId]
    ));
  };

  const openPrimaryAction = () => {
    if (!toat) return;
    const action = getPrimaryAction(toat);
    if (action.external) {
      window.open(action.href, "_blank", "noopener,noreferrer");
      return;
    }
    router.push(action.href);
  };

  const loading = authLoading || (Boolean(user) && !hasLoadedData);

  if (!user && !authLoading) {
    return null;
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <main style={styles.main}>
          <section style={styles.loadingCard}>
            <div style={styles.loadingSpinner} className="animate-spin" />
            <p style={styles.loadingText}>Loading this toat…</p>
          </section>
        </main>
      </div>
    );
  }

  if (error || !toat) {
    return (
      <div style={styles.page}>
        <main style={styles.main}>
          <section style={styles.errorCard}>
            <p style={styles.errorTitle}>We couldn&apos;t load that toat.</p>
            <p style={styles.errorBody}>{error ?? "The toat may have been moved or deleted."}</p>
            <button type="button" onClick={() => router.push("/timeline")} style={styles.primaryButton}>Back to timeline</button>
          </section>
        </main>
      </div>
    );
  }

  const layout = useToatLayout(toat, now);
  const { isMeeting, isEvent, isChecklist, loc, maps, phone, joinUrl, people, startDate, endDate, ticketUrl, visual, heroChip, primaryAction, reminders, agenda } = layout;
  const Icon = visual.Icon;
  const isPhoneViewport = viewportWidth === null || viewportWidth <= 768;

  return (
    <div style={styles.page}>
      <div style={styles.backgroundHaloOne} />
      <div style={styles.backgroundHaloTwo} />
      <div style={styles.backgroundHaloThree} />

      <main style={{ ...styles.main, ...(isPhoneViewport ? styles.mainCompact : {}) }}>
        <section style={{ ...styles.topBar, ...(isPhoneViewport ? styles.topBarCompact : {}) }}>
          <CircleIconButton label="Back" onClick={() => router.back()}>
            <BackIcon size={isPhoneViewport ? 24 : 28} />
          </CircleIconButton>

          <div style={{ ...styles.topBarRight, ...(isPhoneViewport ? styles.topBarRightCompact : {}) }}>
            <UserAvatar user={user} />
            <CircleIconButton label="Share" onClick={() => void openShareModal()}>
              <ShareIcon size={isPhoneViewport ? 20 : 24} />
            </CircleIconButton>
            <div style={{ position: "relative" }}>
              <CircleIconButton label="More actions" onClick={() => setMenuOpen((value) => !value)}>
                <MoreIcon size={isPhoneViewport ? 20 : 24} />
              </CircleIconButton>
              {menuOpen ? (
                <div style={styles.menuCard}>
                  <MenuAction label="Mark done" icon={<DoneIcon size={20} />} tone="#111827" onClick={() => void runMutation("mark-done", async () => { await patchToat({ state: "done" }); router.replace("/timeline"); })} />
                  <MenuAction label="Reschedule" icon={<RescheduleIcon size={20} />} tone="#111827" onClick={() => { setRescheduleValue(toatTime(toat) ? new Date(toatTime(toat)!).toISOString().slice(0, 16) : ""); setRescheduleOpen(true); }} />
                  <MenuAction label="Duplicate" icon={<DuplicateIcon size={20} />} tone="#111827" onClick={() => void runMutation("duplicate", duplicateToat)} />
                  {isEvent ? (
                    <MenuAction label={ticketUrl ? "Update ticket link" : "Add ticket link"} icon={<TicketGlyph size={20} />} tone="#111827" onClick={() => { setMenuOpen(false); setTicketInputOpen(true); }} />
                  ) : null}
                  <MenuAction label="Delete" icon={<TrashIcon size={20} />} tone="#DC2626" onClick={() => { if (window.confirm("Delete this toat?")) { void runMutation("delete", deleteToat); } }} />
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section style={{ ...styles.heroSection, ...(isPhoneViewport ? styles.heroSectionCompact : {}) }}>
          <div style={{ ...styles.heroIconWrap, ...(isPhoneViewport ? styles.heroIconWrapCompact : {}), background: visual.gradient }}>
            <Icon size={isPhoneViewport ? 34 : 46} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={styles.heroKickerRow}>
              {loc && !isMeeting && !isEvent ? <span style={{ ...styles.heroKicker, color: visual.accent }}>• {visual.kicker.toUpperCase()}</span> : null}
              {heroChip ? <DetailBadge text={heroChip.text} style={heroChip.style} accent={visual.accent} /> : null}
            </div>
            <h1 style={{ ...styles.heroTitle, ...(isPhoneViewport ? styles.heroTitleCompact : {}) }}>{toat.title}</h1>

            {isMeeting ? (
              <div style={styles.heroMeetingMeta}>
                <span style={{ ...styles.heroMetaChip, ...(isPhoneViewport ? styles.heroMetaChipCompact : {}) }}><VideoGlyph size={isPhoneViewport ? 16 : 20} /> {joinUrl ? "Meeting link" : "Meeting"}</span>
                {people.length ? (
                  <div style={styles.peopleRow}>
                    {people.slice(0, 4).map((person) => (
                      <span key={person} style={{ ...styles.personBadge, ...(isPhoneViewport ? styles.personBadgeCompact : {}) }}>{initials(person)}</span>
                    ))}
                    {people.length > 4 ? <span style={{ ...styles.personOverflow, ...(isPhoneViewport ? styles.personBadgeCompact : {}) }}>+{people.length - 4}</span> : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {loc ? <p style={{ ...styles.heroLocation, ...(isPhoneViewport ? styles.heroLocationCompact : {}) }}><LocationIcon size={isPhoneViewport ? 18 : 22} /> {loc}</p> : null}
            {isEvent && ticketUrl ? <p style={{ ...styles.heroSecondary, ...(isPhoneViewport ? styles.heroSecondaryCompact : {}) }}><TicketGlyph size={isPhoneViewport ? 16 : 20} /> Tickets ready</p> : null}
            {!isMeeting && !isEvent && startDate ? <p style={{ ...styles.heroSecondary, ...(isPhoneViewport ? styles.heroSecondaryCompact : {}) }}><ClockIcon size={isPhoneViewport ? 16 : 20} /> {formatDate(startDate)}</p> : null}
          </div>
        </section>

        {flash ? <div style={styles.flash}>{flash}</div> : null}

        {/* Quick actions — moved to top so they're always visible */}
        <section style={styles.actionStrip}>
          <ActionStripButton icon={<DoneIcon size={20} />} label="Mark done" tint="#16A34A" disabled={Boolean(actionState)} onClick={() => void runMutation("done", async () => { await patchToat({ state: "done" }); router.replace("/timeline"); })} />
          <ActionStripButton icon={<SnoozeIcon size={20} />} label="+1 Day" tint="#2563EB" disabled={Boolean(actionState)} onClick={() => void runMutation("add1d", async () => {
            const t = toatTime(toat);
            if (!t) throw new Error("This toat has no time to move.");
            await patchToat({ "enrichments.time": { ...toat.enrichments?.time, at: new Date(new Date(t).getTime() + 24 * 60 * 60000).toISOString() } });
          })} />
          <ActionStripButton icon={<RescheduleIcon size={20} />} label="Reschedule" tint="#7C3AED" disabled={Boolean(actionState)} onClick={() => { setRescheduleValue(toatTime(toat) ? new Date(toatTime(toat)!).toISOString().slice(0, 16) : ""); setRescheduleOpen(true); }} />
          <ActionStripButton icon={<DuplicateIcon size={20} />} label="Duplicate" tint="#6B7280" disabled={Boolean(actionState)} onClick={() => void runMutation("duplicate", duplicateToat)} />
          <ActionStripButton icon={<TrashIcon size={20} />} label="Delete" tint="#DC2626" disabled={Boolean(actionState)} onClick={() => { if (window.confirm("Delete this toat?")) { void runMutation("delete", deleteToat); } }} />
        </section>

        {isMeeting ? (
          <button type="button" onClick={openPrimaryAction} style={{ ...styles.fullWidthPrimary, ...(isPhoneViewport ? styles.fullWidthPrimaryCompact : {}), background: visual.gradient }}>
            <VideoGlyph size={isPhoneViewport ? 20 : 24} /> {primaryAction.label}
          </button>
        ) : null}

        {(!isMeeting && !isEvent && !isChecklist) ? (
          <WhenWhereCard
            startDate={startDate}
            endDate={endDate}
            loc={loc}
            maps={maps}
            phone={phone}
            visual={visual}
            notesLocal={notesLocal}
            showNotes={showNotes}
            setNotesLocal={setNotesLocal}
            saveNotesText={saveNotesText}
            notesSaveTimer={notesSaveTimer}
            setShowNotes={setShowNotes}
            onAddLocation={() => setLocationSearchOpen(true)}
            onChangeLocation={() => setLocationSearchOpen(true)}
            onRemoveLocation={() => void runMutation("rm-location", () => patchToat({ "enrichments.place": null }))}
            onShareOrCall={() => {
              if (phone) { window.open(`tel:${phone.replace(/\s+/g, "")}`, "_self"); return; }
              void openShareModal();
            }}
            reminders={reminders}
            user={user}
            toat={toat}
          />
        ) : null}

        {isMeeting ? (
          <MeetingSection
            startDate={startDate}
            endDate={endDate}
            joinUrl={joinUrl!}
            people={people}
            agenda={agenda}
            visual={visual}
            loc={loc}
            maps={maps}
            onAddLocation={() => setLocationSearchOpen(true)}
            onChangeLocation={() => setLocationSearchOpen(true)}
            onRemoveLocation={() => void runMutation("rm-location", () => patchToat({ "enrichments.place": null }))}
          />
        ) : null}

        {isChecklist ? (
          <ChecklistSection
            checklistLocal={checklistLocal}
            setChecklistLocal={setChecklistLocal}
            saveChecklistItems={saveChecklistItems}
            checklistDragIndex={checklistDragIndex}
            visual={visual}
            loc={loc}
            maps={maps}
            onAddLocation={() => setLocationSearchOpen(true)}
            onChangeLocation={() => setLocationSearchOpen(true)}
            onRemoveLocation={() => void runMutation("rm-location", () => patchToat({ "enrichments.place": null }))}
            notesLocal={notesLocal}
            showNotes={showNotes}
            setNotesLocal={setNotesLocal}
            saveNotesText={saveNotesText}
            notesSaveTimer={notesSaveTimer}
            setShowNotes={setShowNotes}
            user={user}
            toat={toat}
          />
        ) : null}

        {people.length ? (
          <SectionCard title="Sharing">
            <div style={styles.shareGrid}>
              {people.map((person) => (
                <div key={person} style={styles.sharePerson}>
                  <span style={styles.shareAvatar}>{initials(person)}</span>
                  <p style={styles.shareName}>{person}</p>
                  <p style={styles.shareRole}>Can view</p>
                </div>
              ))}
            </div>
          </SectionCard>
        ) : null}

        {!isMeeting ? (
          <section style={styles.tipCard}>
            <span style={styles.tipSpark}><SparkleIcon size={20} /></span>
            <p style={styles.tipText}>Toatre will keep this toat on track with your Pings and the timing you already set.</p>
          </section>
        ) : null}

        <div style={{ height: 40 }} />
      </main>

      {shareOpen ? (
        <ShareToatModal
          toat={toat}
          connections={shareConnections}
          selectedConnectionIds={selectedConnectionIds}
          permission={sharePermission}
          busy={shareBusy}
          onClose={() => setShareOpen(false)}
          onToggleConnection={toggleShareConnection}
          onPermissionChange={setSharePermission}
          onCreateLink={() => void createShare(true)}
          onSend={() => void createShare(false)}
          onOpenConnections={() => router.push("/settings")}
        />
      ) : null}

      {rescheduleOpen ? (
        <RescheduleModal
          value={rescheduleValue}
          onChange={setRescheduleValue}
          busy={actionState === "reschedule"}
          onConfirm={() => void runMutation("reschedule", async () => {
            if (!rescheduleValue) throw new Error("Pick a date and time.");
            await patchToat({ "enrichments.time": { ...toat.enrichments?.time, at: new Date(rescheduleValue).toISOString() } });
            setRescheduleOpen(false);
          })}
          onClose={() => setRescheduleOpen(false)}
        />
      ) : null}

      {locationSearchOpen ? (
        <LocationSearchModal
          query={locationQuery}
          suggestions={locationSuggestions}
          onQueryChange={async (q) => {
            setLocationQuery(q);
            if (!q.trim()) { setLocationSuggestions([]); return; }
            try {
              const res = await fetch(`/api/places/autocomplete?q=${encodeURIComponent(q)}`);
              const data = (await res.json()) as { predictions?: Array<{ place_id: string; description: string }> };
              setLocationSuggestions((data.predictions ?? []).map((p) => ({ placeId: p.place_id, description: p.description })));
            } catch { setLocationSuggestions([]); }
          }}
          onSelect={(description) => void runMutation("location", async () => {
            await patchToat({ "enrichments.place": { address: description } });
            setLocationSearchOpen(false);
            setLocationQuery("");
            setLocationSuggestions([]);
          })}
          onClose={() => { setLocationSearchOpen(false); setLocationQuery(""); setLocationSuggestions([]); }}
        />
      ) : null}
      {ticketInputOpen ? (
        <TicketInputModal
          onSave={(url) => void runMutation("ticket-url", async () => {
            await patchToat({ "enrichments.event": { ...toat.enrichments?.event, ticketUrl: url } });
            setTicketInputOpen(false);
          })}
          onClose={() => setTicketInputOpen(false)}
        />
      ) : null}
    </div>
  );
}

// ─── Card components ──────────────────────────────────────────────────────────
// Each card receives exactly the data it needs; no global state access.

function WhenWhereCard({
  startDate, endDate, loc, maps, phone, visual,
  notesLocal, showNotes, setNotesLocal, saveNotesText, notesSaveTimer, setShowNotes,
  onAddLocation, onChangeLocation, onRemoveLocation, onShareOrCall,
  reminders, user, toat,
}: {
  startDate: Date | null; endDate: Date | null; loc: string | null; maps: string | null;
  phone: string | null; visual: DetailVisual;
  notesLocal: string; showNotes: boolean;
  setNotesLocal: (v: string) => void;
  saveNotesText: (v: string) => Promise<void>;
  notesSaveTimer: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  setShowNotes: (v: boolean) => void;
  onAddLocation: () => void; onChangeLocation: () => void; onRemoveLocation: () => void;
  onShareOrCall: () => void;
  reminders: Array<{ title: string; subtitle: string }>;
  user: { displayName: string | null } | null;
  toat: ToatDetail;
}) {
  return (
    <>
      <SectionCard title="When & where" action={<button type="button" style={styles.inlineGhost}><EditIcon size={18} /> Edit</button>}>
        {startDate ? (
          <InfoRow
            icon={<ClockIcon size={22} />}
            label="When"
            title={formatDate(startDate)}
            subtitle={endDate ? `${formatTime(startDate)} \u2013 ${formatTime(endDate)}` : formatTime(startDate)}
          />
        ) : null}
        {loc ? (
          <InfoRow
            icon={<LocationIcon size={22} />}
            label="Where"
            title={loc}
            subtitle={maps ? "Open in Maps" : null}
            onClick={maps ? () => window.open(maps, "_blank", "noopener,noreferrer") : undefined}
            trailing={maps ? <span style={{ color: "#6B7280" }}><ChevronRightIcon size={18} /></span> : undefined}
          />
        ) : null}
        {phone ? (
          <InfoRow icon={<PhoneGlyph size={22} />} label="Contact" title={phone} />
        ) : null}
        {maps && loc ? (
          <>
            <LocationBlock
              location={loc}
              mapsUrl={maps}
              gradient={visual.gradient}
              accent={visual.accent}
              onChangeLocation={onChangeLocation}
              onRemoveLocation={onRemoveLocation}
            />
            <div style={styles.buttonRow}>
              <button type="button" onClick={onShareOrCall} style={styles.secondaryButton}>
                {phone ? <PhoneGlyph size={20} /> : <MessageGlyph size={20} />} {phone ? "Call" : "Share"}
              </button>
            </div>
          </>
        ) : (
          <div style={styles.buttonRow}>
            <button type="button" onClick={onAddLocation} style={styles.secondaryButton}>
              <LocationIcon size={18} /> Add location
            </button>
            <button type="button" onClick={onShareOrCall} style={styles.secondaryButton}>
              {phone ? <PhoneGlyph size={20} /> : <MessageGlyph size={20} />} {phone ? "Call" : "Share"}
            </button>
          </div>
        )}
      </SectionCard>

      {(showNotes || notesLocal.trim() !== "") ? (
        <SectionCard title="Notes">
          <textarea
            style={styles.notesTextarea}
            value={notesLocal}
            onChange={(e) => {
              setNotesLocal(e.target.value);
              if (notesSaveTimer.current) clearTimeout(notesSaveTimer.current);
              notesSaveTimer.current = setTimeout(() => { void saveNotesText(e.target.value); }, 800);
            }}
            onBlur={() => void saveNotesText(notesLocal)}
            placeholder="Add a note\u2026"
            rows={3}
          />
          <div style={styles.captureLine}>
            <span style={styles.captureAvatar}>{user?.displayName?.[0]?.toUpperCase() ?? "T"}</span>
            <span>Captured {formatShortDate(new Date(toat.createdAt))}</span>
            <span style={{ color: visual.accent }}><SparkleIcon size={16} /></span>
          </div>
        </SectionCard>
      ) : (
        <button type="button" onClick={() => setShowNotes(true)} style={{ background: "transparent", border: "1.5px dashed rgba(123,92,246,0.25)", borderRadius: 14, padding: "12px 16px", width: "100%", color: "#7C3AED", fontSize: 14, fontWeight: 600, cursor: "pointer", textAlign: "left", marginBottom: 16 }}>+ Add notes</button>
      )}

      {reminders.length ? (
        <SectionCard title="Reminders">
          {reminders.map((reminder) => (
            <div key={reminder.title} style={styles.toggleRow}>
              <div style={styles.toggleRowText}>
                <span style={{ ...styles.toggleIcon, color: visual.accent, background: visual.soft }}><BellIcon size={20} /></span>
                <div>
                  <p style={styles.toggleTitle}>{reminder.title}</p>
                  <p style={styles.toggleSubtitle}>{reminder.subtitle}</p>
                </div>
              </div>
              <SwitchVisual on={true} />
            </div>
          ))}
        </SectionCard>
      ) : null}
    </>
  );
}

function MeetingSection({
  startDate, endDate, joinUrl, people, agenda, visual, loc, maps,
  onAddLocation, onChangeLocation, onRemoveLocation,
}: {
  startDate: Date | null; endDate: Date | null; joinUrl: string; people: string[];
  agenda: string[]; visual: DetailVisual; loc: string | null; maps: string | null;
  onAddLocation: () => void; onChangeLocation: () => void; onRemoveLocation: () => void;
}) {
  return (
    <>
      <SectionCard title="Meeting details">
        {startDate ? <InfoRow icon={<ClockIcon size={22} />} label="When" title={`${formatDate(startDate)} \u00b7 ${formatTime(startDate)}`} subtitle={endDate ? `Ends at ${formatTime(endDate)}` : null} /> : null}
        <InfoRow icon={<VideoGlyph size={22} />} label="Link" title="Open meeting room" subtitle={joinUrl.replace(/^https?:\/\//, "")} onClick={() => window.open(joinUrl, "_blank", "noopener,noreferrer")} trailing={<span style={{ color: "#6B7280" }}><ChevronRightIcon size={18} /></span>} />
        <InfoRow icon={<MessageGlyph size={22} />} label="People" title={`${people.length || 1} people`} subtitle={people.length ? people.join(", ") : "Just you so far"} />
      </SectionCard>

      <SectionCard title="Agenda" action={<button type="button" style={styles.inlineGhost}><EditIcon size={18} /> Edit</button>}>
        {agenda.length ? (
          <ul style={styles.list}>
            {agenda.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p style={styles.bodyText}>No agenda yet. Add one from your next capture.</p>
        )}
      </SectionCard>

      <SectionCard title="Attachment">
        <button type="button" onClick={() => window.open(joinUrl, "_blank", "noopener,noreferrer")} style={{ ...styles.attachmentRow, ...styles.attachmentRowButton }}>
          <span style={{ ...styles.attachmentIcon, color: visual.accent, background: visual.soft }}><DocumentIcon size={24} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={styles.attachmentTitle}>Meeting link</p>
            <p style={styles.attachmentSubtitle}>{joinUrl.replace(/^https?:\/\//, "")}</p>
          </div>
          <span style={{ color: visual.accent }}><ChevronRightIcon size={20} /></span>
        </button>
      </SectionCard>

      <SectionCard title="Ping">
        <div style={styles.pingRow}>
          <span style={{ ...styles.toggleIcon, color: visual.accent, background: visual.soft }}><BellIcon size={20} /></span>
          <div>
            <p style={styles.toggleTitle}>10 min before</p>
            <p style={styles.toggleSubtitle}>You&apos;ll get a Ping before it starts.</p>
          </div>
        </div>
      </SectionCard>

      {maps && loc ? (
        <LocationBlock
          location={loc}
          mapsUrl={maps}
          gradient={visual.gradient}
          accent={visual.accent}
          onChangeLocation={onChangeLocation}
          onRemoveLocation={onRemoveLocation}
        />
      ) : (
        <div style={styles.buttonRow}>
          <button type="button" onClick={onAddLocation} style={styles.secondaryButton}>
            <LocationIcon size={18} /> Add location
          </button>
        </div>
      )}
    </>
  );
}

function ChecklistSection({
  checklistLocal, setChecklistLocal, saveChecklistItems, checklistDragIndex,
  visual, loc, maps, onAddLocation, onChangeLocation, onRemoveLocation,
  notesLocal, showNotes, setNotesLocal, saveNotesText, notesSaveTimer, setShowNotes,
  user, toat,
}: {
  checklistLocal: Array<{ id: string; text: string; done: boolean }>;
  setChecklistLocal: (v: Array<{ id: string; text: string; done: boolean }>) => void;
  saveChecklistItems: (v: Array<{ id: string; text: string; done: boolean }>) => Promise<void>;
  checklistDragIndex: React.MutableRefObject<number | null>;
  visual: DetailVisual; loc: string | null; maps: string | null;
  onAddLocation: () => void; onChangeLocation: () => void; onRemoveLocation: () => void;
  notesLocal: string; showNotes: boolean;
  setNotesLocal: (v: string) => void;
  saveNotesText: (v: string) => Promise<void>;
  notesSaveTimer: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  setShowNotes: (v: boolean) => void;
  user: { displayName: string | null } | null;
  toat: ToatDetail;
}) {
  return (
    <>
      <SectionCard
        title="Checklist"
        action={
          <button
            type="button"
            style={styles.inlineGhost}
            onClick={() => {
              const newItem = { id: Date.now().toString(), text: "", done: false };
              const next = [...checklistLocal, newItem];
              setChecklistLocal(next);
              void saveChecklistItems(next);
            }}
          >
            <PlusIcon size={15} /> Add item
          </button>
        }
      >
        {checklistLocal.length ? (
          <div style={styles.checklist}>
            {checklistLocal.map((item, i) => (
              <div
                key={item.id}
                style={{ ...styles.checklistRow, opacity: item.done ? 0.55 : 1 }}
                draggable
                onDragStart={() => { checklistDragIndex.current = i; }}
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={() => {
                  const from = checklistDragIndex.current;
                  if (from === null || from === i) return;
                  const next = [...checklistLocal];
                  const [moved] = next.splice(from, 1);
                  next.splice(i, 0, moved);
                  checklistDragIndex.current = null;
                  setChecklistLocal(next);
                  void saveChecklistItems(next);
                }}
              >
                <span style={styles.grabHandle}><GrabHandleIcon size={15} /></span>
                <button
                  type="button"
                  style={{ ...styles.checkCircle, ...(item.done ? { background: visual.accent, borderColor: visual.accent } : {}) }}
                  aria-label={item.done ? "Mark undone" : "Mark done"}
                  onClick={() => {
                    const updated = checklistLocal.map((c, j) => j === i ? { ...c, done: !c.done } : c);
                    const undone = updated.filter((c) => !c.done);
                    const done = updated.filter((c) => c.done);
                    const next = [...undone, ...done];
                    setChecklistLocal(next);
                    void saveChecklistItems(next);
                  }}
                />
                <input
                  style={{ ...styles.checkLabel, ...(item.done ? { textDecoration: "line-through" } : {}), flex: 1, background: "transparent", border: "none", outline: "none", color: "inherit", fontSize: "inherit", fontFamily: "inherit", padding: 0 }}
                  value={item.text}
                  onChange={(e) => {
                    setChecklistLocal(checklistLocal.map((c, j) => j === i ? { ...c, text: e.target.value } : c));
                  }}
                  onBlur={() => void saveChecklistItems(checklistLocal)}
                  placeholder="Item text\u2026"
                />
                <button
                  type="button"
                  style={styles.checkDeleteButton}
                  aria-label="Remove item"
                  onClick={() => {
                    const next = checklistLocal.filter((_, j) => j !== i);
                    setChecklistLocal(next);
                    void saveChecklistItems(next);
                  }}
                >
                  \u00d7
                </button>
              </div>
            ))}
          </div>
        ) : (
          <button
            type="button"
            style={{ ...styles.inlineGhost, width: "100%", justifyContent: "center", padding: "12px 0" }}
            onClick={() => {
              const newItem = { id: Date.now().toString(), text: "", done: false };
              setChecklistLocal([newItem]);
              void saveChecklistItems([newItem]);
            }}
          >
            <PlusIcon size={18} /> Add your first item
          </button>
        )}
      </SectionCard>

      {(showNotes || notesLocal.trim() !== "") ? (
        <SectionCard title="Notes">
          <textarea
            style={styles.notesTextarea}
            value={notesLocal}
            onChange={(e) => {
              setNotesLocal(e.target.value);
              if (notesSaveTimer.current) clearTimeout(notesSaveTimer.current);
              notesSaveTimer.current = setTimeout(() => { void saveNotesText(e.target.value); }, 800);
            }}
            onBlur={() => void saveNotesText(notesLocal)}
            placeholder="Add a note\u2026"
            rows={3}
          />
        </SectionCard>
      ) : (
        <button type="button" onClick={() => setShowNotes(true)} style={{ background: "transparent", border: "1.5px dashed rgba(123,92,246,0.25)", borderRadius: 14, padding: "12px 16px", width: "100%", color: "#7C3AED", fontSize: 14, fontWeight: 600, cursor: "pointer", textAlign: "left", marginBottom: 16 }}>+ Add notes</button>
      )}

      <SectionCard title="Ping me">
        <div style={styles.toggleRow}>
          <div style={styles.toggleRowText}>
            <span style={{ ...styles.toggleIcon, color: visual.accent, background: visual.soft }}><BellIcon size={20} /></span>
            <div>
              <p style={styles.toggleTitle}>30 min before</p>
              <p style={styles.toggleSubtitle}>We&apos;ll Ping you before you head out.</p>
            </div>
          </div>
          <SwitchVisual on={true} />
        </div>
      </SectionCard>

      {maps && loc ? (
        <LocationBlock
          location={loc}
          mapsUrl={maps}
          gradient={visual.gradient}
          accent={visual.accent}
          onChangeLocation={onChangeLocation}
          onRemoveLocation={onRemoveLocation}
        />
      ) : (
        <div style={styles.buttonRow}>
          <button type="button" style={styles.secondaryButton} onClick={onAddLocation}>
            <LocationIcon size={18} /> Add location
          </button>
        </div>
      )}
    </>
  );
}

function TicketInputModal({ onSave, onClose }: { onSave: (url: string) => void; onClose: () => void }) {
  const [value, setValue] = useState("");
  const trimmed = value.trim();
  const isValid = trimmed.startsWith("http://") || trimmed.startsWith("https://");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.32)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "#FFFFFF", borderRadius: 24, padding: 24, width: "100%", maxWidth: 420, boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: "#111827" }}>Add ticket link</h3>
        <p style={{ margin: "0 0 16px", fontSize: 14, color: "#6B7280" }}>Paste a link to your tickets — Ticketmaster, AXS, email confirmation URL, etc.</p>
        <input
          type="url"
          autoFocus
          placeholder="https://tickets.example.com/…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 12, border: "1.5px solid rgba(123,92,246,0.25)", fontSize: 14, color: "#111827", outline: "none", marginBottom: 16 }}
        />
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: "12px 0", borderRadius: 14, border: "1.5px solid rgba(0,0,0,0.1)", background: "transparent", fontSize: 14, fontWeight: 700, color: "#6B7280", cursor: "pointer" }}>Cancel</button>
          <button
            type="button"
            disabled={!isValid}
            onClick={() => { if (isValid) onSave(trimmed); }}
            style={{ flex: 2, padding: "12px 0", borderRadius: 14, border: "none", background: isValid ? "linear-gradient(135deg, #7C3AED, #5B3DF5)" : "rgba(0,0,0,0.08)", fontSize: 14, fontWeight: 700, color: isValid ? "#FFFFFF" : "#9CA3AF", cursor: isValid ? "pointer" : "default" }}
          >
            Save tickets
          </button>
        </div>
      </div>
    </div>
  );
}

function LocationBlock({
  location,
  mapsUrl,
  gradient,
  accent,
  onChangeLocation,
  onRemoveLocation,
}: {
  location: string;
  mapsUrl: string;
  gradient: string;
  accent: string;
  onChangeLocation: () => void;
  onRemoveLocation: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const copyAddress = () => {
    void navigator.clipboard.writeText(location).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Address chip row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", borderRadius: 14, background: "rgba(123,92,246,0.05)", border: "1.5px solid rgba(123,92,246,0.15)" }}>
        <span style={{ color: accent, flexShrink: 0, paddingTop: 2, lineHeight: 1 }}><LocationIcon size={16} /></span>
        <span style={{ flex: 1, fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{location}</span>
        <div style={{ display: "flex", gap: 4, flexShrink: 0, alignItems: "center" }}>
          {/* Copy button */}
          <button
            type="button"
            onClick={copyAddress}
            title="Copy address"
            style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", borderRadius: 6, color: copied ? "#16A34A" : "#9CA3AF", display: "flex", alignItems: "center" }}
          >
            {copied ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            )}
          </button>
          <button type="button" onClick={onChangeLocation} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#7C3AED", fontWeight: 700, padding: "2px 6px", borderRadius: 6 }}>Change</button>
          <button type="button" onClick={onRemoveLocation} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#9CA3AF", fontWeight: 400, padding: "0 4px", lineHeight: 1 }}>×</button>
        </div>
      </div>
      {/* Map visual — real Google Maps Static API tile */}
      <div style={{ position: "relative", height: 180, borderRadius: 20, overflow: "hidden", background: "#F3F4F6", border: "1px solid rgba(229,231,235,0.8)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/places/staticmap?q=${encodeURIComponent(location)}`}
          alt={location}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          loading="lazy"
        />
        <button
          type="button"
          onClick={() => window.open(mapsUrl, "_blank", "noopener,noreferrer")}
          style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(255,255,255,0.92)", border: "none", borderRadius: 10, padding: "5px 10px", fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.14)", display: "flex", alignItems: "center", gap: 5 }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6D28D9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
          Open in Maps
        </button>
      </div>
      {/* Directions button */}
      <button
        type="button"
        onClick={() => window.open(mapsUrl, "_blank", "noopener,noreferrer")}
        style={{ minHeight: 46, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, border: "none", borderRadius: 16, background: gradient, color: "#FFFFFF", fontSize: 15, fontWeight: 700, cursor: "pointer", width: "100%" }}
      >
        <SteeringWheelIcon size={18} /> Directions
      </button>
    </div>
  );
}

function RescheduleModal({
  value,
  onChange,
  busy,
  onConfirm,
  onClose,
}: {
  value: string;
  onChange: (v: string) => void;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 40, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(17,24,39,0.34)", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 480, borderRadius: 28, background: "#FFFFFF", boxShadow: "0 28px 80px rgba(31,41,55,0.18)", padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>Reschedule</span>
          <button type="button" onClick={onClose} style={{ background: "transparent", border: "none", fontSize: 22, cursor: "pointer", color: "#6B7280" }}>✕</button>
        </div>
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: "100%", border: "1.5px solid rgba(123,92,246,0.3)", borderRadius: 12, padding: "10px 14px", fontSize: 15, color: "#111827", outline: "none", boxSizing: "border-box" }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button type="button" onClick={onClose} style={{ minHeight: 42, border: "1.5px solid rgba(123,92,246,0.2)", borderRadius: 14, background: "transparent", color: "#6D28D9", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
          <button type="button" onClick={onConfirm} disabled={busy || !value} style={{ minHeight: 42, border: "none", borderRadius: 14, background: busy ? "#C4B5FD" : "linear-gradient(135deg, #7C3AED, #5B3DF5)", color: "#FFFFFF", fontSize: 14, fontWeight: 700, cursor: busy ? "not-allowed" : "pointer" }}>{busy ? "Saving…" : "Confirm"}</button>
        </div>
      </div>
    </div>
  );
}

function LocationSearchModal({
  query,
  suggestions,
  onQueryChange,
  onSelect,
  onClose,
}: {
  query: string;
  suggestions: Array<{ placeId: string; description: string }>;
  onQueryChange: (q: string) => Promise<void>;
  onSelect: (description: string) => void;
  onClose: () => void;
}) {
  const [inputValue, setInputValue] = useState(query);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const handleChange = (val: string) => {
    setInputValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { void onQueryChange(val); }, 300);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 40, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(17,24,39,0.34)", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 520, borderRadius: 28, background: "#FFFFFF", boxShadow: "0 28px 80px rgba(31,41,55,0.18)", padding: 20, display: "flex", flexDirection: "column", gap: 14, maxHeight: "70vh" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>Add location</span>
          <button type="button" onClick={onClose} style={{ background: "transparent", border: "none", fontSize: 22, cursor: "pointer", color: "#6B7280" }}>✕</button>
        </div>
        <input
          type="text"
          autoFocus
          value={inputValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search for a place or address…"
          style={{ width: "100%", border: "1.5px solid rgba(123,92,246,0.3)", borderRadius: 12, padding: "10px 14px", fontSize: 15, color: "#111827", outline: "none", boxSizing: "border-box" }}
        />
        {suggestions.length > 0 ? (
          <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
            {suggestions.map((s) => (
              <button
                key={s.placeId}
                type="button"
                onClick={() => onSelect(s.description)}
                style={{ textAlign: "left", background: "transparent", border: "none", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "#111827", cursor: "pointer", lineHeight: 1.4 }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(123,92,246,0.07)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                📍 {s.description}
              </button>
            ))}
          </div>
        ) : inputValue.trim() ? (
          <p style={{ fontSize: 14, color: "#6B7280", textAlign: "center" }}>No results. Try a different search.</p>
        ) : null}
      </div>
    </div>
  );
}

function ShareToatModal({
  toat,
  connections,
  selectedConnectionIds,
  permission,
  busy,
  onClose,
  onToggleConnection,
  onPermissionChange,
  onCreateLink,
  onSend,
  onOpenConnections,
}: {
  toat: ToatDetail;
  connections: SavedConnection[];
  selectedConnectionIds: string[];
  permission: "view" | "edit";
  busy: string | null;
  onClose: () => void;
  onToggleConnection: (connectionId: string) => void;
  onPermissionChange: (permission: "view" | "edit") => void;
  onCreateLink: () => void;
  onSend: () => void;
  onOpenConnections: () => void;
}) {
  return (
    <div style={styles.shareOverlay}>
      <section style={styles.shareSheet}>
        <div style={styles.shareSheetHandle} />
        <div style={styles.shareHeader}>
          <div>
            <p style={styles.shareEyebrow}>Share toat</p>
            <h2 style={styles.shareTitle}>Choose connections</h2>
          </div>
          <button type="button" onClick={onClose} style={styles.shareCloseButton}>×</button>
        </div>

        <article style={styles.sharePreviewCard}>
          <div style={styles.sharePreviewIcon}><ShareIcon size={22} /></div>
          <div style={{ minWidth: 0 }}>
            <p style={styles.sharePreviewTitle}>{toat.title}</p>
            <p style={styles.sharePreviewMeta}>{toatTime(toat) ? new Date(toatTime(toat)!).toLocaleString() : "No time set"}</p>
          </div>
        </article>

        <div style={styles.sharePeopleGrid}>
          {busy === "load" ? <p style={styles.shareHelper}>Loading connections…</p> : null}
          {!busy && !connections.length ? (
            <button type="button" onClick={onOpenConnections} style={styles.shareEmptyButton}>Add connections in Settings</button>
          ) : null}
          {connections.map((connection) => {
            const selected = selectedConnectionIds.includes(connection.id);
            return (
              <button
                key={connection.id}
                type="button"
                onClick={() => onToggleConnection(connection.id)}
                style={{ ...styles.sharePersonButton, ...(selected ? styles.sharePersonButtonSelected : {}) }}
              >
                <span style={styles.sharePersonAvatar}>{initials(connection.name)}</span>
                <span style={styles.sharePersonName}>{connection.name}</span>
                <span style={styles.sharePersonRelationship}>{connection.relationship}</span>
              </button>
            );
          })}
        </div>

        <div style={styles.sharePermissionRow}>
          <button type="button" onClick={() => onPermissionChange("view")} style={{ ...styles.sharePermissionButton, ...(permission === "view" ? styles.sharePermissionButtonActive : {}) }}>View only</button>
          <button type="button" onClick={() => onPermissionChange("edit")} style={{ ...styles.sharePermissionButton, ...(permission === "edit" ? styles.sharePermissionButtonActive : {}) }}>Can edit</button>
        </div>

        <button type="button" onClick={onCreateLink} style={styles.secondaryButton} disabled={Boolean(busy)}>
          {busy === "link" ? "Creating link…" : "Create share link"}
        </button>
        <button type="button" onClick={onSend} style={styles.primaryButton} disabled={Boolean(busy) || selectedConnectionIds.length === 0}>
          {busy === "send" ? "Sending…" : "Send invite"}
        </button>
      </section>
    </div>
  );
}

function SummaryTile({
  accent,
  title,
  subtitle,
  value,
}: {
  accent: string;
  title: string;
  subtitle: string;
  value: string;
}) {
  return (
    <div style={styles.summaryTile}>
      <span style={{ ...styles.summaryRing, borderColor: `${accent}55`, color: accent }}>{title}</span>
      <p style={styles.summaryValue}>{value}</p>
      <p style={styles.summarySubtitle}>{subtitle}</p>
    </div>
  );
}

function MenuAction({
  icon,
  label,
  tone,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  tone: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} style={{ ...styles.menuAction, color: tone }}>
      {icon}
      {label}
    </button>
  );
}

function labelForPatch(body: Record<string, unknown>) {
  if (body.status === "done") return "Marked done.";
  if (body.datetime) return "Time updated.";
  return "Saved.";
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #FBFAFF 0%, #F7F5FF 48%, #FBFAFF 100%)",
    position: "relative",
    overflowX: "clip",
  },
  backgroundHaloOne: {
    position: "absolute",
    top: -120,
    left: -150,
    width: 360,
    height: 360,
    background: "radial-gradient(circle, rgba(249,168,212,0.16), rgba(249,168,212,0))",
  },
  backgroundHaloTwo: {
    position: "absolute",
    top: 120,
    right: -120,
    width: 360,
    height: 360,
    background: "radial-gradient(circle, rgba(191,219,254,0.18), rgba(191,219,254,0))",
  },
  backgroundHaloThree: {
    position: "absolute",
    bottom: 120,
    left: "22%",
    width: 300,
    height: 300,
    background: "radial-gradient(circle, rgba(253,224,71,0.1), rgba(253,224,71,0))",
  },
  main: {
    width: "min(calc(100vw - 24px), 860px)",
    margin: "0 auto",
    padding: "24px 0 40px",
    position: "relative",
    zIndex: 1,
  },
  mainCompact: {
    width: "min(calc(100vw - 18px), 860px)",
    padding: "10px 0 22px",
  },
  topBar: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 34,
  },
  topBarCompact: {
    gap: 10,
    marginBottom: 14,
  },
  topBarRight: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
  },
  topBarRightCompact: {
    gap: 8,
  },
  heroSection: {
    display: "flex",
    alignItems: "flex-start",
    gap: 26,
    marginBottom: 24,
  },
  heroSectionCompact: {
    gap: 11,
    marginBottom: 12,
  },
  heroIconWrap: {
    width: 138,
    height: 138,
    borderRadius: 38,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 28px 60px rgba(91,61,245,0.18)",
    flexShrink: 0,
  },
  heroIconWrapCompact: {
    width: 64,
    height: 64,
    borderRadius: 20,
  },
  heroKickerRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 8,
  },
  heroKicker: {
    fontSize: 16,
    letterSpacing: "0.04em",
    fontWeight: 700,
    textTransform: "uppercase",
  },
  heroChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    minHeight: 36,
    padding: "0 13px",
    borderRadius: 999,
    fontSize: 14,
    fontWeight: 700,
  },
  heroTitle: {
    fontSize: "clamp(40px, 10vw, 60px)",
    lineHeight: 0.96,
    letterSpacing: "-0.05em",
    color: "#0F1B4C",
    fontWeight: 800,
    marginBottom: 14,
  },
  heroTitleCompact: {
    fontSize: 25,
    marginBottom: 7,
  },
  heroLocation: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 18,
    color: "#4B5563",
    marginBottom: 8,
  },
  heroLocationCompact: {
    gap: 6,
    fontSize: 12,
    marginBottom: 4,
  },
  heroSecondary: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 16,
    color: "#6B7280",
  },
  heroSecondaryCompact: {
    gap: 6,
    fontSize: 11.5,
  },
  heroMeetingMeta: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 18,
  },
  heroMetaChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    minHeight: 34,
    padding: "0 14px",
    borderRadius: 999,
    background: "rgba(37,99,235,0.1)",
    color: "#2563EB",
    fontSize: 15,
    fontWeight: 700,
  },
  heroMetaChipCompact: {
    minHeight: 28,
    padding: "0 10px",
    fontSize: 12,
    gap: 6,
  },
  peopleRow: {
    display: "flex",
    alignItems: "center",
  },
  personBadge: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    marginLeft: -8,
    background: "linear-gradient(135deg, #E5E7EB, #F8FAFC)",
    border: "3px solid rgba(255,255,255,0.95)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    color: "#374151",
  },
  personOverflow: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    marginLeft: -8,
    background: "rgba(229,231,235,0.8)",
    border: "3px solid rgba(255,255,255,0.95)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    color: "#4B5563",
  },
  personBadgeCompact: {
    width: 32,
    height: 32,
    fontSize: 10,
    borderWidth: 2,
  },
  flash: {
    marginBottom: 16,
    padding: "14px 18px",
    borderRadius: 20,
    background: "rgba(91,61,245,0.08)",
    color: "#5B3DF5",
    fontSize: 16,
    fontWeight: 700,
  },
  shareOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 40,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    background: "rgba(17,24,39,0.34)",
    padding: 12,
  },
  shareSheet: {
    width: "min(100%, 560px)",
    maxHeight: "92vh",
    overflowY: "auto",
    borderRadius: 30,
    background: "#FFFFFF",
    border: "1px solid rgba(229,231,235,0.92)",
    boxShadow: "0 28px 90px rgba(17,24,39,0.22)",
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  shareSheetHandle: {
    alignSelf: "center",
    width: 52,
    height: 5,
    borderRadius: 99,
    background: "#D1D5DB",
    marginBottom: 4,
  },
  shareHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
  },
  shareEyebrow: {
    margin: 0,
    fontSize: 12,
    fontWeight: 850,
    letterSpacing: 0,
    color: "#5B3DF5",
    textTransform: "uppercase",
  },
  shareTitle: {
    margin: "4px 0 0",
    fontSize: 26,
    lineHeight: 1.08,
    color: "#111827",
  },
  shareCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    border: "1px solid rgba(107,114,128,0.16)",
    background: "rgba(249,250,251,0.92)",
    color: "#374151",
    fontSize: 26,
    lineHeight: 1,
    cursor: "pointer",
  },
  sharePreviewCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 20,
    background: "#F8F7FF",
    border: "1px solid #ECE9FF",
  },
  sharePreviewIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, #7C3AED, #5B3DF5)",
    color: "#FFFFFF",
  },
  sharePreviewTitle: {
    margin: 0,
    color: "#111827",
    fontSize: 15,
    fontWeight: 850,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  sharePreviewMeta: {
    margin: "4px 0 0",
    color: "#6B7280",
    fontSize: 12,
  },
  sharePeopleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(104px, 1fr))",
    gap: 10,
  },
  sharePersonButton: {
    display: "flex",
    minHeight: 112,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 18,
    border: "1px solid #E5E7EB",
    background: "#FFFFFF",
    color: "#111827",
    cursor: "pointer",
  },
  sharePersonButtonSelected: {
    borderColor: "#5B3DF5",
    background: "#F4F0FF",
  },
  sharePersonAvatar: {
    width: 42,
    height: 42,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, #EC4899, #F59E0B)",
    color: "#FFFFFF",
    fontWeight: 900,
    fontSize: 13,
  },
  sharePersonName: {
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: 13,
    fontWeight: 850,
  },
  sharePersonRelationship: {
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: 11,
    color: "#6B7280",
  },
  shareEmptyButton: {
    gridColumn: "1 / -1",
    minHeight: 80,
    borderRadius: 18,
    border: "1px dashed rgba(91,61,245,0.35)",
    background: "#F8F7FF",
    color: "#5B3DF5",
    fontWeight: 850,
    cursor: "pointer",
  },
  shareHelper: {
    gridColumn: "1 / -1",
    margin: 0,
    color: "#6B7280",
    fontSize: 14,
  },
  sharePermissionRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    padding: 6,
    borderRadius: 18,
    background: "#F3F4F6",
  },
  sharePermissionButton: {
    minHeight: 44,
    borderRadius: 14,
    border: "none",
    background: "transparent",
    color: "#6B7280",
    fontWeight: 850,
    cursor: "pointer",
  },
  sharePermissionButtonActive: {
    background: "#FFFFFF",
    color: "#5B3DF5",
    boxShadow: "0 8px 22px rgba(17,24,39,0.08)",
  },
  fullWidthPrimary: {
    width: "100%",
    minHeight: 64,
    border: "none",
    borderRadius: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 28px 60px rgba(37,99,235,0.24)",
    marginBottom: 18,
  },
  fullWidthPrimaryCompact: {
    minHeight: 44,
    borderRadius: 15,
    fontSize: 13,
    gap: 8,
    marginBottom: 10,
  },
  sectionCard: {
    borderRadius: 20,
    background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.84))",
    border: "1px solid rgba(255,255,255,0.94)",
    boxShadow: "0 28px 80px rgba(31,41,55,0.08)",
    padding: "14px 14px 13px",
    marginBottom: 10,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 11.5,
    fontWeight: 700,
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: "0.02em",
  },
  inlineGhost: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    minHeight: 30,
    padding: "0 10px",
    borderRadius: 11,
    border: "1px solid rgba(123,92,246,0.18)",
    background: "rgba(123,92,246,0.08)",
    color: "#6D28D9",
    fontSize: 11.5,
    fontWeight: 700,
  },
  inlineTextButton: {
    border: "none",
    background: "transparent",
    color: "#6D28D9",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    padding: 0,
  },
  infoRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: "10px 0",
    borderTop: "1px solid rgba(229,231,235,0.6)",
  },
  infoRowButton: {
    width: "100%",
    border: "none",
    background: "transparent",
    textAlign: "left",
    cursor: "pointer",
  },
  infoRowIcon: {
    width: 24,
    display: "flex",
    justifyContent: "center",
    color: "#6B7280",
    flexShrink: 0,
  },
  infoRowLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: "#6B7280",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  infoRowTitle: {
    fontSize: 15,
    lineHeight: 1.12,
    color: "#0F172A",
    fontWeight: 700,
    marginBottom: 3,
  },
  infoRowSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 1.35,
  },
  buttonRow: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 8,
    marginTop: 10,
  },
  primaryButton: {
    minHeight: 42,
    border: "none",
    borderRadius: 14,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 22px 46px rgba(91,61,245,0.22)",
  },
  secondaryButton: {
    minHeight: 42,
    border: "1px solid rgba(123,92,246,0.18)",
    borderRadius: 14,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    background: "rgba(255,255,255,0.9)",
    color: "#6D28D9",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 1.45,
    color: "#111827",
  },
  captureLine: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    marginTop: 12,
    color: "#6B7280",
    fontSize: 11.5,
  },
  captureAvatar: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #E5E7EB, #F8FAFC)",
    color: "#111827",
    fontWeight: 700,
  },
  toggleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "10px 0",
    borderTop: "1px solid rgba(229,231,235,0.6)",
  },
  toggleRowText: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  toggleIcon: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  toggleTitle: {
    fontSize: 13.5,
    color: "#111827",
    fontWeight: 700,
    marginBottom: 3,
  },
  toggleSubtitle: {
    fontSize: 11.5,
    color: "#6B7280",
  },
  switchBase: {
    width: 42,
    height: 23,
    borderRadius: 999,
    display: "inline-flex",
    alignItems: "center",
    padding: 2,
    flexShrink: 0,
  },
  switchThumb: {
    width: 19,
    height: 19,
    borderRadius: "50%",
    background: "#FFFFFF",
    boxShadow: "0 6px 16px rgba(31,41,55,0.16)",
    transition: "transform 0.18s ease",
  },
  attachmentRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  attachmentRowButton: {
    width: "100%",
    border: "none",
    background: "transparent",
    textAlign: "left",
    cursor: "pointer",
    padding: 0,
  },
  attachmentIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  attachmentTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 4,
  },
  attachmentSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    wordBreak: "break-all",
  },
  pingRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  list: {
    paddingLeft: 22,
    display: "grid",
    gap: 12,
    fontSize: 16,
    lineHeight: 1.4,
    color: "#111827",
  },
  dualMetricCard: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 0,
    borderRadius: 30,
    background: "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(247,244,255,0.88))",
    border: "1px solid rgba(123,92,246,0.16)",
    boxShadow: "0 26px 70px rgba(31,41,55,0.08)",
    padding: 12,
    marginBottom: 18,
  },
  metricCell: {
    padding: "18px 22px",
  },
  metricDivider: {
    width: 1,
    background: "rgba(229,231,235,0.8)",
    margin: "18px 0",
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: 700,
    color: "#6D28D9",
    marginTop: 10,
    marginBottom: 12,
  },
  metricTime: {
    fontSize: 30,
    lineHeight: 1,
    fontWeight: 800,
    color: "#111827",
    marginBottom: 10,
  },
  metricDate: {
    fontSize: 14,
    color: "#6B7280",
  },
  mapCard: {
    position: "relative",
    height: 176,
    borderRadius: 22,
    overflow: "hidden",
    marginTop: 16,
    background: "linear-gradient(180deg, #F8FAFC, #F3F4F6)",
    border: "1px solid rgba(229,231,235,0.8)",
  },
  mapGrid: {
    position: "absolute",
    inset: 0,
    backgroundImage: "linear-gradient(rgba(148,163,184,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.18) 1px, transparent 1px)",
    backgroundSize: "44px 44px",
    transform: "skew(-14deg)",
  },
  mapPin: {
    position: "absolute",
    left: "52%",
    top: "42%",
    width: 22,
    height: 22,
    borderRadius: "50% 50% 50% 0",
    background: "linear-gradient(135deg, #7C3AED, #5B3DF5)",
    transform: "rotate(-45deg)",
    boxShadow: "0 20px 30px rgba(91,61,245,0.22)",
  },
  mapLabel: {
    position: "absolute",
    left: "48%",
    top: "58%",
    transform: "translateX(-50%)",
    fontSize: 16,
    fontWeight: 700,
    color: "#6D28D9",
  },
  mapFooter: {
    marginTop: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    flexWrap: "wrap",
    fontSize: 14,
    color: "#6B7280",
  },
  ticketCard: {
    display: "flex",
    gap: 14,
    borderRadius: 22,
    border: "1px solid rgba(123,92,246,0.16)",
    background: "linear-gradient(180deg, rgba(250,245,255,0.88), rgba(255,255,255,0.8))",
    padding: 16,
  },
  ticketTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: "#111827",
    marginBottom: 8,
  },
  ticketSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
  },
  ticketCounter: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 34,
    padding: "0 12px",
    borderRadius: 999,
    background: "rgba(123,92,246,0.1)",
    color: "#6D28D9",
    fontSize: 16,
    fontWeight: 700,
  },
  qrBox: {
    width: 128,
    borderLeft: "1px dashed rgba(123,92,246,0.24)",
    paddingLeft: 14,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  qrPattern: {
    width: 80,
    height: 80,
    backgroundImage: "linear-gradient(90deg, #111827 12%, transparent 12%, transparent 24%, #111827 24%, #111827 36%, transparent 36%, transparent 48%, #111827 48%, #111827 60%, transparent 60%, transparent 72%, #111827 72%), linear-gradient(#111827 12%, transparent 12%, transparent 24%, #111827 24%, #111827 36%, transparent 36%, transparent 48%, #111827 48%, #111827 60%, transparent 60%, transparent 72%, #111827 72%)",
    backgroundSize: "16px 16px",
    border: "6px solid rgba(255,255,255,0.9)",
    boxShadow: "inset 0 0 0 1px rgba(229,231,235,0.9)",
  },
  qrDigits: {
    fontSize: 16,
    color: "#6B7280",
    letterSpacing: "0.08em",
  },
  summaryStrip: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 14,
    marginBottom: 18,
  },
  summaryTile: {
    borderRadius: 22,
    background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.84))",
    border: "1px solid rgba(255,255,255,0.94)",
    boxShadow: "0 24px 70px rgba(31,41,55,0.08)",
    padding: "16px 12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  summaryRing: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    border: "4px solid rgba(34,197,94,0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    fontWeight: 800,
    marginBottom: 10,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: 800,
    color: "#111827",
    marginBottom: 6,
  },
  summarySubtitle: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 1.4,
  },
  checklist: {
    display: "grid",
    gap: 2,
  },
  checklistRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 0",
    borderBottom: "1px solid rgba(229,231,235,0.5)",
  },
  grabHandle: {
    color: "#D1D5DB",
    cursor: "grab",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    border: "2px solid rgba(34,197,94,0.55)",
    flexShrink: 0,
    cursor: "pointer",
    background: "transparent",
    padding: 0,
  },
  checkLabel: {
    fontSize: 15,
    color: "#111827",
    fontWeight: 500,
    lineHeight: 1.4,
  },
  checkDeleteButton: {
    background: "transparent",
    border: "none",
    color: "#9CA3AF",
    cursor: "pointer",
    fontSize: 20,
    lineHeight: 1,
    padding: "0 4px",
    flexShrink: 0,
  },
  notesTextarea: {
    width: "100%",
    background: "transparent",
    border: "1px solid rgba(209,213,219,0.6)",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 15,
    color: "#111827",
    fontFamily: "inherit",
    lineHeight: 1.6,
    resize: "vertical" as const,
    outline: "none",
    boxSizing: "border-box" as const,
  },
  shareGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
    gap: 16,
  },
  sharePerson: {
    textAlign: "center",
  },
  shareAvatar: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    margin: "0 auto 10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #E5E7EB, #F8FAFC)",
    fontSize: 18,
    fontWeight: 700,
    color: "#374151",
  },
  shareName: {
    fontSize: 17,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 4,
  },
  shareRole: {
    fontSize: 13,
    color: "#6B7280",
  },
  tipCard: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "16px 14px",
    borderRadius: 22,
    background: "linear-gradient(135deg, rgba(255,247,237,0.9), rgba(255,255,255,0.78))",
    border: "1px solid rgba(253,186,116,0.28)",
    boxShadow: "0 22px 60px rgba(249,115,22,0.08)",
    marginBottom: 14,
  },
  tipSpark: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "rgba(251,146,60,0.14)",
    color: "#F97316",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  tipText: {
    fontSize: 15,
    lineHeight: 1.5,
    color: "#111827",
  },
  actionStrip: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: 6,
    borderRadius: 18,
    background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.88))",
    border: "1px solid rgba(255,255,255,0.92)",
    boxShadow: "0 26px 80px rgba(31,41,55,0.08)",
    padding: "10px 7px",
    marginBottom: 14,
  },
  actionStripButton: {
    border: "none",
    background: "transparent",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 5,
    fontSize: 10.5,
    fontWeight: 600,
  },
  actionStripIcon: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  menuCard: {
    position: "absolute",
    top: 74,
    right: 0,
    width: 220,
    padding: 10,
    borderRadius: 24,
    background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,0.88))",
    border: "1px solid rgba(255,255,255,0.94)",
    boxShadow: "0 28px 80px rgba(31,41,55,0.14)",
    backdropFilter: "blur(18px)",
    zIndex: 10,
  },
  menuAction: {
    width: "100%",
    minHeight: 48,
    border: "none",
    borderRadius: 16,
    background: "transparent",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 12px",
    fontSize: 18,
    fontWeight: 600,
    cursor: "pointer",
  },
  loadingCard: {
    minHeight: 320,
    borderRadius: 34,
    background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.84))",
    border: "1px solid rgba(255,255,255,0.92)",
    boxShadow: "0 28px 80px rgba(31,41,55,0.08)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingSpinner: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    border: "3px solid rgba(91,61,245,0.12)",
    borderTopColor: "#5B3DF5",
  },
  loadingText: {
    fontSize: 18,
    color: "#6B7280",
    fontWeight: 600,
  },
  errorCard: {
    minHeight: 320,
    borderRadius: 34,
    background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.84))",
    border: "1px solid rgba(255,255,255,0.92)",
    boxShadow: "0 28px 80px rgba(31,41,55,0.08)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    textAlign: "center",
    padding: 32,
  },
  errorTitle: {
    fontSize: 28,
    lineHeight: 1.1,
    fontWeight: 800,
    color: "#0F172A",
  },
  errorBody: {
    fontSize: 19,
    lineHeight: 1.5,
    color: "#6B7280",
    maxWidth: 500,
  },
};