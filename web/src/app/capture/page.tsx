"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/TopNav";
import { useAuth } from "@/lib/auth/auth-context";

type CaptureStatus = "idle" | "listening" | "processing" | "review" | "error";

const WAVEFORM_BARS = 20;

type ToatKind = "task" | "event" | "meeting" | "errand" | "deadline" | "idea";
type ToatTier = "urgent" | "important" | "regular";

interface ExtractedToat {
  kind: ToatKind;
  tier: ToatTier;
  title: string;
  datetime: string | null;
  endDatetime: string | null;
  location: string | null;
  link: string | null;
  people: string[];
  notes: string | null;
}

const KIND_META: Record<ToatKind, { emoji: string; color: string; bg: string }> = {
  task:     { emoji: "✓",  color: "#6366F1", bg: "#EDE9FE" },
  event:    { emoji: "🎫", color: "#7C3AED", bg: "#F3E8FF" },
  meeting:  { emoji: "💬", color: "#2563EB", bg: "#DBEAFE" },
  errand:   { emoji: "📍", color: "#D97706", bg: "#FEF3C7" },
  deadline: { emoji: "⚡", color: "#DC2626", bg: "#FEE2E2" },
  idea:     { emoji: "💡", color: "#059669", bg: "#D1FAE5" },
};

export default function CapturePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [status, setStatus] = useState<CaptureStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [barHeights, setBarHeights] = useState<number[]>(Array(WAVEFORM_BARS).fill(8));
  const [toats, setToats] = useState<ExtractedToat[]>([]);
  const [selected, setSelected] = useState<boolean[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => { return () => { stopAll(); }; }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stopAll = () => {
    mediaRecorderRef.current?.stop();
    audioCtxRef.current?.close();
    cancelAnimationFrame(animFrameRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    setBarHeights(Array(WAVEFORM_BARS).fill(8));
  };

  const startWaveform = (stream: MediaStream) => {
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = WAVEFORM_BARS * 4;
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
  };

  const getIdToken = useCallback(async () => (user ? user.getIdToken() : null), [user]);

  const startCapture = async () => {
    setTranscript(""); setElapsed(0); setToats([]); setSelected([]); setErrorMsg("");
    setStatus("listening");
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      startWaveform(stream);
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        cancelAnimationFrame(animFrameRef.current);
        setBarHeights(Array(WAVEFORM_BARS).fill(8));
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
          const extracted: ExtractedToat[] = (data.toats ?? []).map((t: ExtractedToat) => ({ ...t }));
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
    } catch {
      setStatus("error"); setErrorMsg("Mic access denied. Check permissions.");
    }
  };

  const stopCapture = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
    audioCtxRef.current?.close();
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const isActive = status === "listening";
  const isProcessing = status === "processing";
  const isReview = status === "review";
  const selectedCount = selected.filter(Boolean).length;

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
            onAddToTimeline={() => router.push("/timeline")}
            selectedCount={selectedCount}
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
              {isActive ? "Tap the mic to stop when you're done."
                : isProcessing ? "Thinking…"
                : status === "error" ? (errorMsg || "Something went wrong.")
                : "Tap the mic and tell me what's on your mind."}
            </p>
          </div>
          <div style={S.pill}>✨ Toatre listens, you live.</div>
        </div>

        {/* Waveform + mic */}
        <div style={S.waveSection}>
          <div style={S.statusRow}>
            {isActive && <><span style={S.dot} /><span style={{ color: "var(--color-primary)", fontWeight: 600 }}>Listening…</span></>}
            {isProcessing && <><SpinIcon /><span style={{ color: "var(--color-primary)", fontWeight: 600 }}>Thinking…</span></>}
            {status === "idle" && <span style={{ color: "var(--color-text-muted)", fontSize: 14 }}>Ready when you are</span>}
            {status === "error" && <span style={{ color: "#EF4444", fontWeight: 600 }}>Couldn&apos;t hear you. Try again.</span>}
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

        {(isActive || isProcessing || status === "error") && (
          <div style={{ textAlign: "center", marginTop: 28 }}>
            <button onClick={() => { stopAll(); router.back(); }} style={S.cancelBtn}>Cancel</button>
          </div>
        )}
      </main>
    </div>
  );
}

/* ─── Review screen ──────────────────────────────────────────────────────── */

function ReviewScreen({ transcript, toats, selected, onToggle, onToggleAll, onAddToTimeline, selectedCount }: {
  transcript: string; toats: ExtractedToat[]; selected: boolean[];
  onToggle: (i: number) => void; onToggleAll: () => void;
  onAddToTimeline: () => void; selectedCount: number;
}) {
  const allSelected = selected.every(Boolean);
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
          <ReviewToatCard key={i} toat={toat} checked={selected[i]!} onToggle={() => onToggle(i)} />
        ))}
      </div>

      {/* Promo */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px", background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 14, fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 24 }}>
        <span style={{ fontSize: 16 }}>✦</span>
        <p style={{ lineHeight: 1.5, flex: 1, margin: 0 }}>Toatre can set reminders, check traffic, and add location details for you.</p>
        <button style={{ background: "none", border: "none", color: "var(--color-primary)", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" as const }}>Learn more →</button>
      </div>

      {/* Bottom bar */}
      <div style={{ position: "sticky", bottom: 0, background: "var(--color-bg)", paddingBottom: 24, paddingTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <button style={{ background: "none", border: "none", fontSize: 14, fontWeight: 600, color: "var(--color-primary)", cursor: "pointer", whiteSpace: "nowrap" as const, padding: "12px 8px" }}>
          + Add another toat
        </button>
        <button
          onClick={onAddToTimeline}
          disabled={selectedCount === 0}
          style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 2, padding: "12px 28px", background: "linear-gradient(135deg, #8B5CF6, #6366F1)", borderRadius: 16, border: "none", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(99,102,241,0.35)", opacity: selectedCount === 0 ? 0.5 : 1, transition: "opacity 0.2s" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span>✓</span> Add to timeline
          </div>
          <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.8 }}>{selectedCount} toat{selectedCount !== 1 ? "s" : ""} will be added</span>
        </button>
      </div>
    </div>
  );
}

function ReviewToatCard({ toat, checked, onToggle }: { toat: ExtractedToat; checked: boolean; onToggle: () => void }) {
  const meta = KIND_META[toat.kind];
  const dt = toat.datetime ? new Date(toat.datetime) : null;
  const timeStr = dt ? dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) + ", " + dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 16, padding: "14px 16px", opacity: checked ? 1 : 0.55, transition: "opacity 0.2s" }}>
      <button onClick={onToggle} style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid ${checked ? "#6366F1" : "#D1D5DB"}`, background: checked ? "#6366F1" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }} aria-label={checked ? "Deselect" : "Select"}>
        {checked && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
      </button>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 20 }}>{meta.emoji}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text)", marginBottom: 4, margin: 0 }}>{toat.title}</p>
        {timeStr && <p style={{ fontSize: 12, color: meta.color, margin: "4px 0 0" }}>📅 {timeStr}</p>}
        {toat.location && <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "2px 0 0" }}>📍 {toat.location}</p>}
        {toat.link && <p style={{ fontSize: 12, color: "#2563EB", margin: "2px 0 0" }}>🔗 {toat.link.replace(/^https?:\/\//, "").split("/")[0]}</p>}
      </div>
      <button style={{ background: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: 10, padding: "5px 14px", fontSize: 13, color: "#374151", cursor: "pointer", flexShrink: 0 }}>Edit</button>
      <span style={{ fontSize: 16, color: "#D1D5DB", cursor: "grab" }}>⠿</span>
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

function MicIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden>
      <defs>
        <linearGradient id="mic-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8B5CF6" /><stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      <rect x={10} y={2} width={8} height={14} rx={4} fill="url(#mic-g)" />
      <path d="M5 13a9 9 0 0 0 18 0" stroke="#8B5CF6" strokeWidth={2} strokeLinecap="round" />
      <line x1={14} y1={22} x2={14} y2={26} stroke="#8B5CF6" strokeWidth={2} strokeLinecap="round" />
      <line x1={10} y1={26} x2={18} y2={26} stroke="#8B5CF6" strokeWidth={2} strokeLinecap="round" />
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
  waveSection: { display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginBottom: 28 },
  statusRow: { display: "flex", alignItems: "center", gap: 8, fontSize: 14, minHeight: 24 },
  dot: { width: 8, height: 8, borderRadius: "50%", background: "var(--color-primary)", animation: "pulse-ring 1.2s ease-in-out infinite" },
  waveRow: { display: "flex", alignItems: "center", gap: 16, width: "100%", justifyContent: "center" },
  barGroup: { display: "flex", alignItems: "center", gap: 4, height: 64 },
  bar: { width: 4, borderRadius: 3, transition: "height 0.08s ease" },
  micBtn: { position: "relative", width: 110, height: 110, borderRadius: "50%", background: "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, boxShadow: "0 4px 24px rgba(99,102,241,0.18), 0 0 0 3px rgba(99,102,241,0.25)", transition: "transform 0.15s, box-shadow 0.15s" },
  micBtnActive: { boxShadow: "0 4px 24px rgba(99,102,241,0.25), 0 0 0 6px rgba(99,102,241,0.15)", transform: "scale(1.04)" },
  micRing: { position: "absolute", inset: -6, borderRadius: "50%", border: "3px solid transparent", background: "linear-gradient(#fff,#fff) padding-box, linear-gradient(135deg,#6366F1,#F59E0B) border-box", pointerEvents: "none" },
  stopSquare: { width: 26, height: 26, borderRadius: 6, background: "linear-gradient(135deg, #EC4899, #8B5CF6)" },
  timer: { fontSize: 22, fontWeight: 700, color: "var(--color-primary)", letterSpacing: "0.05em", fontVariantNumeric: "tabular-nums" },
  privacy: { display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#9CA3AF", justifyContent: "center", marginBottom: 8 },
  tip: { display: "flex", alignItems: "flex-start", gap: 10, padding: "14px 18px", background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 14, fontSize: 14, color: "var(--color-text-secondary)", marginBottom: 24 },
  cancelBtn: { background: "none", border: "1px solid var(--color-border)", borderRadius: 10, padding: "8px 24px", fontSize: 14, color: "var(--color-text-muted)", cursor: "pointer" },
};
