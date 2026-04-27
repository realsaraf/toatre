import { readFile } from "node:fs/promises";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function OpenGraphImage() {
  const iconBuffer = await readFile(new URL("../../public/icon.png", import.meta.url));
  const iconSrc = `data:image/png;base64,${iconBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "72px 84px",
          background:
            "radial-gradient(circle at top left, rgba(244,114,182,0.30), transparent 32%), radial-gradient(circle at bottom right, rgba(59,130,246,0.24), transparent 38%), linear-gradient(135deg, #faf7ff 0%, #f7f4ff 48%, #eef3ff 100%)",
          color: "#0f172a",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: 660,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 28,
              fontSize: 28,
              fontWeight: 700,
              color: "#5b3df5",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "10px 18px",
                borderRadius: 999,
                background: "rgba(91,61,245,0.10)",
              }}
            >
              Toatre
            </span>
            <span style={{ color: "#64748b", fontSize: 24 }}>mic-first personal timeline</span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <div style={{ fontSize: 74, lineHeight: 1.02, fontWeight: 800, letterSpacing: -2.6 }}>
              Say it. Toatre gets it.
            </div>
            <div style={{ fontSize: 32, lineHeight: 1.3, color: "#334155" }}>
              Capture your day with your voice, turn it into toats, and keep your timeline moving.
            </div>
          </div>
        </div>

        <div
          style={{
            width: 280,
            height: 280,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 72,
            background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,247,255,0.92))",
            boxShadow: "0 40px 90px rgba(91,61,245,0.18)",
          }}
        >
          <img
            src={iconSrc}
            alt="Toatre app icon"
            width={188}
            height={188}
            style={{ borderRadius: 42 }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}