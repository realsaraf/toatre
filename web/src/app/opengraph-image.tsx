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
          justifyContent: "center",
          padding: "42px",
          background:
            "radial-gradient(circle at top left, rgba(255,226,186,0.55), transparent 34%), radial-gradient(circle at bottom right, rgba(224,214,255,0.42), transparent 36%), linear-gradient(135deg, #fffdf8 0%, #fff8ef 52%, #fff3e4 100%)",
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
            borderRadius: 34,
            border: "1px solid rgba(216,194,166,0.62)",
            background: "rgba(255,252,247,0.90)",
            boxShadow: "0 26px 80px rgba(190,119,22,0.12)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "30px 34px",
              borderBottom: "1px solid rgba(231,222,208,0.82)",
              background: "linear-gradient(180deg, rgba(255,253,249,0.92) 0%, rgba(255,250,243,0.78) 100%)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <img
                src={iconSrc}
                alt="toatre app icon"
                width={68}
                height={68}
                style={{ borderRadius: 18 }}
              />
              <div
                style={{
                  fontSize: 46,
                  fontWeight: 800,
                  color: "#BE7716",
                  letterSpacing: -1,
                }}
              >
                toatre
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "14px 26px",
                borderRadius: 999,
                border: "2px solid #BE7716",
                color: "#BE7716",
                background: "rgba(255,255,255,0.76)",
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              Get the app
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              padding: "38px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
                borderRadius: 32,
                border: "1px solid rgba(231,222,208,0.92)",
                background: "rgba(255,255,255,0.92)",
                padding: "44px 56px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "10px 18px",
                    borderRadius: 999,
                    background: "rgba(190,119,22,0.10)",
                    color: "#BE7716",
                    fontSize: 24,
                    fontWeight: 700,
                  }}
                >
                  Toatre
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "10px 18px",
                    borderRadius: 999,
                    background: "rgba(245,158,11,0.12)",
                    color: "#B45309",
                    fontSize: 24,
                    fontWeight: 700,
                  }}
                >
                  Mic-first timeline
                </div>
              </div>
              <div style={{ fontSize: 82, lineHeight: 1, marginBottom: 18 }}>🎙️</div>
              <div
                style={{
                  maxWidth: 760,
                  fontSize: 72,
                  lineHeight: 1.05,
                  fontWeight: 900,
                  letterSpacing: -2.4,
                  marginBottom: 20,
                }}
              >
                Turn what you say into toats.
              </div>
              <div
                style={{
                  maxWidth: 760,
                  fontSize: 30,
                  lineHeight: 1.35,
                  color: "#5F6B7A",
                }}
              >
                Capture plans, meetings, ideas, and errands in one calm, shareable Toatre flow.
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}