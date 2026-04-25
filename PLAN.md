# Toatre — Master Build Plan

> **CONFIDENTIAL — PROPRIETARY & NDA-PROTECTED**
> © 2026 Saraf Talukder. All rights reserved.
> See [PRODUCT.md](PRODUCT.md) for full IP notice.

> **Sources of truth:**
> - [PRODUCT.md](PRODUCT.md) — what we're building and why
> - [ARCHITECTURE.md](ARCHITECTURE.md) — how we're building it
> - This file — when we're building what, with checklists + status

---

## 📊 Status Summary

**Last updated:** 2026-04-25 (project kicked off, greenfield)
**Current phase:** Phase 0 — Accounts + scaffold (in progress)
**Platforms:** iOS (TestFlight first), Android (always-buildable, ships to Play Internal in Phase 8), Web (toatre.com)
**Build mode:** AI-driven. Owner directs, agent builds end-to-end.

### Decisions locked 2026-04-25
- Apple team: **Saraf Talukder** (`8B9NZ6FRKF`)
- Bundle ID: `com.toatre.app`
- DO team: **iReve**, project `toatre`
- MongoDB: co-tenanted in existing Mutqin Atlas org/cluster, isolated by DB name `toatre_prod`
- Brand gradient single-source: `mobile/lib/utils/app_colors.dart` + `web/src/app/globals.css`
- iOS-first to TestFlight; Android kept buildable; Play submission Phase 8

---

## 🗺️ Phase Index

| # | Phase | Status |
|---|---|---|
| 0 | Accounts + scaffold | 🚧 in progress |
| 1 | Auth end-to-end | ⏳ |
| 2 | Capture + AI extraction | ⏳ |
| 3 | Timeline + detail editor | ⏳ |
| 4 | Pings (notifications) | ⏳ |
| 5 | Sharing + people graph | ⏳ |
| 6 | Settings + privacy | ⏳ |
| 7 | Polish + analytics | ⏳ |
| 8 | Beta launch (TestFlight + Play Internal + web) | ⏳ |
| 9 | Store submission (App Store + Play Store) | ⏳ |
| 10 | Monetization (paid Pro tier with SMS reminders) | ⏳ |

---

## 0. Phase 0 — Accounts + Scaffold

**Goal:** Both apps boot locally on a clean repo. CI pipelines exist
(may not yet succeed). All third-party accounts provisioned. The first
empty TestFlight build is queued.

**Exit criteria:**
- Visiting a placeholder at `toatre.com` returns 200 (DO App Platform deployed).
- Flutter app launches on iOS simulator **and** Android emulator showing the empty Timeline screen.
- `git push main` triggers a Codemagic build (may not pass yet — just must trigger).
- All env-var slots in `.env.example` have a real value somewhere safe (1Password / Codemagic / DO App Platform secrets).

### 0.1 — Repository scaffold (local, agent does)
- [ ] Create `Toatre/.gitignore` (Flutter + Node + IDEs + secrets)
- [ ] Create `Toatre/.env.example` (matches `ARCHITECTURE.md §13`)
- [ ] Create `Toatre/CLAUDE.md` (agent operating rules)
- [ ] Create `Toatre/PLAN.md` (this file)
- [ ] `git init` on `Toatre/`, branch `main`
- [ ] Add remote `origin git@github.com:realsaraf/toatre.git`
- [ ] First commit: `chore: initial Toatre scaffold (PRODUCT, ARCHITECTURE, PLAN, CLAUDE, README)`

### 0.2 — Flutter app scaffold (`mobile/`)
- [ ] `flutter create --org com.toatre --project-name toatre --platforms ios,android mobile`
- [ ] Verify `mobile/ios/Runner.xcodeproj` bundle id is `com.toatre.app`
- [ ] Verify `mobile/android/app/build.gradle.kts` applicationId is `com.toatre.app`
- [ ] Replace generated `pubspec.yaml` with the locked deps from `ARCHITECTURE.md §4`
- [ ] Replace `mobile/lib/main.dart` with Sentry+Firebase init + `runApp(const ToatreApp())`
- [ ] Create `mobile/lib/app.dart` (MultiProvider + MaterialApp, dark theme)
- [ ] Create `mobile/lib/config/theme_config.dart`
- [ ] Create `mobile/lib/utils/app_colors.dart` with single-source brand gradient
- [ ] Create `mobile/lib/utils/text_styles.dart` (Inter)
- [ ] Stub all directories from `ARCHITECTURE.md §4` with `.gitkeep` files
- [ ] Stub `mobile/lib/ui/splash/splash_screen.dart` (logo + 1s pause → Timeline)
- [ ] Stub `mobile/lib/ui/timeline/timeline_screen.dart` (empty state + mic FAB)
- [ ] Stub providers (auth, toats, capture, pings, settings) as empty ChangeNotifiers
- [ ] `flutter pub get` runs clean
- [ ] `flutter analyze` runs clean
- [ ] App boots on iOS simulator showing dark splash → empty Timeline
- [ ] App boots on Android emulator showing same

### 0.3 — Next.js app scaffold (`web/`)
- [ ] `pnpm create next-app@latest web --ts --tailwind --app --src-dir --import-alias '@/*' --use-npm` (despite name, project uses npm to match Mutqin)
- [ ] Upgrade to Next.js 16, React 19 (`npm install next@latest react@latest react-dom@latest`)
- [ ] Tailwind v4 config with brand gradient CSS vars
- [ ] Create `web/src/app/globals.css` with single-source brand gradient + glass-card utility classes
- [ ] Replace `web/src/app/page.tsx` with placeholder landing ("Toatre — coming soon")
- [ ] Stub `web/src/app/api/health/route.ts` (returns `{ ok: true, sha }`)
- [ ] Stub all directories from `ARCHITECTURE.md §5` with `.gitkeep`
- [ ] Add `eslint`, `prettier`, `tsc --noEmit` to npm scripts
- [ ] `npm run lint` clean, `npm run build` clean
- [ ] `npm run dev` shows the placeholder at `localhost:3000`

### 0.4 — Brand assets generation
- [ ] Port `scripts/generate-icons.mjs` from old PLOTTO repo
- [ ] Generate `web/public/icon-*.png`, `web/public/og-image.png`, `web/src/app/icon.png`, `web/src/app/apple-icon.png`, `web/public/favicon.ico`
- [ ] Generate `mobile/assets/icon.png` (1024), `mobile/assets/adaptive-icon.png`, `mobile/assets/splash.png`
- [ ] Run `flutter_launcher_icons` to push into iOS + Android native projects
- [ ] Verify on simulator: home-screen icon is the Toatre mark
- [ ] Build `mobile/lib/widgets/toatre_mark.dart` (SVG wordmark)
- [ ] Build `web/src/components/ToatreMark.tsx` (SVG wordmark)

### 0.5 — Mobile CI/CD (Codemagic)
- [ ] Author `mobile/codemagic.yaml` modeled on Mutqin's, bundle `com.toatre.app`, team `8B9NZ6FRKF`
- [ ] Workflows: `ios-release` (push to main → TestFlight), `ios-adhoc`, `android-release` (push to main → Play Internal), `flutter-test` (every PR)
- [ ] **[Playwright + user]** Codemagic dashboard: add Toatre app, link `realsaraf/toatre` repo
- [ ] **[Playwright + user]** Codemagic: link App Store Connect API key integration (reuse Mutqin's if same Apple ID, otherwise add new key)
- [ ] **[Playwright + user]** Codemagic: link Google Play service account (defer until Phase 8 Android submission)
- [ ] First Codemagic build triggered (allowed to fail — verifying webhook + repo link)

### 0.6 — Web CI/CD (DigitalOcean App Platform)
- [ ] Create `.do/app.yaml` spec (build command `cd web && npm ci && npm run build`, run `cd web && npm start`, health `/api/health`)
- [ ] Add scheduled jobs spec for `* * * * * GET /api/cron/fire-pings` (gated by `CRON_SECRET`) and `0 3 * * * GET /api/cron/cleanup-captures`
- [ ] **[Playwright + user]** DO dashboard (team **iReve**): create App Platform app `toatre-prod`, link GitHub `realsaraf/toatre`, branch `main`, autodeploy on
- [ ] **[Playwright + user]** DO dashboard: paste env vars from secret store
- [ ] First deploy: `toatre-prod-*.ondigitalocean.app` returns 200 on landing page
- [ ] **[Playwright + user]** DO Spaces: create bucket `toatre-prod` in NYC3
- [ ] **[Playwright + user]** Generate Spaces access key, store in DO App Platform env

### 0.7 — Domain wiring
- [ ] **[Playwright + user]** DO App Platform: add domain `toatre.com` + `www.toatre.com`
- [ ] **[Playwright + user]** Squarespace DNS: add records DO instructs (typically `A`/`ALIAS` to DO's IP and `CNAME www`)
- [ ] **[Playwright + user]** Squarespace DNS: add Resend records (DKIM, SPF, MX `send`)
- [ ] Verify SSL provisioned (Let's Encrypt via DO)
- [ ] Verify `https://toatre.com` shows the placeholder

### 0.8 — Firebase
- [ ] **[Playwright + user]** Firebase Console: create project `toatre-prod`
- [ ] **[Playwright + user]** Enable Auth providers: Google, Apple, Email link, Phone
- [ ] **[Playwright + user]** Add iOS app `com.toatre.app` → download `GoogleService-Info.plist` → save to `mobile/ios/Runner/`
- [ ] **[Playwright + user]** Add Android app `com.toatre.app` → download `google-services.json` → save to `mobile/android/app/`
- [ ] **[Playwright + user]** Add Web app → copy config keys into `.env.example`-shaped doc, paste actual values into local `.env.local` and DO env
- [ ] Run `flutterfire configure` locally to generate `mobile/lib/firebase_options.dart`
- [ ] **[Playwright + user]** Generate Firebase Admin service account JSON → store as `FIREBASE_*` env in DO + `.env.local`
- [ ] **[Playwright + user]** Enable Cloud Messaging (FCM) for push
- [ ] **[Playwright + user]** Apple Developer portal: upload APNs key (or auth key) for FCM
- [ ] **[Playwright + user]** Enable Remote Config; seed default keys (per `ARCHITECTURE.md §1` env section)

### 0.9 — Apple Developer
- [ ] **[Playwright + user]** Confirm team `Saraf Talukder` (`8B9NZ6FRKF`) is current account
- [ ] **[Playwright + user]** Create App ID `com.toatre.app` with capabilities: Push Notifications, Sign in with Apple, App Groups (reserved for share extension), Time Sensitive Notifications, Critical Alerts (request entitlement — Apple takes weeks to grant)
- [ ] **[Playwright + user]** App Store Connect: create app record `Toatre`, primary language `en-US`, SKU `toatre-ios-001`, bundle `com.toatre.app`
- [ ] **[Playwright + user]** Generate ASC API key with App Manager role, download `.p8`, capture Issuer ID + Key ID → store in Codemagic
- [ ] **[Playwright + user]** Add `realsaraf@gmail.com` (and any test emails) as internal TestFlight testers

### 0.10 — MongoDB Atlas
- [ ] **[Playwright + user]** Atlas: confirm logged into existing Mutqin org
- [ ] **[Playwright + user]** Atlas: in existing cluster, create database user `toatre_prod_app` with `readWrite` scoped to `toatre_prod` only
- [ ] **[Playwright + user]** Atlas: create database user `toatre_dev_app` scoped to `toatre_dev`
- [ ] **[Playwright + user]** Atlas: add DO App Platform's outbound IP range to network access (or `0.0.0.0/0` short-term, then tighten in Phase 7)
- [ ] **[Playwright + user]** Capture connection strings → store as `MONGODB_URI` in DO env + `.env.local`
- [ ] Author `web/src/lib/mongo/indexes.ts` with all indexes from `ARCHITECTURE.md §6`
- [ ] Author `scripts/seed-mongo.mjs` to insert `reminder_policies` rows from `PRODUCT.md §7`

### 0.11 — Resend
- [ ] **[Playwright + user]** Resend: confirm `toatre.com` sender domain still verified (carried over from Plotto era — no action if green)
- [ ] **[Playwright + user]** Create new API key `toatre-prod-app` with Sending access only
- [ ] Store as `RESEND_API_KEY` in DO + `.env.local`
- [ ] Set `REMINDER_FROM_EMAIL=Toatre <hello@toatre.com>`

### 0.12 — Twilio
- [ ] **[Playwright + user]** Twilio: confirm account active under owner's email
- [ ] **[Playwright + user]** Create Verify Service `toatre-prod`
- [ ] **[Playwright + user]** Buy SMS-capable phone number for outbound reminders
- [ ] Store SID, auth token, Verify SID, From number in DO + `.env.local`

### 0.13 — OpenAI
- [ ] **[Playwright + user]** OpenAI Console: create new project `toatre-prod`
- [ ] **[Playwright + user]** Generate API key scoped to project `toatre-prod`
- [ ] **[Playwright + user]** Set $50/mo soft limit and email alert at 80%
- [ ] Store as `OPENAI_API_KEY` in DO + `.env.local`

### 0.14 — Langfuse
- [ ] **[Playwright + user]** Langfuse: create project `toatre-prod`
- [ ] **[Playwright + user]** Capture public key + secret key → store in DO + `.env.local`

### 0.15 — Sentry
- [ ] **[Playwright + user]** Sentry: create org `toatre` (or reuse existing if owner already has personal org)
- [ ] **[Playwright + user]** Create projects: `toatre-mobile` (Flutter), `toatre-web` (Next.js)
- [ ] Capture DSN values → store in DO + `.env.local` + Codemagic
- [ ] **[Playwright + user]** Generate Sentry CLI auth token for source map uploads → Codemagic + DO

### 0.16 — PostHog
- [ ] **[Playwright + user]** PostHog: create project `toatre-prod` under existing account
- [ ] Capture project API key + host → store in DO + `.env.local`
- [ ] Wire `posthog_flutter` and `posthog-js` as no-op in dev / live in prod

### 0.17 — Repository hygiene
- [ ] Author `CONTRIBUTING.md` (style guide pointer + branch protection rules)
- [ ] Add brand-hex CI grep guard (script in `scripts/lint-brand-hex.mjs` + GitHub Action)
- [ ] **[user]** GitHub: enable branch protection on `main` (require PR, require status checks)
- [ ] **[Playwright + user]** GitHub: confirm `realsaraf/toatre` exists (rename pending from earlier today). If repo already exists, agent will FORCE-PUSH the new scaffold over old contents — needs explicit go-ahead.

### 0.18 — Phase 0 closeout
- [ ] All [Playwright + user] items checked
- [ ] All `[ ]` automated items checked
- [ ] Sanity: `https://toatre.com` returns 200 with placeholder
- [ ] Sanity: `git push main` from local triggers Codemagic build (may fail signing — that's a Phase 0 acceptable miss; signing fully wired in Phase 1)
- [ ] Update Status Summary at top of this file
- [ ] Tag `v0.0.0-scaffold`

---

## 1. Phase 1 — Auth End-to-End

**Goal:** Sign-in works on mobile + web with Google + Apple + Email magic link + Phone OTP. Users persist in Mongo. First TestFlight build that *does something* lands in testers' hands.

### 1.1 — Server-side auth
- [ ] `web/src/lib/firebase/admin.ts` — Firebase Admin SDK init from env
- [ ] `web/src/lib/auth/session.ts` — cookie helpers (HttpOnly, Secure, SameSite=Lax, scoped `.toatre.com`)
- [ ] `web/src/lib/auth/require-user.ts` — verifies Firebase ID token, upserts `users` row, returns typed user
- [ ] `web/src/lib/mongo/scoped.ts` — wrapped collection getters that mandate `owner_id` predicate
- [ ] `POST /api/auth/session` — exchange ID token → set cookie + upsert user
- [ ] `POST /api/auth/logout` — clear cookie
- [ ] `GET /api/users/me` — returns current user profile
- [ ] `PATCH /api/users/me` — update display_name, handle, timezone, photo_url
- [ ] Zod schemas for all bodies
- [ ] Sentry breadcrumbs (no PII) on every request
- [ ] Rate-limit `POST /api/auth/session` per-IP

### 1.2 — Mobile auth UI
- [ ] `mobile/lib/services/auth_service.dart` — Firebase Auth + Google + Apple + email link + phone OTP
- [ ] `mobile/lib/providers/auth_provider.dart` — state machine (unknown / signed_out / signing_in / signed_in / error)
- [ ] `mobile/lib/services/token_manager.dart` — attaches Firebase ID token to every API request
- [ ] `mobile/lib/services/api_service.dart` — http wrapper with retry + token refresh on 401
- [ ] `mobile/lib/ui/auth/login_screen.dart` — tabbed (Google / Apple / Email / Phone)
- [ ] `mobile/lib/ui/auth/email_link_screen.dart`
- [ ] `mobile/lib/ui/auth/phone_otp_screen.dart`
- [ ] `mobile/lib/ui/splash/splash_screen.dart` — routes to login or timeline based on auth state
- [ ] iOS native: Apple sign-in capability enabled in `ios/Runner/Runner.entitlements`
- [ ] Android native: Google sign-in SHA fingerprints registered in Firebase Console (Playwright + user)

### 1.3 — Web auth UI
- [ ] `web/src/components/AuthProvider.tsx` — Firebase Web SDK + cookie sync
- [ ] `web/src/app/login/page.tsx` — tabbed (Google / Apple / Email / Phone)
- [ ] `web/src/app/signup/page.tsx` (or merge with login)
- [ ] `web/src/app/(authed)/layout.tsx` — server-side `requireUser()` + redirect to `/login` if absent
- [ ] `web/src/app/timeline/page.tsx` — placeholder authed home
- [ ] Magic-link handler at `/login/verify`
- [ ] Phone OTP via Twilio Verify (server-side route to issue + check)

### 1.4 — Account linking + edge cases
- [ ] Same-email auto-link across providers (Firebase setting + server upsert by `email`)
- [ ] Phone number verification flow attaches to existing user, never creates duplicate
- [ ] Account deletion stub (`DELETE /api/users/me`) — full implementation in Phase 6
- [ ] FCM token registration after sign-in (mobile only)

### 1.5 — Phase 1 closeout
- [ ] Sign in via all 4 providers succeeds on iOS TestFlight
- [ ] Sign in via all 4 providers succeeds on web at `toatre.com`
- [ ] User row in Mongo has `firebase_uid`, `email`, `providers`, `fcm_tokens` populated
- [ ] Tag `v0.1.0-auth`

---

## 2. Phase 2 — Capture + AI Extraction

**Goal:** Speak into the mic → get structured toats on the timeline.

### 2.1 — Mobile capture
- [ ] `mobile/lib/services/audio_service.dart` — record (m4a), silence detect, save to temp
- [ ] `mobile/lib/services/stt_service.dart` — Apple Speech (iOS), `speech_to_text` (Android), fallback flag
- [ ] `mobile/lib/providers/capture_provider.dart` — state machine (idle → recording → transcribing → extracting → done | error)
- [ ] `mobile/lib/ui/capture/capture_screen.dart` — full-screen modal with `MicButton`
- [ ] `mobile/lib/ui/capture/components/mic_button.dart` — pulse animation, haptics, accessibility
- [ ] `mobile/lib/ui/capture/components/transcript_preview.dart`
- [ ] `mobile/lib/ui/capture/components/extracted_toats_list.dart` — confirm/edit before save
- [ ] Permission flow: mic + speech recognition (iOS) + record_audio (Android)
- [ ] Manual entry fallback (`manual_form.dart`)

### 2.2 — Server-side extraction pipeline
- [ ] `web/src/lib/ai/openai.ts` — client + retry + cost capture
- [ ] `web/src/lib/ai/langfuse.ts` — trace wrapper
- [ ] `web/src/lib/ai/prompts/extract.system.md` — locked extraction prompt
- [ ] `web/src/lib/ai/prompts/extract.examples.md` — few-shot examples
- [ ] `web/src/lib/ai/extract.ts` — Structured Outputs call, returns Zod-validated `ExtractionResult`
- [ ] `POST /api/captures` — store capture, kick off extraction (sync for now; queue in Phase 7)
- [ ] `POST /api/extract` — runs the pipeline, low-confidence escalation to GPT-4o
- [ ] `POST /api/transcribe` — Whisper fallback when on-device STT failed/unconfident
- [ ] People resolution + dedup
- [ ] Insert toats + capture + initial pings inside one Mongo session (transactional)

### 2.3 — Cost guardrails
- [ ] Per-user daily extraction quota (default 100, configurable via Remote Config)
- [ ] Sentry alert if avg cost per capture > $0.01

### 2.4 — Phase 2 closeout
- [ ] "Dinner with Priya tomorrow at 7" → one `event` toat, correct time, person resolved
- [ ] "Pick up dry cleaning Friday and call mom this weekend" → 2 toats (`errand`, `task`)
- [ ] Langfuse shows traces with cost cents
- [ ] Tag `v0.2.0-capture`

---

## 3. Phase 3 — Timeline + Detail Editor

### 3.1 — Mobile timeline
- [ ] `mobile/lib/providers/toats_provider.dart` — fetch, group, cache, sync
- [ ] `mobile/lib/ui/timeline/timeline_screen.dart` — Today / Week / Upcoming / Past sections
- [ ] `mobile/lib/ui/timeline/components/toat_card.dart` — kind-aware rendering
- [ ] Tier indicator + people pills + quick-action row (Done / Snooze)
- [ ] Pull-to-refresh
- [ ] Empty states per section

### 3.2 — Mobile detail editor
- [ ] `mobile/lib/ui/toat_detail/toat_detail_screen.dart`
- [ ] Kind picker, tier picker, time picker, people picker
- [ ] Audit log tab (collapsed by default)

### 3.3 — Web timeline + editor
- [ ] `web/src/app/timeline/page.tsx` — same sections + filtering by kind/tier/person
- [ ] `web/src/app/toats/[id]/page.tsx` — editor

### 3.4 — APIs
- [ ] `GET /api/toats?range=today|week|upcoming|past`
- [ ] `POST /api/toats`, `GET /api/toats/[id]`, `PATCH /api/toats/[id]`, `DELETE /api/toats/[id]`
- [ ] Audit log written on every mutation
- [ ] Optimistic updates on mobile + web

### 3.5 — Phase 3 closeout
- [ ] Edit on mobile reflects on web in <2s, vice versa
- [ ] Tag `v0.3.0-timeline`

---

## 4. Phase 4 — Pings (Notifications)

### 4.1 — Server
- [ ] `web/src/lib/pings/policies.ts` — policy lookup
- [ ] `web/src/lib/pings/compute.ts` — generate `pings` rows for a toat (called on toat create/update)
- [ ] `web/src/lib/pings/dispatch.ts` — fetch due, send, mark fired (idempotent via `findOneAndUpdate`)
- [ ] `GET /api/cron/fire-pings` (gated by `CRON_SECRET`)
- [ ] FCM payload builder (regular + critical alert)
- [ ] Resend reminder template
- [ ] Twilio SMS dispatch (gated: opt-in + free-tier flag — Phase 10 will gate on subscription)

### 4.2 — Mobile
- [ ] `mobile/lib/services/notifications_service.dart` — `flutter_local_notifications` + FCM
- [ ] Schedule local pings on toat create/update (next 72h window)
- [ ] Re-schedule on app foreground
- [ ] Handle FCM background messages
- [ ] Tap → deep-link to toat detail

### 4.3 — DO scheduled job
- [ ] DO App Platform: schedule `* * * * * GET /api/cron/fire-pings` with `CRON_SECRET` header
- [ ] DO App Platform: schedule `0 3 * * * GET /api/cron/cleanup-captures`

### 4.4 — Phase 4 closeout
- [ ] Urgent toat created on mobile fires local + push + email at right times
- [ ] App in background still receives push on time
- [ ] Tag `v0.4.0-pings`

---

## 5. Phase 5 — Sharing + People

- [ ] People CRUD (add manually, auto-extract from captures, link to Toatre user by handle/email)
- [ ] Share UI on toat detail
- [ ] Public preview at `/j/[token]`
- [ ] Recipient timelines show shared toats with owner badge
- [ ] Email invite via Resend
- [ ] Revoke share
- [ ] Tag `v0.5.0-share`

---

## 6. Phase 6 — Settings + Privacy

- [ ] Settings screen (mobile + web): timezone, work schedule, voice retention, default tier, language
- [ ] Account deletion (truly deletes everything — see `ARCHITECTURE.md §16`)
- [ ] Data export (JSON download)
- [ ] Privacy policy + ToS pages (carry over Plotto-era text, update sub-processor list)
- [ ] Cookie banner (web)
- [ ] Tag `v0.6.0-privacy`

---

## 7. Phase 7 — Polish + Analytics

- [ ] Empty states everywhere
- [ ] Error states everywhere
- [ ] Dark theme audit (every screen, every state)
- [ ] Accessibility audit (VoiceOver / TalkBack labels, hit targets, contrast)
- [ ] PostHog events: capture, toat_created, toat_completed, ping_delivered, share_invited, share_accepted, settings_changed
- [ ] Funnels: signup → first capture → first toat completed
- [ ] Loading skeletons
- [ ] Crash-free monitoring dashboard
- [ ] Lock connections in MongoDB (remove `0.0.0.0/0`, restrict to DO outbound IPs)
- [ ] Web CSP audit
- [ ] Tag `v0.7.0-polish`

---

## 8. Phase 8 — Beta Launch

- [ ] iOS TestFlight: external testing group of ~50, distribute via public link
- [ ] Android Play Internal Track: upload signed AAB, invite ~50 testers
- [ ] Web at `toatre.com` open
- [ ] Owner-side support email `support@toatre.com`
- [ ] Status page (DO Uptime monitor → public page)
- [ ] In-app feedback button (writes to a `feedback` Mongo collection + sends Slack/email to owner)
- [ ] Critical Alerts entitlement granted (or paperwork submitted; usable feature gated until granted)
- [ ] Tag `v0.8.0-beta`

---

## 9. Phase 9 — Store Submission

- [ ] App Store: screenshots (all device sizes), preview video, privacy nutrition labels, age rating, support URL, marketing URL
- [ ] Play Store: same equivalents (graphic asset, feature graphic, content rating questionnaire, data safety form)
- [ ] Both stores: respond to reviewer questions
- [ ] Trademark filing (USPTO ITU) submitted by owner
- [ ] Tag `v1.0.0`

---

## 10. Phase 10 — Monetization

- [ ] Stripe integration (web subscriptions)
- [ ] StoreKit 2 (iOS) + Play Billing (Android) for in-app subscription
- [ ] Pro tier: SMS reminders, voice retention with longer history, calendar sync (later)
- [ ] Subscription status synced via `subscriptions` Mongo collection
- [ ] Existing SMS toggle gated behind `user.subscription.tier == 'pro'`
- [ ] Tag `v1.1.0-pro`

---

## Notes

- Re-read [PRODUCT.md](PRODUCT.md) and [ARCHITECTURE.md](ARCHITECTURE.md) at the start of every session before picking the next unchecked task.
- Every phase ends with a git tag. No phase is "done" until the closeout checklist passes.
- Commits use conventional commits: `feat(mobile):`, `fix(web):`, `chore:`, `ci:`, `docs:`, `perf:`.
- `[Playwright + user]` items always require the user logged in to the relevant dashboard. Agent never types credentials.
