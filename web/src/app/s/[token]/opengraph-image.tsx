import { ImageResponse } from "next/og";
import {
  buildShareNotesExcerpt,
  formatShareDateForMetadata,
  getSharedToatPageData,
} from "./_shared-toat";

export const runtime = "nodejs";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

interface OpenGraphImageProps {
  params: Promise<{ token: string }>;
}

export default async function OpenGraphImage({ params }: OpenGraphImageProps) {
  const { token } = await params;
  const sharedToat = await getSharedToatPageData(token);

  if (!sharedToat) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #fffdf8 0%, #fff4e3 100%)",
            color: "#1c1630",
            fontFamily: "sans-serif",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 18,
            }}
          >
            <div style={{ fontSize: 72 }}>🗂️</div>
            <div style={{ fontSize: 56, fontWeight: 800 }}>Shared toat unavailable</div>
            <div style={{ fontSize: 26, color: "#5f4f39" }}>Open Toatre to view the latest share.</div>
          </div>
        </div>
      ),
      size,
    );
  }

  const noteExcerpt =
    buildShareNotesExcerpt(sharedToat.notes, 220) ?? "Open this shared toat in Toatre.";
  const detailChips = [
    formatShareDateForMetadata(sharedToat.startDate, sharedToat.endDate),
    sharedToat.location,
  ].filter(Boolean).slice(0, 2) as string[];
  const title = sharedToat.title.length > 96
    ? `${sharedToat.title.slice(0, 95).trimEnd()}…`
    : sharedToat.title;
  const tierLabel = sharedToat.tier === "urgent"
    ? "Urgent"
    : sharedToat.tier === "important"
      ? "Important"
      : sharedToat.visualLabel;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: "38px",
          background:
            "radial-gradient(circle at top left, rgba(255,226,186,0.58), transparent 34%), radial-gradient(circle at bottom right, rgba(255,212,168,0.50), transparent 36%), linear-gradient(135deg, #fffdf8 0%, #fff6ea 52%, #ffeeda 100%)",
          color: "#1c1630",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            borderRadius: 36,
            border: "1px solid rgba(216,194,166,0.62)",
            background: "rgba(255,252,247,0.94)",
            boxShadow: "0 28px 80px rgba(190,119,22,0.12)",
            overflow: "hidden",
            padding: "34px 38px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 26,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 78,
                  height: 78,
                  borderRadius: 24,
                  background: "rgba(190,119,22,0.12)",
                  fontSize: 42,
                }}
              >
                {sharedToat.visualEmoji}
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#BE7716" }}>Shared from Toatre</div>
                <div style={{ fontSize: 30, fontWeight: 800 }}>{sharedToat.visualLabel}</div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "12px 20px",
                borderRadius: 999,
                background: "rgba(190,119,22,0.10)",
                color: "#A65D00",
                fontSize: 24,
                fontWeight: 800,
              }}
            >
              {tierLabel}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              justifyContent: "space-between",
              borderRadius: 30,
              border: "1px solid rgba(231,222,208,0.92)",
              background: "rgba(255,255,255,0.92)",
              padding: "34px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div
                style={{
                  display: "flex",
                  fontSize: 62,
                  lineHeight: 1.04,
                  fontWeight: 900,
                  letterSpacing: -2.2,
                }}
              >
                {title}
              </div>

              {detailChips.length > 0 && (
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {detailChips.map((chip) => (
                    <div
                      key={chip}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "10px 16px",
                        borderRadius: 999,
                        background: "rgba(28,17,48,0.06)",
                        color: "#433057",
                        fontSize: 22,
                        fontWeight: 700,
                      }}
                    >
                      {chip}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 28,
                  lineHeight: 1.35,
                  color: "#5F6B7A",
                }}
              >
                {noteExcerpt}
              </div>
              <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: "#BE7716" }}>
                Open the shared toat in Toatre
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}