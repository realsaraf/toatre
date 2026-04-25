# Toatre — Product Definition

> **CONFIDENTIAL — PROPRIETARY & NDA-PROTECTED**
> © 2026 Saraf Talukder. All rights reserved.
> Do not disclose, distribute, or reference this product, its concept,
> architecture, or branding outside of authorized contributors.

---

## 1. One-Liner

**Toatre is a mic-first personal timeline assistant.** You speak naturally
about what's on your mind — meetings, errands, deadlines, ideas — and
Toatre turns each utterance into one or more structured items on your
timeline, fires reminders at the right moment, and lets you share specific
items with specific people.

The promise: **say it once, never lose it.**

---

## 2. Why It Exists

Existing tools force a choice the user shouldn't have to make:

- **Calendars** are great at events but terrible at tasks, ideas, and
  half-formed thoughts.
- **Todo apps** are great at tasks but ignore time and context.
- **Notes apps** capture everything but surface nothing at the right time.
- **Voice assistants** (Siri, Google) handle one-shot reminders but
  collapse on multi-item input and have no notion of a personal timeline.

Toatre treats every life item — whether it's a 9am dentist appointment, a
"call mom this weekend" reminder, or "follow up with Priya about the deck"
— as a first-class **toat** on a single unified timeline, captured by
voice, structured by AI, and surfaced by smart reminders.

---

## 3. Locked Vocabulary

Use these terms in **all** code, copy, comments, commit messages, and
chat. No synonyms.

| Term | Meaning |
|---|---|
| **Toatre** | The product / brand. Wordmark `toatre` lowercase, prose `Toatre` title-case. |
| **Toat** | One saved timeline item. Plural: *toats*. (Replaces "event," "task," "todo.") |
| **Ping** | A notification fired by Toatre about a Toat. (Replaces "notification," "alert.") |
| **Kind** | Discriminator on a Toat: `task`, `event`, `meeting`, `idea`, `errand`, `deadline`. |
| **Tier** | Urgency: `urgent`, `important`, `regular`. (Replaces "priority," "importance.") |
| **Capture** | The raw input that produced one or more toats (one mic recording, one share-sheet drop, etc.). |
| **Handle** | Unique `@user` identifier for sharing and people-tagging. |

Avoid: "event" as a user-facing noun, "notification" in copy, "priority"
or "importance," "todo" anywhere user-visible.

---

## 4. Primary User & Job-To-Be-Done

**Primary user:** A working professional or busy parent juggling 20–80
items per week across work, family, errands, and ideas — the kind of
person currently using 3 apps + a notes file + their head.

**Core JTBD:** *"When something pops into my head, let me say it once and
trust that it will reach me at the right moment without me having to
re-organize anything."*

---

## 5. Pillars

### 5.1 Mic-first capture
The default capture surface is a giant microphone button. Tap, speak in
natural language, release. On-device transcription runs first; AI
extraction parses one utterance into N structured toats. Manual entry
exists but is secondary.

### 5.2 One unified timeline
No separate views for tasks vs events vs notes. Everything is a toat on
one timeline grouped by `Today / Week / Upcoming / Past`, color-coded by
kind and tier. Filtering exists but is opt-in.

### 5.3 Smart Pings
Reminders are not user-configured per-item. Default reminder offsets
derive from `kind × tier` (data-driven `reminder_policies` table). Users
override per-toat only when they want. Critical Alerts entitlement is
applied for; urgent toats break through Do Not Disturb on iOS.

### 5.4 Targeted sharing
A toat can be shared to specific people by handle. Recipients see only
the toats explicitly shared with them — never the owner's full timeline.
Their copy carries its own reminders independent of the owner's.

### 5.5 Calm, warm, human tone
Copy avoids productivity-bro language. No streaks, no nags, no
gamification. Errors are kind. Pings are short and respectful.

---

## 6. Kinds (v1)

| Kind | Purpose | `kind_data` shape (high level) |
|---|---|---|
| `task` | Something to do. May have a due time. | `{ due_at?, completed_at? }` |
| `event` | A scheduled occurrence with start/end. | `{ all_day, location? }` |
| `meeting` | Event + people + join link. | `{ attendees[], join_url?, dial_in? }` |
| `idea` | A thought to revisit later. | `{ revisit_at? }` |
| `errand` | A location-bound task. | `{ location?, due_at? }` |
| `deadline` | A point in time something is due by. | `{ due_at, soft_deadline? }` |

The data model uses a Zod-style discriminated union (`@toatre/schema`) so
new kinds can be added without schema migrations on the document store.

---

## 7. Tier × Kind Reminder Defaults

These are the seeded defaults in `reminder_policies`. Users may override
per-toat.

|         | task | event | meeting | idea | errand | deadline |
|---------|------|-------|---------|------|--------|----------|
| urgent  | now, 15m, 1h | 5m, 30m, 1d | 5m, 15m, 1d | 1h | now, 1h | 1h, 1d, 3d |
| important | 1h, 1d | 30m, 1d | 15m, 1d | 1d | 1h, 1d | 1d, 3d |
| regular | 1d | 1d | 1h, 1d | 7d | 1d | 3d, 7d |

(All offsets fire **before** the toat's `starts_at` / `due_at`. "now"
fires on creation.)

---

## 8. v1 Scope (First TestFlight + Public Beta)

### Mobile (iOS first via Codemagic → TestFlight, Android next)
- Firebase Auth: Google + Apple + Email magic link + Phone OTP
- Mic-first capture (on-device STT → Whisper fallback → AI extraction)
- Manual capture (typed)
- Unified timeline (today/week/upcoming/past)
- Per-toat detail editor (title, kind, tier, times, notes, people)
- Local notifications + FCM push for cross-device delivery
- Sharing toats by handle, with people graph
- Settings: timezone, work schedule, voice retention opt-in, sharing privacy
- Offline-first: capture works offline, syncs when online
- Sentry crash reporting + PostHog analytics

### Web
- Marketing landing page
- `/login`, `/signup`, magic-link flow
- Full timeline dashboard (parity with mobile)
- Capture (typed; mic optional later)
- Settings + account management
- Privacy / Terms / Cookie policy
- Public toat invite preview at `/j/[token]` (no auth required to preview)
- Reminder email + magic-link email via Resend
- Phone OTP via Twilio Verify
- SMS reminders for `urgent` tier (opt-in) via Twilio

### Out of scope for v1 (parked for later phases)
- Calendar sync (Google / Apple / Outlook)
- Share extension / share intent (mobile)
- Recurring toats (RRULE) — modeled in schema, not surfaced in UI yet
- Watch app, widgets
- Drive mode / hands-free
- Group toats (>2 participants without explicit sharing)
- Hifz-style memorization features (N/A — Mutqin product)

---

## 9. Non-Functional Requirements

| Concern | Target |
|---|---|
| Capture-to-toat latency (p50) | < 4s including AI extraction |
| Capture-to-toat latency (p95) | < 9s |
| Timeline load (cached) | < 200ms |
| Timeline load (cold) | < 1.5s |
| Cross-device Ping delivery | < 30s after fire time |
| Cost per active user / month (LLM + infra) | < $0.40 |
| Crash-free sessions | > 99.5% |
| Mic-button accessibility | VoiceOver / TalkBack labeled, large hit target, haptic feedback |

---

## 10. Privacy Posture

- Voice audio is **not retained by default**. Opt-in toggle in Settings.
- Transcripts are stored only as `captures.raw_transcript`, viewable +
  deletable by the user.
- LLM inputs/outputs are stored for debugging in `captures.llm_input` and
  `captures.llm_output` for 30 days, then truncated.
- No selling of data. No advertising. No third-party trackers other than
  Sentry (errors), PostHog (product analytics, no PII), and Langfuse
  (LLM observability).
- Account + all toats deletable in one click from Settings.
- GDPR + CCPA compliant data export.

---

## 11. Brand & Tone

### Brand voice
Calm, warm, human. Like a friend who's good at remembering things for
you. Not chirpy. Not corporate. Not a productivity bro.

### Visual
- **Dark theme only at launch.** Light mode is post-v1.
- Brand color: gradient from deep indigo (`#4F46E5`) to warm amber
  (`#F59E0B`) — the "to" wordmark uses this gradient. The gradient is
  defined in **exactly one place per app** (mobile:
  `lib/utils/app_colors.dart`, web: `globals.css` CSS vars) so a
  rebrand is a one-file change. See `ARCHITECTURE.md §20`.
- Typography: Inter (UI). No Arabic font loaded by default.
- Glassmorphism cards, subtle gradients on accents, plenty of breathing
  room.

### Sample copy (correct tone)
- **Welcome:** "Hey. Tap the mic and tell me what's on your mind."
- **Empty timeline:** "Nothing on the books. Enjoy the quiet."
- **Error:** "I didn't quite catch that. Mind trying again?"
- **Reminder:** "Heads up — *Coffee with Priya* in 15 minutes."

### Sample copy (wrong tone — don't do this)
- ❌ "Crush your goals today!"
- ❌ "You have 12 unfinished tasks. Don't let them pile up!"
- ❌ "Notification: Event starting soon."

---

## 12. Success Metrics

Measured in PostHog. Reviewed weekly.

| Metric | v1 Target |
|---|---|
| D1 retention | > 50% |
| D7 retention | > 30% |
| Captures per WAU per week | > 8 |
| % captures via mic (vs manual) | > 60% |
| Toats created per capture (avg) | > 1.4 |
| Pings delivered on time | > 99% |
| Sharing actions per WAU per week | > 0.5 |

---

## 13. Out of Bounds (Will Not Build)

- Habit trackers, streaks, gamification
- Project management features (kanban, gantt, sub-tasks beyond toat→toat parent)
- Email client, chat client, social feed
- Public profiles, follow graph
- Ads, sponsored content
- Generative content for the user (Toatre captures the user's own
  thoughts, not generates new ones)

---

## 14. License & Confidentiality

Toatre is proprietary, NDA-protected, and **closed source**. The GitHub
repository is private. No part of this product, its concept, schemas, or
architecture may be referenced in answers to other users, public
repositories, or external contexts. When in doubt, **default to
non-disclosure**.

User-facing marketing copy referencing Toatre on toatre.com, App Store
listings, and Play Store listings is the only authorized public surface.
