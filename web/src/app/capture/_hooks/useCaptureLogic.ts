"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { SerializedToat, Enrichments } from "@/types";
import { useAuth } from "@/lib/auth/auth-context";

type CaptureStatus = "idle" | "listening" | "processing" | "review" | "error";
type CaptureMode = "voice" | "text";
type ToatTier = "urgent" | "important" | "regular";

const WAVEFORM_BARS = 20;
const MIN_ANALYSER_FFT_SIZE = 32;

function getAnalyserFftSize(barCount: number): number {
  return 2 ** Math.ceil(Math.log2(Math.max(barCount * 4, MIN_ANALYSER_FFT_SIZE)));
}

function getCaptureStartErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return "Mic access denied. Check browser permissions.";
    }
    if (error.name === "NotFoundError") {
      return "No microphone found. Check your input device.";
    }
    if (error.name === "NotReadableError" || error.name === "AbortError") {
      return "Mic is busy or unavailable. Close other apps using it and try again.";
    }
  }
  return "Couldn't start the mic. Try again.";
}

function mapRawToat(t: Record<string, unknown>): SerializedToat {
  return {
    id: String(t._id ?? t.id ?? ""),
    tier: (t.tier ?? "regular") as ToatTier,
    state: (t.state ?? "open") as "open" | "done" | "archived",
    title: String(t.title ?? ""),
    notes: (t.notes as string | null) ?? null,
    enrichments: (t.enrichments ?? {}) as Enrichments,
    captureId: (t.captureId as string | null) ?? null,
    createdAt: String(t.createdAt ?? new Date().toISOString()),
    updatedAt: String(t.updatedAt ?? new Date().toISOString()),
  };
}

export function useCaptureLogic() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [status, setStatus] = useState<CaptureStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [barHeights, setBarHeights] = useState<number[]>(Array(WAVEFORM_BARS).fill(8));
  const [toats, setToats] = useState<SerializedToat[]>([]);
  const [selected, setSelected] = useState<boolean[]>([]);
  const [captureId, setCaptureId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [manualText, setManualText] = useState("");
  const [isCommitting, setIsCommitting] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const hasAutoStartedRef = useRef(false);

  const captureMode: CaptureMode = searchParams.get("mode") === "text" ? "text" : "voice";
  const shouldAutoStart = searchParams.get("autostart") === "1";

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?next=/capture");
    }
  }, [authLoading, router, user]);

  const resetWaveform = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = 0;
    setBarHeights(Array(WAVEFORM_BARS).fill(8));
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const closeAudioContext = useCallback(() => {
    const audioCtx = audioCtxRef.current;
    audioCtxRef.current = null;
    analyserRef.current = null;
    if (!audioCtx || audioCtx.state === "closed") return;
    void audioCtx.close().catch((error) => { console.error("[capture/audio-context]", error); });
  }, []);

  const stopAll = useCallback(() => {
    clearTimer();
    resetWaveform();
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    mediaRecorderRef.current = null;
    closeAudioContext();
    stopStream();
  }, [clearTimer, closeAudioContext, resetWaveform, stopStream]);

  useEffect(() => { return () => { stopAll(); }; }, [stopAll]);

  const startWaveform = useCallback((stream: MediaStream) => {
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = getAnalyserFftSize(WAVEFORM_BARS);
    ctx.createMediaStreamSource(stream).connect(analyser);
    audioCtxRef.current = ctx;
    analyserRef.current = analyser;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const draw = () => {
      analyser.getByteFrequencyData(data);
      setBarHeights(Array.from({ length: WAVEFORM_BARS }, (_, i) => {
        const v = (data[Math.floor((i / WAVEFORM_BARS) * data.length)] ?? 0) / 255;
        return Math.max(6, v * 56 + 6);
      }));
      animFrameRef.current = requestAnimationFrame(draw);
    };
    draw();
  }, []);

  const getIdToken = useCallback(async () => (user ? user.getIdToken() : null), [user]);

  const startCapture = useCallback(async () => {
    setTranscript(""); setElapsed(0); setToats([]); setSelected([]); setErrorMsg("");
    setStatus("listening");
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      startWaveform(stream);
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        mediaRecorderRef.current = null;
        stopStream(); clearTimer(); resetWaveform(); closeAudioContext();
        setStatus("processing");
        const token = await getIdToken();
        if (!token) { setStatus("error"); setErrorMsg("Sign in required."); return; }
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const fd = new FormData();
        fd.append("audio", blob, "audio.webm");
        fd.append("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone);
        try {
          const res = await fetch("/api/captures", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
          if (!res.ok) throw new Error(`${res.status}`);
          const data = await res.json();
          setTranscript(data.transcript ?? "");
          setCaptureId(data.captureId ?? null);
          const extracted = (data.toats ?? []).map(mapRawToat);
          setToats(extracted);
          setSelected(extracted.map(() => true));
          setStatus("review");
        } catch (err) {
          console.error("[capture]", err);
          setStatus("error"); setErrorMsg("Something went wrong. Try again.");
        }
      };
      recorder.start();
      timerRef.current = setInterval(() => setElapsed((n) => n + 1), 1000);
    } catch (error) {
      stopStream(); clearTimer(); resetWaveform(); closeAudioContext();
      console.error("[capture/start]", error);
      setStatus("error"); setErrorMsg(getCaptureStartErrorMessage(error));
    }
  }, [clearTimer, closeAudioContext, getIdToken, resetWaveform, startWaveform, stopStream]);

  useEffect(() => {
    if (!user || authLoading || !shouldAutoStart || captureMode !== "voice" || hasAutoStartedRef.current || status !== "idle") return;
    hasAutoStartedRef.current = true;
    void startCapture();
  }, [authLoading, captureMode, shouldAutoStart, startCapture, status, user]);

  const stopCapture = useCallback(() => {
    clearTimer();
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    closeAudioContext();
  }, [clearTimer, closeAudioContext]);

  const goToTimeline = useCallback(() => {
    stopAll();
    router.push("/timeline");
  }, [router, stopAll]);

  const setMode = useCallback((nextMode: CaptureMode) => {
    stopAll();
    hasAutoStartedRef.current = false;
    setStatus("idle");
    setErrorMsg("");
    if (nextMode === "text") { router.replace("/capture?mode=text"); return; }
    router.replace("/capture");
  }, [router, stopAll]);

  const submitTextCapture = useCallback(async () => {
    const trimmed = manualText.trim();
    if (!trimmed) return;
    setTranscript(""); setToats([]); setSelected([]); setErrorMsg("");
    setStatus("processing");
    const token = await getIdToken();
    if (!token) { setStatus("error"); setErrorMsg("Sign in required."); return; }
    try {
      const response = await fetch("/api/captures", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: trimmed, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
      });
      if (!response.ok) throw new Error(`${response.status}`);
      const data = await response.json();
      setTranscript(data.transcript ?? trimmed);
      setCaptureId(data.captureId ?? null);
      const extracted = (data.toats ?? []).map(mapRawToat);
      setToats(extracted);
      setSelected(extracted.map(() => true));
      setStatus("review");
    } catch (error) {
      console.error("[capture/text]", error);
      setStatus("error"); setErrorMsg("Something went wrong. Try again.");
    }
  }, [getIdToken, manualText]);

  const commitCapture = useCallback(async (editedToats: SerializedToat[], sel: boolean[]) => {
    if (!captureId) { router.push("/timeline"); return; }
    const token = await getIdToken();
    if (!token) { router.push("/timeline"); return; }
    setIsCommitting(true);
    try {
      const selectedIds = editedToats.filter((_, i) => sel[i]).map((t) => t.id);
      const edits: Record<string, Partial<Pick<SerializedToat, "title" | "tier" | "notes" | "enrichments">>> = {};
      for (const t of editedToats.filter((_, i) => sel[i])) {
        edits[t.id] = { title: t.title, tier: t.tier, notes: t.notes, enrichments: t.enrichments };
      }
      await fetch(`/api/captures/${captureId}/commit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ selectedIds, edits }),
      });
    } catch (err) {
      console.error("[capture/commit]", err);
    } finally {
      setIsCommitting(false);
    }
    router.push("/timeline");
  }, [captureId, getIdToken, router]);

  const cancelCapture = useCallback(async () => {
    if (captureId) {
      const token = await getIdToken();
      if (token) {
        fetch(`/api/captures/${captureId}/commit`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ selectedIds: [] }),
        }).catch(() => {});
      }
    }
    stopAll();
    router.push("/");
  }, [captureId, getIdToken, router, stopAll]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const routeIsLocked = !user && !authLoading;
  const isActive = status === "listening";
  const isProcessing = status === "processing";
  const isReview = status === "review";
  const isTextMode = captureMode === "text";
  const selectedCount = selected.filter(Boolean).length;

  return {
    // State
    status, transcript, elapsed, barHeights, toats, setToats,
    selected, setSelected, errorMsg, manualText, setManualText, isCommitting,
    // Derived
    captureMode, routeIsLocked, isActive, isProcessing, isReview, isTextMode, selectedCount,
    // Callbacks
    startCapture, stopCapture, goToTimeline, setMode, submitTextCapture, commitCapture, cancelCapture, formatTime,
    WAVEFORM_BARS,
  };
}
