"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export interface SocialLink {
  type: "x" | "linkedin" | "instagram" | "youtube";
  url: string;
}

export interface HostInfo {
  displayName: string | null;
  handle: string | null;
  photoUrl: string | null;
  socialLinks?: SocialLink[];
}

export interface Slot {
  start: string;
  end: string;
  blocked: boolean;
}

export interface BookingMeta {
  timezone: string;
  greetingMessage: string;
  pageTitle: string;
  metaDescription: string;
  requireReason: boolean;
}

export interface SlotDayGroup {
  key: string;
  slots: Slot[];
}

export const DEFAULT_BOOKING_META: BookingMeta = {
  timezone: "UTC",
  greetingMessage: "",
  pageTitle: "Book time with me.",
  metaDescription: "Pick a time that works. No back-and-forth.",
  requireReason: false,
};

const EMPTY_FORM = {
  name: "",
  email: "",
  discussion: "",
  note: "",
  sendCalendarInvite: true,
};

type BookingForm = typeof EMPTY_FORM;
type BookingField = keyof Omit<BookingForm, "sendCalendarInvite">;

const BENEFITS = [
  { icon: "bolt", title: "Quick & easy booking", body: "Book in seconds." },
  { icon: "shield", title: "Secure & private", body: "Your information is safe." },
] as const;

function initials(name: string | null): string {
  if (!name?.trim()) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function shortName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

function dateFromKey(key: string): Date {
  return new Date(`${key}T00:00:00`);
}

export function dateKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA");
}

export function groupAvailableSlotsByDay(slots: Slot[]): SlotDayGroup[] {
  const map = new Map<string, Slot[]>();
  for (const slot of slots.filter((entry) => !entry.blocked)) {
    const key = dateKey(slot.start);
    map.set(key, [...(map.get(key) ?? []), slot]);
  }

  return Array.from(map.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, grouped]) => ({
      key,
      slots: grouped.sort((left, right) => left.start.localeCompare(right.start)),
    }));
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateChip(key: string) {
  const date = dateFromKey(key);
  return {
    weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
    date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  };
}

function formatAvailableDate(key: string): string {
  return dateFromKey(key).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatModalDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatSuccessDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function BrandMark({ size = 32 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icon.png"
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.26), display: "block" }}
      aria-hidden
    />
  );
}

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
  };

  if (name === "chevron-left") return <svg {...common}><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  if (name === "chevron-right") return <svg {...common}><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  if (name === "calendar") return <svg {...common}><path d="M8 2v4M16 2v4M3.5 9.1h17M5.5 4h13A2.5 2.5 0 0 1 21 6.5v12A2.5 2.5 0 0 1 18.5 21h-13A2.5 2.5 0 0 1 3 18.5v-12A2.5 2.5 0 0 1 5.5 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  if (name === "clock") return <svg {...common}><path d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  if (name === "globe") return <svg {...common}><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3.6 9h16.8M3.6 15h16.8M12 3a14 14 0 0 1 3 9 14 14 0 0 1-3 9 14 14 0 0 1-3-9 14 14 0 0 1 3-9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  if (name === "bolt") return <svg {...common}><path d="m13 2-8 12h7l-1 8 8-12h-7l1-8Z" fill="currentColor" /></svg>;
  if (name === "shield") return <svg {...common}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="m9 12 2 2 4-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  if (name === "link") return <svg {...common}><path d="M10 13a5 5 0 0 0 7.1 0l2.1-2.1a5 5 0 1 0-7.1-7.1L11 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M14 11a5 5 0 0 0-7.1 0l-2.1 2.1a5 5 0 1 0 7.1 7.1L13 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  if (name === "arrow-right") return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  if (name === "x") return <svg {...common}><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  if (name === "check") return <svg {...common}><path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  return null;
}

function SocialIcon({ type }: { type: SocialLink["type"] }) {
  if (type === "x") return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.725-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>;
  if (type === "linkedin") return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6Z" /><path d="M2 9h4v12H2z" /><circle cx="4" cy="4" r="2" /></svg>;
  if (type === "instagram") return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" /><path d="M17.5 6.8h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>;
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M23 7.1a3 3 0 0 0-2.1-2.1C19 4.5 12 4.5 12 4.5s-7 0-8.9.5A3 3 0 0 0 1 7.1 31.3 31.3 0 0 0 .5 12c0 1.7.2 3.3.5 4.9A3 3 0 0 0 3.1 19C5 19.5 12 19.5 12 19.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1c.3-1.6.5-3.2.5-4.9s-.2-3.3-.5-4.9ZM9.8 15.2V8.8l5.7 3.2-5.7 3.2Z" /></svg>;
}

function Avatar({ host, size = 158 }: { host: HostInfo; size?: number }) {
  return (
    <div className="public-avatar-ring" style={{ width: size + 12, height: size + 12 }}>
      {host.photoUrl ? (
        <div className="public-avatar" style={{ width: size, height: size }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={host.photoUrl} alt={host.displayName ?? "Host"} />
        </div>
      ) : (
        <div className="public-avatar public-avatar-fallback" style={{ width: size, height: size }}>
          {initials(host.displayName)}
        </div>
      )}
    </div>
  );
}

function PublicHandleHeader() {
  return (
    <header className="public-header">
      <a href="https://toatre.com" className="public-brand" aria-label="Toatre home">
        <BrandMark />
        <span>toatre</span>
      </a>
    </header>
  );
}

function SocialLinksRow({ links }: { links: SocialLink[] }) {
  if (links.length === 0) return null;

  return (
    <div className="public-social-row" aria-label="Social links">
      {links.map((link) => (
        <a key={`${link.type}-${link.url}`} href={link.url} target="_blank" rel="noreferrer" className="public-social-link" aria-label={link.type}>
          <SocialIcon type={link.type} />
        </a>
      ))}
    </div>
  );
}

function ProfileColumn({ host, handle, greeting, description }: { host: HostInfo; handle: string; greeting: string; description: string }) {
  const hostName = host.displayName ?? handle;
  const profileHandle = host.handle ?? handle;
  const firstName = shortName(hostName);
  const socialLinks = host.socialLinks?.filter((link) => link.url.trim().length > 0) ?? [];

  return (
    <aside className="profile-column">
      <Avatar host={host} />
      <div className="profile-name-row">
        <h1>{hostName}</h1>
        <span className="verified-badge" aria-label="Verified Toatre profile"><Icon name="check" size={14} /></span>
      </div>
      <p className="profile-handle">@{profileHandle}</p>
      <SocialLinksRow links={socialLinks} />
      <div className="headline-block">
        <h2>Book time<br />with <span>{firstName}.</span></h2>
        <p>{greeting || description || DEFAULT_BOOKING_META.metaDescription}</p>
      </div>
      <div className="benefit-list">
        {BENEFITS.map((benefit) => (
          <div className="benefit-item" key={benefit.title}>
            <div className="benefit-icon"><Icon name={benefit.icon} /></div>
            <div><strong>{benefit.title}</strong><p>{benefit.body}</p></div>
          </div>
        ))}
      </div>
    </aside>
  );
}

function DateSelector({ availableDays, activeDay, onSelectDay }: { availableDays: SlotDayGroup[]; activeDay: SlotDayGroup | null; onSelectDay: (key: string) => void }) {
  const activeIndex = Math.max(0, availableDays.findIndex((day) => day.key === activeDay?.key));
  const [windowStart, setWindowStart] = useState(() => Math.max(0, activeIndex - 1));
  const windowSize = 5;
  const maxStart = Math.max(0, availableDays.length - windowSize);
  const visibleDays = availableDays.slice(windowStart, windowStart + windowSize);

  useEffect(() => {
    queueMicrotask(() => {
      if (activeIndex < windowStart) {
        setWindowStart(activeIndex);
      } else if (activeIndex >= windowStart + windowSize) {
        setWindowStart(Math.min(maxStart, Math.max(0, activeIndex - windowSize + 1)));
      }
    });
  }, [activeIndex, maxStart, windowStart]);

  return (
    <div className="date-selector">
      <button type="button" className="date-arrow" disabled={windowStart === 0} onClick={() => setWindowStart(Math.max(0, windowStart - 1))} aria-label="Previous dates"><Icon name="chevron-left" /></button>
      <div className="date-chip-row">
        {visibleDays.map((day) => {
          const labels = formatDateChip(day.key);
          const selected = day.key === activeDay?.key;
          return (
            <button key={day.key} type="button" className={`date-chip${selected ? " selected" : ""}`} onClick={() => onSelectDay(day.key)} aria-label={selected ? `Selected date ${formatAvailableDate(day.key)}` : `Choose ${formatAvailableDate(day.key)}`} aria-pressed={selected}>
              <span>{labels.weekday}</span><strong>{labels.date}</strong>{selected ? <i aria-hidden /> : null}
            </button>
          );
        })}
      </div>
      <button type="button" className="date-arrow" disabled={windowStart >= maxStart} onClick={() => setWindowStart(Math.min(maxStart, windowStart + 1))} aria-label="Next dates"><Icon name="chevron-right" /></button>
    </div>
  );
}

function BookingCard({ availableDays, activeDay, selectedSlot, showSuccess, successSlot, onSelectDay, onSelectSlot, onResetSuccess }: {
  availableDays: SlotDayGroup[];
  activeDay: SlotDayGroup | null;
  selectedSlot: Slot | null;
  showSuccess: boolean;
  successSlot: Slot | null;
  onSelectDay: (key: string) => void;
  onSelectSlot: (slot: Slot) => void;
  onResetSuccess: () => void;
}) {
  if (showSuccess) return <BookingSuccessCard slot={successSlot} onReset={onResetSuccess} />;
  if (availableDays.length === 0) {
    return <section className="booking-card empty-state"><h2>No open slots right now</h2><p>This Toatre Link is live, but there are no available times to book.</p></section>;
  }

  return (
    <section className="booking-card" aria-label="Book a time">
      <div className="booking-step">
        <h3>1. Choose a date</h3>
        <DateSelector availableDays={availableDays} activeDay={activeDay} onSelectDay={onSelectDay} />
      </div>
      <div className="booking-divider" />
      <div className="booking-step time-step">
        <h3>2. Select a time</h3>
        <p className="available-label"><Icon name="calendar" /><span>Available times for <strong>{activeDay ? formatAvailableDate(activeDay.key) : "..."}</strong></span></p>
        <div className="time-grid">
          {(activeDay?.slots ?? []).map((slot) => {
            const selected = selectedSlot?.start === slot.start;
            return <button key={slot.start} type="button" className={`time-slot${selected ? " selected" : ""}`} onClick={() => onSelectSlot(slot)} aria-label={`Select ${formatTime(slot.start)}`} aria-pressed={selected}><span>{formatTime(slot.start)}</span>{selected ? <i><Icon name="check" size={12} /></i> : null}</button>;
          })}
        </div>
      </div>
      <p className="timezone-note"><Icon name="globe" /><span>All times shown in your local timezone</span></p>
    </section>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return <div className="modal-field"><label htmlFor={id}>{label}</label>{children}{error ? <p className="field-error">{error}</p> : null}</div>;
}

function validateForm(form: BookingForm, requireReason: boolean): Partial<Record<BookingField, string>> {
  const errors: Partial<Record<BookingField, string>> = {};
  if (!form.name.trim()) errors.name = "Enter your full name.";
  if (!form.email.trim()) errors.email = "Enter your email address.";
  else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = "Enter a valid email address.";
  if (requireReason && !form.discussion.trim()) errors.discussion = "Add what you would like to discuss.";
  return errors;
}

function BookingModal({ slot, host, handle, requireReason, onClose, onSuccess }: {
  slot: Slot;
  host: HostInfo;
  handle: string;
  requireReason: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<BookingForm>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<BookingField, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const hostName = host.displayName ?? handle;

  useEffect(() => {
    const firstInput = modalRef.current?.querySelector<HTMLInputElement>("input");
    firstInput?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !modalRef.current) return;
      const focusable = Array.from(modalRef.current.querySelectorAll<HTMLElement>('button, input, textarea, [href], [tabindex]:not([tabindex="-1"])')).filter((element) => !element.hasAttribute("disabled"));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const updateForm = <FieldName extends keyof BookingForm>(field: FieldName, value: BookingForm[FieldName]) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (field !== "sendCalendarInvite") setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = async () => {
    const nextErrors = validateForm(form, requireReason);
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const messageParts = [form.discussion.trim(), form.note.trim()].filter(Boolean);
      const response = await fetch(`/api/booking/${encodeURIComponent(handle)}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotStart: slot.start,
          slotEnd: slot.end,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: null,
          bookerHandle: null,
          message: messageParts.length > 0 ? messageParts.join("\n\n") : null,
        }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Could not book this time.");
      }
      onSuccess();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not book this time.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div ref={modalRef} className="book-modal" role="dialog" aria-modal="true" aria-labelledby="book-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="book-modal-header">
          <div><h2 id="book-modal-title">Book this time</h2><p>Enter your details to confirm your session with {hostName}.</p></div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close booking form"><Icon name="x" /></button>
        </header>
        <div className="selected-summary">
          <div><Icon name="calendar" /><strong>{formatModalDate(slot.start)}</strong></div>
          <span aria-hidden />
          <div><Icon name="clock" /><strong>{formatTime(slot.start)}</strong></div>
        </div>
        <div className="details-form">
          <h3>Your details</h3>
          <Field id="booking-full-name" label="Full name" error={fieldErrors.name}><input id="booking-full-name" className={fieldErrors.name ? "invalid" : ""} value={form.name} onChange={(event) => updateForm("name", event.target.value)} placeholder="Enter your full name" autoComplete="name" /></Field>
          <Field id="booking-email" label="Email address" error={fieldErrors.email}><input id="booking-email" className={fieldErrors.email ? "invalid" : ""} value={form.email} onChange={(event) => updateForm("email", event.target.value)} placeholder="Enter your email address" type="email" autoComplete="email" /></Field>
          <Field id="booking-discussion" label="What would you like to discuss?" error={fieldErrors.discussion}><input id="booking-discussion" className={fieldErrors.discussion ? "invalid" : ""} value={form.discussion} onChange={(event) => updateForm("discussion", event.target.value)} placeholder="e.g., Career advice, Portfolio review, Mentorship" /></Field>
          <Field id="booking-note" label="Add a note (optional)"><textarea id="booking-note" value={form.note} onChange={(event) => updateForm("note", event.target.value)} placeholder={`Anything else ${shortName(hostName)} should know before the session?`} rows={4} /></Field>
          <label className="calendar-checkbox"><input type="checkbox" checked={form.sendCalendarInvite} onChange={(event) => updateForm("sendCalendarInvite", event.target.checked)} /><span aria-hidden><Icon name="check" size={13} /></span>Send me a calendar invite</label>
          <p className="privacy-note"><Icon name="shield" size={17} /> Your information is only used for this booking.</p>
          {submitError ? <p className="submit-error">{submitError}</p> : null}
        </div>
        <footer className="modal-actions">
          <button type="button" className="cancel-button" onClick={onClose}>Cancel</button>
          <button type="button" className="book-button" disabled={submitting} onClick={() => { void submit(); }} aria-label="Book selected time">{submitting ? "Booking..." : "Book time"}</button>
        </footer>
      </div>
    </div>
  );
}

function BookingSuccessCard({ slot, onReset }: { slot: Slot | null; onReset: () => void }) {
  return (
    <section className="booking-card success-state">
      <div className="success-icon"><Icon name="check" size={32} /></div>
      <h2>You&apos;re booked</h2>
      <p>Your session is confirmed.</p>
      {slot ? <div className="success-summary"><span>{formatSuccessDate(slot.start)}</span><strong>{formatTime(slot.start)}</strong><small>Calendar invite sent</small></div> : null}
      <button type="button" onClick={onReset}>Done</button>
    </section>
  );
}

function BottomUpsellStrip() {
  return (
    <section className="upsell-strip">
      <div className="upsell-left"><div className="upsell-icon"><Icon name="link" size={32} /></div><div><h2>Create your own Toatre Link</h2><p>Share once. Get booked forever.</p></div></div>
      <a href="https://toatre.com/signup" className="upsell-button">Get your link <Icon name="arrow-right" size={18} /></a>
    </section>
  );
}

function PublicFooter() {
  return (
    <footer className="public-footer">
      <div><a href="https://toatre.com" className="footer-brand" aria-label="Toatre home"><BrandMark size={24} /><span>toatre</span></a><p>The easiest way to share your time.</p><div className="footer-socials" aria-hidden><span><SocialIcon type="x" /></span><span><SocialIcon type="linkedin" /></span><span><SocialIcon type="instagram" /></span><span><SocialIcon type="youtube" /></span></div></div>
      <p className="footer-copy">© 2025 Toatre. All rights reserved.</p>
    </footer>
  );
}

function PageState({ title, body }: { title: string; body: string }) {
  return <div className="public-page"><style>{pageCss}</style><PublicHandleHeader /><main className="page-state"><BrandMark size={44} /><h1>{title}</h1><p>{body}</p></main></div>;
}

interface HandleBookingPageViewProps {
  handle: string;
  host: HostInfo | null;
  greeting: string;
  title: string;
  description: string;
  loading: boolean;
  notFound: boolean;
  availableDays: SlotDayGroup[];
  activeDay: SlotDayGroup | null;
  selectedSlot: Slot | null;
  showBookingModal: boolean;
  showSuccess: boolean;
  successSlot: Slot | null;
  requireReason: boolean;
  onSelectDay: (key: string) => void;
  onSelectSlot: (slot: Slot) => void;
  onCloseBooking: () => void;
  onBookingSuccess: () => void;
  onResetSuccess: () => void;
}

export function HandleBookingPageView({ handle, host, greeting, title, description, loading, notFound, availableDays, activeDay, selectedSlot, showBookingModal, showSuccess, successSlot, requireReason, onSelectDay, onSelectSlot, onCloseBooking, onBookingSuccess, onResetSuccess }: HandleBookingPageViewProps) {
  if (loading) return <PageState title="Loading this Toatre Link" body="Pulling the latest open slots now." />;
  if (notFound || !host) return <PageState title="This Toatre Link is not live" body="The page does not exist or booking is turned off right now." />;

  return (
    <div className="public-page">
      <style>{pageCss}</style>
      <PublicHandleHeader />
      {showBookingModal && selectedSlot ? <BookingModal slot={selectedSlot} host={host} handle={handle} requireReason={requireReason} onClose={onCloseBooking} onSuccess={onBookingSuccess} /> : null}
      <main className="public-main">
        <section className="hero-booking-section">
          <ProfileColumn host={host} handle={handle} greeting={greeting} description={description || title} />
          <BookingCard availableDays={availableDays} activeDay={activeDay} selectedSlot={selectedSlot} showSuccess={showSuccess} successSlot={successSlot} onSelectDay={onSelectDay} onSelectSlot={onSelectSlot} onResetSuccess={onResetSuccess} />
        </section>
        <BottomUpsellStrip />
      </main>
      <PublicFooter />
    </div>
  );
}

const pageCss = `
  :root { color-scheme: light; }
  .public-page { min-height: 100vh; overflow-x: hidden; background: radial-gradient(circle at 13% 18%, rgba(128, 86, 255, 0.13), transparent 25%), radial-gradient(circle at 84% 8%, rgba(255, 255, 255, 0.95), transparent 30%), linear-gradient(180deg, #fbfaff 0%, #ffffff 54%, #fbf9ff 100%); color: #111735; font-family: Inter, "Segoe UI", sans-serif; position: relative; }
  .public-page::before { content: ""; position: absolute; inset: 118px auto auto -150px; width: 720px; height: 720px; border-radius: 999px; border: 1px solid rgba(112, 86, 255, 0.12); transform: rotate(-18deg); pointer-events: none; }
  .public-page::after { content: ""; position: absolute; inset: 168px auto auto 0; width: 350px; height: 360px; background-image: radial-gradient(rgba(112, 86, 255, 0.17) 1px, transparent 1px); background-size: 18px 18px; opacity: 0.35; pointer-events: none; }
  .public-header, .public-main, .public-footer { width: min(100% - 80px, 1240px); margin: 0 auto; position: relative; z-index: 1; }
  .public-header { padding: 42px 0 50px; }
  .public-brand, .footer-brand { display: inline-flex; align-items: center; gap: 12px; text-decoration: none; color: #101733; font-size: 28px; line-height: 1; font-weight: 800; }
  .hero-booking-section { display: grid; grid-template-columns: minmax(320px, 0.41fr) minmax(560px, 0.59fr); gap: clamp(64px, 7vw, 96px); align-items: start; }
  .profile-column { padding: 22px 0 0 24px; }
  .public-avatar-ring { display: grid; place-items: center; border-radius: 999px; background: conic-gradient(from 220deg, #745cff, #f044b5, #745cff, #37a4ff, #745cff); box-shadow: 0 18px 44px rgba(113, 82, 255, 0.16); margin-bottom: 28px; }
  .public-avatar { display: grid; place-items: center; border-radius: 999px; overflow: hidden; background: #f7f7fb; border: 6px solid rgba(255, 255, 255, 0.95); color: #ffffff; font-size: 44px; font-weight: 800; }
  .public-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .public-avatar-fallback { background: linear-gradient(135deg, #6d45ff, #c23cff); }
  .profile-name-row { display: flex; align-items: center; gap: 12px; }
  .profile-name-row h1 { margin: 0; color: #101733; font-size: 48px; line-height: 1.04; font-weight: 850; letter-spacing: 0; }
  .verified-badge { width: 24px; height: 24px; border-radius: 999px; display: grid; place-items: center; background: #1f8bff; color: #ffffff; flex: 0 0 auto; }
  .profile-handle { margin: 10px 0 18px; color: #626b86; font-size: 24px; line-height: 1.2; font-weight: 500; }
  .public-social-row, .footer-socials { display: flex; align-items: center; gap: 14px; }
  .public-social-link { width: 54px; height: 54px; border-radius: 999px; display: grid; place-items: center; color: #111735; background: rgba(255,255,255,0.68); border: 1px solid rgba(18,27,55,0.10); box-shadow: 0 10px 26px rgba(31,37,67,0.05); text-decoration: none; transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease; }
  .public-social-link:hover { color: #6a3cff; border-color: rgba(106,60,255,0.24); background: rgba(255,255,255,0.94); }
  .headline-block { margin-top: 56px; }
  .headline-block h2 { margin: 0; max-width: 430px; color: #101733; font-size: 58px; line-height: 1.06; font-weight: 850; letter-spacing: 0; }
  .headline-block h2 span { background: linear-gradient(110deg, #ef3fa8 8%, #a84cff 52%, #6247ff 92%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
  .headline-block p { margin: 22px 0 0; max-width: 340px; color: #626b86; font-size: 26px; line-height: 1.38; white-space: pre-line; }
  .benefit-list { display: grid; gap: 26px; margin-top: 50px; }
  .benefit-item { display: grid; grid-template-columns: 60px 1fr; align-items: center; gap: 18px; }
  .benefit-icon { width: 60px; height: 60px; border-radius: 999px; display: grid; place-items: center; color: #6a3cff; background: rgba(112,86,255,0.08); border: 1px solid rgba(112,86,255,0.12); }
  .benefit-item strong { display: block; color: #111735; font-size: 17px; line-height: 1.25; font-weight: 800; }
  .benefit-item p { margin: 7px 0 0; color: #626b86; font-size: 17px; line-height: 1.35; }
  .booking-card { width: 100%; box-sizing: border-box; background: rgba(255,255,255,0.93); border: 1px solid rgba(18,27,55,0.07); border-radius: 28px; box-shadow: 0 28px 80px rgba(33,39,74,0.11); padding: 58px 42px 50px; }
  .booking-step h3 { margin: 0 0 36px; color: #101733; font-size: 23px; line-height: 1.15; font-weight: 850; letter-spacing: 0; }
  .date-selector { display: grid; grid-template-columns: 42px minmax(0, 1fr) 42px; align-items: center; gap: 12px; }
  .date-chip-row { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }
  .date-arrow { width: 42px; height: 56px; border-radius: 10px; display: grid; place-items: center; border: 1px solid rgba(18,27,55,0.13); background: #ffffff; color: #69718d; cursor: pointer; }
  .date-arrow:disabled { opacity: 0.38; cursor: not-allowed; }
  .date-chip { position: relative; min-width: 0; height: 108px; border: 1px solid rgba(18,27,55,0.10); border-radius: 12px; background: rgba(255,255,255,0.86); color: #111735; cursor: pointer; font: inherit; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 9px; transition: border-color 0.16s ease, background 0.16s ease, box-shadow 0.16s ease; }
  .date-chip span { color: #3f4868; font-size: 16px; line-height: 1; font-weight: 500; }
  .date-chip strong { color: #111735; font-size: 17px; line-height: 1.1; font-weight: 800; }
  .date-chip.selected { border-color: #814cff; background: linear-gradient(180deg, rgba(131,76,255,0.07), rgba(255,255,255,0.96)); box-shadow: 0 10px 24px rgba(129,76,255,0.11); }
  .date-chip.selected span, .date-chip.selected strong { color: #672bff; }
  .date-chip i { width: 7px; height: 7px; border-radius: 999px; background: #672bff; }
  .booking-divider { height: 1px; margin: 44px 0 42px; background: rgba(18,27,55,0.11); }
  .time-step h3 { margin-bottom: 30px; }
  .available-label { display: flex; align-items: center; gap: 16px; margin: 0 0 34px; color: #626b86; font-size: 17px; line-height: 1.45; }
  .available-label svg { color: #525d81; flex: 0 0 auto; }
  .available-label strong { color: #672bff; font-weight: 700; }
  .time-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px 18px; }
  .time-slot { position: relative; height: 74px; border-radius: 11px; border: 1px solid rgba(18,27,55,0.10); background: #ffffff; color: #101733; font: inherit; font-size: 17px; line-height: 1; font-weight: 750; cursor: pointer; box-shadow: 0 8px 20px rgba(31,37,67,0.035); transition: border-color 0.16s ease, background 0.16s ease, box-shadow 0.16s ease; }
  .time-slot:hover, .time-slot.selected { border-color: #672bff; background: rgba(111,70,255,0.055); box-shadow: 0 12px 26px rgba(103,43,255,0.10); }
  .time-slot i { position: absolute; top: 50%; right: 17px; width: 17px; height: 17px; margin-top: -8.5px; border-radius: 999px; display: grid; place-items: center; color: white; background: #672bff; }
  .timezone-note { display: flex; align-items: center; gap: 16px; margin: 52px 0 0; color: #626b86; font-size: 16px; }
  .timezone-note svg { color: #525d81; }
  .upsell-strip { display: flex; align-items: center; justify-content: space-between; gap: 28px; margin: 64px 0 52px; padding: 32px 58px; border-radius: 18px; background: linear-gradient(135deg, rgba(111,70,255,0.08), rgba(255,255,255,0.78)); border: 1px solid rgba(111,70,255,0.09); box-shadow: inset 0 1px 0 rgba(255,255,255,0.82); }
  .upsell-left { display: flex; align-items: center; gap: 30px; }
  .upsell-icon { width: 86px; height: 86px; border-radius: 999px; display: grid; place-items: center; color: white; background: linear-gradient(135deg, #6337ff, #9b37ff); box-shadow: 0 18px 34px rgba(99,55,255,0.24); }
  .upsell-strip h2 { margin: 0 0 10px; color: #101733; font-size: 24px; line-height: 1.18; font-weight: 850; letter-spacing: 0; }
  .upsell-strip p { margin: 0; color: #111735; font-size: 17px; line-height: 1.4; }
  .upsell-button { display: inline-flex; align-items: center; justify-content: center; gap: 14px; min-width: 218px; min-height: 60px; padding: 0 24px; border-radius: 7px; background: linear-gradient(135deg, #6337ff, #a236f4); color: #ffffff; text-decoration: none; font-size: 19px; font-weight: 800; box-shadow: 0 16px 34px rgba(99,55,255,0.22); }
  .public-footer { display: flex; align-items: flex-end; justify-content: space-between; gap: 28px; padding: 32px 0 48px; border-top: 1px solid rgba(18,27,55,0.10); }
  .footer-brand { gap: 8px; font-size: 24px; }
  .public-footer p { margin: 12px 0 24px; color: #8188a1; font-size: 15px; }
  .footer-socials span { display: grid; place-items: center; width: 24px; height: 24px; color: #848ba3; }
  .public-footer .footer-copy { margin: 0; color: #8188a1; font-size: 16px; white-space: nowrap; }
  .modal-overlay { position: fixed; inset: 0; z-index: 40; display: grid; place-items: center; padding: 28px; background: rgba(18,22,38,0.34); backdrop-filter: blur(9px); }
  .book-modal { width: min(100%, 620px); max-height: calc(100vh - 56px); overflow: auto; box-sizing: border-box; border-radius: 24px; background: #ffffff; border: 1px solid rgba(18,27,55,0.08); box-shadow: 0 34px 88px rgba(18,22,38,0.24); padding: 36px 40px 38px; }
  .book-modal-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; }
  .book-modal-header h2 { margin: 0 0 8px; color: #101733; font-size: 28px; line-height: 1.12; font-weight: 850; letter-spacing: 0; }
  .book-modal-header p { margin: 0; color: #526080; font-size: 15px; line-height: 1.45; }
  .modal-close { width: 36px; height: 36px; border: 0; border-radius: 999px; display: grid; place-items: center; color: #101733; background: transparent; cursor: pointer; }
  .modal-close:hover { background: rgba(18,27,55,0.06); }
  .selected-summary { display: grid; grid-template-columns: 1fr 1px 1fr; align-items: center; margin-top: 28px; min-height: 64px; border: 1px solid rgba(111,70,255,0.25); border-radius: 12px; background: linear-gradient(135deg, rgba(111,70,255,0.055), rgba(255,255,255,0.92)); overflow: hidden; }
  .selected-summary > div { display: flex; align-items: center; gap: 18px; padding: 0 26px; color: #101733; }
  .selected-summary svg { color: #6a3cff; }
  .selected-summary > span { width: 1px; height: 34px; background: rgba(18,27,55,0.12); }
  .selected-summary strong { font-size: 16px; line-height: 1; font-weight: 800; }
  .details-form { display: grid; gap: 16px; margin-top: 22px; }
  .details-form h3 { margin: 0 0 2px; color: #101733; font-size: 16px; font-weight: 850; }
  .modal-field { display: grid; gap: 8px; }
  .modal-field label { color: #101733; font-size: 14px; line-height: 1.2; font-weight: 650; }
  .modal-field input, .modal-field textarea { width: 100%; box-sizing: border-box; border: 1px solid rgba(18,27,55,0.13); border-radius: 9px; background: #ffffff; color: #101733; font: inherit; font-size: 15px; line-height: 1.4; outline: none; padding: 13px 14px; transition: border-color 0.15s ease, box-shadow 0.15s ease; }
  .modal-field input:focus, .modal-field textarea:focus { border-color: rgba(111,70,255,0.55); box-shadow: 0 0 0 4px rgba(111,70,255,0.10); }
  .modal-field input.invalid, .modal-field textarea.invalid { border-color: #dc2626; }
  .modal-field textarea { min-height: 84px; resize: vertical; }
  .field-error, .submit-error { margin: 0; color: #b42318; font-size: 13px; line-height: 1.35; font-weight: 650; }
  .submit-error { padding: 10px 12px; border-radius: 10px; background: #fff1f0; border: 1px solid #ffccc7; }
  .calendar-checkbox { display: inline-flex; align-items: center; gap: 10px; width: max-content; color: #101733; font-size: 14px; line-height: 1.2; cursor: pointer; }
  .calendar-checkbox input { position: absolute; opacity: 0; pointer-events: none; }
  .calendar-checkbox span { width: 18px; height: 18px; border-radius: 5px; display: grid; place-items: center; border: 1px solid rgba(18,27,55,0.16); color: transparent; background: #ffffff; }
  .calendar-checkbox input:checked + span { border-color: #672bff; background: #672bff; color: #ffffff; }
  .privacy-note { display: flex; align-items: center; gap: 10px; margin: 0; color: #6d7590; font-size: 14px; line-height: 1.4; }
  .privacy-note svg { color: #7a829a; flex: 0 0 auto; }
  .modal-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 150px; margin-top: 30px; }
  .cancel-button, .book-button, .success-state button { min-height: 56px; border-radius: 8px; font: inherit; font-size: 16px; font-weight: 750; cursor: pointer; }
  .cancel-button { color: #101733; background: #ffffff; border: 1px solid rgba(18,27,55,0.13); }
  .book-button, .success-state button { border: 0; color: #ffffff; background: linear-gradient(135deg, #6337ff, #a236f4); box-shadow: 0 16px 34px rgba(99,55,255,0.20); }
  .book-button:disabled { opacity: 0.58; cursor: not-allowed; }
  .success-state, .empty-state, .page-state { text-align: center; }
  .success-state { display: grid; justify-items: center; gap: 16px; }
  .success-icon { width: 76px; height: 76px; border-radius: 999px; display: grid; place-items: center; color: #ffffff; background: linear-gradient(135deg, #14b879, #099565); box-shadow: 0 18px 32px rgba(20,184,121,0.22); }
  .success-state h2, .empty-state h2, .page-state h1 { margin: 0; color: #101733; font-size: 34px; line-height: 1.15; font-weight: 850; letter-spacing: 0; }
  .success-state p, .empty-state p, .page-state p { margin: 0; color: #626b86; font-size: 17px; line-height: 1.55; }
  .success-summary { display: grid; gap: 4px; padding: 14px 20px; border-radius: 14px; background: rgba(111,70,255,0.07); color: #101733; }
  .success-summary span, .success-summary small { color: #626b86; }
  .success-state button { min-width: 180px; padding: 0 24px; }
  .page-state { display: grid; justify-items: center; gap: 16px; width: min(100% - 40px, 540px); margin: 90px auto 0; padding: 48px; border-radius: 24px; background: rgba(255,255,255,0.90); border: 1px solid rgba(18,27,55,0.08); box-shadow: 0 24px 60px rgba(31,37,67,0.08); }
  @media (max-width: 1100px) { .hero-booking-section { grid-template-columns: 1fr; gap: 44px; } .profile-column { padding-left: 0; display: grid; justify-items: center; text-align: center; } .headline-block h2, .headline-block p { max-width: none; } .benefit-list { width: min(100%, 520px); text-align: left; } }
  @media (max-width: 760px) { .public-header, .public-main, .public-footer { width: min(100% - 32px, 1240px); } .public-header { padding: 24px 0 34px; } .public-brand { font-size: 24px; } .public-avatar-ring { transform: scale(0.84); margin-bottom: 8px; } .profile-name-row h1 { font-size: 38px; } .profile-handle { font-size: 20px; } .headline-block { margin-top: 36px; } .headline-block h2 { font-size: 42px; } .headline-block p { font-size: 21px; } .booking-card { padding: 32px 18px 28px; border-radius: 24px; } .booking-step h3 { margin-bottom: 22px; font-size: 20px; } .date-selector { grid-template-columns: 40px minmax(0, 1fr) 40px; gap: 8px; } .date-chip-row { display: flex; overflow: hidden; gap: 8px; } .date-chip { min-width: 82px; height: 92px; } .time-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; } .time-slot { height: 62px; } .upsell-strip, .public-footer { flex-direction: column; align-items: flex-start; } .upsell-strip { padding: 24px; } .upsell-left { gap: 18px; } .upsell-icon { width: 64px; height: 64px; } .upsell-button { width: 100%; min-width: 0; } .modal-overlay { padding: 12px; align-items: end; } .book-modal { max-height: calc(100vh - 24px); border-radius: 22px; padding: 28px 20px 22px; } .selected-summary { grid-template-columns: 1fr; padding: 8px 0; } .selected-summary > span { width: auto; height: 1px; margin: 0 18px; } .selected-summary > div { padding: 12px 20px; } .modal-actions { grid-template-columns: 1fr; gap: 12px; } }
`;