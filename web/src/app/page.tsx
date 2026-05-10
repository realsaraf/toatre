// Root landing page — shown to unauthenticated visitors.
// Authenticated users are redirected to /timeline by proxy.ts.
import Link from "next/link";
import type { Metadata } from "next";
import { LandingMobileMenu } from "@/components/LandingMobileMenu";
import { mobileLandingCss } from "./_landing/landing.css";
import { s } from "./_landing/landing.styles";
import { ToatreLogo, SparkleIcon, ArrowRight, PlayIcon } from "./_landing/LandingIcons";
import { PhoneMockup } from "./_landing/LandingPhoneMockup";
export const metadata: Metadata = {
  title: "Toatre — Own your slice of time.",
  description:
    "Toatre turns what you say into toats: clear slices of your day you can manage, remember, and share.",
  openGraph: {
    title: "Toatre — Own your slice of time.",
    description: "Toatre turns what you say into toats: clear slices of your day you can manage, remember, and share.",
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
    title: "Toatre — Own your slice of time.",
    description: "Toatre turns what you say into toats: clear slices of your day you can manage, remember, and share.",
    images: ["/opengraph-image"],
  },
};

export default function LandingPage() {
  return (
    <div style={s.root}>
      <style>{mobileLandingCss}</style>
      {/* ─── Nav ──────────────────────────────────────────────────────── */}
      <header className="landing-nav" style={s.nav}>
        <Link href="/" style={s.logoWrap}>
          <ToatreLogo size={34} />
          <span style={s.logoText}>toatre</span>
        </Link>
        <nav className="landing-nav-links" style={s.navLinks}>
          <a href="#how" style={s.navLink}>How it works</a>
          <a href="#usecases" style={s.navLink}>Use cases</a>
          <a href="#pricing" style={s.navLink}>Pricing</a>
          <a href="#blog" style={s.navLink}>Blog</a>
        </nav>
        <div className="landing-nav-actions" style={s.navActions}>
          <Link href="/login" style={s.loginLink}>Log in</Link>
          <Link href="/signup" style={s.signupBtn}>Sign up free</Link>
        </div>
        <LandingMobileMenu />
      </header>

      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section className="landing-hero" style={s.hero}>
        <div style={s.heroScene} aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mountains.png" alt="" style={s.heroSceneImage} />
        </div>

        {/* Left column */}
        <div className="landing-hero-left" style={s.heroLeft}>
          <div style={s.badge}>
            <SparkleIcon />
            Voice-first. Time-owned.
          </div>

          <h1 className="landing-hero-title" style={s.h1}>
            Own your slice<br />
            <span className="landing-title-line">of time<span style={s.h1Dot}>.</span></span>
          </h1>

          <p style={s.sub}>
            Toatre turns what you say into toats:<br />
            clear slices of your day you can manage, remember, and share.
          </p>

          <div className="landing-cta-row landing-desktop-cta" style={s.ctaRow}>
            <Link href="/signup" style={s.ctaPrimary}>
              Sign up for free
              <ArrowRight />
            </Link>
            <a href="#how" style={s.ctaSecondary}>
              <PlayIcon />
              Watch how it works
            </a>
          </div>
          <p className="landing-desktop-cta" style={s.noCc}>No credit card required.</p>
        </div>

        {/* Right column — phone */}
        <div className="landing-hero-right" style={s.heroRight}>
          <PhoneMockup />
        </div>

        <div className="landing-mobile-cta" style={s.mobileCta}>
          <div className="landing-cta-row" style={s.ctaRow}>
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
              title: "Say the slice.",
              body: "Tap the mic and say whatever's on your mind: a meeting, an errand, a deadline, or an idea. Natural language. No forms.",
            },
            {
              num: "02",
              title: "We shape it.",
              body: "Toatre parses your words, extracts each toat, assigns kinds and times, and places every slice on your timeline.",
            },
            {
              num: "03",
              title: "You own it.",
              body: "Smart Pings surface each toat when it matters, so the important slices of your day stay in reach.",
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
        <h2 style={s.sectionTitle}>Every part of life has a slice.</h2>
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
          <h2 style={s.ctaTitle}>Ready to own your slice?</h2>
          <p style={s.ctaSub}>Say it once. Toatre keeps it where it belongs.</p>
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
          <ToatreLogo size={22} />
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

