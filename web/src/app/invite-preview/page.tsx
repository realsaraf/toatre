"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";

export default function InvitePreviewPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState(user?.email ?? "");
  const [busy, setBusy] = useState(false);
  const [joined, setJoined] = useState(false);
  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleJoin = async () => {
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/access/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await res.json()) as { ok?: boolean; alreadyJoined?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Could not join the waitlist.");
      if (data.alreadyJoined) {
        setAlreadyJoined(true);
      } else {
        setJoined(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ip-root" style={s.root}>
      <style>{`
        @media (max-width: 900px) {
          .ip-root {
            align-items: stretch !important;
            justify-content: flex-start !important;
            padding: 0 !important;
          }
          .ip-wrap { padding: 0 !important; }
          .ip-frame {
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: transparent !important;
            min-height: 100vh !important;
          }
          .ip-line-desktop { display: none !important; }
          .ip-header {
            padding: 14px 16px 8px !important;
            border-bottom: none !important;
          }
          .ip-frame-body { padding: 12px 16px 20px !important; }
          .ip-frame-body { align-items: stretch !important; }
          .ip-shell {
            grid-template-columns: 1fr !important;
            min-height: 0 !important;
            max-width: none !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
          }
          .ip-divider, .ip-illus-desktop { display: none !important; }
          .ip-left { padding: 10px 0 0 !important; }
          .ip-title {
            font-size: 34px !important;
            line-height: 1.04 !important;
            max-width: none !important;
          }
          .ip-body {
            font-size: 14px !important;
            max-width: none !important;
          }
          .ip-input { min-height: 48px !important; }
          .ip-primary, .ip-secondary {
            min-height: 48px !important;
            font-size: 14px !important;
          }
          .ip-illus-mobile { display: flex !important; }
          .ip-backDesktopIcon, .ip-backDesktopText { display: none !important; }
          .ip-backMobileIcon, .ip-backMobileText { display: inline-flex !important; }
          .ip-backButton {
            padding: 8px 10px !important;
            border-radius: 12px !important;
            gap: 6px !important;
          }
          .ip-footer {
            padding: 8px 0 10px !important;
            gap: 8px !important;
          }
          .ip-footerText { font-size: 13px !important; }
        }
        @media (max-width: 700px) {
          .ip-brandText { font-size: 17px !important; }
          .ip-title { font-size: 30px !important; }
        }
      `}</style>

      <div className="ip-wrap" style={s.wrap}>
        <section className="ip-frame" style={s.frame}>
          <svg className="ip-line-desktop" width="168" height="232" viewBox="0 0 168 232" fill="none" style={s.lineLeft}>
            <path d="M164 6C84 38 84 194 164 226" stroke="#E8D5B8" strokeWidth="1.1" />
            <path d="M148 18C80 48 80 184 148 214" stroke="#E8D5B8" strokeWidth="1.1" opacity="0.82" />
            <path d="M132 32C76 60 76 172 132 200" stroke="#E8D5B8" strokeWidth="1.1" opacity="0.64" />
          </svg>
          <svg className="ip-line-desktop" width="168" height="232" viewBox="0 0 168 232" fill="none" style={s.lineRight}>
            <path d="M4 6C84 38 84 194 4 226" stroke="#E8D5B8" strokeWidth="1.1" />
            <path d="M20 18C88 48 88 184 20 214" stroke="#E8D5B8" strokeWidth="1.1" opacity="0.82" />
            <path d="M36 32C92 60 92 172 36 200" stroke="#E8D5B8" strokeWidth="1.1" opacity="0.64" />
          </svg>
          <svg className="ip-line-desktop" width="260" height="126" viewBox="0 0 260 126" fill="none" style={s.lineBottom}>
            <path d="M4 114C60 78 108 82 152 102C197 121 226 103 256 58" stroke="#E8D5B8" strokeWidth="1.1" />
            <path d="M16 124C72 88 114 92 154 108C194 124 224 112 248 72" stroke="#E8D5B8" strokeWidth="1.1" opacity="0.82" />
            <path d="M30 124C84 96 120 100 156 114C192 128 220 120 240 90" stroke="#E8D5B8" strokeWidth="1.1" opacity="0.64" />
          </svg>

          <header className="ip-header" style={s.header}>
            <div style={s.brand}>
              <Image src="/icon.png" alt="Toatre icon" width={34} height={34} style={{ borderRadius: 10 }} />
              <span className="ip-brandText" style={s.brandText}>toatre</span>
            </div>

            <a href="/" className="ip-backButton" style={s.headerButton}>
              <span className="ip-backDesktopIcon" style={s.headerButtonIcon}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9 11L5 7l4-4" stroke="#4B5563" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="ip-backMobileIcon" style={{ ...s.headerButtonIcon, display: "none" }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M2.8 13.2V6.8L8 2.8l5.2 4v6.4h-3.2V9.6H5.9v3.6H2.8Z" stroke="#4B5563" strokeWidth="1.4" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="ip-backDesktopText">Back to home</span>
              <span className="ip-backMobileText" style={{ display: "none" }}>Home</span>
            </a>
          </header>

          <div className="ip-frame-body" style={s.frameBody}>
            <section className="ip-shell" style={s.shell}>
              <div className="ip-left" style={s.leftPanel}>
                <p style={s.eyebrow}>
                  <span style={{ fontSize: 10 }}>&#10022;</span> INVITE-ONLY PREVIEW
                </p>

                <h1 className="ip-title" style={s.title}>Toatre is in<br />invite-only preview</h1>
                <div style={s.titleRule} />

                <p className="ip-body" style={s.body}>Your sign-in was successful, but this account isn&apos;t approved yet.</p>
                <p className="ip-body" style={{ ...s.body, marginBottom: 24 }}>
                  Join the waitlist and we&apos;ll ping you as soon as access opens.
                </p>

                {joined || alreadyJoined ? (
                  <div style={s.successBox}>
                    {alreadyJoined
                      ? "You’re already on the waitlist — we’ll Ping you when access opens."
                      : "You’re on the waitlist! We’ll Ping you as soon as access opens."}
                  </div>
                ) : (
                  <>
                    <label style={s.label} htmlFor="waitlist-email">Email</label>
                    <div style={s.inputWrap}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={s.inputIcon}>
                        <rect x="1" y="3" width="14" height="10" rx="2" stroke="#9CA3AF" strokeWidth="1.4" />
                        <path d="M1.5 4l6.5 5 6.5-5" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round" />
                      </svg>
                      <input
                        id="waitlist-email"
                        className="ip-input"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") void handleJoin(); }}
                        placeholder="you@example.com"
                        style={s.input}
                      />
                    </div>
                    {error ? <p style={s.errorText}>{error}</p> : null}
                    <button
                      type="button"
                      className="ip-primary"
                      onClick={() => void handleJoin()}
                      disabled={busy || !isValidEmail(email)}
                      style={{
                        ...s.primaryBtn,
                        opacity: busy || !isValidEmail(email) ? 0.55 : 1,
                        cursor: busy || !isValidEmail(email) ? "not-allowed" : "pointer",
                      }}
                    >
                      {busy ? "Joining..." : "Join waitlist"}
                    </button>
                  </>
                )}

                {!loading && user ? (
                  <button type="button" className="ip-secondary" onClick={() => void handleSignOut()} style={s.secondaryBtn}>
                    Sign out
                  </button>
                ) : null}
              </div>

              <div className="ip-divider" style={s.divider} />

              <div className="ip-illus-desktop" style={s.rightPanel} aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ ...s.spark, top: 70, right: 96 }}>
                  <path d="M7 0.8L8.4 5.6L13.2 7L8.4 8.4L7 13.2L5.6 8.4L0.8 7L5.6 5.6L7 0.8Z" fill="#F3D8AF" />
                </svg>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ ...s.spark, top: 118, right: 66 }}>
                  <path d="M5 0.6L6 4L9.4 5L6 6L5 9.4L4 6L0.6 5L4 4L5 0.6Z" fill="#F7DFC0" />
                </svg>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ ...s.spark, top: 192, left: 30 }}>
                  <path d="M6 0.7L7.2 4.8L11.3 6L7.2 7.2L6 11.3L4.8 7.2L0.7 6L4.8 4.8L6 0.7Z" fill="#F3D8AF" />
                </svg>

                <div style={s.micWrap}>
                  <Image src="/micicon.png" alt="" width={112} height={112} />
                </div>

                <div style={s.featureCard}>
                  {[
                    {
                      label: "Capture anything",
                      icon: (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="7" stroke="#BE7716" strokeWidth="1.4" />
                          <path d="M5 8l2 2 4-4" stroke="#BE7716" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ),
                    },
                    {
                      label: "Your day, in order",
                      icon: (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="7" stroke="#BE7716" strokeWidth="1.4" />
                          <path d="M8 4.5V8l2.5 2" stroke="#BE7716" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ),
                    },
                    {
                      label: "Share & receive",
                      icon: (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="7" stroke="#BE7716" strokeWidth="1.4" />
                          <circle cx="5.5" cy="8" r="1.2" fill="#BE7716" />
                          <circle cx="8" cy="5.5" r="1.2" fill="#BE7716" />
                          <circle cx="10.5" cy="8" r="1.2" fill="#BE7716" />
                        </svg>
                      ),
                    },
                  ].map((f, index, items) => (
                    <div
                      key={f.label}
                      style={{
                        ...s.featureRow,
                        borderBottom: index === items.length - 1 ? "none" : "1px solid rgba(190,119,22,0.12)",
                        paddingBottom: index === items.length - 1 ? 0 : 14,
                      }}
                    >
                      <span style={s.featureIcon}>{f.icon}</span>
                      <span style={s.featureLabel}>{f.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="ip-illus-mobile" style={s.mobilePanel} aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ ...s.spark, top: 16, left: 28 }}>
                <path d="M6 0.7L7.2 4.8L11.3 6L7.2 7.2L6 11.3L4.8 7.2L0.7 6L4.8 4.8L6 0.7Z" fill="#F3D8AF" />
              </svg>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ ...s.spark, top: 16, right: 28 }}>
                <path d="M6 0.7L7.2 4.8L11.3 6L7.2 7.2L6 11.3L4.8 7.2L0.7 6L4.8 4.8L6 0.7Z" fill="#F3D8AF" />
              </svg>
              <svg width="240" height="88" viewBox="0 0 240 88" fill="none" style={s.mobileLineArt}>
                <path d="M2 62C44 44 78 44 106 58C134 72 164 72 238 18" stroke="#E8D5B8" strokeWidth="1.1" />
                <path d="M8 76C50 56 84 56 110 68C136 80 166 78 232 30" stroke="#E8D5B8" strokeWidth="1.1" opacity="0.8" />
              </svg>
              <div style={s.mobileMicWrap}>
                <Image src="/micicon.png" alt="" width={86} height={86} />
              </div>
            </section>

            <footer className="ip-footer" style={s.footer}>
              <div style={s.footerRuleRow}>
                <span style={s.footerLine} />
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="7.5" stroke="#BE7716" strokeWidth="1.4" />
                  <path d="M9 5.5V9l2.5 2.5" stroke="#BE7716" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={s.footerLine} />
              </div>
              <span className="ip-footerText" style={s.footerText}>Own your slice of time.</span>
            </footer>
          </div>
        </section>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    background:
      "radial-gradient(circle at top center, rgba(255,255,255,0.98) 0%, rgba(255,250,242,0.95) 38%, #FAF5ED 100%)",
  },
  wrap: {
    width: "100%",
    maxWidth: 1080,
    padding: 8,
    boxSizing: "border-box",
  },
  frame: {
    position: "relative",
    width: "100%",
    background: "linear-gradient(180deg, rgba(255,252,247,0.98) 0%, rgba(255,250,244,0.98) 100%)",
    border: "1px solid rgba(223, 206, 182, 0.42)",
    borderRadius: 34,
    overflow: "hidden",
    boxShadow: "0 18px 52px rgba(189, 139, 63, 0.16), 0 2px 8px rgba(76, 55, 24, 0.05)",
  },
  lineLeft: {
    position: "absolute",
    left: -26,
    top: 202,
    pointerEvents: "none",
  },
  lineRight: {
    position: "absolute",
    right: -26,
    top: 202,
    pointerEvents: "none",
  },
  lineBottom: {
    position: "absolute",
    left: 64,
    bottom: -2,
    pointerEvents: "none",
  },
  header: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "28px 44px 18px",
    borderBottom: "1px solid rgba(223, 206, 182, 0.32)",
  },
  brand: {
    display: "inline-flex",
    alignItems: "center",
    gap: 12,
  },
  brandText: {
    fontSize: 19,
    fontWeight: 700,
    letterSpacing: "-0.03em",
    color: "#172033",
  },
  headerButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    borderRadius: 14,
    border: "1px solid rgba(215, 219, 225, 0.95)",
    background: "rgba(255,255,255,0.92)",
    color: "#4B5563",
    fontSize: 13.5,
    fontWeight: 500,
    textDecoration: "none",
    boxShadow: "0 4px 12px rgba(15, 27, 61, 0.04)",
  },
  headerButtonIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  frameBody: {
    position: "relative",
    zIndex: 1,
    padding: "40px 54px 34px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  shell: {
    display: "grid",
    gridTemplateColumns: "1.12fr 1px 0.88fr",
    minHeight: 434,
    width: "100%",
    maxWidth: 768,
    background: "rgba(255,252,247,0.97)",
    border: "1px solid rgba(223, 206, 182, 0.5)",
    borderRadius: 30,
    overflow: "hidden",
    boxShadow: "0 16px 34px rgba(189, 139, 63, 0.12), 0 2px 8px rgba(76, 55, 24, 0.04)",
  },
  leftPanel: {
    padding: "28px 36px 30px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    boxSizing: "border-box",
  },
  divider: {
    width: 1,
    background: "linear-gradient(180deg, rgba(229,214,190,0.15) 0%, rgba(229,214,190,0.65) 14%, rgba(229,214,190,0.65) 86%, rgba(229,214,190,0.15) 100%)",
  },
  eyebrow: {
    margin: "0 0 16px",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.11em",
    color: "#BE7716",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  title: {
    margin: "0 0 14px",
    fontSize: 48,
    fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
    fontWeight: 700,
    lineHeight: 1.02,
    color: "#0F0E1A",
    letterSpacing: "-0.04em",
    maxWidth: 360,
  },
  titleRule: {
    width: 38,
    height: 2,
    borderRadius: 2,
    background: "#BE7716",
    margin: "0 0 24px",
  },
  body: {
    margin: "0 0 14px",
    fontSize: 15,
    lineHeight: 1.55,
    color: "#4B5563",
    maxWidth: 332,
  },
  label: {
    display: "block",
    fontSize: 14,
    fontWeight: 600,
    color: "#374151",
    marginTop: 14,
    marginBottom: 10,
  },
  inputWrap: {
    position: "relative",
    marginBottom: 16,
  },
  inputIcon: {
    position: "absolute",
    left: 16,
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
  },
  input: {
    display: "block",
    width: "100%",
    minHeight: 52,
    padding: "13px 16px 13px 50px",
    fontSize: 14.5,
    color: "#111827",
    background: "rgba(255,255,255,0.96)",
    border: "1.5px solid rgba(210, 214, 220, 0.9)",
    borderRadius: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  primaryBtn: {
    display: "block",
    width: "100%",
    minHeight: 48,
    padding: "12px 20px",
    fontSize: 14.5,
    fontWeight: 700,
    color: "#FFFFFF",
    background: "#0F0E1A",
    border: "none",
    borderRadius: 14,
    marginBottom: 14,
    boxShadow: "0 8px 20px rgba(15, 27, 61, 0.16)",
  },
  secondaryBtn: {
    display: "block",
    width: "100%",
    minHeight: 44,
    padding: "11px 20px",
    fontSize: 14.5,
    fontWeight: 600,
    color: "#374151",
    background: "rgba(255,255,255,0.92)",
    border: "1.5px solid rgba(210, 214, 220, 0.95)",
    borderRadius: 14,
    cursor: "pointer",
  },
  successBox: {
    marginTop: 18,
    marginBottom: 16,
    padding: "16px 18px",
    background: "rgba(190,119,22,0.08)",
    border: "1px solid rgba(190,119,22,0.25)",
    borderRadius: 14,
    fontSize: 14.5,
    color: "#92400E",
    lineHeight: 1.55,
  },
  errorText: {
    margin: "0 0 12px",
    fontSize: 13.5,
    color: "#B91C1C",
  },
  rightPanel: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 24,
    minWidth: 0,
    padding: "42px 28px 24px",
    backgroundImage:
      "linear-gradient(180deg, rgba(255,252,247,0.56) 0%, rgba(255,247,237,0.18) 44%, rgba(255,242,231,0.06) 100%), url('/waitlistskybg.png')",
    backgroundPosition: "center bottom",
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
  },
  spark: {
    position: "absolute",
    pointerEvents: "none",
    opacity: 0.95,
  },
  micWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 138,
    height: 138,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.22) 52%, rgba(255,255,255,0) 68%)",
    boxShadow:
      "0 0 0 10px rgba(237, 194, 128, 0.06), 0 0 0 20px rgba(237, 194, 128, 0.035), 0 0 0 30px rgba(237, 194, 128, 0.02)",
  },
  featureCard: {
    background: "rgba(255,255,255,0.88)",
    backdropFilter: "blur(18px)",
    alignSelf: "center",
    borderRadius: 22,
    boxShadow: "0 14px 28px rgba(214, 170, 103, 0.12)",
    padding: "18px 18px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
    width: "100%",
    maxWidth: 214,
    marginTop: 8,
  },
  featureRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  featureIcon: {
    width: 34,
    height: 34,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(190,119,22,0.10)",
    borderRadius: 10,
    flexShrink: 0,
  },
  featureLabel: {
    fontSize: 12.5,
    fontWeight: 600,
    color: "#1F2937",
  },
  mobilePanel: {
    display: "none",
    position: "relative",
    width: "100%",
    minHeight: 132,
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundImage:
      "linear-gradient(180deg, rgba(255,252,247,0.18) 0%, rgba(255,245,235,0.08) 30%, rgba(255,242,231,0.02) 100%), url('/waitlistskybg.png')",
    backgroundPosition: "center bottom",
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
    overflow: "hidden",
  },
  mobileLineArt: {
    position: "absolute",
    left: "50%",
    bottom: 30,
    transform: "translateX(-50%)",
    pointerEvents: "none",
  },
  mobileMicWrap: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 96,
    height: 96,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,255,255,0.76) 0%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0) 66%)",
  },
  footer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    padding: "18px 0 4px",
    color: "#BE7716",
  },
  footerRuleRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  footerLine: {
    width: 44,
    height: 1,
    background: "rgba(190,119,22,0.36)",
    display: "block",
  },
  footerText: {
    fontSize: 14,
    fontWeight: 500,
    color: "#BE7716",
    fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
  },
};
