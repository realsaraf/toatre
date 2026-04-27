// Root landing page — shown to unauthenticated visitors.
// Authenticated users are redirected to /timeline by proxy.ts.
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Toatre — Say it. Toatre gets it.",
  description:
    "Capture your day using your voice. Toatre turns it into toats and keeps you on track.",
  openGraph: {
    title: "Toatre — Say it. Toatre gets it.",
    description: "Capture your day using your voice. Toatre turns it into toats and keeps you on track.",
    url: "https://toatre.com",
    siteName: "Toatre",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Toatre app preview with the Toatre app icon",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Toatre — Say it. Toatre gets it.",
    description: "Capture your day using your voice. Toatre turns it into toats and keeps you on track.",
    images: ["/opengraph-image"],
  },
};

export default function LandingPage() {
  return (
    <div style={s.root}>

      {/* ─── Nav ──────────────────────────────────────────────────────── */}
      <header style={s.nav}>
        <Link href="/" style={s.logoWrap}>
          <ToatreLogo />
          <span style={s.logoText}>toatre</span>
        </Link>
        <nav style={s.navLinks}>
          <a href="#how" style={s.navLink}>How it works</a>
          <a href="#usecases" style={s.navLink}>Use cases</a>
          <a href="#pricing" style={s.navLink}>Pricing</a>
          <a href="#blog" style={s.navLink}>Blog</a>
        </nav>
        <div style={s.navActions}>
          <Link href="/login" style={s.loginLink}>Log in</Link>
          <Link href="/signup" style={s.signupBtn}>Sign up free</Link>
        </div>
      </header>

      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section style={s.hero}>
        {/* Left column */}
        <div style={s.heroLeft}>
          <div style={s.badge}>
            <SparkleIcon />
            AI-powered. Voice-first.
          </div>

          <h1 style={s.h1}>
            Say it.<br />
            <span>Toatre gets it</span>
            <span style={s.h1Dot}>.</span>
          </h1>

          <p style={s.sub}>
            Capture your day using your voice.<br />
            Toatre turns it into toats and keeps you on track.
          </p>

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
          <p style={s.noCc}>No credit card required.</p>

          {/* Trust logos */}
          <div style={s.trustWrap}>
            <p style={s.trustLabel}>Trusted by people who value their time</p>
            <div style={s.trustLogos}>
              <AppleLogo />
              <GoogleLogo />
              <MicrosoftLogo />
              <NotionLogo />
              <FigmaLogo />
            </div>
          </div>
        </div>

        {/* Right column — phone */}
        <div style={s.heroRight}>
          <PhoneMockup />
        </div>
      </section>

      {/* ─── How it works ─────────────────────────────────────────────── */}
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

      {/* ─── Use cases ────────────────────────────────────────────────── */}
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

      {/* ─── Pricing ──────────────────────────────────────────────────── */}
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

      {/* ─── Final CTA ────────────────────────────────────────────────── */}
      <section style={s.ctaSection}>
        <div style={s.ctaBox}>
          <h2 style={s.ctaTitle}>Ready to simplify your day?</h2>
          <p style={s.ctaSub}>Stop juggling apps. Just talk.</p>
          <Link href="/signup" style={s.ctaPrimaryLarge}>
            Sign up free <ArrowRight />
          </Link>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 12 }}>
            No credit card required.
          </p>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────── */}
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

/* ─── Phone mockup ───────────────────────────────────────────────────────── */

function PhoneMockup() {
  return (
    <div style={pm.wrap}>
      {/* Outer frame */}
      <div style={pm.frame}>
        {/* Status bar */}
        <div style={pm.statusBar}>
          <span style={pm.time}>9:41</span>
          <div style={pm.statusIcons}>
            <SignalIcon />
            <WifiIcon />
            <BatteryIcon />
          </div>
        </div>

        {/* Dynamic island */}
        <div style={pm.island} />

        {/* Mountain scene background */}
        <div style={pm.screen}>
          <MountainScene />

          {/* App chrome */}
          <div style={pm.appBar}>
            <HamburgerIcon />
            <GearIcon />
          </div>

          {/* Prompt text */}
          <p style={pm.promptText}>
            Tap the mic and tell<br />me what&apos;s on your mind.
          </p>

          {/* Mic button with ripples */}
          <div style={pm.micOuter}>
            <div style={pm.ripple3} />
            <div style={pm.ripple2} />
            <div style={pm.ripple1} />
            <div style={pm.micCircle}>
              <MicIconPhone />
            </div>
          </div>
        </div>

        {/* Bottom tab bar */}
        <div style={pm.tabBar}>
          <TabItem icon={<TimelineTabIcon />} label="Timeline" active={false} />
          <TabItem icon={<CaptureTabIcon />} label="Capture" active={true} />
          <TabItem icon={<PeopleTabIcon />} label="People" active={false} />
          <TabItem icon={<SettingsTabIcon />} label="Settings" active={false} />
        </div>
      </div>

      {/* Floating standalone mic circle (from design sprite) */}
      <div style={pm.floatMic}>
        <MicIconPhone />
      </div>

      {/* Reflection glow */}
      <div style={pm.glow} />
    </div>
  );
}

function TabItem({ icon, label, active }: { icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 3, flex: 1, padding: "6px 0" }}>
      <div style={{ color: active ? "#6366F1" : "#9CA3AF", display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, ...(active ? { background: "#EDE9FE", borderRadius: "50%", padding: 2 } : {}) }}>
        {icon}
      </div>
      <span style={{ fontSize: 10, color: active ? "#6366F1" : "#9CA3AF", fontWeight: active ? 700 : 400 }}>{label}</span>
    </div>
  );
}

/* ─── SVG mountain scene ─────────────────────────────────────────────────── */

function MountainScene() {
  return (
    <svg viewBox="0 0 360 420" width="100%" height="100%" style={{ position: "absolute", inset: 0 }} preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8E4FF" />
          <stop offset="45%" stopColor="#F5C8E8" />
          <stop offset="100%" stopColor="#FDEBD5" />
        </linearGradient>
        <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E0D9F5" />
          <stop offset="100%" stopColor="#D4C8EE" />
        </linearGradient>
      </defs>
      {/* Sky */}
      <rect width="360" height="420" fill="url(#sky)" />
      {/* Sun */}
      <circle cx="310" cy="100" r="32" fill="#F5C15D" opacity="0.85" />
      <circle cx="310" cy="100" r="44" fill="#F5C15D" opacity="0.18" />
      {/* Far mountains — lightest */}
      <path d="M0 280 Q60 200 120 230 Q180 200 240 240 Q300 210 360 250 L360 420 L0 420Z" fill="#C4BCE8" opacity="0.55" />
      {/* Mid mountains */}
      <path d="M0 310 Q50 240 100 270 Q160 220 220 265 Q280 230 360 275 L360 420 L0 420Z" fill="#A99EDB" opacity="0.7" />
      {/* Near mountains */}
      <path d="M0 340 Q40 280 90 310 Q150 260 200 300 Q260 260 310 300 Q340 285 360 310 L360 420 L0 420Z" fill="#8B7FCF" opacity="0.85" />
      {/* Foreground — water/lake */}
      <rect x="0" y="350" width="360" height="70" fill="url(#water)" opacity="0.9" />
      {/* Water reflection shimmer */}
      <line x1="0" y1="360" x2="360" y2="360" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      <line x1="30" y1="370" x2="200" y2="370" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      <line x1="80" y1="380" x2="280" y2="380" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
    </svg>
  );
}

/* ─── Inline SVG logos & icons ───────────────────────────────────────────── */

function ToatreLogo() {
  return (
    <svg width={36} height={36} viewBox="0 0 36 36" fill="none" aria-label="Toatre icon">
      <rect width={36} height={36} rx={9} fill="url(#logo-bg)" />
      <defs>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="36" y2="36">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      {/* Clock face with mic handle as the clock body */}
      <circle cx={18} cy={18} r={10} stroke="#fff" strokeWidth={2} fill="none" />
      <path d="M18 13v5l3 3" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {/* Small t notch */}
      <circle cx={18} cy={8} r={2} fill="#fff" opacity={0.7} />
    </svg>
  );
}

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

function MicIconPhone() {
  return (
    <svg width={26} height={26} viewBox="0 0 26 26" fill="none" aria-hidden>
      <rect x={9} y={2} width={8} height={12} rx={4} fill="#fff" />
      <path d="M4 12a9 9 0 0 0 18 0" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
      <line x1={13} y1={21} x2={13} y2={24} stroke="#fff" strokeWidth={2} strokeLinecap="round" />
      <line x1={9} y1={24} x2={17} y2={24} stroke="#fff" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

function SignalIcon() {
  return (
    <svg width={16} height={12} viewBox="0 0 16 12" fill="none" aria-hidden>
      <rect x={0} y={8} width={3} height={4} rx={0.5} fill="#111" />
      <rect x={4.5} y={5} width={3} height={7} rx={0.5} fill="#111" />
      <rect x={9} y={2} width={3} height={10} rx={0.5} fill="#111" />
      <rect x={13.5} y={0} width={2.5} height={12} rx={0.5} fill="#111" opacity="0.3" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg width={16} height={12} viewBox="0 0 16 12" fill="none" aria-hidden>
      <path d="M8 9.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" fill="#111" />
      <path d="M3.5 7a6.5 6.5 0 0 1 9 0" stroke="#111" strokeWidth={1.5} strokeLinecap="round" />
      <path d="M1 4.5a10 10 0 0 1 14 0" stroke="#111" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg width={24} height={12} viewBox="0 0 24 12" fill="none" aria-hidden>
      <rect x={0.5} y={0.5} width={20} height={11} rx={2.5} stroke="#111" strokeWidth={1} />
      <rect x={2} y={2} width={14} height={8} rx={1.5} fill="#111" />
      <path d="M22 4v4a2 2 0 0 0 0-4z" fill="#111" />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg width={18} height={14} viewBox="0 0 18 14" fill="none" aria-hidden>
      <line x1={0} y1={1} x2={18} y2={1} stroke="#374151" strokeWidth={1.8} strokeLinecap="round" />
      <line x1={0} y1={7} x2={12} y2={7} stroke="#374151" strokeWidth={1.8} strokeLinecap="round" />
      <line x1={0} y1={13} x2={18} y2={13} stroke="#374151" strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx={9} cy={9} r={2.5} stroke="#374151" strokeWidth={1.5} />
      <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.1 3.1l1.4 1.4M13.5 13.5l1.4 1.4M14.9 3.1l-1.4 1.4M4.5 13.5l-1.4 1.4" stroke="#374151" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

/* Tab bar icons */
function TimelineTabIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x={1} y={3} width={16} height={2.5} rx={1.25} fill="currentColor" />
      <rect x={1} y={7.75} width={10} height={2.5} rx={1.25} fill="currentColor" />
      <rect x={1} y={12.5} width={13} height={2.5} rx={1.25} fill="currentColor" />
    </svg>
  );
}

function CaptureTabIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x={6} y={1} width={6} height={9} rx={3} fill="currentColor" />
      <path d="M3 8a6 6 0 0 0 12 0" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      <line x1={9} y1={14} x2={9} y2={17} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      <line x1={6} y1={17} x2={12} y2={17} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

function PeopleTabIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx={7} cy={6} r={3} stroke="currentColor" strokeWidth={1.5} />
      <path d="M1 16c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      <circle cx={13} cy={5} r={2} stroke="currentColor" strokeWidth={1.3} />
      <path d="M15 13c1.1.7 2 1.9 2 3" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" />
    </svg>
  );
}

function SettingsTabIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx={9} cy={9} r={2.5} stroke="currentColor" strokeWidth={1.5} />
      <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.1 3.1l1.4 1.4M13.5 13.5l1.4 1.4M14.9 3.1l-1.4 1.4M4.5 13.5l-1.4 1.4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

/* Trust logos — simplified inline SVG recreations */
function AppleLogo() {
  return (
    <svg width={22} height={26} viewBox="0 0 22 26" fill="none" aria-label="Apple" style={{ opacity: 0.55 }}>
      <path d="M18.5 13.5c0-3.5 2.8-5.2 2.9-5.3-1.6-2.3-4-2.6-4.9-2.6-2.1-.2-4 1.2-5.1 1.2-1 0-2.7-1.2-4.4-1.1C4.6 5.8 2 7.4.8 10c-2.5 4.3-.6 10.6 1.7 14.1 1.2 1.7 2.6 3.6 4.4 3.5 1.8-.1 2.4-1.1 4.5-1.1s2.7 1.1 4.5 1 3.1-1.7 4.2-3.4c1.3-1.9 1.9-3.8 1.9-3.9-.1 0-3.5-1.3-3.5-5.2zM15.2 5.4C16.2 4.2 16.9 2.5 16.7.8c-1.6.1-3.6 1.1-4.7 2.3-.9 1.1-1.8 2.7-1.5 4.3 1.6.1 3.3-.9 4.7-2z" fill="#374151" />
    </svg>
  );
}

function GoogleLogo() {
  return (
    <svg width={60} height={22} viewBox="0 0 60 22" fill="none" aria-label="Google" style={{ opacity: 0.55 }}>
      <text x="0" y="17" fontFamily="-apple-system, sans-serif" fontSize="18" fontWeight="500" fill="#374151">Google</text>
    </svg>
  );
}

function MicrosoftLogo() {
  return (
    <svg width={84} height={22} viewBox="0 0 84 22" fill="none" aria-label="Microsoft" style={{ opacity: 0.55 }}>
      <rect x={0} y={1} width={9} height={9} fill="#F25022" />
      <rect x={11} y={1} width={9} height={9} fill="#7FBA00" />
      <rect x={0} y={12} width={9} height={9} fill="#00A4EF" />
      <rect x={11} y={12} width={9} height={9} fill="#FFB900" />
      <text x="24" y="16" fontFamily="-apple-system, sans-serif" fontSize="14" fontWeight="500" fill="#374151">Microsoft</text>
    </svg>
  );
}

function NotionLogo() {
  return (
    <svg width={62} height={22} viewBox="0 0 62 22" fill="none" aria-label="Notion" style={{ opacity: 0.55 }}>
      <rect x={0} y={1} width={16} height={20} rx={3} fill="#fff" stroke="#374151" strokeWidth={1.5} />
      <path d="M4 5h8M4 9h6M4 13h7M4 17h5" stroke="#374151" strokeWidth={1.2} strokeLinecap="round" />
      <text x="20" y="16" fontFamily="-apple-system, sans-serif" fontSize="14" fontWeight="500" fill="#374151">Notion</text>
    </svg>
  );
}

function FigmaLogo() {
  return (
    <svg width={54} height={22} viewBox="0 0 54 22" fill="none" aria-label="Figma" style={{ opacity: 0.55 }}>
      <circle cx={7} cy={7} r={4} fill="#F24E1E" />
      <circle cx={7} cy={15} r={4} fill="#0ACF83" />
      <rect x={3} y={3} width={8} height={8} rx={0} fill="#A259FF" opacity={0} />
      <circle cx={15} cy={11} r={4} fill="#1ABCFE" />
      <path d="M3 3h8a4 4 0 0 1 0 8H3z" fill="#F24E1E" />
      <path d="M3 11h8a4 4 0 0 1 0 8H3z" fill="#0ACF83" />
      <text x="22" y="16" fontFamily="-apple-system, sans-serif" fontSize="14" fontWeight="500" fill="#374151">Figma</text>
    </svg>
  );
}

/* ─── Phone mockup styles ─────────────────────────────────────────────────── */

const pm: Record<string, React.CSSProperties> = {
  wrap: {
    position: "relative",
    display: "flex",
    justifyContent: "center",
    paddingBottom: 0,
  },
  frame: {
    position: "relative",
    width: 290,
    height: 570,
    borderRadius: 44,
    background: "#fff",
    border: "10px solid #1A1A2E",
    boxShadow: "0 30px 80px rgba(99,102,241,0.22), 0 0 0 1px rgba(99,102,241,0.10), inset 0 0 0 1px rgba(255,255,255,0.15)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  statusBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 22px 0",
  },
  time: {
    fontSize: 13,
    fontWeight: 700,
    color: "#111",
    fontVariantNumeric: "tabular-nums",
  },
  statusIcons: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  island: {
    position: "absolute",
    top: 10,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 20,
    width: 100,
    height: 28,
    borderRadius: 14,
    background: "#0D0D1A",
  },
  screen: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  appBar: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    zIndex: 5,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
  },
  promptText: {
    position: "absolute",
    zIndex: 5,
    top: 95,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 14,
    fontWeight: 500,
    color: "#2D2244",
    lineHeight: 1.5,
    padding: "0 32px",
  },
  micOuter: {
    position: "absolute",
    zIndex: 5,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -30%)",
  },
  ripple3: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 130,
    height: 130,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
  },
  ripple2: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 96,
    height: 96,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)",
  },
  ripple1: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.25)",
    backdropFilter: "blur(2px)",
  },
  micCircle: {
    width: 68,
    height: 68,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #7C3AED 0%, #6366F1 45%, #EC4899 80%, #F59E0B 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 32px rgba(99,102,241,0.45), 0 0 0 3px rgba(255,255,255,0.35)",
    position: "relative",
  },
  tabBar: {
    height: 72,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    background: "rgba(255,255,255,0.97)",
    borderTop: "1px solid rgba(0,0,0,0.06)",
    backdropFilter: "blur(10px)",
    flexShrink: 0,
  },
  floatMic: {
    position: "absolute",
    right: -32,
    top: "42%",
    width: 56,
    height: 56,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #7C3AED 0%, #6366F1 45%, #EC4899 80%, #F59E0B 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 28px rgba(99,102,241,0.35)",
  },
  glow: {
    position: "absolute",
    bottom: -30,
    left: "50%",
    transform: "translateX(-50%)",
    width: 260,
    height: 40,
    borderRadius: "50%",
    background: "rgba(99,102,241,0.15)",
    filter: "blur(18px)",
    pointerEvents: "none",
  },
};

/* ─── Page styles ─────────────────────────────────────────────────────────── */

const s: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    background: "#F8F7FF",
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
    padding: "0 48px",
    height: 68,
    background: "rgba(248,247,255,0.90)",
    backdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(99,102,241,0.08)",
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    textDecoration: "none",
  },
  logoText: {
    fontSize: 22,
    fontWeight: 800,
    color: "#111827",
    letterSpacing: "-0.02em",
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
    transition: "color 0.15s",
  },
  navActions: { display: "flex", alignItems: "center", gap: 24 },
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
    padding: "10px 22px",
    borderRadius: 10,
    boxShadow: "0 2px 12px rgba(99,102,241,0.28)",
  },

  /* Hero — two column */
  hero: {
    maxWidth: 1160,
    margin: "0 auto",
    padding: "80px 48px 60px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    alignItems: "center",
    gap: 64,
    minHeight: "calc(100vh - 68px)",
  },
  heroLeft: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  heroRight: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    paddingBottom: 40,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 16px",
    background: "#EDE9FE",
    border: "1px solid rgba(99,102,241,0.22)",
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 600,
    color: "#6366F1",
    marginBottom: 28,
  },
  h1: {
    fontSize: "clamp(44px, 5.5vw, 76px)",
    fontWeight: 800,
    lineHeight: 1.08,
    color: "#111827",
    letterSpacing: "-0.03em",
    marginBottom: 24,
  },
  h1Dot: {
    color: "#EC4899",
    fontWeight: 900,
  },
  sub: {
    fontSize: 19,
    lineHeight: 1.65,
    color: "#6B7280",
    marginBottom: 40,
    maxWidth: 440,
  },
  ctaRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 14,
    flexWrap: "wrap",
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
    boxShadow: "0 4px 24px rgba(99,102,241,0.32)",
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
  noCc: {
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 52,
  },

  /* Trust */
  trustWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  trustLabel: {
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: 500,
  },
  trustLogos: {
    display: "flex",
    alignItems: "center",
    gap: 24,
    flexWrap: "wrap",
  },

  /* Sections */
  section: {
    maxWidth: 1000,
    margin: "0 auto",
    padding: "96px 48px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  sectionAlt: {
    maxWidth: "100%",
    padding: "96px 48px",
    background: "#F0EEFF",
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

  /* Steps */
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
  stepBody: { fontSize: 15, color: "#6B7280", lineHeight: 1.7 },

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
  useCaseTitle: { fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 14 },
  useCaseList: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 },
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
  ctaSection: { padding: "0 48px", display: "flex", justifyContent: "center" },
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
  ctaSub: { fontSize: 18, color: "rgba(255,255,255,0.75)", marginBottom: 32 },
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
    padding: "28px 48px",
    borderTop: "1px solid rgba(0,0,0,0.07)",
    background: "#F8F7FF",
  },
  footerLogo: { display: "flex", alignItems: "center", gap: 8, textDecoration: "none" },
  footerLogoText: { fontSize: 16, fontWeight: 700, color: "#111827" },
  footerLinks: { display: "flex", gap: 24 },
  footerLink: { fontSize: 14, color: "#6B7280", textDecoration: "none" },
  footerCopy: { fontSize: 13, color: "#9CA3AF" },
};
