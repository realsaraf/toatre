"use client";

import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import {
  BackIcon,
  BellIcon,
  CircleIconButton,
  CloseIcon,
  DirectionsIcon,
  DoneIcon,
  DuplicateIcon,
  EditIcon,
  LinkIcon,
  LocationIcon,
  MoreIcon,
  PaperclipIcon,
  RescheduleIcon,
  ShareIcon,
  SnoozeIcon,
  SparkleIcon,
  TicketGlyph,
  TrashIcon,
  UserAvatar,
  VideoGlyph,
} from "@/components/mobile-ui";

import type { ChecklistItem, SavedConnection, ToatDetail } from "./_types";
import { toatTime } from "./_utils";
import { useToatLayout } from "./_hooks";
import {
  actionStripStyles,
  heroStyles,
  menuStyles,
  pageStyles,
  stateStyles,
  tipCardStyles,
  topBarStyles,
  buttonStyles,
} from "./_styles";
import { ActionStripButton } from "./_components/ActionStripButton";
import { AddLinkModal } from "./_components/AddLinkModal";
import { AttachmentBar, type AttachmentBarHandle } from "@/app/timeline/_components/mobile/AttachmentBar";
import { ChecklistSection } from "./_components/ChecklistSection";
import { DetailBadge } from "./_components/DetailBadge";
import { LinksSection } from "./_components/LinksSection";
import { LocationSearchModal } from "./_components/LocationSearchModal";
import { MeetingSection } from "./_components/MeetingSection";
import { MenuAction } from "./_components/MenuAction";
import { RescheduleModal } from "./_components/RescheduleModal";
import { SectionCard } from "./_components/SectionCard";
import { ShareToatModal } from "./_components/ShareToatModal";
import { WhenWhereCard } from "./_components/WhenWhereCard";
import { fireConfetti, captureOrigin } from "@/lib/fire-confetti";

function labelForPatch(body: Record<string, unknown>) {
  if (body.status === "done") return "Marked done.";
  if (body.datetime) return "Time updated.";
  return "Saved.";
}

interface ToatDetailViewProps {
  /** The toat ID to display. */
  id: string;
  /** Called when the user wants to go back / close. */
  onClose: () => void;
  /**
   * When true the component is rendered inside a panel overlay (not a full page).
   * - Hides page background halos.
   * - Forces compact (phone-width) layout styles.
   * - Skips the auth redirect (caller guarantees user is logged in).
   * - After delete, calls onClose() instead of navigating to /timeline.
   */
  embedded?: boolean;
}

export function ToatDetailView({ id, onClose, embedded = false }: ToatDetailViewProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [toat, setToat] = useState<ToatDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reminderPickerOpen, setReminderPickerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const [shareOpen, setShareOpen] = useState(false);
  const [shareBusy, setShareBusy] = useState<string | null>(null);
  const [sharePermission, setSharePermission] = useState<"view" | "edit">("view");
  const [shareConnections, setShareConnections] = useState<SavedConnection[]>([]);
  const [selectedConnectionIds, setSelectedConnectionIds] = useState<string[]>([]);

  const [checklistLocal, setChecklistLocal] = useState<ChecklistItem[]>([]);
  const checklistDragIndex = useRef<number | null>(null);
  const doneButtonRef = useRef<HTMLDivElement>(null);

  const [notesLocal, setNotesLocal] = useState<string>("");
  const notesSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showNotes, setShowNotes] = useState(false);

  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleValue, setRescheduleValue] = useState("");
  const [locationSearchOpen, setLocationSearchOpen] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<
    Array<{ placeId: string; description: string }>
  >([]);
  const [addLinkOpen, setAddLinkOpen] = useState(false);
  const attachmentBarRef = useRef<AttachmentBarHandle>(null);

  const [titleLocal, setTitleLocal] = useState("");
  const titleSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [titleFocused, setTitleFocused] = useState(false);
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize the title textarea whenever titleLocal changes
  useEffect(() => {
    const el = titleTextareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [titleLocal]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handleDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setReminderPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleDown);
    return () => document.removeEventListener("mousedown", handleDown);
  }, [menuOpen]);

  const now = new Date();

  useEffect(() => {
    if (embedded) return;
    if (!authLoading && !user) {
      router.replace(`/login?next=/toats/${id}`);
    }
  }, [authLoading, embedded, id, router, user]);

  useEffect(() => {
    if (!id || !user) return;
    let cancelled = false;

    setHasLoadedData(false);
    setToat(null);
    setError(null);

    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/toats/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          throw new Error(
            res.status === 404 ? "Toat not found" : `Request failed (${res.status})`,
          );
        }
        const data = (await res.json()) as { toat?: ToatDetail };
        if (!cancelled) {
          setToat(data.toat ?? null);
          setError(data.toat ? null : "Toat not found");
          if (data.toat) {
            setNotesLocal(data.toat.notes ?? "");
            setShowNotes(Boolean(data.toat.notes?.trim()));
            setChecklistLocal(data.toat.enrichments?.action?.checklist ?? []);
            setTitleLocal(data.toat.title ?? "");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load this toat.");
        }
      } finally {
        if (!cancelled) setHasLoadedData(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, user]);

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
    const res = await fetch(`/api/toats/${toat.id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => null)) as {
      toat?: ToatDetail;
      error?: string;
    } | null;
    if (!res.ok || !data?.toat) throw new Error(data?.error ?? "Could not update this toat.");
    setToat(data.toat);
    setFlash(labelForPatch(body));
  };

  const saveChecklistItems = useCallback(
    async (items: ChecklistItem[]) => {
      if (!user || !toat) return;
      try {
        const token = await user.getIdToken();
        await fetch(`/api/toats/${toat.id}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            "enrichments.action": { type: "checklist", checklist: items },
          }),
        });
      } catch {
        // silently ignore autosave failures
      }
    },
    [user, toat],
  );

  const saveNotesText = useCallback(
    async (text: string) => {
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
    },
    [user, toat],
  );

  const saveTitleText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!user || !toat || !trimmed) return;
      try {
        const token = await user.getIdToken();
        await fetch(`/api/toats/${toat.id}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmed }),
        });
        setToat((prev) => prev ? { ...prev, title: trimmed } : prev);
      } catch {
        // silently ignore autosave failures
      }
    },
    [user, toat],
  );

  const deleteToat = async () => {
    if (!user || !toat) return;
    const token = await user.getIdToken();
    const res = await fetch(`/api/toats/${toat.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error ?? "Could not delete this toat.");
    }
    if (embedded) {
      onClose();
    } else {
      router.replace("/timeline");
    }
  };

  const addLink = async (url: string, label: string) => {
    if (!user || !toat) return;
    await runMutation("add-link", async () => {
      const token = await user.getIdToken();
      const res = await fetch(`/api/toats/${toat.id}/links`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url, ...(label ? { label } : {}) }),
      });
      const data = (await res.json().catch(() => null)) as { link?: { id: string; url: string; label: string; createdAt: string }; error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "Could not add link.");
      if (data?.link) {
        setToat((prev) => prev ? { ...prev, links: [...(prev.links ?? []), data.link!] } : prev);
      }
      setAddLinkOpen(false);
    });
  };

  const removeLink = async (linkId: string) => {
    if (!user || !toat) return;
    const token = await user.getIdToken();
    const res = await fetch(`/api/toats/${toat.id}/links/${linkId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      setFlash("Could not remove link.");
      return;
    }
    setToat((prev) => prev ? { ...prev, links: (prev.links ?? []).filter((l) => l.id !== linkId) } : prev);
  };

  const duplicateToat = async () => {
    if (!user || !toat) return;
    const token = await user.getIdToken();
    const res = await fetch("/api/toats", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        tier: toat.tier,
        title: `${toat.title} copy`,
        notes: toat.notes,
        enrichments: toat.enrichments,
      }),
    });
    const data = (await res.json().catch(() => null)) as {
      toat?: ToatDetail;
      error?: string;
    } | null;
    if (!res.ok || !data?.toat) throw new Error(data?.error ?? "Could not duplicate this toat.");
    if (embedded) {
      onClose();
    } else {
      router.push(`/toats/${data.toat.id}`);
    }
  };

  const openShareModal = async () => {
    if (!user || !toat) return;
    setShareOpen(true);
    setShareBusy("load");
    setFlash(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/connections", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json().catch(() => null)) as {
        connections?: SavedConnection[];
        error?: string;
      } | null;
      if (!res.ok) throw new Error(data?.error ?? "Could not load your connections.");
      const nextConnections = data?.connections ?? [];
      setShareConnections(nextConnections);
      setSelectedConnectionIds(nextConnections.slice(0, 2).map((c) => c.id));
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
      const res = await fetch(`/api/toats/${toat.id}/share`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionIds: linkOnly ? [] : selectedConnectionIds,
          permission: sharePermission,
          linkOnly,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        shareUrl?: string;
        error?: string;
      } | null;
      if (!res.ok || !data?.shareUrl)
        throw new Error(data?.error ?? "Could not create that share link.");
      if (linkOnly) {
        // Copy to clipboard first, then also open the share sheet if available
        await navigator.clipboard.writeText(data.shareUrl).catch(() => null);
        if (navigator.share) {
          await navigator.share({ title: toat.title, text: toat.title, url: data.shareUrl });
        }
      } else if (navigator.share) {
        await navigator.share({ title: toat.title, text: toat.title, url: data.shareUrl });
      } else {
        await navigator.clipboard.writeText(data.shareUrl);
      }
      setFlash(linkOnly ? "Link copied to clipboard." : "Share invite ready.");
      setShareOpen(false);
    } catch (err) {
      setFlash(err instanceof Error ? err.message : "Could not share this toat.");
    } finally {
      setShareBusy(null);
    }
  };

  const toggleShareConnection = (connectionId: string) => {
    setSelectedConnectionIds((current) =>
      current.includes(connectionId)
        ? current.filter((cid) => cid !== connectionId)
        : [...current, connectionId],
    );
  };

  const loading = authLoading || (Boolean(user) && !hasLoadedData);

  if (!user && !authLoading) return null;

  if (loading) {
    return (
      <div style={embedded ? { padding: "48px 0" } : pageStyles.page}>
        <main style={embedded ? {} : pageStyles.main}>
          <section style={stateStyles.loadingCard}>
            <div style={stateStyles.loadingSpinner} className="animate-spin" />
            <p style={stateStyles.loadingText}>Loading this toat...</p>
          </section>
        </main>
      </div>
    );
  }

  if (error || !toat) {
    return (
      <div style={embedded ? { padding: "48px 24px" } : pageStyles.page}>
        <main style={embedded ? {} : pageStyles.main}>
          <section style={stateStyles.errorCard}>
            <p style={stateStyles.errorTitle}>We couldn&apos;t load that toat.</p>
            <p style={stateStyles.errorBody}>{error ?? "The toat may have been moved or deleted."}</p>
            <button
              type="button"
              onClick={embedded ? onClose : () => router.push("/timeline")}
              style={{ ...buttonStyles.primaryButton, background: "linear-gradient(135deg, #7C3AED, #5B3DF5)" }}
            >
              {embedded ? "Close" : "Back to timeline"}
            </button>
          </section>
        </main>
      </div>
    );
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const layout = useToatLayout(toat, now);
  const {
    isMeeting,
    isEvent,
    isChecklist,
    loc,
    maps,
    phone,
    joinUrl,
    people,
    startDate,
    endDate,
    ticketUrl,
    visual,
    heroChip,
    reminders,
    agenda,
  } = layout;

  const Icon = visual.Icon;
  // In embedded panel mode always use compact (phone-width) styles
  const isPhoneViewport = embedded || true;

  // When embedded, constrain to panel width (not 100vw) and add horizontal padding
  const embeddedMainOverride: CSSProperties = embedded
    ? { width: "100%", padding: "10px 20px 22px", boxSizing: "border-box" }
    : {};

  const content = (
    <main style={{ ...pageStyles.main, ...(isPhoneViewport ? pageStyles.mainCompact : {}), ...embeddedMainOverride }}>
      <section style={{ ...topBarStyles.topBar, ...(isPhoneViewport ? topBarStyles.topBarCompact : {}) }}>
        {!embedded ? (
          <CircleIconButton label="Back" onClick={onClose}>
            <BackIcon size={24} />
          </CircleIconButton>
        ) : null}

        <div style={{ ...topBarStyles.topBarRight, ...(isPhoneViewport ? topBarStyles.topBarRightCompact : {}), marginLeft: "auto" }}>
          {!embedded ? <UserAvatar user={user} /> : null}
          <CircleIconButton label="Share" onClick={() => void openShareModal()}>
            <ShareIcon size={isPhoneViewport ? 20 : 24} />
          </CircleIconButton>
          <div style={{ position: "relative" }} ref={menuRef}>
            <CircleIconButton label="More actions" onClick={() => { setMenuOpen((v) => !v); setReminderPickerOpen(false); }}>
              <MoreIcon size={isPhoneViewport ? 20 : 24} />
            </CircleIconButton>
            {menuOpen ? (
              <div style={menuStyles.menuCard}>
                {reminderPickerOpen ? (
                  <>
                    <div style={{ padding: "4px 12px 8px", fontSize: 12, fontWeight: 700, color: "#84786E", letterSpacing: "0.06em", textTransform: "uppercase" }}>Remind me</div>
                    {([
                      { label: "15 minutes before", minutes: 15 },
                      { label: "30 minutes before", minutes: 30 },
                      { label: "1 hour before", minutes: 60 },
                      { label: "2 hours before", minutes: 120 },
                      { label: "1 day before", minutes: 1440 },
                    ] as const).map(({ label, minutes }) => (
                      <MenuAction
                        key={minutes}
                        label={label}
                        icon={<BellIcon size={20} />}
                        tone="#111827"
                        onClick={() => {
                          setReminderPickerOpen(false);
                          void runMutation("add-reminder", () => patchToat({ "enrichments.time": { ...toat!.enrichments?.time, reminderOffset: minutes } }));
                        }}
                      />
                    ))}
                    <MenuAction label="Back" icon={<BackIcon size={20} />} tone="#84786E" onClick={() => setReminderPickerOpen(false)} />
                  </>
                ) : (
                  <>
                    <MenuAction label="Add reminder" icon={<BellIcon size={20} />} tone="#111827" onClick={() => setReminderPickerOpen(true)} />
                    <MenuAction label="Add location" icon={<LocationIcon size={20} />} tone="#111827" onClick={() => { setMenuOpen(false); setLocationSearchOpen(true); }} />
                    <MenuAction label="Add notes" icon={<EditIcon size={20} />} tone="#111827" onClick={() => { setMenuOpen(false); setShowNotes(true); }} />
                    <MenuAction label="Add link" icon={<LinkIcon size={20} />} tone="#111827" onClick={() => { setMenuOpen(false); setAddLinkOpen(true); }} />
                    <MenuAction label="Add attachment" icon={<PaperclipIcon size={20} />} tone="#111827" onClick={() => { setMenuOpen(false); attachmentBarRef.current?.triggerUpload(); }} />
                    <MenuAction label="Delete" icon={<TrashIcon size={20} />} tone="#DC2626" onClick={() => { if (window.confirm("Delete this toat?")) { void runMutation("delete", deleteToat); } }} />
                  </>
                )}
              </div>
            ) : null}
          </div>
          {embedded ? (
            <CircleIconButton label="Close" onClick={onClose}>
              <CloseIcon size={20} />
            </CircleIconButton>
          ) : null}
        </div>
      </section>

      <div
        style={{
          ...heroStyles.heroCard,
          ...(isPhoneViewport ? heroStyles.heroCardCompact : {}),
          background: `linear-gradient(135deg, ${visual.soft}, rgba(255,255,255,0.86))`,
          borderColor: `${visual.tint}20`,
          boxShadow: `0 20px 60px ${visual.soft}`,
        }}
      >
      <section style={{ ...heroStyles.heroSection, ...(isPhoneViewport ? heroStyles.heroSectionCompact : {}) }}>
        <div style={{ ...heroStyles.heroIconWrap, ...(isPhoneViewport ? heroStyles.heroIconWrapCompact : {}), background: visual.gradient }}>
          <Icon size={isPhoneViewport ? 34 : 46} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ ...heroStyles.heroTitle, ...(isPhoneViewport ? heroStyles.heroTitleCompact : {}), marginBottom: 0 }}>
            <div style={{
              position: "relative",
              borderRadius: 10,
              padding: titleFocused ? "4px 8px" : "4px 0",
              marginLeft: titleFocused ? -8 : 0,
              background: titleFocused ? "rgba(255,255,255,0.55)" : "transparent",
              borderBottom: titleFocused ? "2px solid rgba(79,70,229,0.55)" : "2px solid transparent",
              transition: "background 0.15s, border-color 0.15s, padding 0.15s, margin 0.15s",
            }}>
              <textarea
                ref={titleTextareaRef}
                value={titleLocal}
                onChange={(e) => {
                  setTitleLocal(e.target.value);
                  if (titleSaveTimer.current) clearTimeout(titleSaveTimer.current);
                  titleSaveTimer.current = setTimeout(() => void saveTitleText(e.target.value), 1200);
                }}
                onFocus={() => setTitleFocused(true)}
                onBlur={() => {
                  setTitleFocused(false);
                  if (titleSaveTimer.current) clearTimeout(titleSaveTimer.current);
                  void saveTitleText(titleLocal);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    (e.target as HTMLTextAreaElement).blur();
                  }
                }}
                rows={1}
                style={{
                  ...heroStyles.heroTitle,
                  ...(isPhoneViewport ? heroStyles.heroTitleCompact : {}),
                  display: "block",
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  resize: "none",
                  fontFamily: "inherit",
                  padding: 0,
                  margin: 0,
                  marginBottom: 0,
                  lineHeight: "inherit",
                  overflow: "hidden",
                  overflowWrap: "break-word",
                  wordBreak: "break-word",
                  whiteSpace: "pre-wrap",
                  cursor: "text",
                  height: "auto",
                }}
                aria-label="Toat title"
              />
              {!titleFocused ? (
                <span style={{
                  position: "absolute",
                  right: 0,
                  bottom: 4,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: "rgba(255,255,255,0.72)",
                  color: "#6B7280",
                  pointerEvents: "none",
                }}>
                  <EditIcon size={13} />
                </span>
              ) : null}
            </div>
          </h1>

          {(heroChip ?? maps ?? (isMeeting && joinUrl)) ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: loc ? 6 : 0, flexWrap: "wrap" }}>
              {heroChip ? <DetailBadge text={heroChip.text} style={heroChip.style} accent={visual.accent} /> : null}
              {isMeeting && joinUrl ? (
                <button
                  type="button"
                  onClick={() => window.open(joinUrl, "_blank", "noopener,noreferrer")}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, height: isPhoneViewport ? 34 : 38, padding: "0 14px", borderRadius: 999, border: "none", background: visual.gradient, color: "#fff", fontSize: isPhoneViewport ? 13 : 14, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
                >
                  <VideoGlyph size={isPhoneViewport ? 14 : 16} /> Join
                </button>
              ) : maps ? (
                <button
                  type="button"
                  onClick={() => window.open(maps, "_blank", "noopener,noreferrer")}
                  title="Directions"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: isPhoneViewport ? 34 : 38, height: isPhoneViewport ? 34 : 38, borderRadius: isPhoneViewport ? 10 : 12, border: "none", background: visual.gradient, color: "#fff", cursor: "pointer", flexShrink: 0 }}
                >
                  <DirectionsIcon size={isPhoneViewport ? 16 : 18} />
                </button>
              ) : null}
            </div>
          ) : null}

          {loc ? <p style={{ ...heroStyles.heroLocation, ...(isPhoneViewport ? heroStyles.heroLocationCompact : {}) }}><LocationIcon size={isPhoneViewport ? 14 : 16} /> {loc}</p> : null}
          {isEvent && ticketUrl ? <p style={{ ...heroStyles.heroSecondary, ...(isPhoneViewport ? heroStyles.heroSecondaryCompact : {}) }}><TicketGlyph size={isPhoneViewport ? 16 : 20} /> Tickets ready</p> : null}
        </div>
      </section>
      </div>

      {flash ? <div style={pageStyles.flash}>{flash}</div> : null}

      <section style={actionStripStyles.actionStrip}>
        <div ref={doneButtonRef} style={{ display: "contents" }}><ActionStripButton icon={<DoneIcon size={22} />} label="Mark done" tint="#16A34A" disabled={Boolean(actionState)} onClick={() => { const origin = captureOrigin(doneButtonRef.current); void runMutation("done", async () => { await patchToat({ state: "done" }); fireConfetti(origin); await new Promise<void>((r) => setTimeout(r, 1000)); if (embedded) { onClose(); } else { router.replace("/timeline"); } }); }} /></div>
        <ActionStripButton icon={<SnoozeIcon size={22} />} label="+1 Day" tint="#2563EB" disabled={Boolean(actionState)} onClick={() => void runMutation("add1d", async () => { const t = toatTime(toat); if (!t) throw new Error("This toat has no time to move."); await patchToat({ "enrichments.time": { ...toat.enrichments?.time, at: new Date(new Date(t).getTime() + 24 * 60 * 60000).toISOString() } }); })} />
        <ActionStripButton icon={<RescheduleIcon size={22} />} label="Reschedule" tint="#7C3AED" disabled={Boolean(actionState)} onClick={() => { const t = toatTime(toat); setRescheduleValue(t ? new Date(t).toISOString().slice(0, 16) : ""); setRescheduleOpen(true); }} />
        <ActionStripButton icon={<DuplicateIcon size={22} />} label="Duplicate" tint="#6B7280" disabled={Boolean(actionState)} onClick={() => void runMutation("duplicate", duplicateToat)} />
      </section>

      {!isMeeting && !isChecklist ? (
        <WhenWhereCard startDate={startDate} endDate={endDate} loc={loc} maps={maps} phone={phone} visual={visual} notesLocal={notesLocal} showNotes={showNotes} setNotesLocal={setNotesLocal} saveNotesText={saveNotesText} notesSaveTimerRef={notesSaveTimer} onChangeLocation={() => setLocationSearchOpen(true)} onRemoveLocation={() => void runMutation("rm-location", () => patchToat({ "enrichments.place": null }))} onShareOrCall={() => { if (phone) { window.open(`tel:${phone.replace(/\s+/g, "")}`, "_self"); return; } void openShareModal(); }} reminders={reminders} user={user} toat={toat} />
      ) : null}

      {isMeeting ? (
        <MeetingSection startDate={startDate} endDate={endDate} joinUrl={joinUrl!} people={people} agenda={agenda} visual={visual} loc={loc} maps={maps} onChangeLocation={() => setLocationSearchOpen(true)} onRemoveLocation={() => void runMutation("rm-location", () => patchToat({ "enrichments.place": null }))} />
      ) : null}

      {isChecklist ? (
        <ChecklistSection checklistLocal={checklistLocal} setChecklistLocal={setChecklistLocal} saveChecklistItems={saveChecklistItems} checklistDragIndex={checklistDragIndex} visual={visual} loc={loc} maps={maps} onChangeLocation={() => setLocationSearchOpen(true)} onRemoveLocation={() => void runMutation("rm-location", () => patchToat({ "enrichments.place": null }))} notesLocal={notesLocal} showNotes={showNotes} setNotesLocal={setNotesLocal} saveNotesText={saveNotesText} notesSaveTimerRef={notesSaveTimer} user={user} toat={toat} />
      ) : null}

      {(toat.links ?? []).length > 0 ? (
        <LinksSection links={toat.links ?? []} onRemove={(lid) => void removeLink(lid)} accent={visual.accent} />
      ) : null}

      <AttachmentBar ref={attachmentBarRef} toatId={toat.id} initialAttachments={toat.attachments ?? []} />

      {!isMeeting ? (
        <section style={tipCardStyles.tipCard}>
          <span style={tipCardStyles.tipSpark}><SparkleIcon size={20} /></span>
          <p style={tipCardStyles.tipText}>Toatre will keep this toat on track with your Pings and the timing you already set.</p>
        </section>
      ) : null}

      <div style={{ height: 40 }} />
    </main>
  );

  if (embedded) {
    return (
      <>
        {content}
        {shareOpen ? (
          <ShareToatModal toat={toat} connections={shareConnections} selectedConnectionIds={selectedConnectionIds} permission={sharePermission} busy={shareBusy} onClose={() => setShareOpen(false)} onToggleConnection={toggleShareConnection} onPermissionChange={setSharePermission} onCreateLink={() => void createShare(true)} onSend={() => void createShare(false)} onOpenConnections={() => router.push("/settings")} />
        ) : null}
        {rescheduleOpen ? (
          <RescheduleModal value={rescheduleValue} onChange={setRescheduleValue} busy={actionState === "reschedule"} onConfirm={() => void runMutation("reschedule", async () => { if (!rescheduleValue) throw new Error("Pick a date and time."); await patchToat({ "enrichments.time": { ...toat.enrichments?.time, at: new Date(rescheduleValue).toISOString() } }); setRescheduleOpen(false); })} onClose={() => setRescheduleOpen(false)} />
        ) : null}
        {locationSearchOpen ? (
          <LocationSearchModal query={locationQuery} suggestions={locationSuggestions} onQueryChange={async (q) => { setLocationQuery(q); if (!q.trim()) { setLocationSuggestions([]); return; } try { const res = await fetch(`/api/places/autocomplete?q=${encodeURIComponent(q)}`); const data = (await res.json()) as { predictions?: Array<{ place_id: string; description: string }> }; setLocationSuggestions((data.predictions ?? []).map((p) => ({ placeId: p.place_id, description: p.description }))); } catch { setLocationSuggestions([]); } }} onSelect={(description) => void runMutation("location", async () => { await patchToat({ "enrichments.place": { address: description } }); setLocationSearchOpen(false); setLocationQuery(""); setLocationSuggestions([]); })} onClose={() => { setLocationSearchOpen(false); setLocationQuery(""); setLocationSuggestions([]); }} />
        ) : null}
        {addLinkOpen ? (
          <AddLinkModal busy={actionState === "add-link"} onSave={(url, label) => void addLink(url, label)} onClose={() => setAddLinkOpen(false)} />
        ) : null}
      </>
    );
  }

  return (
    <div style={pageStyles.page}>
      <div style={pageStyles.backgroundHaloOne} />
      <div style={pageStyles.backgroundHaloTwo} />
      <div style={pageStyles.backgroundHaloThree} />
      {content}
      {shareOpen ? (
        <ShareToatModal toat={toat} connections={shareConnections} selectedConnectionIds={selectedConnectionIds} permission={sharePermission} busy={shareBusy} onClose={() => setShareOpen(false)} onToggleConnection={toggleShareConnection} onPermissionChange={setSharePermission} onCreateLink={() => void createShare(true)} onSend={() => void createShare(false)} onOpenConnections={() => router.push("/settings")} />
      ) : null}
      {rescheduleOpen ? (
        <RescheduleModal value={rescheduleValue} onChange={setRescheduleValue} busy={actionState === "reschedule"} onConfirm={() => void runMutation("reschedule", async () => { if (!rescheduleValue) throw new Error("Pick a date and time."); await patchToat({ "enrichments.time": { ...toat.enrichments?.time, at: new Date(rescheduleValue).toISOString() } }); setRescheduleOpen(false); })} onClose={() => setRescheduleOpen(false)} />
      ) : null}
      {locationSearchOpen ? (
        <LocationSearchModal query={locationQuery} suggestions={locationSuggestions} onQueryChange={async (q) => { setLocationQuery(q); if (!q.trim()) { setLocationSuggestions([]); return; } try { const res = await fetch(`/api/places/autocomplete?q=${encodeURIComponent(q)}`); const data = (await res.json()) as { predictions?: Array<{ place_id: string; description: string }> }; setLocationSuggestions((data.predictions ?? []).map((p) => ({ placeId: p.place_id, description: p.description }))); } catch { setLocationSuggestions([]); } }} onSelect={(description) => void runMutation("location", async () => { await patchToat({ "enrichments.place": { address: description } }); setLocationSearchOpen(false); setLocationQuery(""); setLocationSuggestions([]); })} onClose={() => { setLocationSearchOpen(false); setLocationQuery(""); setLocationSuggestions([]); }} />
      ) : null}
      {addLinkOpen ? (
        <AddLinkModal busy={actionState === "add-link"} onSave={(url, label) => void addLink(url, label)} onClose={() => setAddLinkOpen(false)} />
      ) : null}
    </div>
  );
}
