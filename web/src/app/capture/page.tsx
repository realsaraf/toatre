"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TopNav } from "@/components/TopNav";
import { useAuth } from "@/lib/auth/auth-context";
import type { SerializedToat, Enrichments } from "@/types";

type CaptureStatus = "idle" | "listening" | "processing" | "review" | "error";
type CaptureMode = "voice" | "text";

const WAVEFORM_BARS = 20;

const MIN_ANALYSER_FFT_SIZE = 32;

type ToatTier = "urgent" | "important" | "regular";

type ExtractedToat = SerializedToat;

function getEnrichmentMeta(enrichments: Enrichments | undefined): { color: string; bg: string; icon: string } {
  if (enrichments?.communication?.channel === "call") return { color: "#DB2777", bg: "#FCE7F3", icon: "📞" };
  if (enrichments?.communication?.joinUrl) return { color: "#2563EB", bg: "#DBEAFE", icon: "📹" };
  if (enrichments?.communication?.channel === "email") return { color: "#0891B2", bg: "#CFFAFE", icon: "✉️" };
  if (enrichments?.event) return { color: "#7C3AED", bg: "#F3E8FF", icon: "🎫" };
  if (enrichments?.action?.type === "checklist") return { color: "#16A34A", bg: "#DCFCE7", icon: "🛒" };
  if (enrichments?.action?.type === "errand") return { color: "#D97706", bg: "#FEF3C7", icon: "📍" };
  if (enrichments?.thought) return { color: "#059669", bg: "#D1FAE5", icon: "💡" };
  return { color: "#6366F1", bg: "#EDE9FE", icon: "✅" };
}

// Context-aware icon resolver: uses title keywords then falls back to enrichment default
function getTitleIcon(title = "", enrichments?: Enrichments): string {
  const t = title.toLowerCase();
  // Sports
  if (/soccer|football|nycfc|mls/.test(t)) return "⚽";
  if (/basketball|nba/.test(t)) return "🏀";
  if (/baseball|mlb/.test(t)) return "⚾";
  if (/tennis/.test(t)) return "🎾";
  if (/golf/.test(t)) return "⛳";
  if (/hockey|nhl/.test(t)) return "🏒";
  if (/cricket/.test(t)) return "🏏";
  if (/rugby/.test(t)) return "🏉";
  if (/game|match|stadium|sport/.test(t)) return "🏟️";
  // School / education
  if (/school|class|lesson|tutori|study|homework|exam|test|lecture|college|university/.test(t)) return "🏫";
  if (/sunday school/.test(t)) return "⛪";
  // Grocery / shopping
  if (/groceri|supermark|walmart|target|costco/.test(t)) return "🛒";
  if (/pharmacy|drug store/.test(t)) return "💊";
  if (/coffee|starbucks/.test(t)) return "☕";
  if (/restaurant|dinner|lunch|breakfast|food|eat/.test(t)) return "🍽️";
  // Medical
  if (/doctor|physician|hospital|clinic/.test(t)) return "🏥";
  if (/dentist|dental/.test(t)) return "🦷";
  if (/gym|workout|fitness/.test(t)) return "💪";
  if (/haircut|salon|barber/.test(t)) return "💈";
  // Transport
  if (/airport|flight|plane/.test(t)) return "✈️";
  if (/train|subway|metro/.test(t)) return "🚇";
  if (/drive|driving|car/.test(t)) return "🚗";
  if (/drop.?(off|son|daughter|kid|child)/.test(t)) return "👨‍👦";
  if (/pick.?up/.test(t)) return "🤝";
  // Work
  if (/meeting|standup|sync/.test(t)) return "💼";
  if (/zoom|google meet|teams|video call/.test(t)) return "📹";
  if (/email|send|reply/.test(t)) return "✉️";
  if (/call|phone/.test(t)) return "📞";
  if (/interview/.test(t)) return "👔";
  if (/deadline|submit|due|deliver/.test(t)) return "⏰";
  if (/report|document|presentation|deck/.test(t)) return "📄";
  // Home
  if (/clean|laundry|wash/.test(t)) return "🧹";
  if (/cook|bake/.test(t)) return "🍳";
  if (/repair|fix|plumber|electrician/.test(t)) return "🔧";
  // Enrichment-based fallback
  return getEnrichmentMeta(enrichments).icon;
}

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

export default function CapturePage() {
  return (
    <Suspense fallback={<CapturePageFallback />}>
      <CapturePageContent />
    </Suspense>
  );
}

function CapturePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [status, setStatus] = useState<CaptureStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [barHeights, setBarHeights] = useState<number[]>(Array(WAVEFORM_BARS).fill(8));
  const [toats, setToats] = useState<ExtractedToat[]>([]);
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

  const routeIsLocked = !user && !authLoading;

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

    if (!audioCtx || audioCtx.state === "closed") {
      return;
    }

    void audioCtx.close().catch((error) => {
      console.error("[capture/audio-context]", error);
    });
  }, []);

  const stopAll = useCallback(() => {
    clearTimer();
    resetWaveform();

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    mediaRecorderRef.current = null;

    closeAudioContext();
    stopStream();
  }, [clearTimer, closeAudioContext, resetWaveform, stopStream]);

  useEffect(() => {
    return () => {
      stopAll();
    };
  }, [stopAll]);

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
        stopStream();
        clearTimer();
        resetWaveform();
        closeAudioContext();
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
          const extracted: ExtractedToat[] = (data.toats ?? []).map((t: Record<string, unknown>) => ({
            id: String(t._id ?? t.id ?? ""),
            tier: (t.tier ?? "regular") as ToatTier,
            state: (t.state ?? "open") as "open" | "done" | "archived",
            title: String(t.title ?? ""),
            notes: t.notes as string | null ?? null,
            enrichments: (t.enrichments ?? {}) as Enrichments,
            captureId: t.captureId as string | null ?? null,
            createdAt: String(t.createdAt ?? new Date().toISOString()),
            updatedAt: String(t.updatedAt ?? new Date().toISOString()),
          }));
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
      stopStream();
      clearTimer();
      resetWaveform();
      closeAudioContext();
      console.error("[capture/start]", error);
      setStatus("error"); setErrorMsg(getCaptureStartErrorMessage(error));
    }
  }, [clearTimer, closeAudioContext, getIdToken, resetWaveform, startWaveform, stopStream]);

  useEffect(() => {
    if (!user || authLoading || !shouldAutoStart || captureMode !== "voice" || hasAutoStartedRef.current || status !== "idle") {
      return;
    }

    hasAutoStartedRef.current = true;
    void startCapture();
  }, [authLoading, captureMode, shouldAutoStart, startCapture, status, user]);

  const stopCapture = () => {
    clearTimer();
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    closeAudioContext();
  };

  const goToTimeline = useCallback(() => {
    stopAll();
    router.push("/timeline");
  }, [router, stopAll]);

  const setMode = useCallback((nextMode: CaptureMode) => {
    stopAll();
    hasAutoStartedRef.current = false;
    setStatus("idle");
    setErrorMsg("");

    if (nextMode === "text") {
      router.replace("/capture?mode=text");
      return;
    }

    router.replace("/capture");
  }, [router, stopAll]);

  const submitTextCapture = useCallback(async () => {
    const trimmed = manualText.trim();
    if (!trimmed) {
      return;
    }

    setTranscript("");
    setToats([]);
    setSelected([]);
    setErrorMsg("");
    setStatus("processing");

    const token = await getIdToken();
    if (!token) {
      setStatus("error");
      setErrorMsg("Sign in required.");
      return;
    }

    try {
      const response = await fetch("/api/captures", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript: trimmed,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      if (!response.ok) {
        throw new Error(`${response.status}`);
      }

      const data = await response.json();
      setTranscript(data.transcript ?? trimmed);
      setCaptureId(data.captureId ?? null);
      const extracted: ExtractedToat[] = (data.toats ?? []).map((t: Record<string, unknown>) => ({
        id: String(t._id ?? t.id ?? ""),
        tier: (t.tier ?? "regular") as ToatTier,
        state: (t.state ?? "open") as "open" | "done" | "archived",
        title: String(t.title ?? ""),
        notes: t.notes as string | null ?? null,
        enrichments: (t.enrichments ?? {}) as Enrichments,
        captureId: t.captureId as string | null ?? null,
        createdAt: String(t.createdAt ?? new Date().toISOString()),
        updatedAt: String(t.updatedAt ?? new Date().toISOString()),
      }));
      setToats(extracted);
      setSelected(extracted.map(() => true));
      setStatus("review");
    } catch (error) {
      console.error("[capture/text]", error);
      setStatus("error");
      setErrorMsg("Something went wrong. Try again.");
    }
  }, [getIdToken, manualText]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const isActive = status === "listening";
  const isProcessing = status === "processing";
  const isReview = status === "review";
  const selectedCount = selected.filter(Boolean).length;
  const isTextMode = captureMode === "text";

  const commitCapture = useCallback(async (editedToats: ExtractedToat[], sel: boolean[]) => {
    if (!captureId) { router.push("/timeline"); return; }
    const token = await getIdToken();
    if (!token) { router.push("/timeline"); return; }
    setIsCommitting(true);
    try {
      const selectedIds = editedToats.filter((_, i) => sel[i]).map((t) => t.id);
      const edits: Record<string, Partial<Pick<ExtractedToat, "title" | "tier" | "notes" | "enrichments">>> = {};
      for (const t of editedToats.filter((_, i) => sel[i])) {
        edits[t.id] = {
          title: t.title,
          tier: t.tier,
          notes: t.notes,
          enrichments: t.enrichments,
        };
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
    // Delete all pending toats for this capture and go home
    if (captureId) {
      const token = await getIdToken();
      if (token) {
        // Commit with empty selectedIds to delete all pending toats
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

  if (routeIsLocked) {
    return null;
  }

  if (isReview) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
        <TopNav />
        <main style={S.main}>
          <ReviewScreen
            transcript={transcript}
            toats={toats}
            selected={selected}
            onToggle={(i) => setSelected((s) => s.map((v, j) => (j === i ? !v : v)))}
            onToggleAll={() => { const all = selected.every(Boolean); setSelected(selected.map(() => !all)); }}
            onUpdateToat={(i, updated) => setToats((prev) => prev.map((t, j) => j === i ? { ...t, ...updated } : t))}
            onReorder={(from, to) => {
              setToats((prev) => {
                const next = [...prev];
                const [item] = next.splice(from, 1);
                next.splice(to, 0, item!);
                return next;
              });
              setSelected((prev) => {
                const next = [...prev];
                const [item] = next.splice(from, 1);
                next.splice(to, 0, item!);
                return next;
              });
            }}
            onAddToTimeline={() => void commitCapture(toats, selected)}
            onCancel={() => void cancelCapture()}
            selectedCount={selectedCount}
            isCommitting={isCommitting}
          />
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      <TopNav />
      <main style={S.main}>
        {/* Header */}
        <div style={S.header}>
          <div>
            <h1 style={S.title}>Capture</h1>
            <p style={S.subtitle}>
                {isTextMode
                  ? isProcessing
                    ? "Turning your note into toats."
                    : status === "error"
                      ? (errorMsg || "Something went wrong.")
                      : "Type whatever is on your mind. Toatre will split it into toats for you."
                  : isActive
                    ? "Tap the mic to stop when you're done."
                    : isProcessing
                      ? "Thinking…"
                      : status === "error"
                        ? (errorMsg || "Something went wrong.")
                        : "Tap the mic and tell me what's on your mind."}
            </p>
          </div>
          <div style={S.pill}>✨ Toatre listens, you live.</div>
        </div>

          <div style={S.modeSwitch}>
            <button
              type="button"
              onClick={() => setMode("voice")}
              style={{ ...S.modeButton, ...(captureMode === "voice" ? S.modeButtonActive : {}) }}
            >
              Talk
            </button>
            <button
              type="button"
              onClick={() => setMode("text")}
              style={{ ...S.modeButton, ...(captureMode === "text" ? S.modeButtonActive : {}) }}
            >
              Type
            </button>
          </div>

          {!isTextMode ? (
            <>
              <div style={S.waveSection}>
                <div style={S.statusRow}>
                  {isActive && <><span style={S.dot} /><span style={{ color: "var(--color-primary)", fontWeight: 600 }}>Listening…</span></>}
                  {isProcessing && <><SpinIcon /><span style={{ color: "var(--color-primary)", fontWeight: 600 }}>Thinking…</span></>}
                  {status === "idle" && <span style={{ color: "var(--color-text-muted)", fontSize: 14 }}>Ready when you are</span>}
                  {status === "error" && <span style={{ color: "#EF4444", fontWeight: 600 }}>{errorMsg || "Couldn't start the mic. Try again."}</span>}
                </div>

                <div style={S.waveRow}>
                  <div style={S.barGroup}>
                    {barHeights.slice(0, WAVEFORM_BARS / 2).map((h, i) => (
                      <div key={i} style={{ ...S.bar, height: h, background: "linear-gradient(to top, #6366F1, #8B5CF6)", opacity: isActive ? 1 : 0.2 }} />
                    ))}
                  </div>
                  <button
                    onClick={isActive ? stopCapture : startCapture}
                    disabled={isProcessing}
                    style={{ ...S.micBtn, ...(isActive ? S.micBtnActive : {}) }}
                    aria-label={isActive ? "Stop recording" : "Start recording"}
                  >
                    <div style={{ ...S.micRing, ...(isActive ? { animation: "pulse-ring 1.8s cubic-bezier(0.4,0,0.6,1) infinite" } : {}) }} />
                    {isProcessing ? <SpinIconLg /> : isActive ? <div style={S.stopSquare} /> : <MicIcon />}
                  </button>
                  <div style={S.barGroup}>
                    {barHeights.slice(WAVEFORM_BARS / 2).map((h, i) => (
                      <div key={i} style={{ ...S.bar, height: h, background: "linear-gradient(to top, #F59E0B, #EC4899)", opacity: isActive ? 1 : 0.2 }} />
                    ))}
                  </div>
                </div>

                {isActive && <p style={S.timer}>{formatTime(elapsed)}</p>}
              </div>

              {isActive && (
                <div style={S.privacy}>
                  <LockIcon />
                  Audio is not stored by default
                </div>
              )}

              {status === "idle" && (
                <div style={S.tip}>
                  <span style={{ fontSize: 16 }}>💡</span>
                  <span>You can say multiple things — I&apos;ll organise them for you.</span>
                </div>
              )}
            </>
          ) : (
            <div style={S.textCaptureCard}>
              <div style={S.statusRow}>
                {isProcessing && <><SpinIcon /><span style={{ color: "var(--color-primary)", fontWeight: 600 }}>Capturing your note…</span></>}
                {!isProcessing && status !== "error" && <span style={{ color: "var(--color-text-muted)", fontSize: 14 }}>Paste a brain dump or type a quick note</span>}
                {status === "error" && <span style={{ color: "#EF4444", fontWeight: 600 }}>{errorMsg || "Couldn't capture that note. Try again."}</span>}
              </div>

              <textarea
                value={manualText}
                onChange={(event) => setManualText(event.target.value)}
                placeholder="Try: Pick up son from Sunday school at 1, join the 2 p.m. team meeting, and remind me to send the deck tonight."
                style={S.textarea}
                disabled={isProcessing}
              />

              <div style={S.textFooter}>
                <p style={S.textHint}>Toatre can split one typed note into multiple toats.</p>
                <button
                  type="button"
                  onClick={() => void submitTextCapture()}
                  disabled={isProcessing || manualText.trim().length === 0}
                  style={{
                    ...S.textSubmitButton,
                    opacity: isProcessing || manualText.trim().length === 0 ? 0.55 : 1,
                    cursor: isProcessing || manualText.trim().length === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  {isProcessing ? "Capturing…" : "Capture from text"}
                </button>
              </div>
            </div>
          )}

          {!isTextMode && isActive && (
          <div style={S.privacy}>
            <LockIcon />
            Audio is not stored by default
          </div>
        )}

          {(isTextMode || isActive || isProcessing || status === "error") && (
          <div style={{ textAlign: "center", marginTop: 28 }}>
            <button onClick={goToTimeline} style={S.cancelBtn}>Cancel</button>
          </div>
        )}
      </main>
    </div>
  );
}

function CapturePageFallback() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      <TopNav />
      <main style={S.main}>
        <div style={S.header}>
          <div>
            <h1 style={S.title}>Capture</h1>
            <p style={S.subtitle}>Loading capture…</p>
          </div>
          <div style={S.pill}>✨ Toatre listens, you live.</div>
        </div>
      </main>
    </div>
  );
}

/* ─── Review screen ──────────────────────────────────────────────────────── */

function ReviewScreen({
  transcript, toats, selected, onToggle, onToggleAll, onUpdateToat,
  onReorder, onAddToTimeline, onCancel, selectedCount, isCommitting,
}: {
  transcript: string; toats: ExtractedToat[]; selected: boolean[];
  onToggle: (i: number) => void; onToggleAll: () => void;
  onUpdateToat: (i: number, updated: Partial<ExtractedToat>) => void;
  onReorder: (from: number, to: number) => void;
  onAddToTimeline: () => void; onCancel: () => void;
  selectedCount: number; isCommitting: boolean;
}) {
  const allSelected = selected.every(Boolean);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [showLearnMore, setShowLearnMore] = useState(false);
  const dragIndexRef = useRef<number | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <p style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text)", marginBottom: 2 }}>Captured</p>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
          {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </p>
      </div>

      {/* Transcript card */}
      <div style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 20, padding: "18px 20px", marginBottom: 18, boxShadow: "0 2px 12px rgba(99,102,241,0.06)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 22, color: "#6366F1" }}>✦</span>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", marginBottom: 2 }}>Got these from what you said</p>
            <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Review and make any changes before adding.</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
          <WaveIcon />
          <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--color-text)", flex: 1 }}>
            <HighlightedTranscript text={transcript} />
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" as const }}>
          <LegendDot color="#8B5CF6" label="Time" />
          <LegendDot color="#2563EB" label="People" />
          <LegendDot color="#16A34A" label="Places" />
          <LegendDot color="#D97706" label="Others" />
        </div>
      </div>

      {/* List header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-secondary)" }}>{toats.length} toat{toats.length !== 1 ? "s" : ""} found</span>
        <button onClick={onToggleAll} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "var(--color-primary)", padding: 0 }}>
          {allSelected ? "All selected" : "Select all"}
          <span style={{ width: 22, height: 22, borderRadius: "50%", background: allSelected ? "#6366F1" : "#E0E0E0", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {allSelected && <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>✓</span>}
          </span>
        </button>
      </div>

      {/* Toat cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {toats.map((toat, i) => (
          <div
            key={toat.id || i}
            draggable
            onDragStart={() => { dragIndexRef.current = i; }}
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={() => {
              const from = dragIndexRef.current;
              if (from !== null && from !== i) onReorder(from, i);
              dragIndexRef.current = null;
            }}
          >
            <ReviewToatCard
              toat={toat}
              checked={selected[i]!}
              onToggle={() => onToggle(i)}
              onEdit={() => setEditIndex(i)}
            />
          </div>
        ))}
      </div>

      {/* Learn more promo */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px", background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 14, fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 24 }}>
        <span style={{ fontSize: 16 }}>✦</span>
        <p style={{ lineHeight: 1.5, flex: 1, margin: 0 }}>Toatre can set reminders, check traffic, and add location details for you.</p>
        <button onClick={() => setShowLearnMore(true)} style={{ background: "none", border: "none", color: "var(--color-primary)", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" as const }}>Learn more →</button>
      </div>

      {/* Bottom bar */}
      <div style={{ position: "sticky", bottom: 0, background: "var(--color-bg)", paddingBottom: 24, paddingTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <button
          onClick={onCancel}
          style={{ background: "none", border: "1px solid var(--color-border)", borderRadius: 12, padding: "12px 20px", fontSize: 14, fontWeight: 600, color: "var(--color-text-muted)", cursor: "pointer" }}
        >
          Cancel
        </button>
        <button
          onClick={onAddToTimeline}
          disabled={selectedCount === 0 || isCommitting}
          style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 2, padding: "12px 28px", background: "linear-gradient(135deg, #8B5CF6, #6366F1)", borderRadius: 16, border: "none", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(99,102,241,0.35)", opacity: selectedCount === 0 || isCommitting ? 0.5 : 1, transition: "opacity 0.2s" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {isCommitting ? <span>Saving…</span> : <><span>✓</span> Add to timeline</>}
          </div>
          {!isCommitting && <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.8 }}>{selectedCount} toat{selectedCount !== 1 ? "s" : ""} will be added</span>}
        </button>
      </div>

      {/* Edit modal */}
      {editIndex !== null && (
        <EditToatModal
          toat={toats[editIndex]!}
          onSave={(updated) => {
            onUpdateToat(editIndex, updated);
            setEditIndex(null);
          }}
          onClose={() => setEditIndex(null)}
        />
      )}

      {/* Learn more modal */}
      {showLearnMore && <LearnMoreModal onClose={() => setShowLearnMore(false)} />}
    </div>
  );
}

function ReviewToatCard({ toat, checked, onToggle, onEdit }: { toat: ExtractedToat; checked: boolean; onToggle: () => void; onEdit: () => void }) {
  const meta = getEnrichmentMeta(toat.enrichments);
  const timeStr = (() => {
    const t = toat.enrichments?.time;
    const iso = t?.at ?? t?.startAt ?? null;
    if (!iso) return null;
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) + ", " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  })();
  const loc = toat.enrichments?.place?.address ?? toat.enrichments?.place?.placeName ?? toat.enrichments?.event?.venueName ?? null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 16, padding: "14px 16px", opacity: checked ? 1 : 0.55, transition: "opacity 0.2s" }}>
      <button onClick={onToggle} style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid ${checked ? "#6366F1" : "#D1D5DB"}`, background: checked ? "#6366F1" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }} aria-label={checked ? "Deselect" : "Select"}>
        {checked && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
      </button>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 20 }}>{getTitleIcon(toat.title, toat.enrichments)}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text)", marginBottom: 4, margin: 0 }}>{toat.title}</p>
        {timeStr && <p style={{ fontSize: 12, color: meta.color, margin: "4px 0 0" }}>📅 {timeStr}</p>}
        {loc && <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "2px 0 0" }}>📍 {loc}</p>}
      </div>
      <button onClick={onEdit} style={{ background: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: 10, padding: "5px 14px", fontSize: 13, color: "#374151", cursor: "pointer", flexShrink: 0 }}>Edit</button>
      <span style={{ fontSize: 16, color: "#D1D5DB", cursor: "grab" }} aria-hidden>⠿</span>
    </div>
  );
}

function EditToatModal({ toat, onSave, onClose }: { toat: ExtractedToat; onSave: (updated: Partial<ExtractedToat>) => void; onClose: () => void }) {
  const meta = getEnrichmentMeta(toat.enrichments);
  const [title, setTitle] = useState(toat.title);
  const initLoc = toat.enrichments?.place?.address ?? toat.enrichments?.place?.placeName ?? toat.enrichments?.event?.venueName ?? "";
  const [location, setLocation] = useState(initLoc);
  const [notes, setNotes] = useState(toat.notes ?? "");
  const initIso = toat.enrichments?.time?.at ?? toat.enrichments?.time?.startAt ?? null;
  const [datetime, setDatetime] = useState(() => {
    if (!initIso) return "";
    const d = new Date(initIso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 0 0 0" }} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 560, background: "var(--color-card)", borderRadius: "24px 24px 0 0", padding: "24px 24px 40px", boxShadow: "0 -8px 48px rgba(0,0,0,0.18)", maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 18 }}>{meta.icon}</span>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)" }}>{toat.title}</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--color-text-muted)", lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: 6 }}>TITLE</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid var(--color-border)", fontSize: 15, background: "var(--color-bg)", color: "var(--color-text)", outline: "none" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: 6 }}>DATE &amp; TIME <span style={{ fontWeight: 400 }}>(optional)</span></label>
            <input type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid var(--color-border)", fontSize: 14, background: "var(--color-bg)", color: "var(--color-text)", outline: "none" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: 6 }}>LOCATION <span style={{ fontWeight: 400 }}>(optional)</span></label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Citi Field, New York" style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid var(--color-border)", fontSize: 14, background: "var(--color-bg)", color: "var(--color-text)", outline: "none" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: 6 }}>NOTES <span style={{ fontWeight: 400 }}>(optional)</span></label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid var(--color-border)", fontSize: 14, background: "var(--color-bg)", color: "var(--color-text)", outline: "none", resize: "vertical" }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "14px", borderRadius: 14, border: "1.5px solid var(--color-border)", background: "none", fontSize: 15, fontWeight: 600, color: "var(--color-text-muted)", cursor: "pointer" }}>Cancel</button>
          <button
            onClick={() => {
              const timeIso = datetime ? new Date(datetime).toISOString() : null;
              const loc = location.trim() || null;
              const updatedEnrichments: Enrichments = {
                ...toat.enrichments,
                ...(timeIso ? { time: { ...toat.enrichments?.time, at: timeIso } } : {}),
                ...(loc ? { place: { ...toat.enrichments?.place, address: loc } } : {}),
              };
              onSave({ title: title.trim() || toat.title, notes: notes.trim() || null, enrichments: updatedEnrichments });
            }}
            style={{ flex: 2, padding: "14px", borderRadius: 14, background: "linear-gradient(135deg, #8B5CF6, #6366F1)", border: "none", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

function LearnMoreModal({ onClose }: { onClose: () => void }) {
  const features = [
    { icon: "⏰", title: "Smart Reminders", desc: "Toatre calculates travel time and Pings you early enough to leave." },
    { icon: "🗺️", title: "Live Traffic", desc: "Before you head out, Toatre checks real-time traffic to your location." },
    { icon: "📍", title: "Auto Location", desc: "Drop a name like 'dentist' — Toatre looks up the address for you." },
    { icon: "👥", title: "People Memory", desc: "Toatre remembers people you mention so future captures are faster." },
    { icon: "🔁", title: "Smart Follow-ups", desc: "After a call or meeting, Toatre can surface follow-up toats automatically." },
    { icon: "📅", title: "Calendar Sync", desc: "Toatre keeps your timeline in sync with Google Calendar or Apple Calendar." },
  ];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 480, background: "var(--color-card)", borderRadius: 24, padding: "28px 24px", boxShadow: "0 16px 64px rgba(0,0,0,0.22)", maxHeight: "80vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div>
            <p style={{ fontSize: 18, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>What Toatre can do for you</p>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "4px 0 0" }}>Your personal timeline assistant, always working.</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--color-text-muted)", padding: 4 }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {features.map((f) => (
            <div key={f.title} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(99,102,241,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{f.icon}</div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{f.title}</p>
                <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "3px 0 0", lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <button onClick={onClose} style={{ marginTop: 24, width: "100%", padding: 14, borderRadius: 14, background: "linear-gradient(135deg, #8B5CF6, #6366F1)", border: "none", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Got it</button>
      </div>
    </div>
  );
}

/* ─── Small components ────────────────────────────────────────────────────── */

function HighlightedTranscript({ text }: { text: string }) {
  const timeRx = /\b(\d{1,2}(:\d{2})?\s?(am|pm)?|tomorrow|today|tonight|this (morning|afternoon|evening|weekend|week)|next \w+|may \d{1,2}|\d+\s?(min|hour|day|week)s?\b)/gi;
  const placeRx = /\b(zoom|google meet|teams|slack|las vegas|new york|nyc)/gi;
  const parts: React.ReactNode[] = [];
  const matches: { start: number; end: number; type: "time" | "place" }[] = [];
  let m;
  while ((m = timeRx.exec(text)) !== null) matches.push({ start: m.index, end: m.index + m[0].length, type: "time" });
  while ((m = placeRx.exec(text)) !== null) matches.push({ start: m.index, end: m.index + m[0].length, type: "place" });
  matches.sort((a, b) => a.start - b.start);
  let last = 0;
  for (const match of matches) {
    if (match.start < last) continue;
    if (match.start > last) parts.push(text.slice(last, match.start));
    parts.push(<span key={match.start} style={{ color: match.type === "time" ? "#7C3AED" : "#16A34A", fontWeight: 500 }}>{text.slice(match.start, match.end)}</span>);
    last = match.end;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#6B7280" }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
      {label}
    </div>
  );
}

function WaveIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: 3 }} aria-hidden>
      <rect x={1} y={6} width={2} height={6} rx={1} fill="#8B5CF6" />
      <rect x={5} y={3} width={2} height={12} rx={1} fill="#8B5CF6" />
      <rect x={9} y={5} width={2} height={8} rx={1} fill="#8B5CF6" />
      <rect x={13} y={2} width={2} height={14} rx={1} fill="#8B5CF6" />
    </svg>
  );
}

function MicIcon({ size = 52 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none" aria-hidden>
      <rect x={17} y={6} width={18} height={26} rx={9} fill="#FFFFFF" />
      <path d="M12 24C12 31.732 18.268 38 26 38C33.732 38 40 31.732 40 24" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" />
      <path d="M26 38V45" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" />
      <path d="M18 46H34" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" />
    </svg>
  );
}

function SpinIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" fill="none" className="animate-spin" aria-hidden>
      <circle cx={7} cy={7} r={5} stroke="rgba(99,102,241,0.3)" strokeWidth={2} />
      <path d="M7 2a5 5 0 0 1 5 5" stroke="#6366F1" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

function SpinIconLg() {
  return (
    <svg width={28} height={28} viewBox="0 0 28 28" fill="none" className="animate-spin" aria-hidden>
      <circle cx={14} cy={14} r={11} stroke="rgba(99,102,241,0.25)" strokeWidth={3} />
      <path d="M14 3a11 11 0 0 1 11 11" stroke="#6366F1" strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width={13} height={13} viewBox="0 0 13 13" fill="none" aria-hidden>
      <rect x={1} y={5} width={11} height={8} rx={2} stroke="#6B7280" strokeWidth={1.2} />
      <path d="M4 5V3.5a2.5 2.5 0 0 1 5 0V5" stroke="#6B7280" strokeWidth={1.2} strokeLinecap="round" />
    </svg>
  );
}

/* ─── Styles ──────────────────────────────────────────────────────────────── */

const S: Record<string, React.CSSProperties> = {
  main: { maxWidth: 560, margin: "0 auto", padding: "28px 20px 60px", display: "flex", flexDirection: "column", gap: 0 },
  header: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 32, flexWrap: "wrap" },
  title: { fontSize: 32, fontWeight: 800, color: "var(--color-text)", marginBottom: 6, lineHeight: 1.15 },
  subtitle: { fontSize: 15, color: "var(--color-text-secondary)", lineHeight: 1.5, maxWidth: 280 },
  pill: { display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "var(--color-card)", border: "1px solid var(--color-border-strong)", borderRadius: 20, fontSize: 13, fontWeight: 600, color: "var(--color-primary)", flexShrink: 0, boxShadow: "0 1px 6px rgba(99,102,241,0.10)", alignSelf: "flex-start" },
  modeSwitch: { display: "inline-flex", alignItems: "center", gap: 8, padding: 6, marginBottom: 24, background: "rgba(255,255,255,0.9)", border: "1px solid var(--color-border)", borderRadius: 999, alignSelf: "flex-start", boxShadow: "0 12px 30px rgba(99,102,241,0.08)" },
  modeButton: { minWidth: 88, minHeight: 42, borderRadius: 999, border: "none", background: "transparent", color: "var(--color-text-secondary)", fontSize: 14, fontWeight: 700, cursor: "pointer", padding: "0 18px" },
  modeButtonActive: { background: "linear-gradient(135deg, rgba(99,102,241,0.14), rgba(236,72,153,0.12))", color: "var(--color-primary)" },
  waveSection: { display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginBottom: 28 },
  statusRow: { display: "flex", alignItems: "center", gap: 8, fontSize: 14, minHeight: 24 },
  dot: { width: 8, height: 8, borderRadius: "50%", background: "var(--color-primary)", animation: "pulse-ring 1.2s ease-in-out infinite" },
  waveRow: { display: "flex", alignItems: "center", gap: 16, width: "100%", justifyContent: "center" },
  barGroup: { display: "flex", alignItems: "center", gap: 4, height: 64 },
  bar: { width: 4, borderRadius: 3, transition: "height 0.08s ease" },
  micBtn: { position: "relative", width: 138, height: 138, borderRadius: "50%", background: "linear-gradient(145deg, #5B6CFF 0%, #7867FF 22%, #D946EF 56%, #FF6B4A 82%, #FDBA3B 100%)", border: "6px solid rgba(255,255,255,0.96)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, boxShadow: "0 18px 48px rgba(99,102,241,0.22), 0 18px 72px rgba(236,72,153,0.20)", transition: "transform 0.15s, box-shadow 0.15s" },
  micBtnActive: { boxShadow: "0 22px 56px rgba(99,102,241,0.28), 0 24px 84px rgba(236,72,153,0.24)", transform: "scale(1.04)" },
  micRing: { position: "absolute", inset: -26, borderRadius: "50%", border: "1px solid rgba(129, 140, 248, 0.18)", background: "radial-gradient(circle, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.12) 42%, rgba(255,255,255,0) 72%)", pointerEvents: "none" },
  stopSquare: { width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.95)" },
  timer: { fontSize: 22, fontWeight: 700, color: "var(--color-primary)", letterSpacing: "0.05em", fontVariantNumeric: "tabular-nums" },
  privacy: { display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#9CA3AF", justifyContent: "center", marginBottom: 8 },
  tip: { display: "flex", alignItems: "flex-start", gap: 10, padding: "14px 18px", background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 14, fontSize: 14, color: "var(--color-text-secondary)", marginBottom: 24 },
  textCaptureCard: { display: "flex", flexDirection: "column", gap: 18, padding: "22px 22px 20px", borderRadius: 24, background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.84))", border: "1px solid rgba(255,255,255,0.92)", boxShadow: "0 22px 60px rgba(31,41,55,0.08)", marginBottom: 24 },
  textarea: { width: "100%", minHeight: 220, resize: "vertical", borderRadius: 20, border: "1px solid var(--color-border)", padding: "18px 18px 20px", fontSize: 16, lineHeight: 1.6, color: "var(--color-text)", outline: "none", background: "rgba(251,250,255,0.98)", boxShadow: "inset 0 1px 2px rgba(15,23,42,0.04)" },
  textFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" },
  textHint: { fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.5, flex: 1, minWidth: 220 },
  textSubmitButton: { minHeight: 54, padding: "0 20px", borderRadius: 18, border: "none", background: "linear-gradient(135deg, #5B3DF5, #7C3AED)", color: "#FFFFFF", fontSize: 15, fontWeight: 700, boxShadow: "0 18px 36px rgba(91,61,245,0.22)" },
  cancelBtn: { background: "none", border: "1px solid var(--color-border)", borderRadius: 10, padding: "8px 24px", fontSize: 14, color: "var(--color-text-muted)", cursor: "pointer" },
};
