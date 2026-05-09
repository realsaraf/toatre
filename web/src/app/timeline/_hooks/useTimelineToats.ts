"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { fireConfetti, captureOrigin } from "@/lib/fire-confetti";
import type { TimelineToat } from "../_utils/timeline-helpers";

export interface UseTimelineToatsResult {
  toats: TimelineToat[];
  fetching: boolean;
  fetchError: string | null;
  finishingToatId: string | null;
  archivingToatId: string | null;
  removingToatId: string | null;
  updateToatState: (
    toat: TimelineToat,
    nextState: "done" | "archived",
    anchorEl?: HTMLElement | null,
  ) => void;
  reloadToats: () => Promise<void>;
}

export function useTimelineToats(
  user: User | null | undefined,
  authLoading: boolean,
): UseTimelineToatsResult {
  const [toats, setToats] = useState<TimelineToat[]>([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [finishingToatId, setFinishingToatId] = useState<string | null>(null);
  const [archivingToatId, setArchivingToatId] = useState<string | null>(null);
  const [removingToatId, setRemovingToatId] = useState<string | null>(null);

  const loadToats = useCallback(async (isCancelled: () => boolean = () => false) => {
    if (!user) return;
    setFetching(true);
    setFetchError(null);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/toats", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to load timeline");
      const data = (await response.json()) as { toats?: TimelineToat[] };
      if (!isCancelled()) setToats(data.toats ?? []);
    } catch (error) {
      if (!isCancelled()) {
        console.error("[timeline] failed to load", error);
        setFetchError("Could not load your timeline.");
      }
    } finally {
      if (!isCancelled()) setFetching(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    queueMicrotask(() => {
      void loadToats(() => cancelled);
    });
    return () => {
      cancelled = true;
    };
  }, [authLoading, loadToats, user]);

  function updateToatState(
    toat: TimelineToat,
    nextState: "done" | "archived",
    anchorEl?: HTMLElement | null,
  ) {
    if (!user) return;
    setFetchError(null);
    if (nextState === "done") {
      setFinishingToatId(toat.id);
    } else {
      setArchivingToatId(toat.id);
    }

    const run = async () => {
      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/toats/${toat.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ state: nextState }),
        });
        if (!response.ok) throw new Error("Failed to update toat state");
        if (nextState === "done") fireConfetti(captureOrigin(anchorEl));
        setRemovingToatId(toat.id);
        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, 260);
        });
        setToats((current) => current.filter((item) => item.id !== toat.id));
        setRemovingToatId((current) => (current === toat.id ? null : current));
      } catch (error) {
        console.error("[timeline] failed to update", error);
        setFetchError(
          nextState === "done"
            ? "Could not mark that toat done."
            : "Could not archive that toat.",
        );
        setRemovingToatId(null);
      } finally {
        if (nextState === "done") {
          setFinishingToatId((current) => (current === toat.id ? null : current));
        } else {
          setArchivingToatId((current) => (current === toat.id ? null : current));
        }
      }
    };

    void run();
  }

  return {
    toats,
    fetching,
    fetchError,
    finishingToatId,
    archivingToatId,
    removingToatId,
    updateToatState,
    reloadToats: () => loadToats(),
  };
}
