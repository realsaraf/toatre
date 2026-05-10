"use client";

import { MobileAppShell, MobilePageIntro } from "@/app/_components/mobile-app-shell";

const styles = {
  stack: {
    display: "grid",
    gap: 18,
  },
  notice: {
    borderRadius: 18,
    padding: "12px 14px",
    border: "1px solid rgba(124,58,237,0.14)",
    background: "rgba(124,58,237,0.08)",
    color: "#5b21b6",
    fontSize: 14,
    fontWeight: 600,
  },
  card: {
    borderRadius: 28,
    padding: 22,
    background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.86))",
    border: "1px solid rgba(255,255,255,0.92)",
    boxShadow: "0 28px 80px rgba(31,41,55,0.08)",
    display: "grid",
    gap: 14,
  },
  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 800,
    color: "#0f1b4c",
  },
  body: {
    margin: 0,
    fontSize: 15,
    lineHeight: 1.55,
    color: "#6b7280",
  },
  list: {
    margin: 0,
    paddingLeft: 18,
    display: "grid",
    gap: 8,
    color: "#52607e",
    fontSize: 14,
    lineHeight: 1.5,
  },
  actions: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap" as const,
  },
  primary: {
    minHeight: 48,
    padding: "0 16px",
    borderRadius: 16,
    border: "none",
    background: "linear-gradient(135deg, #5b3df5, #7c3aed)",
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  },
  secondary: {
    minHeight: 48,
    padding: "0 16px",
    borderRadius: 16,
    border: "1px solid rgba(91,61,245,0.14)",
    background: "rgba(255,255,255,0.88)",
    color: "#5b3df5",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  },
} as const;

export function MobileHelpView({
  user,
  notice,
  onCopyEmail,
  onOpenSupportDraft,
  onOpenFeedbackDraft,
  onOpenTimeline,
  onOpenInbox,
  onOpenBookings,
  onOpenMenu,
  onOpenCapture,
}: {
  user: {
    photoURL?: string | null;
    displayName?: string | null;
    email?: string | null;
  } | null | undefined;
  notice: string | null;
  onCopyEmail: () => void;
  onOpenSupportDraft: () => void;
  onOpenFeedbackDraft: () => void;
  onOpenTimeline: () => void;
  onOpenInbox: () => void;
  onOpenBookings: () => void;
  onOpenMenu: () => void;
  onOpenCapture: () => void;
}) {
  return (
    <MobileAppShell
      user={user}
      active="menu"
      inboxCount={0}
      onOpenTimeline={onOpenTimeline}
      onOpenInbox={onOpenInbox}
      onOpenBookings={onOpenBookings}
      onOpenMenu={onOpenMenu}
      onOpenCapture={onOpenCapture}
      header={<MobilePageIntro title="Help & feedback" subtitle="Get support and send product feedback without leaving the app" />}
    >
      <section style={styles.stack}>
        {notice ? <div style={styles.notice}>{notice}</div> : null}

        <article style={styles.card}>
          <h2 style={styles.title}>Need help fast?</h2>
          <p style={styles.body}>Use the support email for bugs, access issues, booking problems, or anything blocking your flow.</p>
          <strong>help@toatre.com</strong>
          <div style={styles.actions}>
            <button type="button" style={styles.primary} onClick={onCopyEmail}>Copy email</button>
            <button type="button" style={styles.secondary} onClick={onOpenSupportDraft}>Open email draft</button>
          </div>
        </article>

        <article style={styles.card}>
          <h2 style={styles.title}>Send feedback</h2>
          <p style={styles.body}>Share ideas for the timeline, Inbox, bookings, or the capture flow without leaving the mobile navigation.</p>
          <ul style={styles.list}>
            <li>What you were trying to do</li>
            <li>What felt confusing or slow</li>
            <li>What you expected to happen instead</li>
          </ul>
          <div style={styles.actions}>
            <button type="button" style={styles.primary} onClick={onOpenFeedbackDraft}>Send feedback</button>
          </div>
        </article>

        <article style={styles.card}>
          <h2 style={styles.title}>What we can help with</h2>
          <ul style={styles.list}>
            <li>Booking requests not showing up in Inbox</li>
            <li>Shared toats from connections</li>
            <li>Calendar sync and Ping behavior</li>
            <li>Handle, booking page, and account settings</li>
          </ul>
        </article>
      </section>
    </MobileAppShell>
  );
}
