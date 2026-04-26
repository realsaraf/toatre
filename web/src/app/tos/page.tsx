import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Toatre",
  description: "The terms and conditions governing your use of the Toatre application and service.",
};

const EFFECTIVE_DATE = "April 25, 2026";
const CONTACT_EMAIL = "legal@toatre.com";

export default function TosPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      {/* ── Minimal header ── */}
      <header style={s.header}>
        <Link href="/" style={s.logo}>
          <span style={s.logoGradient}>toatre</span>
        </Link>
        <nav style={s.nav}>
          <Link href="/privacy" style={s.navLink}>Privacy Policy</Link>
          <Link href="/login" style={s.navCta}>Sign in</Link>
        </nav>
      </header>

      <main style={s.main}>
        <div style={s.hero}>
          <p style={s.heroLabel}>Legal</p>
          <h1 style={s.heroTitle}>Terms of Service</h1>
          <p style={s.heroSubtitle}>Effective date: {EFFECTIVE_DATE}</p>
        </div>

        <div style={s.prose}>
          <p style={s.lead}>
            These Terms of Service (&ldquo;Terms&rdquo;) form a legally binding agreement between
            you and Toatre (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) governing your
            access to and use of the Toatre application and the website at{" "}
            <strong>toatre.com</strong> (together, the &ldquo;Service&rdquo;). By creating an
            account or using the Service, you agree to these Terms. If you do not agree, do not use
            the Service.
          </p>

          {/* 1 */}
          <Section title="1. Eligibility">
            <p style={s.p}>
              You must be at least 13 years old to use the Service. By using Toatre, you represent
              and warrant that you meet this requirement. If you are using the Service on behalf of
              an organisation, you represent that you have authority to bind that organisation to
              these Terms.
            </p>
          </Section>

          {/* 2 */}
          <Section title="2. Your Account">
            <ul style={s.ul}>
              <li>You are responsible for maintaining the security of your account credentials and
                for all activity that occurs under your account.</li>
              <li>Your @handle must be unique, must not impersonate another person or entity, and
                must comply with these Terms.</li>
              <li>You must notify us immediately at{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} style={s.link}>{CONTACT_EMAIL}</a> if you
                suspect unauthorised access to your account.</li>
              <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
            </ul>
          </Section>

          {/* 3 */}
          <Section title="3. The Service">
            <p style={s.p}>
              Toatre is a personal timeline assistant that lets you capture spoken or typed input
              and automatically extracts structured timeline items (&ldquo;toats&rdquo;) such as
              tasks, events, meetings, and reminders. The Service is provided for personal,
              non-commercial use unless a separate commercial agreement is in place.
            </p>
            <p style={s.p}>
              We reserve the right to modify, suspend, or discontinue any part of the Service at
              any time, with reasonable notice where practicable. We are not liable to you or any
              third party for any modification, suspension, or discontinuation.
            </p>
          </Section>

          {/* 4 */}
          <Section title="4. Your Content">
            <SubSection title="4.1 Ownership">
              <p style={s.p}>
                You retain full ownership of all audio, text, and structured data you create or
                capture through the Service (&ldquo;Your Content&rdquo;).
              </p>
            </SubSection>
            <SubSection title="4.2 Licence to Toatre">
              <p style={s.p}>
                By using the Service, you grant Toatre a limited, non-exclusive, worldwide,
                royalty-free licence to store, process, and transmit Your Content solely as
                necessary to provide the Service to you. We do not claim ownership of Your Content
                and we do not use it to train AI models or for any purpose beyond operating the
                Service for you.
              </p>
            </SubSection>
            <SubSection title="4.3 Prohibited content">
              <p style={s.p}>You may not use the Service to store or transmit content that:</p>
              <ul style={s.ul}>
                <li>Is unlawful, threatening, abusive, defamatory, or harassing;</li>
                <li>Infringes the intellectual property rights of any third party;</li>
                <li>Contains malware, viruses, or any harmful code;</li>
                <li>Violates the privacy of any third party.</li>
              </ul>
            </SubSection>
          </Section>

          {/* 5 */}
          <Section title="5. Third-Party Services">
            <p style={s.p}>
              The Service integrates with third-party platforms including Google (authentication),
              OpenAI (AI processing), and others listed in our{" "}
              <Link href="/privacy" style={s.link}>Privacy Policy</Link>. Your use of those
              platforms is governed by their respective terms of service. We are not responsible for
              the practices or content of third-party services.
            </p>
            <p style={s.p}>
              When you sign in with Google, you are also bound by{" "}
              <a
                href="https://policies.google.com/terms"
                target="_blank"
                rel="noopener noreferrer"
                style={s.link}
              >
                Google&rsquo;s Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                style={s.link}
              >
                Privacy Policy
              </a>.
            </p>
          </Section>

          {/* 6 */}
          <Section title="6. Acceptable Use">
            <p style={s.p}>You agree not to:</p>
            <ul style={s.ul}>
              <li>Use the Service for any illegal purpose or in violation of any applicable law;</li>
              <li>Attempt to probe, scan, or test the vulnerability of any Toatre system or
                circumvent any security measures;</li>
              <li>Scrape, crawl, or use automated tools to extract data from the Service without
                our written permission;</li>
              <li>Interfere with or disrupt the integrity or performance of the Service;</li>
              <li>Attempt to gain unauthorised access to any part of the Service or its related
                systems;</li>
              <li>Resell, sublicense, or commercialise any part of the Service without a separate
                written agreement.</li>
            </ul>
          </Section>

          {/* 7 */}
          <Section title="7. Intellectual Property">
            <p style={s.p}>
              All intellectual property in the Service — including the Toatre name and logo,
              software, user interface, and original content — is owned by or licensed to Toatre
              and is protected by applicable intellectual property laws. Nothing in these Terms
              grants you a right to use Toatre&rsquo;s trademarks, logos, or other brand elements
              without our prior written consent.
            </p>
          </Section>

          {/* 8 */}
          <Section title="8. Disclaimers">
            <p style={s.p}>
              THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT
              WARRANTY OF ANY KIND. TO THE FULLEST EXTENT PERMITTED BY LAW, TOATRE DISCLAIMS ALL
              WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
              PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p style={s.p}>
              We do not warrant that the Service will be uninterrupted, error-free, or that AI
              extraction will be accurate. Toats generated by the AI are suggestions — you are
              responsible for verifying their accuracy before acting on them.
            </p>
          </Section>

          {/* 9 */}
          <Section title="9. Limitation of Liability">
            <p style={s.p}>
              TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, TOATRE AND ITS OFFICERS,
              EMPLOYEES, AND LICENSORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
              CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF PROFITS, DATA, GOODWILL, OR
              BUSINESS OPPORTUNITIES, ARISING FROM OR RELATED TO THESE TERMS OR THE SERVICE, EVEN
              IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
            <p style={s.p}>
              IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS EXCEED THE GREATER OF
              (A) THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM OR (B) USD $50.
            </p>
          </Section>

          {/* 10 */}
          <Section title="10. Indemnification">
            <p style={s.p}>
              You agree to indemnify and hold harmless Toatre and its officers, employees, and
              agents from any claims, damages, losses, or expenses (including reasonable legal fees)
              arising from your use of the Service, Your Content, or your violation of these Terms.
            </p>
          </Section>

          {/* 11 */}
          <Section title="11. Termination">
            <p style={s.p}>
              You may stop using the Service and delete your account at any time (Settings →
              Account → Delete my account). We may suspend or terminate your access at any time for
              violation of these Terms or for any other reason at our sole discretion, with or
              without notice.
            </p>
            <p style={s.p}>
              Upon termination, your right to use the Service ends immediately. Sections 4.2, 7, 8,
              9, 10, and 13 survive termination.
            </p>
          </Section>

          {/* 12 */}
          <Section title="12. Changes to These Terms">
            <p style={s.p}>
              We may update these Terms at any time. Material changes will be communicated via
              email or an in-app notice at least 7 days before they take effect (where practicable).
              Continued use of the Service after the effective date constitutes acceptance of the
              updated Terms.
            </p>
          </Section>

          {/* 13 */}
          <Section title="13. Governing Law and Disputes">
            <p style={s.p}>
              These Terms are governed by and construed in accordance with the laws of the State of
              Delaware, United States, without regard to conflict-of-law principles. Any dispute
              arising from or relating to these Terms shall first be addressed informally by
              contacting us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} style={s.link}>{CONTACT_EMAIL}</a>. If not
              resolved within 30 days, disputes shall be submitted to binding arbitration under the
              JAMS Streamlined Arbitration Rules, unless you opt out in writing within 30 days of
              first accepting these Terms.
            </p>
          </Section>

          {/* 14 */}
          <Section title="14. Contact Us">
            <address style={s.address}>
              Toatre<br />
              Email:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} style={s.link}>{CONTACT_EMAIL}</a><br />
              Website: <a href="https://toatre.com" style={s.link}>toatre.com</a>
            </address>
          </Section>

          <div style={s.footer}>
            <Link href="/privacy" style={s.footerLink}>Privacy Policy</Link>
            <span style={{ color: "var(--color-text-muted)" }}>·</span>
            <Link href="/" style={s.footerLink}>Back to Toatre</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={s.h2}>{title}</h2>
      {children}
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={s.h3}>{title}</h3>
      {children}
    </div>
  );
}

/* ─── Styles ──────────────────────────────────────────────────────────────── */

const s: Record<string, React.CSSProperties> = {
  header: {
    position: "sticky",
    top: 0,
    zIndex: 30,
    background: "rgba(245,244,255,0.92)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid var(--color-border)",
    padding: "0 24px",
    height: 60,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: { textDecoration: "none" },
  logoGradient: {
    fontSize: 22,
    fontWeight: 800,
    background: "linear-gradient(90deg, var(--color-gradient-start), var(--color-gradient-end))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  nav: { display: "flex", alignItems: "center", gap: 20 },
  navLink: {
    fontSize: 14,
    color: "var(--color-text-secondary)",
    textDecoration: "none",
    fontWeight: 500,
  },
  navCta: {
    fontSize: 14,
    color: "#fff",
    textDecoration: "none",
    fontWeight: 600,
    background: "var(--color-primary)",
    padding: "6px 16px",
    borderRadius: 20,
  },
  main: {
    maxWidth: 760,
    margin: "0 auto",
    padding: "48px 24px 80px",
  },
  hero: {
    marginBottom: 40,
    paddingBottom: 32,
    borderBottom: "1px solid var(--color-border)",
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "var(--color-primary)",
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 40,
    fontWeight: 800,
    color: "var(--color-text)",
    lineHeight: 1.1,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 15,
    color: "var(--color-text-muted)",
  },
  prose: {},
  lead: {
    fontSize: 17,
    lineHeight: 1.75,
    color: "var(--color-text-secondary)",
    marginBottom: 40,
    padding: "20px 24px",
    background: "var(--color-bg-elevated)",
    borderRadius: 14,
    borderLeft: "3px solid var(--color-primary)",
  },
  h2: {
    fontSize: 20,
    fontWeight: 700,
    color: "var(--color-text)",
    marginBottom: 16,
    paddingBottom: 8,
    borderBottom: "1px solid var(--color-border)",
  },
  h3: {
    fontSize: 16,
    fontWeight: 600,
    color: "var(--color-text)",
    marginBottom: 10,
    marginTop: 8,
  },
  p: {
    fontSize: 15,
    lineHeight: 1.75,
    color: "var(--color-text-secondary)",
    marginBottom: 12,
  },
  ul: {
    fontSize: 15,
    lineHeight: 1.8,
    color: "var(--color-text-secondary)",
    paddingLeft: 20,
    marginBottom: 12,
  },
  link: {
    color: "var(--color-primary)",
    textDecoration: "underline",
    textUnderlineOffset: 3,
  },
  address: {
    fontStyle: "normal",
    fontSize: 15,
    lineHeight: 2,
    color: "var(--color-text-secondary)",
    padding: "16px 20px",
    background: "var(--color-bg-elevated)",
    borderRadius: 12,
  },
  footer: {
    display: "flex",
    gap: 16,
    alignItems: "center",
    marginTop: 48,
    paddingTop: 24,
    borderTop: "1px solid var(--color-border)",
    fontSize: 14,
  },
  footerLink: {
    color: "var(--color-text-secondary)",
    textDecoration: "none",
    fontWeight: 500,
  },
};
