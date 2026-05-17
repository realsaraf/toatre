"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import {
  BackIcon,
  CircleIconButton,
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
import { toatTime, initials } from "./_utils";
import { useToatLayout } from "./_hooks";
import {
  actionStripStyles,
  heroStyles,
  menuStyles,
  pageStyles,
  shareGridStyles,
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

  const now = new Date();

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/login?next=/toats/${params.id}`);
    }
  }, [authLoading, params.id, router, user]);

  useEffect(() => {
    if (!params.id || !user) return;
    let cancelled = false;

    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/toats/${params.id}`, {
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
    router.replace("/timeline");
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
    router.push(`/toats/${data.toat.id}`);
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
    setSelectedConnectionIds((current) =>
      current.includes(connectionId)
        ? current.filter((id) => id !== connectionId)
        : [...current, connectionId],
    );
  };

  const loading = authLoading || (Boolean(user) && !hasLoadedData);

  if (!user && !authLoading) return null;

  if (loading) {
    return (
      <div style={pageStyles.page}>
        <main style={pageStyles.main}>
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
      <div style={pageStyles.page}>
        <main style={pageStyles.main}>
          <section style={stateStyles.errorCard}>
            <p style={stateStyles.errorTitle}>We couldn&apos;t load that toat.</p>
            <p style={stateStyles.errorBody}>{error ?? "The toat may have been moved or deleted."}</p>
            <button
              type="button"
              onClick={() => router.push("/timeline")}
              style={{ ...buttonStyles.primaryButton, background: "linear-gradient(135deg, #7C3AED, #5B3DF5)" }}
            >
              Back to timeline
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
  const isPhoneViewport = viewportWidth === null || viewportWidth <= 768;

  return (
    <div style={pageStyles.page}>
      <div style={pageStyles.backgroundHaloOne} />
      <div style={pageStyles.backgroundHaloTwo} />
      <div style={pageStyles.backgroundHaloThree} />

      <main style={{ ...pageStyles.main, ...(isPhoneViewport ? pageStyles.mainCompact : {}) }}>
        <section style={{ ...topBarStyles.topBar, ...(isPhoneViewport ? topBarStyles.topBarCompact : {}) }}>
          <CircleIconButton label="Back" onClick={() => router.back()}>
            <BackIcon size={isPhoneViewport ? 24 : 28} />
          </CircleIconButton>

          <div style={{ ...topBarStyles.topBarRight, ...(isPhoneViewport ? topBarStyles.topBarRightCompact : {}) }}>
            <UserAvatar user={user} />
            <CircleIconButton label="Share" onClick={() => void openShareModal()}>
              <ShareIcon size={isPhoneViewport ? 20 : 24} />
            </CircleIconButton>
            <div style={{ position: "relative" }}>
              <CircleIconButton label="More actions" onClick={() => setMenuOpen((v) => !v)}>
                <MoreIcon size={isPhoneViewport ? 20 : 24} />
              </CircleIconButton>
              {menuOpen ? (
                <div style={menuStyles.menuCard}>
                  <MenuAction label="Add location" icon={<LocationIcon size={20} />} tone="#111827" onClick={() => { setMenuOpen(false); setLocationSearchOpen(true); }} />
                  <MenuAction label="Add notes" icon={<EditIcon size={20} />} tone="#111827" onClick={() => { setMenuOpen(false); setShowNotes(true); }} />
                  <MenuAction label="Add link" icon={<LinkIcon size={20} />} tone="#111827" onClick={() => { setMenuOpen(false); setAddLinkOpen(true); }} />
                  <MenuAction label="Add attachment" icon={<PaperclipIcon size={20} />} tone="#111827" onClick={() => { setMenuOpen(false); attachmentBarRef.current?.triggerUpload(); }} />
                  <MenuAction label="Delete" icon={<TrashIcon size={20} />} tone="#DC2626" onClick={() => { if (window.confirm("Delete this toat?")) { void runMutation("delete", deleteToat); } }} />
                </div>
              ) : null}
            </div>
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
            <h1 style={{ ...heroStyles.heroTitle, ...(isPhoneViewport ? heroStyles.heroTitleCompact : {}) }}>{toat.title}</h1>

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
          <div ref={doneButtonRef} style={{ display: "contents" }}><ActionStripButton icon={<DoneIcon size={22} />} label="Mark done" tint="#16A34A" disabled={Boolean(actionState)} onClick={() => { const origin = captureOrigin(doneButtonRef.current); void runMutation("done", async () => { await patchToat({ state: "done" }); fireConfetti(origin); await new Promise<void>((r) => setTimeout(r, 1000)); router.replace("/timeline"); }); }} /></div>
          <ActionStripButton icon={<SnoozeIcon size={22} />} label="+1 Day" tint="#2563EB" disabled={Boolean(actionState)} onClick={() => void runMutation("add1d", async () => { const t = toatTime(toat); if (!t) throw new Error("This toat has no time to move."); await patchToat({ "enrichments.time": { ...toat.enrichments?.time, at: new Date(new Date(t).getTime() + 24 * 60 * 60000).toISOString() } }); })} />
          <ActionStripButton icon={<RescheduleIcon size={22} />} label="Reschedule" tint="#7C3AED" disabled={Boolean(actionState)} onClick={() => { const t = toatTime(toat); setRescheduleValue(t ? new Date(t).toISOString().slice(0, 16) : ""); setRescheduleOpen(true); }} />
          <ActionStripButton icon={<DuplicateIcon size={22} />} label="Duplicate" tint="#6B7280" disabled={Boolean(actionState)} onClick={() => void runMutation("duplicate", duplicateToat)} />
        </section>

        {!isMeeting && !isEvent && !isChecklist ? (
          <WhenWhereCard startDate={startDate} endDate={endDate} loc={loc} maps={maps} phone={phone} visual={visual} notesLocal={notesLocal} showNotes={showNotes} setNotesLocal={setNotesLocal} saveNotesText={saveNotesText} notesSaveTimerRef={notesSaveTimer} onChangeLocation={() => setLocationSearchOpen(true)} onRemoveLocation={() => void runMutation("rm-location", () => patchToat({ "enrichments.place": null }))} onShareOrCall={() => { if (phone) { window.open(`tel:${phone.replace(/\s+/g, "")}`, "_self"); return; } void openShareModal(); }} reminders={reminders} user={user} toat={toat} />
        ) : null}

        {isMeeting ? (
          <MeetingSection startDate={startDate} endDate={endDate} joinUrl={joinUrl!} people={people} agenda={agenda} visual={visual} loc={loc} maps={maps} onChangeLocation={() => setLocationSearchOpen(true)} onRemoveLocation={() => void runMutation("rm-location", () => patchToat({ "enrichments.place": null }))} />
        ) : null}

        {isChecklist ? (
          <ChecklistSection checklistLocal={checklistLocal} setChecklistLocal={setChecklistLocal} saveChecklistItems={saveChecklistItems} checklistDragIndex={checklistDragIndex} visual={visual} loc={loc} maps={maps} onChangeLocation={() => setLocationSearchOpen(true)} onRemoveLocation={() => void runMutation("rm-location", () => patchToat({ "enrichments.place": null }))} notesLocal={notesLocal} showNotes={showNotes} setNotesLocal={setNotesLocal} saveNotesText={saveNotesText} notesSaveTimerRef={notesSaveTimer} user={user} toat={toat} />
        ) : null}

        {people.length ? (
          <SectionCard title="Sharing">
            <div style={shareGridStyles.shareGrid}>
              {people.map((person) => (
                <div key={person} style={shareGridStyles.sharePerson}>
                  <span style={shareGridStyles.shareAvatar}>{initials(person)}</span>
                  <p style={shareGridStyles.shareName}>{person}</p>
                  <p style={shareGridStyles.shareRole}>Can view</p>
                </div>
              ))}
            </div>
          </SectionCard>
        ) : null}

        {(toat.links ?? []).length > 0 ? (
          <LinksSection links={toat.links ?? []} onRemove={(id) => void removeLink(id)} accent={visual.accent} />
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
