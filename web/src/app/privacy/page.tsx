import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Toatre",
  description:
    "How Toatre collects, uses, and protects your personal data, including data obtained via Google Sign-In.",
};

const EFFECTIVE_DATE = "April 25, 2026";
const CONTACT_EMAIL = "privacy@toatre.com";

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      {/* ── Minimal header (no auth required) ── */}
      <header style={s.header}>
        <Link href="/" style={s.logo}>
          <span style={s.logoGradient}>toatre</span>
        </Link>
        <nav style={s.nav}>
          <Link href="/tos" style={s.navLink}>Terms of Service</Link>
          <Link href="/login" style={s.navCta}>Sign in</Link>
        </nav>
      </header>

      <main style={s.main}>
        <div style={s.hero}>
          <p style={s.heroLabel}>Legal</p>
          <h1 style={s.heroTitle}>Privacy Policy</h1>
          <p style={s.heroSubtitle}>Effective date: {EFFECTIVE_DATE}</p>
        </div>

        <div style={s.prose}>

          <p style={s.lead}>
            Toatre (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) operates the Toatre
            application and the website at <strong>toatre.com</strong> (collectively, the
            &ldquo;Service&rdquo;). This Privacy Policy explains what information we collect, why we
            collect it, how we use and protect it, and your rights over it — including our use of
            data obtained through Google Sign-In and other Google APIs.
          </p>

          {/* 1 */}
          <Section title="1. Information We Collect">
            <SubSection title="1.1 Information you provide directly">
              <ul style={s.ul}>
                <li><strong>Account information</strong> — your chosen @handle when you sign up.</li>
                <li><strong>Voice captures</strong> — audio recordings you make inside the app, which
                  are sent to our servers for transcription and extraction.</li>
                <li><strong>Text input</strong> — text you type as an alternative to voice.</li>
                <li><strong>Toats</strong> — the structured timeline items (tasks, events, meetings,
                  etc.) created from your captures.</li>
              </ul>
            </SubSection>

            <SubSection title="1.2 Information received from Google Sign-In">
              <p style={s.p}>
                When you authenticate with Google, we receive the following data from
                Google&rsquo;s OAuth 2.0 service:
              </p>
              <ul style={s.ul}>
                <li><strong>Email address</strong> — used as your primary account identifier and to
                  send transactional messages (e.g., magic-link sign-in emails).</li>
                <li><strong>Display name</strong> — shown in your profile and used to personalise
                  the experience.</li>
                <li><strong>Profile photo URL</strong> — displayed as your avatar inside the app.</li>
                <li><strong>Google User ID (sub)</strong> — used internally to uniquely identify
                  your account and prevent duplicate registrations.</li>
              </ul>
              <p style={s.p}>
                We request only the <code>openid</code>, <code>email</code>, and{" "}
                <code>profile</code> scopes. We do not request access to your Google Drive,
                Gmail, Calendar, Contacts, or any other Google product data.
              </p>
            </SubSection>

            <SubSection title="1.3 Information collected automatically">
              <ul style={s.ul}>
                <li><strong>Session data</strong> — a secure session cookie (<code>toatre_session</code>)
                  stored as an httpOnly, Secure cookie with a 14-day expiry.</li>
                <li><strong>Usage analytics</strong> — anonymised product events (e.g., &ldquo;capture
                  started&rdquo;, &ldquo;toat created&rdquo;) collected via PostHog with IP addresses
                  masked. No advertising profiles are built.</li>
                <li><strong>Error diagnostics</strong> — crash reports collected via Sentry, which
                  may include device type, OS version, and a stack trace. No user content is
                  included in crash reports.</li>
                <li><strong>Server logs</strong> — standard request logs (IP address, user-agent,
                  HTTP status) retained for 30 days for security and debugging.</li>
              </ul>
            </SubSection>
          </Section>

          {/* 2 */}
          <Section title="2. How We Use Your Information">
            <p style={s.p}>We use the information collected solely for the following purposes:</p>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Data</th>
                  <th style={s.th}>Purpose</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Email address", "Account creation, sign-in authentication, transactional emails (e.g., magic links, Ping notifications)"],
                  ["Display name & photo", "Personalising your in-app experience; shown only to you"],
                  ["Google User ID", "Linking your Google account to your Toatre account; preventing duplicate accounts"],
                  ["Voice audio", "Transcribed server-side via OpenAI Whisper to produce a text transcript; audio is deleted from our servers within 60 seconds of transcription"],
                  ["Transcript & toats", "Processed by an AI model to extract structured timeline items; stored in your personal account for retrieval"],
                  ["Analytics events", "Understanding feature usage to improve the product; no advertising use"],
                  ["Error reports", "Diagnosing and fixing bugs; improving reliability"],
                ].map(([d, p]) => (
                  <tr key={d}>
                    <td style={s.td}><strong>{d}</strong></td>
                    <td style={s.td}>{p}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={s.p}>
              We do <strong>not</strong> use Google user data to train AI or machine-learning models,
              to build advertising profiles, or to target you with third-party advertising.
            </p>
          </Section>

          {/* 3 */}
          <Section title="3. How We Share Your Information">
            <p style={s.p}>
              We do not sell, rent, or trade your personal data. We share data only with the
              following categories of sub-processors, strictly to operate the Service:
            </p>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Sub-processor</th>
                  <th style={s.th}>Role</th>
                  <th style={s.th}>Data shared</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Google Firebase (Firebase Auth)", "Authentication provider", "Email, display name, Google User ID"],
                  ["MongoDB Atlas (AWS eu-west-1)", "Primary database", "All account and toat data — stored encrypted at rest"],
                  ["DigitalOcean App Platform", "Web and API hosting", "Request logs; no persistent user data stored on compute instances"],
                  ["OpenAI", "Speech-to-text and AI extraction", "Raw audio (Whisper) and transcript text (GPT). Data is not used to train OpenAI models under our enterprise agreement"],
                  ["Sentry", "Error monitoring", "Crash reports — no user-generated content included"],
                  ["PostHog", "Product analytics", "Anonymised usage events — IP is masked before storage"],
                  ["Resend", "Transactional email", "Your email address and email content (e.g., magic-link emails)"],
                  ["Twilio", "SMS Pings (optional)", "Your phone number if you opt into SMS notifications"],
                ].map(([sp, role, data]) => (
                  <tr key={sp}>
                    <td style={s.td}><strong>{sp}</strong></td>
                    <td style={s.td}>{role}</td>
                    <td style={s.td}>{data}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={s.p}>
              We may disclose information if required by law, court order, or to protect the rights,
              property, or safety of Toatre, our users, or the public.
            </p>
          </Section>

          {/* 4 */}
          <Section title="4. Data Storage and Protection">
            <ul style={s.ul}>
              <li>All data in transit is encrypted using TLS 1.2 or higher.</li>
              <li>All data at rest in MongoDB Atlas is encrypted using AES-256.</li>
              <li>Session cookies are flagged <code>httpOnly</code>, <code>Secure</code>, and{" "}
                <code>SameSite=Lax</code>, making them inaccessible to JavaScript and protected
                against CSRF.</li>
              <li>Firebase Auth tokens are short-lived (1 hour) and exchanged for a server-managed
                session cookie; raw Firebase ID tokens are never stored server-side.</li>
              <li>Voice audio is processed in memory and purged from temporary storage within 60
                seconds of transcription completion; it is never written to persistent storage.</li>
              <li>Access to production systems is restricted to authorised personnel using
                multi-factor authentication and least-privilege IAM roles.</li>
              <li>We perform regular dependency audits and follow the OWASP Top 10 guidance for
                our web application.</li>
            </ul>
          </Section>

          {/* 5 */}
          <Section title="5. Data Retention and Deletion">
            <SubSection title="5.1 Retention periods">
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Data type</th>
                    <th style={s.th}>Retention period</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Account profile (email, name, handle)", "Until account deletion"],
                    ["Toats and captures", "Until deleted by you or account deletion"],
                    ["Voice audio", "Maximum 60 seconds after transcription; then purged"],
                    ["Session cookies", "14 days from last sign-in, or until sign-out"],
                    ["Server request logs", "30 days"],
                    ["Anonymised analytics events", "Up to 24 months"],
                    ["Error/crash reports", "90 days"],
                  ].map(([d, r]) => (
                    <tr key={d}>
                      <td style={s.td}><strong>{d}</strong></td>
                      <td style={s.td}>{r}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SubSection>

            <SubSection title="5.2 How to delete your data">
              <p style={s.p}>
                You can delete your Toatre account and all associated personal data at any time:
              </p>
              <ol style={s.ol}>
                <li>Open the Toatre app → Settings → Account.</li>
                <li>Tap <strong>&ldquo;Delete my account&rdquo;</strong> and confirm.</li>
              </ol>
              <p style={s.p}>
                Upon deletion, your account record, toats, captures, and handle are permanently
                removed from our database within <strong>30 days</strong>. Anonymised analytics
                events (which contain no personal identifiers) may persist for up to 24 months.
              </p>
              <p style={s.p}>
                You may also email us at{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} style={s.link}>{CONTACT_EMAIL}</a>{" "}
                to request deletion and we will process your request within 30 days.
              </p>
            </SubSection>
          </Section>

          {/* 6 */}
          <Section title="6. Google API Services User Data Policy">
            <p style={s.p}>
              Toatre&rsquo;s use of information received from Google APIs adheres to the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                style={s.link}
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
            <p style={s.p}>
              Specifically, data received from Google APIs:
            </p>
            <ul style={s.ul}>
              <li>Is used only to provide and improve the Toatre application for the authenticated user.</li>
              <li>Is not transferred to third parties except as necessary to provide the Service,
                subject to confidentiality obligations.</li>
              <li>Is not used for serving advertisements or building advertising profiles.</li>
              <li>Is not used to train generative AI or machine-learning models.</li>
              <li>Is not sold or made available to data brokers.</li>
            </ul>
          </Section>

          {/* 7 */}
          <Section title="7. Your Rights">
            <p style={s.p}>
              Depending on your jurisdiction, you may have the following rights:
            </p>
            <ul style={s.ul}>
              <li><strong>Access</strong> — request a copy of the personal data we hold about you.</li>
              <li><strong>Rectification</strong> — request correction of inaccurate data.</li>
              <li><strong>Erasure</strong> — request deletion of your data (see §5.2 above).</li>
              <li><strong>Portability</strong> — request your toats and captures in a machine-readable format.</li>
              <li><strong>Objection</strong> — object to certain processing activities.</li>
              <li><strong>Withdrawal of consent</strong> — revoke Google account access at any time via
                your{" "}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={s.link}
                >
                  Google Account permissions page
                </a>. This will not delete your Toatre account or data, but will prevent future
                Google Sign-In until re-authorised.
              </li>
            </ul>
            <p style={s.p}>
              To exercise any of these rights, email{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} style={s.link}>{CONTACT_EMAIL}</a>.
            </p>
          </Section>

          {/* 8 */}
          <Section title="8. Children's Privacy">
            <p style={s.p}>
              The Service is not directed to individuals under 13 years of age. We do not knowingly
              collect personal data from children under 13. If you believe we have inadvertently
              collected such data, please contact us immediately at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} style={s.link}>{CONTACT_EMAIL}</a>.
            </p>
          </Section>

          {/* 9 */}
          <Section title="9. Changes to This Policy">
            <p style={s.p}>
              We may update this Privacy Policy periodically. When we make material changes, we
              will update the effective date above and, where required by law, notify you via email
              or an in-app notice. Your continued use of the Service after the effective date
              constitutes acceptance of the updated policy.
            </p>
          </Section>

          {/* 10 */}
          <Section title="10. Contact Us">
            <p style={s.p}>
              For privacy questions, data requests, or concerns, please contact:
            </p>
            <address style={s.address}>
              Toatre<br />
              Email:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} style={s.link}>{CONTACT_EMAIL}</a><br />
              Website: <a href="https://toatre.com" style={s.link}>toatre.com</a>
            </address>
          </Section>

          <div style={s.footer}>
            <Link href="/tos" style={s.footerLink}>Terms of Service</Link>
            <span style={{ color: "var(--color-text-muted)" }}>·</span>
            <Link href="/" style={s.footerLink}>Back to Toatre</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

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

/* ─── Styles ────────────────────────────────────────────────────────────────── */

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
  ol: {
    fontSize: 15,
    lineHeight: 1.8,
    color: "var(--color-text-secondary)",
    paddingLeft: 20,
    marginBottom: 12,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
    marginBottom: 16,
    borderRadius: 10,
    overflow: "hidden",
    border: "1px solid var(--color-border)",
  },
  th: {
    background: "var(--color-bg-elevated)",
    padding: "10px 14px",
    textAlign: "left",
    fontWeight: 700,
    color: "var(--color-text)",
    fontSize: 13,
    borderBottom: "1px solid var(--color-border)",
  },
  td: {
    padding: "10px 14px",
    borderBottom: "1px solid var(--color-border)",
    color: "var(--color-text-secondary)",
    verticalAlign: "top",
    lineHeight: 1.6,
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
