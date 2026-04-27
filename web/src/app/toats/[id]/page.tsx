"use client";

import { useEffect, useState } from "react";
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
  LocationIcon,
  MessageGlyph,
  MoreIcon,
  PhoneGlyph,
  RescheduleIcon,
  ShareIcon,
  SnoozeIcon,
  SparkleIcon,
  TicketGlyph,
  ToothGlyph,
  TrashIcon,
  UserAvatar,
  VideoGlyph,
} from "@/components/mobile-ui";

type ToatKind = "task" | "event" | "meeting" | "errand" | "deadline" | "idea";
type ToatTier = "urgent" | "important" | "regular";

interface ToatDetail {
  id: string;
  kind: ToatKind;
  tier: ToatTier;
  title: string;
  datetime: string | null;
  endDatetime: string | null;
  location: string | null;
  link: string | null;
  people: string[];
  notes: string | null;
  status: string;
  captureId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ActionConfig {
  label: string;
  href: string;
  external: boolean;
}

type DetailVariant = "appointment" | "checklist" | "meeting" | "event" | "general";

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
  if (!toat.datetime) return null;

  const start = new Date(toat.datetime);
  const end = toat.endDatetime ? new Date(toat.endDatetime) : null;
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

function normalizeText(toat: ToatDetail) {
  return `${toat.title} ${toat.notes ?? ""}`.toLowerCase();
}

function extractPhone(toat: ToatDetail) {
  const match = `${toat.title} ${toat.notes ?? ""}`.match(/(\+?\d[\d\s().-]{7,}\d)/);
  return match ? match[1] : null;
}

function mapHref(location: string | null) {
  if (!location) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

function getVariant(toat: ToatDetail): DetailVariant {
  const text = normalizeText(toat);
  if (toat.kind === "meeting" || /meet|standup|sync|zoom|google meet/.test(text)) return "meeting";
  if (toat.kind === "event") return "event";
  if (/grocer|shopping|buy /.test(text)) return "checklist";
  if (/dentist|doctor|clinic|appointment|check-up/.test(text) || toat.kind === "errand") return "appointment";
  return "general";
}

function getVisual(toat: ToatDetail) {
  const text = normalizeText(toat);

  if (/dentist|doctor|clinic|appointment|check-up/.test(text) || toat.kind === "errand") {
    return {
      kicker: "Appointment",
      gradient: "linear-gradient(135deg, #7C3AED, #5B3DF5)",
      soft: "rgba(139,92,246,0.12)",
      accent: "#6D28D9",
      Icon: ToothGlyph,
    };
  }

  if (toat.kind === "meeting" || /meet|standup|sync|zoom|google meet/.test(text)) {
    return {
      kicker: "Meeting",
      gradient: "linear-gradient(135deg, #3B82F6, #2563EB)",
      soft: "rgba(59,130,246,0.12)",
      accent: "#2563EB",
      Icon: VideoGlyph,
    };
  }

  if (/grocer|shopping|buy /.test(text)) {
    return {
      kicker: "Errand",
      gradient: "linear-gradient(135deg, #22C55E, #16A34A)",
      soft: "rgba(34,197,94,0.12)",
      accent: "#16A34A",
      Icon: CartGlyph,
    };
  }

  if (toat.kind === "event") {
    return {
      kicker: "Event",
      gradient: "linear-gradient(135deg, #7C3AED, #5B3DF5)",
      soft: "rgba(124,58,237,0.12)",
      accent: "#6D28D9",
      Icon: TicketGlyph,
    };
  }

  if (/call /.test(text)) {
    return {
      kicker: "Call",
      gradient: "linear-gradient(135deg, #F43F5E, #EC4899)",
      soft: "rgba(236,72,153,0.12)",
      accent: "#DB2777",
      Icon: PhoneGlyph,
    };
  }

  if (/email|send|deck|message/.test(text)) {
    return {
      kicker: "Task",
      gradient: "linear-gradient(135deg, #F97316, #FB923C)",
      soft: "rgba(249,115,22,0.12)",
      accent: "#EA580C",
      Icon: EnvelopeGlyph,
    };
  }

  return {
    kicker: toat.kind === "idea" ? "Idea" : "Toat",
    gradient: "linear-gradient(135deg, #F59E0B, #FBBF24)",
    soft: "rgba(245,158,11,0.12)",
    accent: "#D97706",
    Icon: BulbGlyph,
  };
}

function getPrimaryAction(toat: ToatDetail): ActionConfig {
  const variant = getVariant(toat);
  const phone = extractPhone(toat);
  const directions = mapHref(toat.location);

  if (variant === "meeting" && toat.link) {
    return { label: "Join now", href: toat.link, external: true };
  }

  if (variant === "event" && toat.link) {
    return { label: "View tickets", href: toat.link, external: true };
  }

  if (phone) {
    return { label: "Call", href: `tel:${phone.replace(/\s+/g, "")}`, external: true };
  }

  if (directions) {
    return { label: "Directions", href: directions, external: true };
  }

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

function parseChecklist(notes: string | null) {
  if (!notes) return [];
  return notes
    .split(/\r?\n|,|;/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function buildReminderLines(toat: ToatDetail) {
  if (!toat.datetime) return [];
  const start = new Date(toat.datetime);
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
        kind: toat.kind,
        tier: toat.tier,
        title: `${toat.title} copy`,
        datetime: toat.datetime,
        endDatetime: toat.endDatetime,
        location: toat.location,
        link: toat.link,
        people: toat.people,
        notes: toat.notes,
      }),
    });

    const data = (await response.json().catch(() => null)) as { toat?: ToatDetail; error?: string } | null;
    if (!response.ok || !data?.toat) {
      throw new Error(data?.error ?? "Could not duplicate this toat.");
    }

    router.push(`/toats/${data.toat.id}`);
  };

  const shareToat = async () => {
    if (!toat) return;
    const shareUrl = `${window.location.origin}/toats/${toat.id}`;
    if (navigator.share) {
      await navigator.share({ title: toat.title, text: toat.title, url: shareUrl });
      return;
    }

    await navigator.clipboard.writeText(shareUrl);
    setFlash("Link copied.");
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

  const visual = getVisual(toat);
  const variant = getVariant(toat);
  const Icon = visual.Icon;
  const heroChip = formatRelativeChip(toat, now);
  const primaryAction = getPrimaryAction(toat);
  const reminders = buildReminderLines(toat);
  const agenda = parseAgenda(toat.notes);
  const checklistItems = parseChecklist(toat.notes);
  const ticketDigits = qrDigits(toat.id);
  const startDate = toat.datetime ? new Date(toat.datetime) : null;
  const endDate = toat.endDatetime ? new Date(toat.endDatetime) : null;
  const phone = extractPhone(toat);
  const maps = mapHref(toat.location);
  const isPhoneViewport = viewportWidth !== null && viewportWidth <= 430;

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
            <CircleIconButton label="Share" onClick={() => void shareToat()}>
              <ShareIcon size={isPhoneViewport ? 20 : 24} />
            </CircleIconButton>
            <div style={{ position: "relative" }}>
              <CircleIconButton label="More actions" onClick={() => setMenuOpen((value) => !value)}>
                <MoreIcon size={isPhoneViewport ? 20 : 24} />
              </CircleIconButton>
              {menuOpen ? (
                <div style={styles.menuCard}>
                  <MenuAction label="Mark done" icon={<DoneIcon size={20} />} tone="#111827" onClick={() => void runMutation("mark-done", async () => { await patchToat({ status: "done" }); router.replace("/timeline"); })} />
                  <MenuAction label="Reschedule" icon={<RescheduleIcon size={20} />} tone="#111827" onClick={() => void runMutation("reschedule", async () => { if (!toat.datetime) throw new Error("This toat has no time to reschedule."); await patchToat({ datetime: new Date(new Date(toat.datetime).getTime() + 24 * 60 * 60000).toISOString() }); })} />
                  <MenuAction label="Duplicate" icon={<DuplicateIcon size={20} />} tone="#111827" onClick={() => void runMutation("duplicate", duplicateToat)} />
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
              {variant === "appointment" ? <span style={{ ...styles.heroKicker, color: visual.accent }}>• {visual.kicker.toUpperCase()}</span> : null}
              {heroChip ? <DetailBadge text={heroChip.text} style={heroChip.style} accent={visual.accent} /> : null}
            </div>
            <h1 style={{ ...styles.heroTitle, ...(isPhoneViewport ? styles.heroTitleCompact : {}) }}>{toat.title}</h1>

            {variant === "meeting" ? (
              <div style={styles.heroMeetingMeta}>
                <span style={{ ...styles.heroMetaChip, ...(isPhoneViewport ? styles.heroMetaChipCompact : {}) }}><VideoGlyph size={isPhoneViewport ? 16 : 20} /> {toat.link ? "Meeting link" : "Meeting"}</span>
                {toat.people.length ? (
                  <div style={styles.peopleRow}>
                    {toat.people.slice(0, 4).map((person) => (
                      <span key={person} style={{ ...styles.personBadge, ...(isPhoneViewport ? styles.personBadgeCompact : {}) }}>{initials(person)}</span>
                    ))}
                    {toat.people.length > 4 ? <span style={{ ...styles.personOverflow, ...(isPhoneViewport ? styles.personBadgeCompact : {}) }}>+{toat.people.length - 4}</span> : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {toat.location ? <p style={{ ...styles.heroLocation, ...(isPhoneViewport ? styles.heroLocationCompact : {}) }}><LocationIcon size={isPhoneViewport ? 18 : 22} /> {toat.location}</p> : null}
            {variant === "event" && toat.link ? <p style={{ ...styles.heroSecondary, ...(isPhoneViewport ? styles.heroSecondaryCompact : {}) }}><TicketGlyph size={isPhoneViewport ? 16 : 20} /> Tickets ready</p> : null}
            {variant === "general" && startDate ? <p style={{ ...styles.heroSecondary, ...(isPhoneViewport ? styles.heroSecondaryCompact : {}) }}><ClockIcon size={isPhoneViewport ? 16 : 20} /> {formatDate(startDate)}</p> : null}
          </div>
        </section>

        {flash ? <div style={styles.flash}>{flash}</div> : null}

        {variant === "meeting" ? (
          <button type="button" onClick={openPrimaryAction} style={{ ...styles.fullWidthPrimary, ...(isPhoneViewport ? styles.fullWidthPrimaryCompact : {}), background: visual.gradient }}>
            <VideoGlyph size={isPhoneViewport ? 20 : 24} /> {primaryAction.label}
          </button>
        ) : null}

        {variant === "appointment" || variant === "general" ? (
          <>
            <SectionCard title="When & where" action={<button type="button" style={styles.inlineGhost}><EditIcon size={18} /> Edit</button>}>
              {startDate ? (
                <InfoRow
                  icon={<ClockIcon size={22} />}
                  label="When"
                  title={formatDate(startDate)}
                  subtitle={endDate ? `${formatTime(startDate)} – ${formatTime(endDate)}` : formatTime(startDate)}
                />
              ) : null}
              {toat.location ? (
                <InfoRow
                  icon={<LocationIcon size={22} />}
                  label="Where"
                  title={toat.location}
                  subtitle={maps ? "Open in Maps" : null}
                  onClick={maps ? () => window.open(maps, "_blank", "noopener,noreferrer") : undefined}
                  trailing={maps ? <span style={{ color: "#6B7280" }}><ChevronRightIcon size={18} /></span> : undefined}
                />
              ) : null}
              {phone ? (
                <InfoRow icon={<PhoneGlyph size={22} />} label="Contact" title={phone} />
              ) : null}
              <div style={styles.buttonRow}>
                <button type="button" onClick={openPrimaryAction} style={{ ...styles.primaryButton, background: visual.gradient }}>
                  <DirectionsIcon size={20} /> {primaryAction.label}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (phone) {
                      window.open(`tel:${phone.replace(/\s+/g, "")}`, "_self");
                      return;
                    }
                    void shareToat();
                  }}
                  style={styles.secondaryButton}
                >
                  {phone ? <PhoneGlyph size={20} /> : <MessageGlyph size={20} />} {phone ? "Call" : "Share"}
                </button>
              </div>
            </SectionCard>

            {toat.notes ? (
              <SectionCard title="About this toat">
                <p style={styles.bodyText}>{toat.notes}</p>
                <div style={styles.captureLine}>
                  <span style={styles.captureAvatar}>{user?.displayName?.[0]?.toUpperCase() ?? "T"}</span>
                  <span>Captured {formatShortDate(new Date(toat.createdAt))}</span>
                  <span style={{ color: visual.accent }}><SparkleIcon size={16} /></span>
                </div>
              </SectionCard>
            ) : null}

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
        ) : null}

        {variant === "meeting" ? (
          <>
            <SectionCard title="Meeting details">
              {startDate ? <InfoRow icon={<ClockIcon size={22} />} label="When" title={`${formatDate(startDate)} · ${formatTime(startDate)}`} subtitle={endDate ? `Ends at ${formatTime(endDate)}` : null} /> : null}
              {toat.link ? <InfoRow icon={<VideoGlyph size={22} />} label="Link" title="Open meeting room" subtitle={toat.link.replace(/^https?:\/\//, "")} onClick={() => window.open(toat.link!, "_blank", "noopener,noreferrer")} trailing={<span style={{ color: "#6B7280" }}><ChevronRightIcon size={18} /></span>} /> : null}
              <InfoRow icon={<MessageGlyph size={22} />} label="People" title={`${toat.people.length || 1} people`} subtitle={toat.people.length ? toat.people.join(", ") : "Just you so far"} />
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

            {toat.link ? (
              <SectionCard title="Attachment">
                <button type="button" onClick={() => window.open(toat.link!, "_blank", "noopener,noreferrer")} style={{ ...styles.attachmentRow, ...styles.attachmentRowButton }}>
                  <span style={{ ...styles.attachmentIcon, color: visual.accent, background: visual.soft }}><DocumentIcon size={24} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={styles.attachmentTitle}>Meeting link</p>
                    <p style={styles.attachmentSubtitle}>{toat.link.replace(/^https?:\/\//, "")}</p>
                  </div>
                  <span style={{ color: visual.accent }}><ChevronRightIcon size={20} /></span>
                </button>
              </SectionCard>
            ) : null}

            <SectionCard title="Ping">
              <div style={styles.pingRow}>
                <span style={{ ...styles.toggleIcon, color: visual.accent, background: visual.soft }}><BellIcon size={20} /></span>
                <div>
                  <p style={styles.toggleTitle}>10 min before</p>
                  <p style={styles.toggleSubtitle}>You&apos;ll get a Ping before it starts.</p>
                </div>
              </div>
            </SectionCard>
          </>
        ) : null}

        {variant === "event" ? (
          <>
            {startDate ? (
              <section style={styles.dualMetricCard}>
                <div style={styles.metricCell}>
                  <span style={{ color: visual.accent }}><ClockIcon size={24} /></span>
                  <p style={styles.metricLabel}>Doors open</p>
                  <p style={styles.metricTime}>{formatTime(new Date(startDate.getTime() - 60 * 60000))}</p>
                  <p style={styles.metricDate}>{formatShortDate(startDate)}</p>
                </div>
                <div style={styles.metricDivider} />
                <div style={styles.metricCell}>
                  <span style={{ color: visual.accent }}><DocumentIcon size={24} /></span>
                  <p style={styles.metricLabel}>Show starts</p>
                  <p style={styles.metricTime}>{formatTime(startDate)}</p>
                  <p style={styles.metricDate}>{formatShortDate(startDate)}</p>
                </div>
              </section>
            ) : null}

            <div style={styles.buttonRow}>
              <button type="button" onClick={() => { if (maps) window.open(maps, "_blank", "noopener,noreferrer"); }} style={{ ...styles.primaryButton, background: visual.gradient }}>
                <DirectionsIcon size={20} /> Directions
              </button>
              <button type="button" onClick={openPrimaryAction} style={styles.secondaryButton}>
                <TicketGlyph size={20} /> View tickets
              </button>
            </div>

            <SectionCard title={toat.location ?? "Venue"}>
              <p style={styles.infoRowSubtitle}>{toat.location ?? "Venue details coming soon"}</p>
              <div style={styles.mapCard}>
                <div style={styles.mapGrid} />
                <span style={styles.mapPin} />
                <span style={styles.mapLabel}>{toat.location ?? "Venue"}</span>
              </div>
              <div style={styles.mapFooter}>
                <span><DirectionsIcon size={18} /> {startDate ? "25 min drive" : "Directions ready"}</span>
                <button type="button" style={styles.inlineTextButton} onClick={() => { if (maps) window.open(maps, "_blank", "noopener,noreferrer"); }}>
                  Open in Maps
                </button>
              </div>
            </SectionCard>

            <SectionCard title="Your tickets" action={<button type="button" style={styles.inlineTextButton} onClick={openPrimaryAction}>View details</button>}>
              <div style={styles.ticketCard}>
                <div style={{ flex: 1 }}>
                  <p style={styles.ticketTitle}>Seat details</p>
                  <p style={styles.ticketSubtitle}>Ticket ref {ticketDigits.slice(0, 4)} · {ticketDigits.slice(4, 8)}</p>
                  <span style={styles.ticketCounter}>1 of 1</span>
                </div>
                <div style={styles.qrBox}>
                  <div style={styles.qrPattern} />
                  <p style={styles.qrDigits}>{ticketDigits}</p>
                </div>
              </div>
            </SectionCard>

            {toat.notes ? (
              <SectionCard title="Note" action={<button type="button" style={styles.inlineTextButton}><EditIcon size={18} /> Edit</button>}>
                <p style={styles.bodyText}>{toat.notes}</p>
              </SectionCard>
            ) : null}
          </>
        ) : null}

        {variant === "checklist" ? (
          <>
            <section style={styles.summaryStrip}>
              <SummaryTile accent={visual.accent} title={`${checklistItems.length}`} subtitle="items" value={`${checklistItems.length}`} />
              <SummaryTile accent={visual.accent} title="Checklist" subtitle="to buy" value={`${Math.max(0, checklistItems.length)}`} />
              <SummaryTile accent={visual.accent} title={toat.location ?? "For me"} subtitle="where" value={toat.people[0] ?? "Personal"} />
            </section>

            <SectionCard title="Shopping list" action={<button type="button" style={styles.inlineGhost}><EditIcon size={18} /> Edit</button>}>
              {checklistItems.length ? (
                <div style={styles.checklist}>
                  {checklistItems.map((item) => (
                    <div key={item} style={styles.checklistRow}>
                      <span style={styles.checkCircle} />
                      <span style={styles.checkLabel}>{item}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={styles.bodyText}>Add line-separated notes to turn this into a richer checklist.</p>
              )}
            </SectionCard>

            {toat.notes ? (
              <SectionCard title="Note">
                <p style={styles.bodyText}>{toat.notes}</p>
              </SectionCard>
            ) : null}

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

            <div style={styles.buttonRow}>
              <button type="button" style={styles.secondaryButton} onClick={() => void patchToat({ notes: `${toat.notes ?? ""}\n` })}>
                <DocumentIcon size={20} /> View list
              </button>
              <button type="button" style={{ ...styles.primaryButton, background: visual.gradient }} onClick={openPrimaryAction}>
                <DirectionsIcon size={20} /> Directions
              </button>
            </div>
          </>
        ) : null}

        {variant === "general" ? (
          <>
            <SectionCard title="Details">
              {startDate ? <InfoRow icon={<ClockIcon size={22} />} label="When" title={formatDate(startDate)} subtitle={formatTime(startDate)} /> : null}
              {toat.location ? <InfoRow icon={<LocationIcon size={22} />} label="Where" title={toat.location} /> : null}
              {toat.notes ? <InfoRow icon={<DocumentIcon size={22} />} label="Notes" title={toat.notes} /> : null}
            </SectionCard>
          </>
        ) : null}

        {toat.people.length ? (
          <SectionCard title="Sharing">
            <div style={styles.shareGrid}>
              {toat.people.map((person) => (
                <div key={person} style={styles.sharePerson}>
                  <span style={styles.shareAvatar}>{initials(person)}</span>
                  <p style={styles.shareName}>{person}</p>
                  <p style={styles.shareRole}>Can view</p>
                </div>
              ))}
            </div>
          </SectionCard>
        ) : null}

        {variant !== "meeting" ? (
          <section style={styles.tipCard}>
            <span style={styles.tipSpark}><SparkleIcon size={20} /></span>
            <p style={styles.tipText}>Toatre will keep this toat on track with your Pings and the timing you already set.</p>
          </section>
        ) : null}

        <section style={styles.actionStrip}>
          <ActionStripButton icon={<DoneIcon size={20} />} label="Mark done" tint="#16A34A" disabled={Boolean(actionState)} onClick={() => void runMutation("done", async () => { await patchToat({ status: "done" }); router.replace("/timeline"); })} />
          <ActionStripButton icon={<SnoozeIcon size={20} />} label="Snooze" tint="#2563EB" disabled={Boolean(actionState)} onClick={() => void runMutation("snooze", async () => { if (!toat.datetime) throw new Error("This toat has no time to snooze."); await patchToat({ datetime: new Date(new Date(toat.datetime).getTime() + 60 * 60000).toISOString() }); })} />
          <ActionStripButton icon={<RescheduleIcon size={20} />} label="Reschedule" tint="#7C3AED" disabled={Boolean(actionState)} onClick={() => void runMutation("reschedule", async () => { if (!toat.datetime) throw new Error("This toat has no time to reschedule."); await patchToat({ datetime: new Date(new Date(toat.datetime).getTime() + 24 * 60 * 60000).toISOString() }); })} />
          <ActionStripButton icon={<DuplicateIcon size={20} />} label="Duplicate" tint="#6B7280" disabled={Boolean(actionState)} onClick={() => void runMutation("duplicate", duplicateToat)} />
          <ActionStripButton icon={<TrashIcon size={20} />} label="Delete" tint="#DC2626" disabled={Boolean(actionState)} onClick={() => { if (window.confirm("Delete this toat?")) { void runMutation("delete", deleteToat); } }} />
        </section>

        <div style={{ height: 40 }} />
      </main>
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
    gap: 14,
  },
  checklistRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    paddingBottom: 14,
    borderBottom: "1px solid rgba(229,231,235,0.6)",
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: "50%",
    border: "2px solid rgba(34,197,94,0.65)",
    flexShrink: 0,
  },
  checkLabel: {
    fontSize: 17,
    color: "#111827",
    fontWeight: 600,
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