"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Enrichments, SerializedToat } from "@/types";
import { useAuth } from "@/lib/auth/auth-context";
import { ReviewScreen } from "@/app/capture/_components/ReviewScreen";
import { KeyboardIcon, MicIcon, StopIcon } from "./desktop-icons";

type CaptureStatus = "idle" | "listening" | "processing" | "review" | "error";
type CaptureMode = "voice" | "type";
type ToatTier = "urgent" | "important" | "regular";

const waveformBarCount = 20;
const minAnalyserFftSize = 32;

function analyserFftSize(barCount: number): number {
  return 2 ** Math.ceil(Math.log2(Math.max(barCount * 4, minAnalyserFftSize)));
}

function captureStartErrorMessage(error: unknown): string {
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

function mapRawToat(toat: Record<string, unknown>): SerializedToat {
  return {
    id: String(toat._id ?? toat.id ?? ""),
    tier: (toat.tier ?? "regular") as ToatTier,
    state: (toat.state ?? "open") as "open" | "done" | "archived",
    title: String(toat.title ?? ""),
    notes: (toat.notes as string | null) ?? null,
    enrichments: (toat.enrichments ?? {}) as Enrichments,
    captureId: (toat.captureId as string | null) ?? null,
    createdAt: String(toat.createdAt ?? new Date().toISOString()),
    updatedAt: String(toat.updatedAt ?? new Date().toISOString()),
  };
}

function WaveformIcon() {
  return (
    <span className="desktop-capture-status-wave" aria-hidden>
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}

function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="10" width="14" height="10" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function BulbIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M8.5 14.3A6 6 0 1 1 15.5 14c-.9.7-1.4 1.7-1.4 2.8H9.9c0-1-.5-1.9-1.4-2.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M10 20h4M10 17h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function VisualizerBars({ barHeights }: { barHeights: number[] }) {
  return (
    <div className="desktop-capture-visual-bars" aria-hidden>
      {barHeights.slice(6, 13).map((height, index) => (
        <span key={`${height}-${index}`} style={{ height }} />
      ))}
    </div>
  );
}

function SideWaveform({ side }: { side: "left" | "right" }) {
  const heights = side === "left" ? [16, 34, 26, 54, 72, 44, 28, 62] : [62, 28, 44, 72, 54, 26, 34, 16];
  return (
    <div className={`desktop-capture-side-wave ${side}`} aria-hidden>
      {heights.map((height, index) => (
        <span key={`${side}-${index}`} style={{ height }} />
      ))}
    </div>
  );
}

interface DesktopCaptureModalProps {
  initialMode: CaptureMode;
  onClose: () => void;
  onSaved: () => void;
}

export function DesktopCaptureModal({
  initialMode,
  onClose,
  onSaved,
}: DesktopCaptureModalProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<CaptureMode>(initialMode);
  const [status, setStatus] = useState<CaptureStatus>("idle");
  const [typedCapture, setTypedCapture] = useState("");
  const [transcript, setTranscript] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [barHeights, setBarHeights] = useState<number[]>(Array(waveformBarCount).fill(8));
  const [toats, setToats] = useState<SerializedToat[]>([]);
  const [selected, setSelected] = useState<boolean[]>([]);
  const [captureId, setCaptureId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isCommitting, setIsCommitting] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const autoStartedRef = useRef(false);
  const shouldProcessRecordingRef = useRef(false);

  const isTypeMode = mode === "type";
  const isListening = status === "listening";
  const isProcessing = status === "processing";
  const isReview = status === "review";
  const selectedCount = selected.filter(Boolean).length;

  const formattedElapsed = `${Math.floor(elapsed / 60).toString().padStart(2, "0")}:${(elapsed % 60).toString().padStart(2, "0")}`;

  const resetWaveform = useCallback(() => {
    cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = 0;
    setBarHeights(Array(waveformBarCount).fill(8));
  }, []);

  const clearTimer = useCallback(() => {
    if (!timerRef.current) return;
    clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const closeAudioContext = useCallback(() => {
    const audioContext = audioContextRef.current;
    audioContextRef.current = null;
    analyserRef.current = null;
    if (!audioContext || audioContext.state === "closed") return;
    void audioContext.close().catch((error) => console.error("[desktop-capture/audio-context]", error));
  }, []);

  const stopAll = useCallback(() => {
    clearTimer();
    resetWaveform();
    shouldProcessRecordingRef.current = false;
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    mediaRecorderRef.current = null;
    closeAudioContext();
    stopStream();
  }, [clearTimer, closeAudioContext, resetWaveform, stopStream]);

  const getIdToken = useCallback(async () => (user ? user.getIdToken() : null), [user]);

  const startWaveform = useCallback((stream: MediaStream) => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = analyserFftSize(waveformBarCount);
    audioContext.createMediaStreamSource(stream).connect(analyser);
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const draw = () => {
      analyser.getByteFrequencyData(data);
      setBarHeights(Array.from({ length: waveformBarCount }, (_, index) => {
        const value = (data[Math.floor((index / waveformBarCount) * data.length)] ?? 0) / 255;
        return Math.max(8, value * 68 + 8);
      }));
      animationFrameRef.current = requestAnimationFrame(draw);
    };
    draw();
  }, []);

  const startCapture = useCallback(async () => {
    if (!user || status === "listening" || status === "processing") return;
    setTranscript("");
    setElapsed(0);
    setToats([]);
    setSelected([]);
    setErrorMsg("");
    setCaptureId(null);
    setStatus("listening");
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      startWaveform(stream);
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      shouldProcessRecordingRef.current = true;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        const shouldProcess = shouldProcessRecordingRef.current;
        shouldProcessRecordingRef.current = false;
        mediaRecorderRef.current = null;
        stopStream();
        clearTimer();
        resetWaveform();
        closeAudioContext();
        if (!shouldProcess) return;
        setStatus("processing");
        const token = await getIdToken();
        if (!token) {
          setStatus("error");
          setErrorMsg("Sign in required.");
          return;
        }
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", audioBlob, "audio.webm");
        formData.append("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone);
        try {
          const response = await fetch("/api/captures", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });
          if (!response.ok) throw new Error(`${response.status}`);
          const data = await response.json();
          const extracted = ((data.toats ?? []) as Record<string, unknown>[]).map(mapRawToat);
          setTranscript(data.transcript ?? "");
          setCaptureId(data.captureId ?? null);
          setToats(extracted);
          setSelected(extracted.map(() => true));
          setStatus("review");
        } catch (error) {
          console.error("[desktop-capture/voice]", error);
          setStatus("error");
          setErrorMsg("Something went wrong. Try again.");
        }
      };
      recorder.start();
      timerRef.current = setInterval(() => setElapsed((current) => current + 1), 1000);
    } catch (error) {
      stopStream();
      clearTimer();
      resetWaveform();
      closeAudioContext();
      console.error("[desktop-capture/start]", error);
      setStatus("error");
      setErrorMsg(captureStartErrorMessage(error));
    }
  }, [clearTimer, closeAudioContext, getIdToken, resetWaveform, startWaveform, status, stopStream, user]);

  const stopCapture = useCallback(() => {
    clearTimer();
    const recorder = mediaRecorderRef.current;
    shouldProcessRecordingRef.current = true;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    closeAudioContext();
  }, [clearTimer, closeAudioContext]);

  const submitTextCapture = useCallback(async () => {
    const trimmed = typedCapture.trim();
    if (!trimmed || !user || isProcessing) return;
    stopAll();
    setTranscript("");
    setToats([]);
    setSelected([]);
    setErrorMsg("");
    setCaptureId(null);
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
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: trimmed, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
      });
      if (!response.ok) throw new Error(`${response.status}`);
      const data = await response.json();
      const extracted = ((data.toats ?? []) as Record<string, unknown>[]).map(mapRawToat);
      setTranscript(data.transcript ?? trimmed);
      setCaptureId(data.captureId ?? null);
      setToats(extracted);
      setSelected(extracted.map(() => true));
      setStatus("review");
    } catch (error) {
      console.error("[desktop-capture/text]", error);
      setStatus("error");
      setErrorMsg("Something went wrong. Try again.");
    }
  }, [getIdToken, isProcessing, stopAll, typedCapture, user]);

  const commitCapture = useCallback(async (editedToats: SerializedToat[], selectedToats: boolean[]) => {
    if (!captureId) {
      onSaved();
      return;
    }
    const token = await getIdToken();
    if (!token) {
      onSaved();
      return;
    }
    setIsCommitting(true);
    try {
      const selectedIds = editedToats.filter((_, index) => selectedToats[index]).map((toat) => toat.id);
      const edits: Record<string, Partial<Pick<SerializedToat, "title" | "tier" | "notes" | "enrichments">>> = {};
      for (const toat of editedToats.filter((_, index) => selectedToats[index])) {
        edits[toat.id] = {
          title: toat.title,
          tier: toat.tier,
          notes: toat.notes,
          enrichments: toat.enrichments,
        };
      }
      const response = await fetch(`/api/captures/${captureId}/commit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ selectedIds, edits }),
      });
      if (!response.ok) throw new Error(`${response.status}`);
      onSaved();
    } catch (error) {
      console.error("[desktop-capture/commit]", error);
      setErrorMsg("Couldn't add those toats. Try again.");
      setStatus("error");
    } finally {
      setIsCommitting(false);
    }
  }, [captureId, getIdToken, onSaved]);

  const cancelCapture = useCallback(async () => {
    stopAll();
    if (captureId) {
      const token = await getIdToken();
      if (token) {
        fetch(`/api/captures/${captureId}/commit`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ selectedIds: [] }),
        }).catch(() => undefined);
      }
    }
    onClose();
  }, [captureId, getIdToken, onClose, stopAll]);

  const switchMode = useCallback((nextMode: CaptureMode) => {
    stopAll();
    setMode(nextMode);
    setStatus("idle");
    setErrorMsg("");
    setTranscript("");
    setToats([]);
    setSelected([]);
    setCaptureId(null);
    if (nextMode === "voice") {
      autoStartedRef.current = false;
    }
  }, [stopAll]);

  useEffect(() => () => stopAll(), [stopAll]);

  useEffect(() => {
    if (mode !== "voice" || !user || autoStartedRef.current || status !== "idle") return;
    autoStartedRef.current = true;
    void startCapture();
  }, [mode, startCapture, status, user]);

  if (isReview) {
    return (
      <div className="desktop-capture-overlay" role="presentation" onMouseDown={() => void cancelCapture()}>
        <section
          className="desktop-capture-modal review-mode"
          role="dialog"
          aria-modal="true"
          aria-labelledby="desktop-capture-review-title"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <button type="button" className="desktop-capture-close review-close" onClick={() => void cancelCapture()} aria-label="Close capture">
            ×
          </button>
          <h2 id="desktop-capture-review-title" className="desktop-capture-sr-title">Review captured toats</h2>
          <ReviewScreen
            transcript={transcript}
            toats={toats}
            selected={selected}
            onToggle={(index) => setSelected((current) => current.map((value, itemIndex) => (itemIndex === index ? !value : value)))}
            onToggleAll={() => {
              const allSelected = selected.every(Boolean);
              setSelected(selected.map(() => !allSelected));
            }}
            onUpdateToat={(index, updated) => setToats((current) => current.map((toat, itemIndex) => (itemIndex === index ? { ...toat, ...updated } : toat)))}
            onReorder={(from, to) => {
              setToats((current) => {
                const next = [...current];
                const [item] = next.splice(from, 1);
                next.splice(to, 0, item!);
                return next;
              });
              setSelected((current) => {
                const next = [...current];
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
        </section>
      </div>
    );
  }

  return (
    <div className="desktop-capture-overlay" role="presentation" onMouseDown={() => void cancelCapture()}>
      <section
        className={`desktop-capture-modal${isTypeMode ? " type-mode" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="desktop-capture-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="desktop-capture-header">
          <div>
            <h2 id="desktop-capture-title">{isTypeMode ? "Type a Toat" : "Capture"}</h2>
            {isTypeMode ? (
              <>
                <p>Write what Toatre should remember.</p>
                <p>You can include multiple things.</p>
              </>
            ) : (
              <>
                <p>Tell Toatre what&apos;s on your mind.</p>
                <p>You can say multiple things.</p>
              </>
            )}
          </div>
          <button type="button" className="desktop-capture-close" onClick={() => void cancelCapture()} aria-label="Close capture">
            ×
          </button>
        </header>

        {isTypeMode ? (
          <label className="desktop-type-capture-card">
            <span>Text capture</span>
            {status === "error" ? <strong>{errorMsg || "Couldn't capture that note. Try again."}</strong> : null}
            <textarea
              value={typedCapture}
              onChange={(event) => setTypedCapture(event.target.value)}
              placeholder="Dentist tomorrow at 9, team standup at 11, call Mom this afternoon..."
              autoFocus
              disabled={isProcessing}
            />
          </label>
        ) : (
          <>
            <div className="desktop-capture-listening">
              <div className="desktop-capture-status-row">
                {isProcessing ? null : <WaveformIcon />}
                <span>
                  {isListening
                    ? "Listening..."
                    : isProcessing
                      ? "Processing..."
                      : status === "error"
                        ? errorMsg || "Couldn't start the mic. Try again."
                        : "Starting..."}
                </span>
              </div>

              <div className="desktop-capture-visual-wrap">
                <SideWaveform side="left" />
                <div className="desktop-capture-visualizer">
                  <span className="desktop-capture-ring one" />
                  <span className="desktop-capture-ring two" />
                  <span className="desktop-capture-ring three" />
                  <div className="desktop-capture-core">
                    <VisualizerBars barHeights={barHeights} />
                  </div>
                </div>
                <SideWaveform side="right" />
              </div>

              <div className="desktop-capture-timer">{formattedElapsed}</div>
            </div>
          </>
        )}

        <div className="desktop-privacy-pill">
          <LockIcon />
          <span>On-device transcription</span>
        </div>

        <article className="desktop-capture-tip">
          <span><BulbIcon /></span>
          <div>
            <strong>Tip: You can say multiple things.</strong>
            <p>I&apos;ll organize them for you.</p>
          </div>
        </article>

        <footer className="desktop-capture-actions">
          <button type="button" className="desktop-capture-secondary" onClick={() => void cancelCapture()}>Cancel</button>
          {isTypeMode ? (
            <button
              type="button"
              className="desktop-capture-primary-wide"
              onClick={() => void submitTextCapture()}
              disabled={!typedCapture.trim() || isProcessing}
            >
              {isProcessing ? "Capturing..." : "Capture text"}
            </button>
          ) : (
            <button
              type="button"
              className="desktop-capture-live-mic"
              onClick={isListening ? stopCapture : startCapture}
              disabled={isProcessing}
              aria-label={isListening ? "Stop recording" : "Start recording"}
            >
              {isListening ? <StopIcon size={34} /> : <MicIcon size={34} />}
            </button>
          )}
          <button
            type="button"
            className="desktop-capture-secondary with-icon"
            onClick={() => switchMode(isTypeMode ? "voice" : "type")}
            disabled={isProcessing}
            aria-label={isTypeMode ? "Switch to voice capture" : "Switch to typed capture"}
          >
            {isTypeMode ? <MicIcon size={18} /> : <KeyboardIcon size={18} />}
            {isTypeMode ? "Speak instead" : "Type instead"}
          </button>
        </footer>
      </section>
    </div>
  );
}