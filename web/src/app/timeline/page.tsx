"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useTimelineToats } from "./_hooks/useTimelineToats";
import { MobileTimelineView } from "./_components/mobile/MobileTimelineView";
import { DesktopTimelineView } from "./_components/desktop/DesktopTimelineView";
import type { TimelineToat } from "./_utils/timeline-helpers";

export default function TimelinePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);
  const {
    toats,
    fetching,
    fetchError,
    finishingToatId,
    archivingToatId,
    removingToatId,
    updateToatState,
    reloadToats,
  } = useTimelineToats(user, loading);

  useEffect(() => {
    const update = () => setViewportWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (!loading && !user) router.replace("/login?next=/timeline");
  }, [loading, router, user]);

  const now = new Date();
  const isCompact = viewportWidth !== null && viewportWidth < 430;
  const isDesktop = viewportWidth !== null && viewportWidth >= 1100;
  const bookingCount = toats.filter((t) =>
    Boolean((t as TimelineToat & { bookingRequestId?: string | null }).bookingRequestId),
  ).length;

  const openTimeline = () => router.push("/timeline");
  const openInbox = () => router.push("/inbox");
  const openPeople = () => router.push("/people");
  const openSearch = () => router.push("/capture?mode=text");
  const openSettings = () => router.push("/settings");
  const openCapture = () => router.push("/capture");
  const openTextCapture = () => router.push("/capture?mode=text");
  const openToat = (toat: TimelineToat) => router.push(`/toats/${toat.id}`);
  const refreshTimeline = () => { void reloadToats(); };

  if (isDesktop) {
    return (
      <DesktopTimelineView
        user={user}
        toats={toats}
        now={now}
        onOpenSettings={openSettings}
        onOpenTimeline={openTimeline}
        onOpenInbox={openInbox}
        onOpenPeople={openPeople}
        onOpenSearch={openSearch}
        onCaptureSaved={refreshTimeline}
        onOpenToat={openToat}
        onMarkDone={(toat, anchorEl) => updateToatState(toat, "done", anchorEl)}
        onArchiveToat={(toat) => updateToatState(toat, "archived")}
        finishingToatId={finishingToatId}
        archivingToatId={archivingToatId}
        removingToatId={removingToatId}
      />
    );
  }

  return (
    <MobileTimelineView
      user={user}
      toats={toats}
      now={now}
      isCompact={isCompact}
      authLoading={loading}
      fetching={fetching}
      fetchError={fetchError}
      bookingCount={bookingCount}
      finishingToatId={finishingToatId}
      archivingToatId={archivingToatId}
      removingToatId={removingToatId}
      onMarkDone={(toat, anchorEl) => updateToatState(toat, "done", anchorEl)}
      onArchiveToat={(toat) => updateToatState(toat, "archived")}
      onOpenSettings={openSettings}
      onOpenSearch={openSearch}
      onOpenCapture={openCapture}
      onOpenTextCapture={openTextCapture}
      onOpenToat={openToat}
      onOpenInbox={openInbox}
      onOpenPeople={openPeople}
      onOpenTimeline={openTimeline}
    />
  );
}
