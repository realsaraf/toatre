"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { BookingDashboardShell } from "@/app/_components/booking-dashboard";
import { MobileHelpView } from "./_components/mobile/MobileHelpView";

const helpPageCss = `
  .help-workspace { padding: 12px 34px 34px; display: grid; gap: 20px; }
  .help-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
  .help-card { border: 1px solid #e4e7f0; border-radius: 16px; background: #fff; padding: 22px; box-shadow: 0 12px 30px rgba(20, 25, 58, 0.025); display: grid; gap: 14px; }
  .help-card h2 { margin: 0; font-size: 18px; font-weight: 850; color: #0d1235; }
  .help-card p { margin: 0; color: #66708f; font-size: 14px; line-height: 1.55; }
  .help-card strong { color: #0d1235; font-size: 14px; }
  .help-actions { display: flex; flex-wrap: wrap; gap: 10px; }
  .help-button, .help-secondary-button { min-height: 42px; border-radius: 10px; padding: 0 16px; font: inherit; font-size: 13px; font-weight: 800; cursor: pointer; }
  .help-button { border: 0; background: linear-gradient(135deg, #6942ff, #5428e8); color: #fff; box-shadow: 0 10px 20px rgba(91, 45, 255, 0.18); }
  .help-secondary-button { border: 1px solid #d8deeb; background: #fff; color: #475569; }
  .help-notice { border: 1px solid #d8ceff; background: #f6f2ff; color: #4d2bd0; border-radius: 11px; padding: 12px 14px; font-size: 13px; font-weight: 750; }
  .help-list { margin: 0; padding-left: 18px; display: grid; gap: 8px; color: #52607e; font-size: 14px; line-height: 1.5; }
  @media (max-width: 1180px) { .help-grid { grid-template-columns: 1fr; } }
`;

export default function HelpPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login?next=/help");
  }, [loading, router, user]);

  useEffect(() => {
    const update = () => setViewportWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (!user && !loading) return null;

  const isDesktop = viewportWidth !== null && viewportWidth >= 1100;

  if (!isDesktop) {
    return (
      <MobileHelpView
        user={user}
        notice={notice}
        onCopyEmail={async () => {
          await navigator.clipboard.writeText("help@toatre.com");
          setNotice("Copied help@toatre.com to your clipboard.");
        }}
        onOpenSupportDraft={() => window.location.assign("mailto:help@toatre.com?subject=Toatre%20support")}
        onOpenFeedbackDraft={() => window.location.assign("mailto:help@toatre.com?subject=Toatre%20feedback")}
        onOpenTimeline={() => router.push("/timeline")}
        onOpenInbox={() => router.push("/inbox")}
        onOpenBookings={() => router.push("/bookings")}
        onOpenMenu={() => router.push("/settings")}
        onOpenCapture={() => router.push("/capture")}
      />
    );
  }

  return (
    <BookingDashboardShell
      user={user}
      active="help"
      inboxCount={0}
      bookingCount={0}
      pageTitle="Help & feedback"
      pageSubtitle="Get support and send product feedback without leaving the app"
      onCapture={() => router.push("/capture?mode=text")}
    >
      <style>{helpPageCss}</style>
      <section className="help-workspace">
        {notice ? <div className="help-notice">{notice}</div> : null}
        <div className="help-grid">
          <article className="help-card">
            <h2>Need help fast?</h2>
            <p>Use the support email for bugs, access issues, booking problems, or anything blocking your flow.</p>
            <strong>help@toatre.com</strong>
            <div className="help-actions">
              <button
                type="button"
                className="help-button"
                onClick={async () => {
                  await navigator.clipboard.writeText("help@toatre.com");
                  setNotice("Copied help@toatre.com to your clipboard.");
                }}
              >
                Copy email
              </button>
              <button type="button" className="help-secondary-button" onClick={() => window.location.assign("mailto:help@toatre.com?subject=Toatre%20support")}>Open email draft</button>
            </div>
          </article>

          <article className="help-card">
            <h2>Send feedback</h2>
            <p>Share ideas for the timeline, Inbox, bookings, or the capture flow without leaving the app navigation.</p>
            <ul className="help-list">
              <li>What you were trying to do</li>
              <li>What felt confusing or slow</li>
              <li>What you expected to happen instead</li>
            </ul>
            <div className="help-actions">
              <button type="button" className="help-button" onClick={() => window.location.assign("mailto:help@toatre.com?subject=Toatre%20feedback")}>Send feedback</button>
            </div>
          </article>

          <article className="help-card">
            <h2>What we can help with</h2>
            <ul className="help-list">
              <li>Booking requests not showing up in Inbox</li>
              <li>Shared toats from connections</li>
              <li>Calendar sync and Ping behavior</li>
              <li>Handle, booking page, and account settings</li>
            </ul>
            <div className="help-actions">
              <button type="button" className="help-secondary-button" onClick={() => router.push("/settings")}>Open Settings</button>
              <button type="button" className="help-secondary-button" onClick={() => router.push("/inbox")}>Open Inbox</button>
            </div>
          </article>
        </div>
      </section>
    </BookingDashboardShell>
  );
}
