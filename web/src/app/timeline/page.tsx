"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import {
  AppBrand,
  BottomTabBar,
  BulbGlyph,
  CalendarIcon,
  CartGlyph,
  ChevronDownIcon,
  ChevronRightIcon,
  CircleIconButton,
  ClockIcon,
  DirectionsIcon,
  EnvelopeGlyph,
  EditIcon,
  FilterIcon,
  FloatingMicButton,
  InboxIcon,
  LocationIcon,
  MessageGlyph,
  PeopleIcon,
  PhoneGlyph,
  SearchIcon,
  SettingsIcon,
  SparkleIcon,
  TicketGlyph,
  TimelineIcon,
  ToothGlyph,
  UserAvatar,
  VideoGlyph,
} from "@/components/mobile-ui";

type ToatKind = "task" | "event" | "meeting" | "errand" | "deadline" | "idea";
type ToatTier = "urgent" | "important" | "regular";

interface TimelineToat {
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

interface DayGroup {
  key: string;
  title: string;
  subtitle: string;
  toats: TimelineToat[];
}

interface TimeSection {
  label: string;
  toats: TimelineToat[];
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatRailTime(date: Date) {
  const text = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
  const [time, period] = text.split(" ");
  return { time, period: period ?? "" };
}

function formatSecondaryDate(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function relativeDayLabel(date: Date, now: Date) {
  const today = startOfDay(now).getTime();
  const target = startOfDay(date).getTime();
  const diffDays = Math.round((target - today) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

function buildDayGroups(toats: TimelineToat[], now: Date): DayGroup[] {
  const buckets = new Map<string, TimelineToat[]>();

  for (const toat of toats) {
    const key = toat.datetime ? startOfDay(new Date(toat.datetime)).toISOString() : "undated";
    const existing = buckets.get(key) ?? [];
    existing.push(toat);
    buckets.set(key, existing);
  }

  return Array.from(buckets.entries())
    .sort(([leftKey], [rightKey]) => {
      if (leftKey === "undated") return 1;
      if (rightKey === "undated") return -1;
      return new Date(leftKey).getTime() - new Date(rightKey).getTime();
    })
    .map(([key, groupToats]) => {
      if (key === "undated") {
        return { key, title: "Someday", subtitle: "Whenever you get to it", toats: sortToats(groupToats) };
      }

      const groupDate = new Date(key);
      return {
        key,
        title: relativeDayLabel(groupDate, now),
        subtitle: formatSecondaryDate(groupDate),
        toats: sortToats(groupToats),
      };
    });
}

function sortToats(toats: TimelineToat[]) {
  return [...toats].sort((left, right) => {
    if (!left.datetime && !right.datetime) return left.createdAt.localeCompare(right.createdAt);
    if (!left.datetime) return 1;
    if (!right.datetime) return -1;
    return new Date(left.datetime).getTime() - new Date(right.datetime).getTime();
  });
}

function buildSections(toats: TimelineToat[]): TimeSection[] {
  const sections = new Map<string, TimelineToat[]>();

  for (const toat of toats) {
    if (!toat.datetime) {
      const undated = sections.get("Any time") ?? [];
      undated.push(toat);
      sections.set("Any time", undated);
      continue;
    }

    const hour = new Date(toat.datetime).getHours();
    const label = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
    const existing = sections.get(label) ?? [];
    existing.push(toat);
    sections.set(label, existing);
  }

  return Array.from(sections.entries()).map(([label, sectionToats]) => ({ label, toats: sectionToats }));
}

function formatMinutesLabel(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
}

function extractPhone(toat: TimelineToat) {
  const match = `${toat.title} ${toat.notes ?? ""}`.match(/(\+?\d[\d\s().-]{7,}\d)/);
  return match ? match[1] : null;
}

function mapHref(location: string | null) {
  if (!location) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

function normalizeKeywords(text: string) {
  return text.toLowerCase();
}

function getToatVisual(toat: TimelineToat) {
  const text = normalizeKeywords(`${toat.title} ${toat.notes ?? ""}`);

  if (/dentist|doctor|clinic|appointment|check-up/.test(text)) {
    return {
      label: "Appointment",
      cardGradient: "linear-gradient(135deg, #7C3AED, #5B3DF5)",
      iconTint: "#8B5CF6",
      softTint: "rgba(139,92,246,0.12)",
      actionText: "Directions",
      actionBackground: "rgba(123,92,246,0.12)",
      actionColor: "#6D28D9",
      Icon: ToothGlyph,
    };
  }

  if (toat.kind === "meeting" || /meet|standup|sync|zoom|google meet|call with/.test(text)) {
    return {
      label: "Meeting",
      cardGradient: "linear-gradient(135deg, #3B82F6, #2563EB)",
      iconTint: "#3B82F6",
      softTint: "rgba(59,130,246,0.12)",
      actionText: "Join",
      actionBackground: "rgba(59,130,246,0.12)",
      actionColor: "#2563EB",
      Icon: VideoGlyph,
    };
  }

  if (/call /.test(text) || /phone/.test(text)) {
    return {
      label: "Call",
      cardGradient: "linear-gradient(135deg, #F43F5E, #EC4899)",
      iconTint: "#EC4899",
      softTint: "rgba(236,72,153,0.12)",
      actionText: "Call",
      actionBackground: "rgba(236,72,153,0.12)",
      actionColor: "#DB2777",
      Icon: PhoneGlyph,
    };
  }

  if (/email|send|deck|message/.test(text)) {
    return {
      label: "Task",
      cardGradient: "linear-gradient(135deg, #F97316, #FB923C)",
      iconTint: "#F97316",
      softTint: "rgba(249,115,22,0.12)",
      actionText: "Message",
      actionBackground: "rgba(249,115,22,0.12)",
      actionColor: "#EA580C",
      Icon: EnvelopeGlyph,
    };
  }

  if (/grocer|shopping|buy /.test(text)) {
    return {
      label: "Errand",
      cardGradient: "linear-gradient(135deg, #8B5CF6, #7C3AED)",
      iconTint: "#8B5CF6",
      softTint: "rgba(139,92,246,0.12)",
      actionText: "Directions",
      actionBackground: "rgba(139,92,246,0.12)",
      actionColor: "#6D28D9",
      Icon: CartGlyph,
    };
  }

  if (toat.kind === "event") {
    return {
      label: "Event",
      cardGradient: "linear-gradient(135deg, #7C3AED, #5B3DF5)",
      iconTint: "#7C3AED",
      softTint: "rgba(124,58,237,0.12)",
      actionText: "Tickets",
      actionBackground: "rgba(124,58,237,0.12)",
      actionColor: "#6D28D9",
      Icon: TicketGlyph,
    };
  }

  if (toat.kind === "idea" || /read|idea|brainstorm|note/.test(text)) {
    return {
      label: "Idea",
      cardGradient: "linear-gradient(135deg, #F59E0B, #FBBF24)",
      iconTint: "#F59E0B",
      softTint: "rgba(245,158,11,0.12)",
      actionText: "Open",
      actionBackground: "rgba(245,158,11,0.12)",
      actionColor: "#D97706",
      Icon: BulbGlyph,
    };
  }

  return {
    label: toat.kind === "deadline" ? "Deadline" : "Task",
    cardGradient: "linear-gradient(135deg, #8B5CF6, #EC4899)",
    iconTint: "#8B5CF6",
    softTint: "rgba(139,92,246,0.12)",
    actionText: "Open",
    actionBackground: "rgba(139,92,246,0.12)",
    actionColor: "#6D28D9",
    Icon: MessageGlyph,
  };
}

function getCountdownLabel(toat: TimelineToat, now: Date) {
  if (!toat.datetime) return "Any time";

  const start = new Date(toat.datetime);
  const end = toat.endDatetime ? new Date(toat.endDatetime) : null;
  const diffMinutes = Math.round((start.getTime() - now.getTime()) / 60000);

  if (end && now >= start && now <= end) return "Happening now";
  if (diffMinutes > 0 && diffMinutes <= 15) return `Leave in ${formatMinutesLabel(diffMinutes)}`;
  if (diffMinutes > 15) return `Starting in ${formatMinutesLabel(diffMinutes)}`;
  if (diffMinutes <= 0 && (!end || now > end)) return "Past due";
  return formatTime(start);
}

function getPrimaryAction(toat: TimelineToat) {
  const visual = getToatVisual(toat);
  const phone = extractPhone(toat);
  const directions = mapHref(toat.location);

  if ((toat.kind === "meeting" || visual.actionText === "Join") && toat.link) {
    return { label: "Join", href: toat.link, external: true };
  }

  if (visual.actionText === "Call" && phone) {
    return { label: "Call", href: `tel:${phone.replace(/\s+/g, "")}`, external: true };
  }

  if (visual.actionText === "Message" && toat.link) {
    return { label: "Message", href: toat.link, external: true };
  }

  if (directions && (visual.actionText === "Directions" || toat.location)) {
    return { label: "Directions", href: directions, external: true };
  }

  if (toat.kind === "event" && toat.link) {
    return { label: "Tickets", href: toat.link, external: true };
  }

  return { label: visual.actionText, href: `/toats/${toat.id}`, external: false };
}

function getUpNext(toats: TimelineToat[], now: Date) {
  return [...toats]
    .filter((toat) => toat.datetime && toat.status === "active")
    .sort((left, right) => new Date(left.datetime!).getTime() - new Date(right.datetime!).getTime())
    .find((toat) => {
      const start = new Date(toat.datetime!);
      const end = toat.endDatetime ? new Date(toat.endDatetime) : null;
      if (end && now > end) return false;
      return start >= new Date(now.getTime() - 15 * 60000);
    });
}

function EmptyTimeline({ onCapture, onTextCapture }: { onCapture: () => void; onTextCapture: () => void }) {
  return (
    <section style={styles.emptyCard}>
      <div style={styles.emptySun} />
      <div style={styles.emptyGlow} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={styles.emptyBadgeWrap}>
          <span style={styles.emptyBadge}><SparkleIcon size={18} /></span>
        </div>
        <h2 style={styles.emptyTitle}>You&apos;re all clear.</h2>
        <p style={styles.emptyBody}>Tap the mic and say what needs to happen next. Toatre will turn it into toats and drop them into your timeline.</p>
        <div style={styles.emptyActions}>
          <button type="button" onClick={onCapture} style={styles.emptyCaptureButton}>Start capturing</button>
          <button type="button" onClick={onTextCapture} style={styles.emptyTextButton}>Type it instead</button>
        </div>
      </div>
      <div style={styles.landscape}>
        <div style={styles.sunDisc} />
        <div style={styles.hillOne} />
        <div style={styles.hillTwo} />
      </div>
    </section>
  );
}

export default function TimelinePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [toats, setToats] = useState<TimelineToat[]>([]);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showOnlyTimed, setShowOnlyTimed] = useState(false);
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);

  const now = new Date();
  const openCapture = () => router.push("/capture?autostart=1");
  const openTextCapture = () => router.push("/capture?mode=text");

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/toats?range=all", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error(`Failed to load timeline (${response.status})`);
        }

        const data = (await response.json()) as { toats?: TimelineToat[] };
        if (!cancelled) {
          setToats(sortToats(data.toats ?? []));
        }
      } catch (error) {
        console.error("[timeline]", error);
      } finally {
        if (!cancelled) {
          setHasLoadedData(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

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

  const groups = buildDayGroups(toats, now);
  const resolvedSelectedDayKey = selectedDayKey && groups.some((group) => group.key === selectedDayKey)
    ? selectedDayKey
    : (groups.find((group) => group.title === "Today") ?? groups[0])?.key ?? null;
  const activeGroup = groups.find((group) => group.key === resolvedSelectedDayKey) ?? groups[0] ?? null;
  const visibleToats = (activeGroup?.toats ?? []).filter((toat) => (showOnlyTimed ? Boolean(toat.datetime) : true));
  const sections = buildSections(visibleToats);
  const upNext = getUpNext(toats, new Date());
  const lastToat = visibleToats[visibleToats.length - 1] ?? null;
  const loading = authLoading || (Boolean(user) && !hasLoadedData);
  const isPhoneViewport = viewportWidth !== null && viewportWidth <= 430;
  const clearCardMarginTop = visibleToats.length <= 2 ? (isPhoneViewport ? 34 : 18) : 8;

  return (
    <div style={styles.page}>
      <div style={styles.backgroundHaloOne} />
      <div style={styles.backgroundHaloTwo} />
      <div style={styles.backgroundHaloThree} />

      <main style={{ ...styles.main, ...(isPhoneViewport ? styles.mainCompact : {}) }}>
        <section style={{ ...styles.topRow, ...(isPhoneViewport ? styles.topRowCompact : {}) }}>
            <AppBrand />
            <button type="button" onClick={() => router.push("/settings")} style={styles.avatarButton} aria-label="Open profile settings">
              <UserAvatar user={user} />
            </button>
        </section>

        <section style={{ ...styles.headingRow, ...(isPhoneViewport ? styles.headingRowCompact : {}) }}>
            <div style={{ position: "relative", flex: 1 }}>
              <button type="button" onClick={() => setPickerOpen((value) => !value)} style={{ ...styles.dayButton, ...(isPhoneViewport ? styles.dayButtonCompact : {}) }}>
                <span style={styles.dayButtonLabel}>{activeGroup?.title ?? "Timeline"}</span>
                <ChevronDownIcon size={22} />
              </button>
              <p style={{ ...styles.dayButtonSubtitle, ...(isPhoneViewport ? styles.dayButtonSubtitleCompact : {}) }}>{activeGroup?.subtitle ?? "Your next toats"}</p>

              {pickerOpen ? (
                <div style={{ ...styles.dayPicker, ...(isPhoneViewport ? styles.dayPickerCompact : {}) }}>
                  {groups.map((group) => (
                    <button
                      key={group.key}
                      type="button"
                      onClick={() => {
                        setSelectedDayKey(group.key);
                        setPickerOpen(false);
                      }}
                      style={{
                        ...styles.dayPickerItem,
                        background: group.key === activeGroup?.key ? "rgba(91,61,245,0.10)" : "transparent",
                      }}
                    >
                      <span>
                        <span style={styles.dayPickerTitle}>{group.title}</span>
                        <span style={styles.dayPickerSubtitle}>{group.subtitle}</span>
                      </span>
                      <span style={styles.dayPickerCount}>{group.toats.length}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div style={{ ...styles.headerActions, ...(isPhoneViewport ? styles.headerActionsCompact : {}) }}>
              <CircleIconButton label="Choose day" onClick={() => setPickerOpen((value) => !value)}>
                <CalendarIcon size={26} />
              </CircleIconButton>
              <CircleIconButton
                label="Filter timed toats"
                active={showOnlyTimed}
                onClick={() => setShowOnlyTimed((value) => !value)}
              >
                <FilterIcon size={26} />
              </CircleIconButton>
            </div>
        </section>

        {loading ? (
          <section style={{ ...styles.loadingCard, ...(isPhoneViewport ? styles.loadingCardCompact : {}) }}>
            <div style={styles.loadingSpinner} className="animate-spin" />
            <p style={styles.loadingText}>Loading your timeline…</p>
          </section>
        ) : null}

        {!loading && upNext ? <UpNextCard toat={upNext} compact={isPhoneViewport} /> : null}

        {!loading && visibleToats.length > 0 ? (
            <section>
              {sections.map((section) => (
                <div key={section.label} style={styles.sectionBlock}>
                  <h2 style={{ ...styles.sectionTitle, ...(isPhoneViewport ? styles.sectionTitleCompact : {}) }}>{section.label}</h2>
                  <div style={{ ...styles.sectionRows, ...(isPhoneViewport ? styles.sectionRowsCompact : {}) }}>
                    {section.toats.map((toat) => (
                      <TimelineRow key={toat.id} toat={toat} onOpen={() => router.push(`/toats/${toat.id}`)} compact={isPhoneViewport} />
                    ))}
                  </div>
                </div>
              ))}

              <section style={{ ...styles.clearCard, ...(isPhoneViewport ? styles.clearCardCompact : {}), marginTop: clearCardMarginTop }}>
                <div style={styles.clearTextWrap}>
                  <span style={{ ...styles.clearSparkle, ...(isPhoneViewport ? styles.clearSparkleCompact : {}) }}><SparkleIcon size={isPhoneViewport ? 14 : 18} /></span>
                  <div>
                    <p style={{ ...styles.clearHeadline, ...(isPhoneViewport ? styles.clearHeadlineCompact : {}) }}>
                      {lastToat?.datetime ? `You’re all clear after ${formatTime(new Date(lastToat.datetime))}` : "You’re all clear."}
                    </p>
                    <p style={{ ...styles.clearSub, ...(isPhoneViewport ? styles.clearSubCompact : {}) }}>Enjoy your {lastToat?.datetime && new Date(lastToat.datetime).getHours() < 17 ? "evening" : "day"}.</p>
                  </div>
                </div>
                <div style={{ ...styles.clearScene, ...(isPhoneViewport ? styles.clearSceneCompact : {}) }}>
                  <div style={{ ...styles.clearSceneSun, ...(isPhoneViewport ? styles.clearSceneSunCompact : {}) }} />
                  <div style={{ ...styles.clearSceneHillOne, ...(isPhoneViewport ? styles.clearSceneHillOneCompact : {}) }} />
                  <div style={{ ...styles.clearSceneHillTwo, ...(isPhoneViewport ? styles.clearSceneHillTwoCompact : {}) }} />
                </div>
              </section>
            </section>
          ) : null}

        {!loading && !toats.length ? <EmptyTimeline onCapture={openCapture} onTextCapture={openTextCapture} /> : null}

        <div style={{ height: isPhoneViewport ? 128 : 176 }} />
      </main>

      <button type="button" onClick={openTextCapture} style={styles.textCaptureDockButton} aria-label="Start text capture" title="Start text capture">
        <EditIcon size={18} />
      </button>
      <FloatingMicButton onClick={openCapture} />

      <BottomTabBar
        items={[
          { label: "Timeline", icon: <TimelineIcon />, href: "/timeline", active: true },
          { label: "Search", icon: <SearchIcon /> },
          { label: "People", icon: <PeopleIcon /> },
          { label: "Inbox", icon: <InboxIcon /> },
          { label: "Settings", icon: <SettingsIcon />, href: "/settings" },
        ]}
      />
    </div>
  );
}

function UpNextCard({ toat, compact = false }: { toat: TimelineToat; compact?: boolean }) {
  const router = useRouter();
  const visual = getToatVisual(toat);
  const Icon = visual.Icon;
  const action = getPrimaryAction(toat);
  const time = toat.datetime ? formatTime(new Date(toat.datetime)) : "Any time";

  const openAction = () => {
    if (action.external) {
      window.open(action.href, "_blank", "noopener,noreferrer");
      return;
    }

    router.push(action.href);
  };

  return (
    <section style={{ ...styles.upNextCard, ...(compact ? styles.upNextCardCompact : {}) }} className="animate-fade-up">
      <div style={{ ...styles.upNextMetaRow, ...(compact ? styles.upNextMetaRowCompact : {}) }}>
        <span style={{ ...styles.upNextBadge, ...(compact ? styles.upNextBadgeCompact : {}) }}><SparkleIcon size={compact ? 12 : 16} /> UP NEXT</span>
        <span style={{ ...styles.upNextTimePill, ...(compact ? styles.upNextTimePillCompact : {}) }}><ClockIcon size={compact ? 14 : 18} /> {time}</span>
      </div>

      <div style={{ ...styles.upNextBody, ...(compact ? styles.upNextBodyCompact : {}) }}>
        <div style={{ ...styles.iconPanel, ...(compact ? styles.iconPanelCompact : {}), background: visual.cardGradient }}>
          <Icon size={compact ? 24 : 30} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ ...styles.upNextTitle, ...(compact ? styles.upNextTitleCompact : {}) }}>{toat.title}</h3>
          {toat.location ? (
            <p style={{ ...styles.upNextLocation, ...(compact ? styles.upNextLocationCompact : {}) }}><LocationIcon size={compact ? 14 : 18} /> {toat.location}</p>
          ) : null}
          <p style={{ ...styles.upNextCountdown, ...(compact ? styles.upNextCountdownCompact : {}), color: visual.actionColor }}>{getCountdownLabel(toat, new Date())}</p>
        </div>
      </div>

      <div style={styles.upNextActionRow}>
        <button type="button" onClick={openAction} style={{ ...styles.primaryPillButton, ...(compact ? styles.primaryPillButtonCompact : {}), background: visual.cardGradient }}>
          <DirectionsIcon size={compact ? 14 : 18} /> {action.label === "Open" ? "View details" : action.label}
        </button>
      </div>
    </section>
  );
}

function TimelineRow({ toat, onOpen, compact = false }: { toat: TimelineToat; onOpen: () => void; compact?: boolean }) {
  const visual = getToatVisual(toat);
  const Icon = visual.Icon;
  const action = getPrimaryAction(toat);

  const runAction = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (action.external) {
      window.open(action.href, "_blank", "noopener,noreferrer");
      return;
    }

    onOpen();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  };

  const railTime = toat.datetime ? formatRailTime(new Date(toat.datetime)) : { time: "Any", period: "time" };

  return (
    <div style={{ ...styles.timelineRow, ...(compact ? styles.timelineRowCompact : {}) }}>
      <div style={{ ...styles.timeRailColumn, ...(compact ? styles.timeRailColumnCompact : {}) }}>
        <p style={{ ...styles.timeRailTime, ...(compact ? styles.timeRailTimeCompact : {}) }}>{railTime.time}</p>
        <p style={{ ...styles.timeRailPeriod, ...(compact ? styles.timeRailPeriodCompact : {}) }}>{railTime.period}</p>
      </div>

      <div style={styles.railTrackWrap}>
        <div style={styles.railLine} />
        <span style={{ ...styles.railDot, ...(compact ? styles.railDotCompact : {}), background: visual.iconTint }} />
      </div>

      <div role="button" tabIndex={0} onClick={onOpen} onKeyDown={onKeyDown} style={{ ...styles.toatCard, ...(compact ? styles.toatCardCompact : {}) }}>
        <div style={{ ...styles.iconPanel, ...(compact ? styles.timelineIconPanelCompact : styles.timelineIconPanel), background: visual.cardGradient, boxShadow: `0 18px 32px ${visual.softTint}` }}>
          <Icon size={compact ? 24 : 30} />
        </div>

        <div style={{ ...styles.cardBody, ...(compact ? styles.cardBodyCompact : {}) }}>
          <div style={{ ...styles.cardHeader, ...(compact ? styles.cardHeaderCompact : {}) }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ ...styles.cardTitle, ...(compact ? styles.cardTitleCompact : {}) }}>{toat.title}</p>
              {toat.location ? (
                <p style={{ ...styles.cardMeta, ...(compact ? styles.cardMetaCompact : {}) }}><LocationIcon size={compact ? 14 : 18} /> {toat.location}</p>
              ) : toat.people.length ? (
                <p style={{ ...styles.cardMeta, ...(compact ? styles.cardMetaCompact : {}) }}><PeopleIcon size={compact ? 14 : 18} /> {toat.people.join(", ")}</p>
              ) : (
                <p style={{ ...styles.cardMeta, ...(compact ? styles.cardMetaCompact : {}) }}>{getCountdownLabel(toat, new Date())}</p>
              )}
            </div>
            <span style={{ color: "#9CA3AF", flexShrink: 0 }}><ChevronRightIcon /></span>
          </div>

          <div style={{ ...styles.cardFooter, ...(compact ? styles.cardFooterCompact : {}) }}>
            <span style={{ ...styles.kindPill, ...(compact ? styles.kindPillCompact : {}), color: visual.actionColor, background: visual.softTint }}>{visual.label}</span>
            <button type="button" onClick={runAction} style={{ ...styles.cardActionButton, ...(compact ? styles.cardActionButtonCompact : {}), color: visual.actionColor, background: visual.actionBackground }}>
              <DirectionsIcon size={compact ? 14 : 18} /> {action.label}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #FBFAFF 0%, #F7F5FF 52%, #FBFAFF 100%)",
    position: "relative",
    overflowX: "clip",
  },
  backgroundHaloOne: {
    position: "absolute",
    top: -120,
    left: -160,
    width: 420,
    height: 420,
    background: "radial-gradient(circle, rgba(249,168,212,0.20), rgba(249,168,212,0))",
    filter: "blur(20px)",
  },
  backgroundHaloTwo: {
    position: "absolute",
    top: 140,
    right: -140,
    width: 420,
    height: 420,
    background: "radial-gradient(circle, rgba(191,219,254,0.22), rgba(191,219,254,0))",
    filter: "blur(26px)",
  },
  backgroundHaloThree: {
    position: "absolute",
    bottom: 140,
    left: "25%",
    width: 340,
    height: 340,
    background: "radial-gradient(circle, rgba(253,224,71,0.12), rgba(253,224,71,0))",
    filter: "blur(24px)",
  },
  main: {
    width: "min(calc(100vw - 16px), 860px)",
    margin: "0 auto",
    padding: "16px 0 0",
    position: "relative",
    zIndex: 1,
  },
  mainCompact: {
    width: "min(calc(100vw - 18px), 860px)",
    padding: "14px 0 0",
  },
  topRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: "clamp(20px, 6vw, 34px)",
  },
  topRowCompact: {
    marginBottom: 16,
  },
  avatarButton: {
    border: "none",
    background: "transparent",
    padding: 0,
    cursor: "pointer",
  },
  headingRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "clamp(12px, 4vw, 18px)",
    marginBottom: "clamp(20px, 5vw, 28px)",
    position: "relative",
  },
  headingRowCompact: {
    gap: 10,
    marginBottom: 18,
  },
  dayButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    background: "transparent",
    border: "none",
    padding: 0,
    fontSize: "clamp(38px, 10.8vw, 56px)",
    lineHeight: 0.96,
    fontWeight: 800,
    color: "#0F1B4C",
    cursor: "pointer",
    letterSpacing: "-0.05em",
  },
  dayButtonCompact: {
    fontSize: 34,
    gap: 8,
  },
  dayButtonLabel: {
    transform: "translateY(2px)",
  },
  dayButtonSubtitle: {
    marginTop: 10,
    fontSize: "clamp(14px, 4.2vw, 20px)",
    color: "#6B7280",
    fontWeight: 500,
  },
  dayButtonSubtitleCompact: {
    marginTop: 6,
    fontSize: 11,
  },
  dayPicker: {
    position: "absolute",
    top: "clamp(84px, 22vw, 112px)",
    left: 0,
    width: "min(100%, 300px)",
    padding: 10,
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.92)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.86))",
    boxShadow: "0 28px 70px rgba(31,41,55,0.13)",
    backdropFilter: "blur(18px)",
    zIndex: 10,
  },
  dayPickerCompact: {
    top: 72,
    width: 250,
  },
  dayPickerItem: {
    width: "100%",
    border: "none",
    borderRadius: 18,
    background: "transparent",
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    textAlign: "left",
  },
  dayPickerTitle: {
    display: "block",
    fontSize: "clamp(16px, 4.4vw, 18px)",
    fontWeight: 700,
    color: "#111827",
    marginBottom: 4,
  },
  dayPickerSubtitle: {
    display: "block",
    fontSize: 13,
    color: "#6B7280",
  },
  dayPickerCount: {
    minWidth: 34,
    height: 34,
    borderRadius: 999,
    background: "rgba(91,61,245,0.12)",
    color: "#5B3DF5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 700,
  },
  headerActions: {
    display: "flex",
    gap: 10,
    flexShrink: 0,
    paddingTop: 4,
  },
  headerActionsCompact: {
    gap: 8,
    paddingTop: 2,
  },
  loadingCard: {
    minHeight: 180,
    borderRadius: 24,
    background: "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.76))",
    border: "1px solid rgba(255,255,255,0.9)",
    boxShadow: "0 28px 80px rgba(31,41,55,0.08)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    marginBottom: 22,
  },
  loadingCardCompact: {
    minHeight: 140,
    borderRadius: 20,
    marginBottom: 18,
  },
  loadingSpinner: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    border: "3px solid rgba(91,61,245,0.12)",
    borderTopColor: "#5B3DF5",
  },
  loadingText: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: 500,
  },
  upNextCard: {
    borderRadius: "clamp(24px, 7vw, 32px)",
    padding: "clamp(16px, 4.4vw, 20px) clamp(16px, 5vw, 22px) clamp(18px, 5.4vw, 24px)",
    marginBottom: 18,
    background: "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,247,255,0.84))",
    border: "1px solid rgba(248,212,255,0.72)",
    boxShadow: "0 32px 90px rgba(31,41,55,0.08)",
    backdropFilter: "blur(20px)",
  },
  upNextCardCompact: {
    borderRadius: 18,
    padding: "8px 10px 10px",
    marginBottom: 10,
  },
  upNextMetaRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  upNextMetaRowCompact: {
    gap: 6,
    marginBottom: 6,
  },
  upNextBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 12px",
    borderRadius: 999,
    background: "rgba(91,61,245,0.08)",
    color: "#5B3DF5",
    fontSize: "clamp(13px, 3.6vw, 15px)",
    fontWeight: 700,
  },
  upNextBadgeCompact: {
    padding: "4px 8px",
    fontSize: 10,
    gap: 4,
  },
  upNextTimePill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 12px",
    borderRadius: 14,
    background: "rgba(255,255,255,0.86)",
    color: "#374151",
    fontSize: "clamp(13px, 3.6vw, 15px)",
    fontWeight: 600,
  },
  upNextTimePillCompact: {
    padding: "4px 8px",
    borderRadius: 10,
    fontSize: 10,
    gap: 4,
  },
  upNextBody: {
    display: "flex",
    alignItems: "center",
    gap: "clamp(14px, 4vw, 20px)",
    marginBottom: 14,
  },
  upNextBodyCompact: {
    gap: 6,
    marginBottom: 6,
  },
  upNextActionRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  iconPanel: {
    width: "clamp(64px, 18vw, 88px)",
    height: "clamp(64px, 18vw, 88px)",
    borderRadius: "clamp(20px, 5vw, 26px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  iconPanelCompact: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  upNextTitle: {
    fontSize: "clamp(18px, 6vw, 24px)",
    fontWeight: 800,
    lineHeight: 1.06,
    color: "#0F1B4C",
    marginBottom: 8,
  },
  upNextTitleCompact: {
    fontSize: 14,
    marginBottom: 2,
  },
  upNextLocation: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: "clamp(13px, 4vw, 16px)",
    color: "#6B7280",
    marginBottom: 8,
  },
  upNextLocationCompact: {
    fontSize: 9,
    marginBottom: 2,
    gap: 4,
  },
  upNextCountdown: {
    fontSize: "clamp(14px, 4.6vw, 18px)",
    fontWeight: 600,
  },
  upNextCountdownCompact: {
    fontSize: 9,
  },
  primaryPillButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: "clamp(44px, 12vw, 52px)",
    width: "min(100%, 168px)",
    maxWidth: "100%",
    padding: "0 14px",
    border: "none",
    borderRadius: "clamp(16px, 5vw, 20px)",
    color: "#FFFFFF",
    fontSize: "clamp(13px, 4vw, 15px)",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 22px 44px rgba(91,61,245,0.24)",
  },
  primaryPillButtonCompact: {
    minHeight: 28,
    width: 86,
    padding: "0 8px",
    borderRadius: 10,
    fontSize: 9,
    gap: 4,
  },
  sectionBlock: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#6B7280",
    marginBottom: 10,
    paddingLeft: "clamp(62px, 24vw, 96px)",
  },
  sectionTitleCompact: {
    fontSize: 12,
    marginBottom: 8,
    paddingLeft: 46,
  },
  sectionRows: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  sectionRowsCompact: {
    gap: 10,
  },
  timelineRow: {
    display: "grid",
    gridTemplateColumns: "clamp(44px, 14vw, 64px) 12px minmax(0, 1fr)",
    gap: "clamp(8px, 3vw, 12px)",
    alignItems: "stretch",
  },
  timelineRowCompact: {
    gridTemplateColumns: "40px 10px minmax(0, 1fr)",
    gap: 8,
  },
  timeRailColumn: {
    paddingTop: 10,
    textAlign: "left",
  },
  timeRailColumnCompact: {
    paddingTop: 8,
  },
  timeRailTime: {
    fontSize: "clamp(16px, 5.6vw, 22px)",
    fontWeight: 700,
    color: "#111827",
    lineHeight: 1,
    marginBottom: 4,
  },
  timeRailTimeCompact: {
    fontSize: 13,
  },
  timeRailPeriod: {
    fontSize: "clamp(10px, 3.3vw, 13px)",
    fontWeight: 500,
    color: "#6B7280",
    lineHeight: 1,
  },
  timeRailPeriodCompact: {
    fontSize: 8.5,
  },
  railTrackWrap: {
    position: "relative",
    display: "flex",
    justifyContent: "center",
  },
  railLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    background: "linear-gradient(180deg, rgba(209,213,219,0.2), rgba(209,213,219,0.9), rgba(209,213,219,0.2))",
    borderRadius: 999,
  },
  railDot: {
    position: "absolute",
    top: 28,
    width: 14,
    height: 14,
    borderRadius: "50%",
    border: "3px solid rgba(255,255,255,0.96)",
    boxShadow: "0 10px 20px rgba(91,61,245,0.18)",
  },
  railDotCompact: {
    top: 22,
    width: 12,
    height: 12,
    borderWidth: 2.5,
  },
  toatCard: {
    display: "flex",
    alignItems: "center",
    gap: "clamp(10px, 3vw, 14px)",
    minHeight: "clamp(92px, 28vw, 118px)",
    padding: "clamp(14px, 4vw, 18px) clamp(14px, 4.4vw, 18px)",
    borderRadius: "clamp(20px, 7vw, 28px)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.84))",
    border: "1px solid rgba(255,255,255,0.94)",
    boxShadow: "0 26px 80px rgba(31,41,55,0.08)",
    cursor: "pointer",
    outline: "none",
  },
  toatCardCompact: {
    gap: 10,
    minHeight: 84,
    padding: "12px 12px",
    borderRadius: 20,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  cardBodyCompact: {
    gap: 8,
  },
  cardHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  cardHeaderCompact: {
    gap: 8,
  },
  cardTitle: {
    fontSize: "clamp(16px, 5vw, 19px)",
    fontWeight: 700,
    color: "#0F172A",
    lineHeight: 1.1,
    marginBottom: 6,
  },
  cardTitleCompact: {
    fontSize: 12,
    marginBottom: 4,
  },
  cardMeta: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: "clamp(12px, 3.6vw, 14px)",
    color: "#6B7280",
    lineHeight: 1.3,
  },
  cardMetaCompact: {
    fontSize: 10,
    gap: 4,
  },
  cardFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },
  cardFooterCompact: {
    gap: 8,
  },
  kindPill: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: "clamp(12px, 3.6vw, 15px)",
    fontWeight: 700,
  },
  kindPillCompact: {
    padding: "5px 8px",
    fontSize: 10,
  },
  cardActionButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: "clamp(38px, 10vw, 44px)",
    minWidth: "clamp(88px, 28vw, 120px)",
    padding: "0 12px",
    border: "none",
    borderRadius: "clamp(14px, 4vw, 16px)",
    fontSize: "clamp(12px, 3.6vw, 14px)",
    fontWeight: 700,
    cursor: "pointer",
  },
  cardActionButtonCompact: {
    minHeight: 32,
    minWidth: 74,
    padding: "0 10px",
    borderRadius: 10,
    fontSize: 10.5,
    gap: 6,
  },
  timelineIconPanel: {
    width: "clamp(64px, 18vw, 78px)",
    height: "clamp(64px, 18vw, 78px)",
    borderRadius: "clamp(20px, 5vw, 24px)",
  },
  timelineIconPanelCompact: {
    width: 48,
    height: 48,
    borderRadius: 15,
  },
  clearCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "clamp(14px, 4.2vw, 18px) clamp(14px, 4.6vw, 18px)",
    borderRadius: "clamp(24px, 8vw, 32px)",
    background: "linear-gradient(135deg, rgba(255,255,255,0.94), rgba(255,247,239,0.86))",
    border: "1px solid rgba(255,255,255,0.92)",
    boxShadow: "0 28px 80px rgba(31,41,55,0.08)",
    overflow: "hidden",
  },
  clearCardCompact: {
    gap: 8,
    padding: "12px 12px",
    borderRadius: 18,
  },
  clearTextWrap: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  clearSparkle: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    background: "rgba(91,61,245,0.08)",
    color: "#5B3DF5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  clearSparkleCompact: {
    width: 30,
    height: 30,
  },
  clearHeadline: {
    fontSize: "clamp(15px, 4.4vw, 18px)",
    fontWeight: 700,
    color: "#0F172A",
    marginBottom: 6,
  },
  clearHeadlineCompact: {
    fontSize: 13,
    marginBottom: 3,
  },
  clearSub: {
    fontSize: "clamp(13px, 4vw, 17px)",
    color: "#6B7280",
  },
  clearSubCompact: {
    fontSize: 10,
  },
  clearScene: {
    position: "relative",
    width: "clamp(92px, 24vw, 150px)",
    height: "clamp(42px, 12vw, 60px)",
    flexShrink: 0,
  },
  clearSceneCompact: {
    width: 78,
    height: 38,
  },
  clearSceneSun: {
    position: "absolute",
    right: 62,
    bottom: 12,
    width: 54,
    height: 54,
    borderRadius: "50%",
    background: "radial-gradient(circle, #FDBA74, #F59E0B)",
    boxShadow: "0 0 0 18px rgba(251,191,36,0.12)",
  },
  clearSceneSunCompact: {
    right: 48,
    bottom: 10,
    width: 40,
    height: 40,
    boxShadow: "0 0 0 12px rgba(251,191,36,0.12)",
  },
  clearSceneHillOne: {
    position: "absolute",
    left: 28,
    right: 0,
    bottom: 0,
    height: 32,
    borderTopLeftRadius: 60,
    borderTopRightRadius: 80,
    background: "linear-gradient(90deg, rgba(244,114,182,0.32), rgba(139,92,246,0.26))",
  },
  clearSceneHillOneCompact: {
    left: 18,
    height: 24,
  },
  clearSceneHillTwo: {
    position: "absolute",
    left: 72,
    right: -18,
    bottom: 0,
    height: 22,
    borderTopLeftRadius: 60,
    borderTopRightRadius: 90,
    background: "linear-gradient(90deg, rgba(139,92,246,0.2), rgba(56,189,248,0.16))",
  },
  clearSceneHillTwoCompact: {
    left: 46,
    right: -10,
    height: 18,
  },
  emptyCard: {
    position: "relative",
    minHeight: "clamp(320px, 84vw, 400px)",
    borderRadius: "clamp(28px, 8vw, 40px)",
    padding: "clamp(22px, 6vw, 30px) clamp(18px, 5vw, 24px) clamp(18px, 5vw, 22px)",
    overflow: "hidden",
    background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,248,252,0.84))",
    border: "1px solid rgba(255,255,255,0.9)",
    boxShadow: "0 30px 90px rgba(31,41,55,0.08)",
  },
  emptyBadgeWrap: {
    marginBottom: 16,
  },
  emptyBadge: {
    width: 46,
    height: 46,
    borderRadius: "50%",
    background: "rgba(91,61,245,0.10)",
    color: "#5B3DF5",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: "clamp(28px, 8vw, 36px)",
    lineHeight: 1,
    fontWeight: 800,
    letterSpacing: "-0.04em",
    color: "#0F1B4C",
    marginBottom: 12,
  },
  emptyBody: {
    maxWidth: 540,
    fontSize: "clamp(15px, 4.4vw, 19px)",
    lineHeight: 1.55,
    color: "#6B7280",
    marginBottom: 18,
  },
  emptyCaptureButton: {
    minHeight: 52,
    padding: "0 18px",
    borderRadius: 16,
    border: "none",
    background: "linear-gradient(135deg, #5B3DF5, #7C3AED)",
    color: "#FFFFFF",
    fontSize: "clamp(15px, 4.4vw, 18px)",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 22px 44px rgba(91,61,245,0.22)",
  },
  emptyActions: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  emptyTextButton: {
    minHeight: 52,
    padding: "0 18px",
    borderRadius: 16,
    border: "1px solid rgba(91,61,245,0.16)",
    background: "rgba(255,255,255,0.78)",
    color: "#5B3DF5",
    fontSize: "clamp(15px, 4.4vw, 18px)",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 18px 38px rgba(31,41,55,0.06)",
  },
  emptySun: {
    position: "absolute",
    top: -30,
    right: -20,
    width: 220,
    height: 220,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(253,224,71,0.18), rgba(253,224,71,0))",
  },
  emptyGlow: {
    position: "absolute",
    left: -60,
    bottom: 40,
    width: 220,
    height: 220,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(249,168,212,0.18), rgba(249,168,212,0))",
  },
  landscape: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "clamp(112px, 34vw, 150px)",
  },
  sunDisc: {
    position: "absolute",
    right: 92,
    bottom: 46,
    width: 88,
    height: 88,
    borderRadius: "50%",
    background: "linear-gradient(180deg, #FDBA74, #FB923C)",
  },
  hillOne: {
    position: "absolute",
    left: -30,
    right: 100,
    bottom: -18,
    height: 88,
    borderTopLeftRadius: 120,
    borderTopRightRadius: 120,
    background: "linear-gradient(90deg, rgba(244,114,182,0.26), rgba(139,92,246,0.28))",
  },
  hillTwo: {
    position: "absolute",
    left: 120,
    right: -10,
    bottom: -12,
    height: 72,
    borderTopLeftRadius: 120,
    borderTopRightRadius: 120,
    background: "linear-gradient(90deg, rgba(139,92,246,0.22), rgba(56,189,248,0.18))",
  },
  textCaptureDockButton: {
    position: "fixed",
    right: "max(112px, calc((100vw - min(100vw - 16px, 860px)) / 2 + 116px))",
    bottom: "calc(env(safe-area-inset-bottom, 0px) + 110px)",
    width: 46,
    height: 46,
    padding: 0,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.88)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.84))",
    boxShadow: "0 18px 40px rgba(31,41,55,0.1)",
    color: "#5B3DF5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 45,
    backdropFilter: "blur(16px)",
  },
};
