"use client";

import { Suspense } from "react";
import { TopNav } from "@/components/TopNav";
import { ReviewScreen } from "./_components/ReviewScreen";
import { SpinIcon, SpinIconLg, MicIcon, LockIcon } from "./_components/CaptureIcons";
import { useCaptureLogic } from "./_hooks/useCaptureLogic";
import { S } from "./capture.styles";

export default function CapturePage() {
  return (
    <Suspense fallback={<CapturePageFallback />}>
      <CapturePageContent />
    </Suspense>
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
            <p style={S.subtitle}>Loading capture&hellip;</p>
          </div>
          <div style={S.pill}>{"\u2728"} Toatre listens, you live.</div>
        </div>
      </main>
    </div>
  );
}

function CapturePageContent() {
  const {
    status, transcript, elapsed, barHeights, toats, setToats,
    selected, setSelected, errorMsg, manualText, setManualText, isCommitting,
    captureMode, routeIsLocked, isActive, isProcessing, isReview, isTextMode, selectedCount,
    startCapture, stopCapture, goToTimeline, setMode, submitTextCapture, commitCapture, cancelCapture, formatTime,
    WAVEFORM_BARS,
  } = useCaptureLogic();

  if (routeIsLocked) return null;

  if (isReview) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
        <TopNav />
        <main style={{ ...S.main, maxWidth: 1220 }}>
          <ReviewScreen
            transcript={transcript}
            toats={toats}
            selected={selected}
            onToggle={(i) => setSelected((s) => s.map((v, j) => (j === i ? !v : v)))}
            onToggleAll={() => {
              const all = selected.every(Boolean);
              setSelected(selected.map(() => !all));
            }}
            onAddToat={() => {
              const now = new Date().toISOString();
              const newIndex = toats.length;
              setToats((prev) => [
                ...prev,
                {
                  id: `temp-toat-${crypto.randomUUID()}`,
                  tier: "regular",
                  state: "open",
                  title: "New toat",
                  notes: null,
                  enrichments: {},
                  captureId: null,
                  createdAt: now,
                  updatedAt: now,
                },
              ]);
              setSelected((prev) => [...prev, true]);
              return newIndex;
            }}
            onUpdateToat={(i, updated) =>
              setToats((prev) => prev.map((t, j) => (j === i ? { ...t, ...updated } : t)))
            }
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
        <div style={S.header}>
          <div>
            <h1 style={S.title}>Capture</h1>
            <p style={S.subtitle}>
              {isTextMode
                ? isProcessing
                  ? "Turning your note into toats."
                  : status === "error"
                  ? errorMsg || "Something went wrong."
                  : "Type whatever is on your mind. Toatre will split it into toats for you."
                : isActive
                ? "Tap the mic to stop when you're done."
                : isProcessing
                ? "Thinking\u2026"
                : status === "error"
                ? errorMsg || "Something went wrong."
                : "Tap the mic and tell me what's on your mind."}
            </p>
          </div>
          <div style={S.pill}>{"\u2728"} Toatre listens, you live.</div>
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
                {isActive && (
                  <>
                    <span style={S.dot} />
                    <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>Listening&hellip;</span>
                  </>
                )}
                {isProcessing && (
                  <>
                    <SpinIcon />
                    <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>Thinking&hellip;</span>
                  </>
                )}
                {status === "idle" && (
                  <span style={{ color: "var(--color-text-muted)", fontSize: 14 }}>Ready when you are</span>
                )}
                {status === "error" && (
                  <span style={{ color: "#EF4444", fontWeight: 600 }}>
                    {errorMsg || "Couldn't start the mic. Try again."}
                  </span>
                )}
              </div>
              <div style={S.waveRow}>
                <div style={S.barGroup}>
                  {barHeights.slice(0, WAVEFORM_BARS / 2).map((h, i) => (
                    <div
                      key={i}
                      style={{
                        ...S.bar,
                        height: h,
                        background: "linear-gradient(to top, #6366F1, #8B5CF6)",
                        opacity: isActive ? 1 : 0.2,
                      }}
                    />
                  ))}
                </div>
                <button
                  onClick={isActive ? stopCapture : startCapture}
                  disabled={isProcessing}
                  style={{ ...S.micBtn, ...(isActive ? S.micBtnActive : {}) }}
                  aria-label={isActive ? "Stop recording" : "Start recording"}
                >
                  <div
                    style={{
                      ...S.micRing,
                      ...(isActive
                        ? { animation: "pulse-ring 1.8s cubic-bezier(0.4,0,0.6,1) infinite" }
                        : {}),
                    }}
                  />
                  {isProcessing ? <SpinIconLg /> : isActive ? <div style={S.stopSquare} /> : <MicIcon />}
                </button>
                <div style={S.barGroup}>
                  {barHeights.slice(WAVEFORM_BARS / 2).map((h, i) => (
                    <div
                      key={i}
                      style={{
                        ...S.bar,
                        height: h,
                        background: "linear-gradient(to top, #F59E0B, #EC4899)",
                        opacity: isActive ? 1 : 0.2,
                      }}
                    />
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
                <span style={{ fontSize: 16 }}>{"\uD83D\uDCA1"}</span>
                <span>You can say multiple things &mdash; I&apos;ll organise them for you.</span>
              </div>
            )}
          </>
        ) : (
          <div style={S.textCaptureCard}>
            <div style={S.statusRow}>
              {isProcessing && (
                <>
                  <SpinIcon />
                  <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>Capturing your note&hellip;</span>
                </>
              )}
              {!isProcessing && status !== "error" && (
                <span style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
                  Paste a brain dump or type a quick note
                </span>
              )}
              {status === "error" && (
                <span style={{ color: "#EF4444", fontWeight: 600 }}>
                  {errorMsg || "Couldn't capture that note. Try again."}
                </span>
              )}
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
                {isProcessing ? "Capturing\u2026" : "Capture from text"}
              </button>
            </div>
          </div>
        )}

        {(isTextMode || isActive || isProcessing || status === "error") && (
          <div style={{ textAlign: "center", marginTop: 28 }}>
            <button onClick={goToTimeline} style={S.cancelBtn}>
              Cancel
            </button>
          </div>
        )}
      </main>
    </div>
  );
}