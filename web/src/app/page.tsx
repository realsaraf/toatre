// Root landing page — shown to unauthenticated visitors.
// Authenticated users are redirected to /timeline by proxy.ts before reaching here.
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Toatre — Say it. Toatre gets it.",
  description:
    "Capture your day using your voice. Toatre turns it into smart toats and keeps you on track.",
};

export default function LandingPage() {
  return (
    <div style={s.root}>
      {/* ─── Nav ─────────────────────────────────────────────────────── */}
      <header style={s.nav}>
        <Link href="/" style={s.logoWrap}>
          <Image src="/icon.png" alt="Toatre icon" width={32} height={32} style={s.logoIcon} />
          <span style={s.logoText}>toatre</span>
        </Link>
        <nav style={s.navLinks}>
          <a href="#how" style={s.navLink}>How it works</a>
          <a href="#usecases" style={s.navLink}>Use cases</a>
          <a href="#pricing" style={s.navLink}>Pricing</a>
        </nav>
        <div style={s.navActions}>
          <Link href="/login" style={s.loginLink}>Log in</Link>
          <Link href="/signup" style={s.signupBtn}>Sign up free</Link>
        </div>
      </header>

      {/* ─── Hero ────────────────────────────────────────────────────── */}
      <section style={s.hero}>
        {/* Radial background rings */}
        <div style={s.ringOuter} aria-hidden />
        <div style={s.ringMid} aria-hidden />
        <div style={s.ringInner} aria-hidden />

        {/* Badge */}
        <div style={s.badge}>
          <SparkleIcon />
          AI-powered. Voice-first.
        </div>

        {/* Headline */}
        <h1 style={s.h1}>
          Say it.<br />
          <span style={s.h1Bold}>Toatre gets it</span>
          <span style={s.h1Dot}>.</span>
        </h1>

        {/* Sub */}
        <p style={s.sub}>
          Capture your day using your voice.<br />
          Toatre turns it into smart toats and keeps you on track.
        </p>

        {/* CTAs */}
        <div style={s.ctaRow}>
          <Link href="/signup" style={s.ctaPrimary}>
            Sign up for free
            <ArrowRight />
          </Link>
          <a href="#how" style={s.ctaSecondary}>
            <PlayIcon />
            Watch how it works
          </a>
        </div>
        <p style={s.trust}>No credit card required.</p>

        {/* Phone mockup */}
        <div style={s.phoneWrap}>
          <div style={s.phone}>
            {/* Dynamic island */}
            <div style={s.dynamicIsland} />
            {/* Screen */}
            <div style={s.screen}>
              <p style={s.screenText}>
                Tap the mic and tell me<br />what&apos;s on your mind.
              </p>
              <div style={s.micBtn}>
                <div style={s.micRing} />
                <MicSvg />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How it works ────────────────────────────────────────────── */}
      <section id="how" style={s.section}>
        <p style={s.sectionLabel}>How it works</p>
        <h2 style={s.sectionTitle}>Three steps. Zero friction.</h2>
        <div style={s.steps}>
          {[
            {
              num: "01",
              title: "You talk.",
              body: "Tap the mic and say whatever's on your mind — a meeting, a task, an errand. Natural language. No forms.",
            },
            {
              num: "02",
              title: "We understand.",
              body: "Toatre's AI parses your words, extracts every item, assigns kinds and times, and organises them into your timeline.",
            },
            {
              num: "03",
              title: "You stay on track.",
              body: "Smart Pings remind you at the right moment. Your timeline surfaces what's Up Next so you never miss a beat.",
            },
          ].map((step) => (
            <div key={step.num} style={s.stepCard}>
              <span style={s.stepNum}>{step.num}</span>
              <h3 style={s.stepTitle}>{step.title}</h3>
              <p style={s.stepBody}>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Use cases ───────────────────────────────────────────────── */}
      <section id="usecases" style={s.sectionAlt}>
        <p style={s.sectionLabel}>Use cases</p>
        <h2 style={s.sectionTitle}>Works for every part of your life.</h2>
        <div style={s.useCaseGrid}>
          {[
            {
              icon: "💼",
              title: "Work",
              items: [
                "\"Standup at 11, then deep work block until 3.\"",
                "\"Email Sarah the proposal before EOD.\"",
                "\"Follow up with the design team next Tuesday.\"",
              ],
            },
            {
              icon: "🏠",
              title: "Family",
              items: [
                "\"Pick up Emma at 4pm from soccer practice.\"",
                "\"Dentist for the kids, Thursday 9am.\"",
                "\"Groceries — milk, eggs, pasta, olive oil.\"",
              ],
            },
            {
              icon: "✦",
              title: "Personal",
              items: [
                "\"Gym at 7am tomorrow, don't let me skip.\"",
                "\"Book Taylor Swift tickets — sale ends Friday.\"",
                "\"Call Dad on Sunday afternoon.\"",
              ],
            },
          ].map((uc) => (
            <div key={uc.title} style={s.useCaseCard}>
              <span style={s.useCaseIcon}>{uc.icon}</span>
              <h3 style={s.useCaseTitle}>{uc.title}</h3>
              <ul style={s.useCaseList}>
                {uc.items.map((item) => (
                  <li key={item} style={s.useCaseItem}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Pricing placeholder ─────────────────────────────────────── */}
      <section id="pricing" style={s.section}>
        <p style={s.sectionLabel}>Pricing</p>
        <h2 style={s.sectionTitle}>Free while in beta.</h2>
        <p style={s.pricingBody}>
          Toatre is completely free during the beta period. Sign up now and lock
          in early-access pricing when we launch paid tiers.
        </p>
        <Link href="/signup" style={{ ...s.ctaPrimary, marginTop: 8 }}>
          Get early access free <ArrowRight />
        </Link>
      </section>

      {/* ─── Final CTA ───────────────────────────────────────────────── */}
      <section style={s.ctaSection}>
        <div style={s.ctaBox}>
          <h2 style={s.ctaTitle}>Ready to simplify your day?</h2>
          <p style={s.ctaSub}>
            Stop juggling apps. Just talk.
          </p>
          <Link href="/signup" style={s.ctaPrimaryLarge}>
            Sign up free <ArrowRight />
          </Link>
          <p style={{ ...s.trust, color: "rgba(255,255,255,0.6)", marginTop: 12 }}>
            No credit card required.
          </p>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────── */}
      <footer style={s.footer}>
        <Link href="/" style={s.footerLogo}>
          <Image src="/icon.png" alt="Toatre" width={22} height={22} style={{ borderRadius: 6 }} />
          <span style={s.footerLogoText}>toatre</span>
        </Link>
        <div style={s.footerLinks}>
          <Link href="/privacy" style={s.footerLink}>Privacy</Link>
          <Link href="/tos" style={s.footerLink}>Terms</Link>
          <a href="mailto:contact@toatre.com" style={s.footerLink}>Contact</a>
        </div>
        <p style={s.footerCopy}>© 2026 Toatre. All rights reserved.</p>
      </footer>
    </div>
  );
}

/* ─── Icons ──────────────────────────────────────────────────────────────── */

function SparkleIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M7 1v2M7 11v2M1 7h2M11 7h2M3 3l1.5 1.5M9.5 9.5l1.5 1.5M11 3l-1.5 1.5M4.5 9.5L3 11" stroke="#6366F1" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden style={{ marginLeft: 4 }}>
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx={10} cy={10} r={9} stroke="#374151" strokeWidth={1.5} />
      <path d="M8 7l6 3-6 3V7z" fill="#374151" />
    </svg>
  );
}

function MicSvg() {
  return (
    <svg width={28} height={28} viewBox="0 0 28 28" fill="none" aria-hidden>
      <defs>
        <linearGradient id="lp-mic" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      <rect x={10} y={2} width={8} height={14} rx={4} fill="url(#lp-mic)" />
      <path d="M5 13a9 9 0 0 0 18 0" stroke="#8B5CF6" strokeWidth={2} strokeLinecap="round" />
      <line x1={14} y1={22} x2={14} y2={26} stroke="#8B5CF6" strokeWidth={2} strokeLinecap="round" />
      <line x1={10} y1={26} x2={18} y2={26} stroke="#8B5CF6" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const s: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    background: "#FAFAFA",
    color: "#111827",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif",
    overflowX: "hidden",
  },

  /* Nav */
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 40px",
    height: 64,
    background: "rgba(250,250,250,0.88)",
    backdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    textDecoration: "none",
  },
  logoIcon: { borderRadius: 8 },
  logoText: {
    fontSize: 20,
    fontWeight: 800,
    background: "linear-gradient(90deg, #6366F1, #F59E0B)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  navLinks: {
    display: "flex",
    gap: 36,
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
  },
  navLink: {
    fontSize: 15,
    color: "#4B5563",
    textDecoration: "none",
    fontWeight: 500,
  },
  navActions: { display: "flex", alignItems: "center", gap: 20 },
  loginLink: {
    fontSize: 15,
    color: "#111827",
    textDecoration: "none",
    fontWeight: 500,
  },
  signupBtn: {
    fontSize: 15,
    color: "#fff",
    textDecoration: "none",
    fontWeight: 600,
    background: "#6366F1",
    padding: "9px 20px",
    borderRadius: 10,
  },

  /* Hero */
  hero: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    paddingTop: 80,
    paddingBottom: 0,
    overflow: "hidden",
  },
  ringOuter: {
    position: "absolute",
    top: "30%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 900,
    height: 900,
    borderRadius: "50%",
    border: "1px solid rgba(99,102,241,0.07)",
    pointerEvents: "none",
  },
  ringMid: {
    position: "absolute",
    top: "30%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 620,
    height: 620,
    borderRadius: "50%",
    border: "1px solid rgba(99,102,241,0.10)",
    pointerEvents: "none",
  },
  ringInner: {
    position: "absolute",
    top: "30%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 380,
    height: 380,
    borderRadius: "50%",
    border: "1px solid rgba(99,102,241,0.13)",
    pointerEvents: "none",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "7px 16px",
    background: "#EDE9FE",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 600,
    color: "#6366F1",
    marginBottom: 32,
    position: "relative",
  },
  h1: {
    fontSize: "clamp(52px, 7vw, 88px)",
    fontWeight: 700,
    lineHeight: 1.1,
    color: "#111827",
    letterSpacing: "-0.03em",
    marginBottom: 24,
    position: "relative",
  },
  h1Bold: {
    fontWeight: 900,
  },
  h1Dot: {
    color: "#EC4899",
    fontWeight: 900,
  },
  sub: {
    fontSize: 20,
    lineHeight: 1.65,
    color: "#6B7280",
    marginBottom: 40,
    maxWidth: 480,
    position: "relative",
  },
  ctaRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
    flexWrap: "wrap",
    justifyContent: "center",
    position: "relative",
  },
  ctaPrimary: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "14px 28px",
    background: "#6366F1",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: 16,
    borderRadius: 12,
    boxShadow: "0 4px 24px rgba(99,102,241,0.30)",
  },
  ctaSecondary: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "14px 20px",
    color: "#374151",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: 16,
  },
  trust: {
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 56,
    position: "relative",
  },

  /* Phone mockup */
  phoneWrap: {
    position: "relative",
    display: "flex",
    justifyContent: "center",
    width: "100%",
    paddingBottom: 0,
    /* Soft glow behind phone */
    filter: "drop-shadow(0 20px 80px rgba(139,92,246,0.18))",
  },
  phone: {
    position: "relative",
    width: 300,
    height: 340,
    borderRadius: "44px 44px 0 0",
    background: "linear-gradient(160deg, #f0eeff 0%, #fce4f6 60%, #fff4e0 100%)",
    border: "8px solid #e2e0f0",
    borderBottom: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingTop: 36,
    gap: 24,
    overflow: "hidden",
  },
  dynamicIsland: {
    position: "absolute",
    top: 12,
    left: "50%",
    transform: "translateX(-50%)",
    width: 100,
    height: 28,
    borderRadius: 16,
    background: "#111",
  },
  screen: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 24,
    marginTop: 16,
  },
  screenText: {
    fontSize: 16,
    fontWeight: 600,
    color: "#1A1128",
    textAlign: "center",
    lineHeight: 1.5,
  },
  micBtn: {
    position: "relative",
    width: 80,
    height: 80,
    borderRadius: "50%",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 20px rgba(139,92,246,0.20)",
  },
  micRing: {
    position: "absolute",
    inset: -4,
    borderRadius: "50%",
    border: "3px solid transparent",
    background:
      "linear-gradient(#fff,#fff) padding-box, linear-gradient(135deg, #6366F1, #F59E0B) border-box",
    pointerEvents: "none",
  },

  /* Sections */
  section: {
    maxWidth: 1000,
    margin: "0 auto",
    padding: "96px 40px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  sectionAlt: {
    maxWidth: "100%",
    margin: 0,
    padding: "96px 40px",
    background: "#F5F4FF",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#6366F1",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: "clamp(28px, 4vw, 44px)",
    fontWeight: 800,
    color: "#111827",
    letterSpacing: "-0.02em",
    marginBottom: 48,
    lineHeight: 1.15,
  },

  /* How it works steps */
  steps: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 24,
    width: "100%",
    maxWidth: 900,
  },
  stepCard: {
    background: "#fff",
    border: "1px solid rgba(99,102,241,0.10)",
    borderRadius: 20,
    padding: "32px 28px",
    textAlign: "left",
    boxShadow: "0 2px 16px rgba(99,102,241,0.05)",
  },
  stepNum: {
    fontSize: 13,
    fontWeight: 800,
    color: "#6366F1",
    letterSpacing: "0.1em",
    display: "block",
    marginBottom: 14,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: "#111827",
    marginBottom: 12,
    letterSpacing: "-0.02em",
  },
  stepBody: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 1.7,
  },

  /* Use cases */
  useCaseGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 20,
    width: "100%",
    maxWidth: 900,
  },
  useCaseCard: {
    background: "#fff",
    border: "1px solid rgba(99,102,241,0.12)",
    borderRadius: 20,
    padding: "28px 24px",
    textAlign: "left",
    boxShadow: "0 2px 12px rgba(99,102,241,0.05)",
  },
  useCaseIcon: { fontSize: 28, display: "block", marginBottom: 12 },
  useCaseTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 14,
  },
  useCaseList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  useCaseItem: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 1.6,
    paddingLeft: 16,
    borderLeft: "2px solid #EDE9FE",
    fontStyle: "italic",
  },

  /* Pricing */
  pricingBody: {
    fontSize: 17,
    color: "#6B7280",
    maxWidth: 480,
    lineHeight: 1.7,
    marginBottom: 32,
    textAlign: "center",
  },

  /* Final CTA */
  ctaSection: {
    padding: "0 40px 0",
    display: "flex",
    justifyContent: "center",
  },
  ctaBox: {
    width: "100%",
    maxWidth: 680,
    background: "linear-gradient(135deg, #6366F1, #7C3AED)",
    borderRadius: 28,
    padding: "64px 48px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    margin: "80px 0",
    boxShadow: "0 24px 80px rgba(99,102,241,0.30)",
  },
  ctaTitle: {
    fontSize: "clamp(28px, 4vw, 40px)",
    fontWeight: 800,
    color: "#fff",
    letterSpacing: "-0.02em",
    marginBottom: 12,
    lineHeight: 1.15,
  },
  ctaSub: {
    fontSize: 18,
    color: "rgba(255,255,255,0.75)",
    marginBottom: 32,
  },
  ctaPrimaryLarge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "16px 36px",
    background: "#fff",
    color: "#6366F1",
    textDecoration: "none",
    fontWeight: 800,
    fontSize: 17,
    borderRadius: 14,
    boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
  },

  /* Footer */
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 16,
    padding: "28px 40px",
    borderTop: "1px solid rgba(0,0,0,0.07)",
    background: "#FAFAFA",
  },
  footerLogo: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    textDecoration: "none",
  },
  footerLogoText: {
    fontSize: 16,
    fontWeight: 700,
    color: "#111827",
  },
  footerLinks: { display: "flex", gap: 24 },
  footerLink: {
    fontSize: 14,
    color: "#6B7280",
    textDecoration: "none",
  },
  footerCopy: {
    fontSize: 13,
    color: "#9CA3AF",
  },
};
