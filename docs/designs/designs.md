# Toatre — Design Spec

Screen-by-screen build spec mapped to phases. Source images live alongside this file.

---

## Web — Landing Page

![Home landing page](home%20landing%20page%20web.png)

**Status:** Live at `toatre.com` — implemented 2026-04-25.

**Layout (top → bottom):**
- **Nav** (sticky, white/blur): logo left · "How it works / Use cases / Pricing" centered · "Log in" + "Sign up free" (indigo pill) right
- **Hero**: sparkle pill badge · H1 "Say it. / **Toatre gets it**." (pink period) · subtext · CTA row ("Sign up for free →" + "▶ Watch how it works") · trust line · iPhone mockup (lavender→pink gradient screen, mic circle)
- **How it works**: 3-card grid — "You talk." / "We understand." / "You stay on track."
- **Use cases**: 3-card grid — Work / Family / Personal with italic example toats
- **Pricing**: "Free while in beta." copy + "Get early access free →" CTA
- **Final CTA block**: indigo gradient box — "Ready to simplify your day?" + "Sign up free"
- **Footer**: logo · Privacy · Terms · Contact · © 2026 Toatre

**Proxy behaviour:** Unauthenticated `GET /` renders landing page. Authenticated users are redirected to `/timeline` by `proxy.ts` before the page renders.

---

## Phase 0 — Scaffold (current)

No screens. CI, accounts, brand assets.

---

## Phase 1 — Auth

**Screens to build:**

### 1.1 Splash

![Splash screen](1.%20splash.png)

**File:** `mobile/lib/ui/splash/splash_screen.dart`

- Shows logo + "Hey. Tap the mic…"
- Auto-transitions after ~1–1.5 s
- Logic:
  ```
  if (user.authenticated) → /timeline
  else → /auth
  ```

### 1.2 Auth — Entry

**File:** `mobile/lib/ui/auth/auth_screen.dart`

- Sign in with Apple
- Sign in with Google
- Continue with email
- Unauthenticated users land here from splash

### 1.3 Auth — Permissions

**File:** `mobile/lib/ui/auth/permissions_screen.dart`

- Microphone permission (required — gating, user must grant)
- Notifications permission (recommended)

### 1.4 Auth — Handle Creation

**File:** `mobile/lib/ui/auth/handle_screen.dart`

- Input: `@yourname` (unique handle)
- Validation: availability check against API

### 1.5 Auth — Contacts Sync (optional)

**File:** `mobile/lib/ui/auth/contacts_screen.dart`

- Optional: find family/friends
- Skip button prominent

### 1.6 Auth — First Capture Prompt

- After handle creation → navigate directly to Capture screen
- No intermediate screen

**Web equivalents:**
- `web/src/app/(auth)/login/page.tsx`
- `web/src/app/(auth)/signup/page.tsx`

---

## Phase 2 — Capture + AI Extraction

**Screens to build:**

### 2.1 Capture — Listening

![Capture listening state](3.%20user%20talking%20and%20transcribing.png)

**File:** `mobile/lib/ui/capture/capture_screen.dart`

- Triggered by FAB mic button on Timeline
- Full-screen overlay
- Components:
  - Mic animation (pulsing ring, active state)
  - Live waveform visualiser
  - Elapsed timer
  - Real-time transcript preview (builds as user speaks)
- States:
  - `listening` — mic active, waveform running
  - `processing` — spinner, "Thinking…"
  - `error` — "Didn't catch that. Tap to retry."
- Stop → triggers extraction

### 2.2 Extraction — AI Confirmation

![Extraction screen](4.%20toatre%20captures%20multiple%20toats%20from%20single%20voice%20clip.png)

**File:** `mobile/lib/ui/capture/extraction_screen.dart`

- Shows highlighted transcript: time references, people, places highlighted inline
- Auto-generated toat cards below (pre-selected, all checked by default)
- Each toat card: editable inline (kind, time, title)
- CTA: "Add to timeline" (creates all selected toats)
- Tap individual card to deselect / edit before confirming

**AI output shape:**
```json
{
  "kind": "meeting",
  "title": "...",
  "starts_at": "ISO8601",
  "ends_at": "ISO8601",
  "people": ["@handle"],
  "location": "...",
  "notes": "..."
}
```

---

## Phase 3 — Timeline + Toat Details

**Screens to build:**

### 3.1 Timeline — Home

![Timeline home](2.%20Timeline%20view%20home.png)

**File:** `mobile/lib/ui/timeline/timeline_screen.dart`

- Scrollable list, grouped by day (Today / Tomorrow / This week)
- Left rail: time column (primary structure)
- "Up Next" smart card at top (dynamically computed)
- Empty state: "You're all clear. Tap the mic to add something."
- Interactions:
  - Tap card → Toat detail screen
  - Long press → action sheet (share, reschedule, snooze, delete)
  - FAB (bottom right) → Capture screen

**Smart card states (time-aware):**

| State | Condition | Label |
|---|---|---|
| before | > 15 min away | "Leave in X min" |
| imminent | ≤ 15 min | "Leaving now" |
| during | start < now < end | "Happening now — Join" |
| after | past end | "Missed / Done" |

### 3.2 Toat Detail — Errand/Appointment

![Toat detail — errand](5.1%20dentist%20appointment%20toat.png)

**File:** `mobile/lib/ui/toat_detail/toat_detail_screen.dart` (shared shell)

- Context: location, time, notes
- Primary action button: adapts by state (Leave / Navigate / Call)
- Secondary: call contact
- Ping settings (when to be reminded)
- Capture source (transcript snippet that created this toat)
- Location button → opens native Maps

### 3.3 Toat Detail — Checklist

![Toat detail — checklist](5.2.grocery%20toat.png)

- Reuses `toat_detail_screen.dart` with checklist variant
- Item categories
- Progress counter ("3 of 12 left")
- Swipe item right to complete
- Add item inline at bottom
- Notes section below list
- Items auto-reorder: incomplete first

### 3.4 Toat Detail — Meeting

![Toat detail — meeting](5.3%20team%20meeting%20toat.png)

- Reuses `toat_detail_screen.dart` with meeting variant
- Join button (primary, time-aware):
  - Before start → "Join"
  - During → "Rejoin"
  - After → "View notes"
- Attendees list (avatars + names)
- Agenda (markdown)
- Attachments
- Ping controls

### 3.5 Toat Detail — Event

![Toat detail — event](5.4.%20ticketed%20event%20toat.png)

- Reuses `toat_detail_screen.dart` with event variant
- Ticket (QR code display)
- Directions button
- Timeline strip: doors open / start / end
- Mini-map embed
- "Add to Wallet" (iOS Wallet pass)
- Time-aware prompts:
  - "Leave now" (travel time aware)
  - "Doors open in X min"

### 3.6 Reschedule / Time Picker

**File:** `mobile/lib/ui/toat_detail/reschedule_sheet.dart`

- Bottom sheet
- Quick options: Later today, Tomorrow, Next week
- Custom picker fallback

### 3.7 Snooze Flow

**File:** `mobile/lib/ui/toat_detail/snooze_sheet.dart`

- Bottom sheet
- Options: 10 min / 1 hour / Tomorrow morning

---

## Phase 4 — Pings (Notifications)

**Notification types:**

| Type | Trigger | Tap destination |
|---|---|---|
| Time-based ping | X min before starts_at | Timeline (highlighted toat) |
| Incoming toat | Another user shares a toat | Incoming accept screen |
| Pending accept reminder | Unaccepted toats > 24h | Inbox screen |
| Smart travel reminder | Calculated leave time | Timeline (highlighted toat) |

**Screens to build:**

### 4.1 Incoming Toat — Accept/Decline

**File:** `mobile/lib/ui/sharing/incoming_toat_screen.dart`

- Minimal preview of shared toat (sender, title, time)
- Conflict warning if overlaps existing toat
- Accept → adds to timeline
- Decline → dismisses

---

## Phase 5 — Sharing + People Graph

**Screens to build:**

### 5.1 Share Screen

![Share screen](5.5%20share%20toat%20screen.png)

**File:** `mobile/lib/ui/sharing/share_screen.dart`

- People selector: avatars (recent contacts first)
- Share via link toggle (native share sheet)
- Permission toggle: View / Edit
- Send CTA
- Tap user to select/deselect → send triggers notification + email to recipient

### 5.2 Inbox Screen

**File:** `mobile/lib/ui/inbox/inbox_screen.dart`

- All incoming shared toats
- Grouped by sender
- Accept / Decline inline per item
- Unread badge on nav

### 5.3 People Screen

**File:** `mobile/lib/ui/people/people_screen.dart`

- Connections list
- Add by handle search
- Remove connection
- Recent shares section

### 5.4 Web Accept Flow

**File:** `web/src/app/accept/[token]/page.tsx`

- For link-based sharing (recipient not on app)
- Preview toat → prompt login/signup → accept → redirect to App Store

---

## Phase 6 — Settings + Privacy

**Screens to build:**

### 6.1 Settings Screen

**File:** `mobile/lib/ui/settings/settings_screen.dart`

- Timezone (auto-detected, overridable)
- Work hours (used for ping scheduling)
- Privacy: voice retention (keep transcripts / delete after extraction)
- Notifications: per-type toggles
- Account: handle, email, linked providers
- Sign out

### 6.2 Search Screen

**File:** `mobile/lib/ui/search/search_screen.dart`

- Unified search: toats + people
- Filters: kind (task/meeting/event/etc), time range
- Recent searches

---

## Phase 7 — Polish + Analytics

**To build:**

- Error states: no network, failed transcription, retry capture
- Offline state overlay
- Analytics / insights screen (weekly summary)
- Recurring toats (RRULE-based)

---

## Phase 8 — Beta Launch

- Home screen widget (iOS / Android)
- Calendar sync (Google Calendar, Apple Calendar)

---

## Phase 9+ — Future

- Watch app (quick pings + capture)
- Smart suggestions (auto-detect patterns)
- Voice memory timeline (replay captures)
- Advanced sharing (groups)
