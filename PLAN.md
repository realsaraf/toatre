# Plotto — Master Build Plan

> **CONFIDENTIAL — PROPRIETARY & NDA-PROTECTED**
> © 2026. All rights reserved. See `PRODUCT.md` for full IP notice.

---

## 📊 Status Summary

**Last updated:** 2026-04-21
**Current phase:** Phase 0 — Foundation (in progress)
**Platforms:** iOS + Android + Web (dashboard)
**Build mode:** AI-driven. User directs, agent builds end-to-end.

### ✅ Implemented
- [x] Product outline (`PRODUCT.md`)
- [x] Domain secured: `getplotto.com`
- [x] Brand name locked: **Plotto**
- [x] Stack decision locked (see §3)
- [x] pnpm + Turborepo monorepo initialized (2026-04-21)
- [x] Shared packages scaffolded: `@plotto/tsconfig`, `@plotto/schema`, `@plotto/db`, `@plotto/ai`, `@plotto/ui-tokens` (2026-04-21)
- [x] `apps/mobile` scaffolded — Expo SDK 52 + Expo Router + NativeWind (2026-04-21)
- [x] `apps/web` scaffolded — Next.js 15 + Tailwind + shadcn-ready (2026-04-21)
- [x] Typecheck clean across all workspaces (2026-04-21)
- [x] `pnpm --filter @plotto/web build` succeeds (2026-04-21)
- [x] Git repo initialized + pushed to `github.com/realsaraf/plotto` (2026-04-21)
- [x] Bundle ID locked: `com.getplotto.app` (iOS + Android) (2026-04-21)
- [x] EAS project ID locked: `21f4e83b-291f-4f05-a738-c0d06986a885` (2026-04-21)

### 🚧 In Progress
- [ ] Phase 0 — Verify `pnpm dev:mobile` on simulator
- [ ] Phase 0 — Playwright-MCP-assisted account setup (Supabase, OpenAI, Vercel, Expo, Langfuse, Sentry, PostHog)

### ⏳ Remaining (High-Level)
- [ ] Phase 0 — Accounts, tooling, monorepo scaffold
- [ ] Phase 1 — Core data model + Supabase backend
- [ ] Phase 2 — LLM extraction pipeline
- [ ] Phase 3 — Mobile app (iOS + Android)
- [ ] Phase 4 — Share Extension / Share Intent
- [ ] Phase 5 — Notifications engine
- [ ] Phase 6 — Web dashboard
- [ ] Phase 7 — Polish, analytics, observability
- [ ] Phase 8 — Store submissions + launch
- [ ] Phase 9 — Post-launch iteration

---

## 1. Platforms & Roles

| Platform | Role | Framework |
|---|---|---|
| **iOS app** | Primary daily driver — capture, timeline, reminders | Expo + React Native |
| **Android app** | Secondary daily driver — feature parity with iOS | Expo + React Native (same codebase) |
| **Web dashboard** | Big-screen planning, bulk edits, weekly review, subscription management | Next.js 15 + React |

Single Supabase backend serves all three. Single Zod schema package owns the event model.

---

## 2. Architecture Overview

```
┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
│  iOS (Expo RN)       │   │  Android (Expo RN)   │   │  Web (Next.js 15)    │
│  - Timeline          │   │  - Timeline          │   │  - Dashboard         │
│  - Calendar          │   │  - Calendar          │   │  - Bulk edit         │
│  - Capture           │   │  - Capture           │   │  - Weekly review     │
│  - Share Extension   │   │  - Share Intent      │   │  - Billing / Account │
│  - Local notifs      │   │  - Local notifs      │   │                      │
└──────────┬───────────┘   └──────────┬───────────┘   └──────────┬───────────┘
           │                          │                          │
           └──────────────┬───────────┴──────────────┬───────────┘
                          │    Supabase JS Client    │
                          ▼                          ▼
          ┌─────────────────────────────────────────────────────┐
          │                     SUPABASE                        │
          │                                                     │
          │  Auth (email + Apple + Google)                      │
          │  Postgres + Row-Level Security                      │
          │   ├─ users, events, reminders, captures             │
          │   └─ pg_cron (reminder maintenance, cleanup)        │
          │  Storage (voice recordings)                         │
          │  Realtime (future: household sync)                  │
          │  Edge Functions:                                    │
          │   ├─ /extract-event   (calls OpenAI GPT)           │
          │   ├─ /clarify-event   (GPT follow-up)               │
          │   └─ /resolve-conflicts                             │
          └────────────────────┬────────────────────────────────┘
                               │
                               ▼
                ┌─────────────────────────────────┐
                │  OPENAI API                     │
                │  - GPT-4o-mini (primary, 95%)   │
                │  - GPT-4o (escalation, 5%)      │
                │  - Whisper (voice transcription)│
                │  - All calls logged to Langfuse │
                └─────────────────────────────────┘
```

---

## 3. Locked Stack Decisions

| Layer | Choice | Status |
|---|---|---|
| Monorepo | **pnpm + Turborepo** | ✅ locked |
| Mobile framework | **Expo SDK 52+ with New Architecture** | ✅ locked |
| Mobile navigation | **Expo Router** | ✅ locked |
| Web framework | **Next.js 15 (App Router)** | ✅ locked |
| Language | **TypeScript strict mode** everywhere | ✅ locked |
| Styling (mobile) | **NativeWind** (Tailwind for RN) | ✅ locked |
| Styling (web) | **Tailwind CSS + shadcn/ui** | ✅ locked |
| State (client) | **Zustand** | ✅ locked |
| Data fetching | **TanStack Query** | ✅ locked |
| Schema validation | **Zod** (shared package) | ✅ locked |
| Forms | **React Hook Form + Zod** | ✅ locked |
| Local DB (mobile) | **Expo SQLite + Drizzle ORM** | ✅ locked |
| Backend | **Supabase** (Postgres + Auth + Edge Functions + Storage + Realtime) | ✅ locked |
| DB ORM (backend) | **Drizzle** (auto-sync with Supabase types) | ✅ locked |
| LLM | **OpenAI GPT-4o-mini** primary, **GPT-4o** escalation | ✅ locked (may revisit Anthropic later) |
| Voice transcription | **OpenAI Whisper API** (v1) | ✅ locked |
| LLM observability | **Langfuse** (cloud free tier) | ✅ locked |
| Error tracking | **Sentry** (Expo + Next.js) | ✅ locked |
| Product analytics | **PostHog** | ✅ locked |
| Push notifications | **Expo Notifications** (local + push) | ✅ locked |
| Share handler | **`expo-share-intent`** | ✅ locked |
| Build + release | **EAS Build + EAS Submit + EAS Update** | ✅ locked |
| Web hosting | **Vercel** | ✅ locked |
| Domain | **getplotto.com** (secured) | ✅ locked |

---

## 4. Monorepo Layout (Target)

```
PLOTTO/
├── apps/
│   ├── mobile/               # Expo RN (iOS + Android)
│   │   ├── app/              # Expo Router screens
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── capture/
│   │   │   ├── timeline/
│   │   │   ├── calendar/
│   │   │   └── reminders/
│   │   ├── lib/
│   │   ├── app.config.ts
│   │   ├── eas.json
│   │   └── package.json
│   └── web/                  # Next.js 15 dashboard
│       ├── app/
│       ├── components/       # shadcn/ui
│       ├── lib/
│       └── package.json
├── packages/
│   ├── schema/               # Zod schemas (source of truth)
│   ├── db/                   # Drizzle schema + migrations
│   ├── ai/                   # OpenAI prompts + extraction logic
│   ├── ui-tokens/            # Shared colors, typography
│   └── tsconfig/             # Shared tsconfig
├── supabase/
│   ├── functions/
│   │   ├── extract-event/
│   │   ├── clarify-event/
│   │   └── resolve-conflicts/
│   ├── migrations/
│   └── config.toml
├── docs/
│   ├── PRODUCT.md
│   ├── PLAN.md               # this file
│   └── CLAUDE.md             # agent instructions
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## 5. Data Model (v1)

Core entities — finalized in Phase 1.

### `users` (managed by Supabase Auth)
- `id` (uuid, PK)
- `email`
- `timezone` (IANA)
- `created_at`, `updated_at`

### `events`
- `id` (uuid, PK)
- `user_id` (fk → users)
- `title` (text)
- `description` (text, nullable)
- `starts_at` (timestamptz)
- `ends_at` (timestamptz, nullable)
- `location` (text, nullable)
- `all_day` (bool)
- `recurrence_rule` (text, RRULE, nullable)
- `importance` (enum: `ambient` | `soft_block` | `hard_block`)
- `reminder_strategy` (enum: `silent` | `standard` | `critical`)
- `confidence` (float, 0–1)
- `source_capture_id` (fk → captures, nullable)
- `parent_event_id` (fk → events, nullable) — for linked events
- `status` (enum: `active` | `snoozed` | `done` | `cancelled`)
- `created_at`, `updated_at`

### `reminders`
- `id` (uuid, PK)
- `event_id` (fk)
- `fires_at` (timestamptz)
- `channel` (enum: `local_notification` | `push` | `alarm`)
- `fired` (bool, default false)

### `captures`
- `id` (uuid, PK)
- `user_id` (fk)
- `raw_content` (text) — the original shared text
- `source` (enum: `share_sheet` | `voice` | `manual` | `email` | `screenshot`)
- `media_url` (text, nullable) — for voice recordings
- `llm_input` (jsonb) — what we sent to the LLM
- `llm_output` (jsonb) — what the LLM returned
- `llm_model` (text)
- `llm_cost_cents` (int)
- `processed` (bool)
- `created_at`

### Row-Level Security
All tables have RLS enabled. Policy: `user_id = auth.uid()` on every read/write.

---

## 6. Phased Build Plan

Each phase has a clear deliverable and demo criterion. Status is updated after each.

---

### ⏳ Phase 0 — Foundation
**Goal:** All accounts exist, monorepo boots, basic "hello world" runs on iOS + Android + Web.

**Agent tasks:**
- [x] Initialize pnpm + Turborepo monorepo in `c:\DRIVE\src\PLOTTO` (2026-04-21)
- [x] Scaffold `apps/mobile` (Expo + NativeWind + Expo Router) (2026-04-21)
- [x] Scaffold `apps/web` (Next.js 15 + Tailwind + shadcn) (2026-04-21)
- [x] Scaffold `packages/schema`, `packages/db`, `packages/ai`, `packages/tsconfig`, `packages/ui-tokens` (2026-04-21)
- [x] Configure root `tsconfig.json`, `turbo.json`, `pnpm-workspace.yaml` (2026-04-21)
- [x] Initialize git repo with `.gitignore` (2026-04-21)
- [x] Write root `README.md` (2026-04-21)

**User tasks (blocks until done):**
- [ ] Create Supabase project named `plotto` (free tier) — provide project URL + anon key + service role key
- [ ] Create OpenAI account + add $20 prepaid credit → provide API key
- [ ] Create Expo account → login via CLI when prompted
- [ ] Verify Apple Developer account is active
- [ ] Verify Google Play Console account is active
- [ ] Purchase/assign Vercel account for web deploy

**Agent will handle via Playwright MCP** (see `CLAUDE.md`):
- [ ] Navigate user through Supabase dashboard screens
- [ ] Auto-configure Supabase auth providers (Apple + Google)
- [ ] Set up Vercel project with correct env vars
- [ ] Connect Expo to EAS

**Done when:**
- `pnpm dev:mobile` opens Expo in simulator
- `pnpm dev:web` runs Next.js on localhost:3000
- Both show a "Plotto — Hello" screen
- Supabase dashboard shows empty `plotto` project

---

### ⏳ Phase 1 — Core Data Model + Auth
**Goal:** Users can sign up and events persist in Supabase with RLS.

**Agent tasks:**
- [ ] Write Drizzle schema matching §5
- [ ] Generate SQL migrations → apply to Supabase
- [ ] Enable RLS policies on all tables
- [ ] Configure Supabase Auth: email magic link, Apple Sign-In, Google Sign-In
- [ ] Write `packages/schema/event.ts` (Zod) — single source of truth
- [ ] Create Supabase client wrappers in `apps/mobile/lib/supabase.ts` and `apps/web/lib/supabase.ts`
- [ ] Implement sign-in screens (mobile + web)
- [ ] Implement a dummy "Create Event" form wired to DB

**Done when:**
- User signs up on mobile → sees their own events only
- User signs up on web → same user, same events visible
- `SELECT` from another user returns 0 rows (RLS verified)

---

### ⏳ Phase 2 — LLM Extraction Pipeline
**Goal:** Paste any text → get a validated Event back in the DB.

**Agent tasks:**
- [ ] Write `packages/ai/extraction.ts` — typed OpenAI call (structured outputs) with Zod response validation
- [ ] Design extraction system prompt (v1) with few-shot examples
- [ ] Implement `supabase/functions/extract-event/index.ts` Edge Function
- [ ] Add `captures` table write before LLM call (audit trail)
- [ ] Implement confidence threshold logic — escalate to GPT-4o if < 0.7
- [ ] Implement clarifying-question path for confidence < 0.5
- [ ] Wire Langfuse tracing on every LLM call
- [ ] Cost accounting: write `llm_cost_cents` to every capture
- [ ] Write golden test set (30 example inputs → expected outputs)
- [ ] Add prompt caching (OpenAI — when available on chosen model)

**Done when:**
- POST to `/extract-event` with `"dentist friday 9am"` returns a valid Event
- 90%+ accuracy on the golden test set
- Every call visible in Langfuse with cost + latency
- Under $0.005 per capture on average

---

### ⏳ Phase 3 — Mobile App Core (iOS + Android)
**Goal:** The timeline view works, events extracted via LLM show up, basic calendar toggle.

**Agent tasks:**
- [ ] Build **Timeline screen** — vertical chronological list with grouping ("Tonight," "Tomorrow Morning," etc.)
- [ ] Build **Calendar screen** — week/month grid view
- [ ] Build **Manual capture** flow — text input → extraction → save
- [ ] Build **Voice capture** — `expo-av` recording → upload to Supabase Storage → Whisper → extraction
- [ ] Build **Event detail** screen with edit/delete
- [ ] Build **Event create/edit** form (fallback when AI fails)
- [ ] Offline-first: sync local SQLite ↔ Supabase
- [ ] Optimistic updates via TanStack Query
- [ ] Dark mode + light mode
- [ ] Pull-to-refresh + empty states

**Done when:**
- User types "soccer saturday 11am" → appears in timeline in <3s
- Works offline (writes queue, syncs on reconnect)
- Visual polish matches design direction (warm, timeline-native)

---

### ⏳ Phase 4 — Share Extension / Share Intent
**Goal:** User can share any text/URL/screenshot to Plotto from any app.

**Agent tasks:**
- [ ] Install + configure `expo-share-intent`
- [ ] Configure iOS App Group identifier (requires user to do one step in Apple Developer portal)
- [ ] Implement intent handler in mobile app
- [ ] Route shared content → captures table → extraction
- [ ] Handle iOS 120MB memory limit in Share Extension
- [ ] Handle Android intent variations (text, URL, image)
- [ ] OCR pipeline for shared screenshots (future; stub for now)

**Done when:**
- Share any iMessage to Plotto → event appears
- Share any Gmail email to Plotto → event appears
- Share a screenshot → stub says "OCR coming soon"

**User manual step:**
- Create App Group in Apple Developer portal (Agent walks through via Playwright MCP)

---

### ⏳ Phase 5 — Notifications Engine
**Goal:** Reminders fire reliably per-event with the correct strategy.

**Agent tasks:**
- [ ] Install + configure `expo-notifications`
- [ ] Implement local notification scheduler respecting iOS 64-notification limit
- [ ] Background task (daily) to roll forward scheduled notifications
- [ ] Per-event reminder strategies:
  - `silent` — just show in timeline
  - `standard` — 1 notification at offset
  - `critical` — multi-stage (30m / 10m / at-time) with alarm sound
- [ ] Server-side push fallback via Supabase + Expo Push
- [ ] Handle timezone changes on device
- [ ] Android OEM compatibility testing (Samsung, Xiaomi)

**Done when:**
- Set up a test event 5 min from now → reminder fires reliably
- Critical event with sound works even with phone on silent (respects OS rules)

---

### ⏳ Phase 6 — Web Dashboard
**Goal:** Big-screen view to plan, bulk edit, and manage subscription.

**Agent tasks:**
- [ ] Set up Next.js 15 app with Tailwind + shadcn/ui
- [ ] Auth via Supabase (shared user base with mobile)
- [ ] Timeline view (desktop layout — 3-column: today / week / upcoming)
- [ ] Calendar grid view (full week + month)
- [ ] Bulk edit (select multiple, snooze, delete, mark done)
- [ ] Weekly review page (last week's completed + next week's upcoming)
- [ ] Account + billing page (Stripe integration, Pro/Family tiers)
- [ ] Deploy to Vercel
- [ ] Point `app.getplotto.com` DNS at Vercel (Agent via Playwright MCP)

**Done when:**
- User logs into web, sees same events as mobile
- Can bulk-edit 10 events at once
- Subscription upgrade works end-to-end

---

### ⏳ Phase 7 — Polish, Analytics, Observability
**Goal:** Production-ready instrumentation.

**Agent tasks:**
- [ ] Install Sentry on mobile + web
- [ ] Install PostHog on mobile + web
- [ ] Define core events: `capture_created`, `event_extracted`, `reminder_fired`, `reminder_dismissed`, `event_completed`
- [ ] Configure Langfuse dashboards: cost/day, p95 latency, extraction accuracy
- [ ] Set up Supabase DB backups
- [ ] Performance pass on mobile (FlashList, Reanimated)
- [ ] Accessibility audit (VoiceOver + TalkBack)
- [ ] Privacy policy + terms of service (Agent drafts, user reviews)
- [ ] App Store + Play Store privacy nutrition labels

**Done when:**
- All events tracked in PostHog
- Errors surface in Sentry within seconds
- Langfuse shows LLM costs per user

---

### ⏳ Phase 8 — Store Submission + Launch
**Goal:** Live in App Store, Play Store, and on web.

**Agent tasks:**
- [ ] Generate all required screenshots (App Store + Play Store)
- [ ] Write store listings (title, subtitle, description, keywords)
- [ ] Build production release via EAS
- [ ] Submit to TestFlight (iOS) + Internal Testing (Android)
- [ ] Collect 20 beta testers (user's network + landing page waitlist)
- [ ] Fix bugs from beta
- [ ] Submit to App Store + Play Store production
- [ ] Ship `getplotto.com` landing page + `app.getplotto.com` dashboard

**User manual steps:**
- Approve TestFlight distribution
- Approve store submissions
- Click "Release to production" once approved

**Done when:**
- App is downloadable on both stores
- Web dashboard is live
- First 100 waitlist users invited

---

### ⏳ Phase 9 — Post-Launch Iteration
**Goal:** Grow to 1,000 weekly active users.

**Agent + user tasks (ongoing):**
- [ ] Gmail integration (high-value Phase 2 feature)
- [ ] Screenshot OCR for WhatsApp / iMessage
- [ ] Household sharing (shared timelines between partners)
- [ ] Smart conflict resolution UI
- [ ] Natural language query ("when am I free Thursday?")
- [ ] Widgets (iOS + Android home screens)
- [ ] Apple Watch complication
- [ ] Continuous improvement of extraction prompt based on error logs

---

## 7. Risk Register

| Risk | Mitigation |
|---|---|
| Apple rejects Share Extension on first submit | Budget 2–5 extra days; Agent knows common rejection reasons |
| LLM extraction accuracy below 90% | Golden test set in Phase 2; iterate prompt before Phase 3 ends |
| Android OEMs kill scheduled notifications | Test on Samsung + Xiaomi in Phase 5; use `setExactAndAllowWhileIdle` |
| Supabase free tier exhausted | Pro tier is $25/mo; expected after first 500 active users |
| LLM costs spiral | Cost tracking from Phase 2; cap per-user daily quota if needed |
| User overwhelmed with manual steps | Playwright MCP automation (see `CLAUDE.md`) minimizes this |
| Sherlocked by Apple Intelligence / Google Gemini | Move fast, own capture ubiquity + household sharing as moat |

---

## 8. Budget & Timeline

| Phase | Target duration | Services cost |
|---|---|---|
| Phase 0 | 2–3 days | ~$0 |
| Phase 1 | 2–3 days | ~$0 |
| Phase 2 | 3–5 days | ~$5 (LLM credits) |
| Phase 3 | 5–7 days | ~$10 |
| Phase 4 | 3–5 days | ~$10 |
| Phase 5 | 2–3 days | ~$10 |
| Phase 6 | 3–5 days | ~$15 |
| Phase 7 | 2–3 days | ~$20 |
| Phase 8 | 3–5 days | ~$100 (EAS + dev accounts) |
| **Total build** | **~5–6 weeks** | **~$170** |

Ongoing run cost post-launch: ~$60/mo until ~500 users, scales linearly.

---

## 9. Session Handoff Protocol

At the start of every working session, the agent must:

1. Read `PRODUCT.md` — confirm product truth hasn't drifted
2. Read `PLAN.md` (this file) — identify next unchecked task
3. Read `CLAUDE.md` — confirm operating rules + MCP tools available
4. Announce the current phase + next task before doing anything
5. Update this file's Status Summary at the end of every session

At the end of every session:

1. Update `## 📊 Status Summary` with what moved
2. Check off completed tasks with dates (e.g., `[x] Task (2026-05-01)`)
3. Note any new blockers in the relevant phase
4. Commit all changes with a descriptive message

---

## 10. Next Concrete Action

**Immediate next step:** Phase 0, Task 1 — Initialize pnpm + Turborepo monorepo in `c:\DRIVE\src\PLOTTO`.

Waiting on user to:
1. Give the go-ahead to begin Phase 0
2. Be ready to open Supabase dashboard, OpenAI platform, and Vercel for Playwright-MCP-assisted setup when reached
