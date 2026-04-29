# Toatre — Master Build Plan

> **CONFIDENTIAL — PROPRIETARY & NDA-PROTECTED**
> © 2026 Saraf Talukder. All rights reserved.
> See [PRODUCT.md](PRODUCT.md) for full IP notice.

> **Sources of truth:**
> - [PRODUCT.md](PRODUCT.md) — what we're building and why
> - [ARCHITECTURE.md](ARCHITECTURE.md) — how we're building it
> - [Designs.md](docs\designs\designs.md) - the details of various app screens and they layout etc
> - [mockups](docs\designs) - folder contains various screen desing mockups
> - This file — when we're building what, with checklists + status

---

## 📊 Status Summary

**Last updated:** 2026-04-28
**Current phase:** Phase 0 — Accounts + scaffold (iOS CI ✅ deployed to TestFlight; latest mobile parity build #9 finished in Codemagic; remaining: Playwright account steps)
**Platforms:** iOS (TestFlight first), Android (always-buildable, ships to Play Internal in Phase 8), Web (toatre.com)
**Build mode:** AI-driven. Owner directs, agent builds end-to-end.

**Implementation note:** Code delivery has advanced into Phases 1–3 on web and mobile while several external account/dashboard steps in Phase 0 still remain open.

### Session 2026-04-28 (server-owned Google Calendar sync) — completed
- Replaced the earlier client-owned Google Calendar permission flow with server-owned OAuth start/callback/disconnect/manual-sync API routes
- Added encrypted-at-rest OAuth token storage with AES-256-GCM and SHA-256 hashed one-time OAuth state values for lookup/verification
- Added Mongo collections and indexes for calendar sync tokens, OAuth state TTL cleanup, and toat external event mappings
- Added the Google Calendar sync worker: forward-only import from Google Calendar into Toatre, Toatre-to-Google export, two-way mode support, last-sync timestamps, and skip behavior for done/archived Toatre toats
- Wired mobile and web Settings → Sync to open backend OAuth, pause sync, and run manual sync now; scheduled DigitalOcean sync job added for every 10 minutes
- Documented required Google Calendar and token-encryption env vars in `.env.example`
- Validation: `npm run typecheck`, `npm run build`, `flutter analyze`, `flutter test`, VS Code Problems check for touched Dart files

### Session 2026-04-28 (Google Calendar sync state repair) — completed
- Fixed `/api/settings` so Google Calendar connection status is derived from the server-owned token collection instead of trusting generic settings writes
- Blocked generic settings PATCH calls from mutating `syncConnections`; sync state now has to flow through the dedicated sync endpoints
- Repaired the affected Mongo settings record, manually ran the Google Calendar sync job, and confirmed the Apr 28 Google-origin toat imported
- Validation: `npm run typecheck`, `npm run build`, VS Code Problems check for touched Settings API file

### Session 2026-04-28 (Connections-backed sharing) — completed
- Added owner-scoped Connections with CRUD APIs, Mongo indexes, web Settings UI, and mobile Settings UI so share targets come from trusted saved people instead of extracted toat text
- Added Connections context to capture extraction so relationship phrases like “call mom” can include saved names, phone numbers, handles, and notes in the LLM prompt
- Replaced the no-op share path with a real share endpoint, ACL records, public `/j/[token]` shared-toat preview page, web share modal, and mobile share screen backed by Connections
- Local smoke test: Settings → Connections loads, toat detail Share opens, and Create share link returns “Share link ready” on localhost
- Validation: `npm run typecheck`, `npm run build`, `flutter analyze`, `flutter test`, VS Code Problems check for touched web/mobile paths

### Session 2026-04-28 (mobile capture repair + share completion) — completed
- Fixed Android mobile capture analysis by adding the missing Android `INTERNET` permission and preserving uploaded mobile audio filenames/container extensions for Whisper instead of forcing every upload to `audio.webm`
- Completed the mobile share sheet empty-Connections path so it opens Settings, reloads Connections after returning, disables duplicate sends while busy, and shows every saved Connection instead of only the first three
- Validation: `npm run typecheck`, `npm run build`, `flutter analyze`, `flutter test`, `flutter build apk --debug`, VS Code Problems check for touched app paths

### Session 2026-04-27 (settings sync surface) — completed
- Added a Settings → Sync tab on mobile and web, starting with Google Calendar as the active provider plus placeholders for iOS Calendar and Office 365
- Collapsed settings navigation to three tabs on both mobile and web: General, Pings, and Sync; Handle and Phone settings now live inside General
- Added Google Calendar sync direction controls for Google → Toatre, Toatre → Google, and two-way, with copy clarifying that sync starts only from the connection time and does not hide source calendar entries when a toat is marked done
- Persisted sync connection state through the shared `/api/settings` payload via `syncConnections`, including provider, direction, connected state, connection timestamp, and forward-only start timestamp
- Wired mobile Google Calendar connect to request the Google Calendar scope through `google_sign_in`; wired web connect to request the same scope through Firebase popup/link/reauth
- Validation: `flutter analyze`, `flutter test`, `npm run typecheck`, `npm run build`

### Session 2026-04-26 (mobile parity + Android build unblocking) — completed
- Brought the Flutter mobile app much closer to the current web surface: tappable timeline cards, a full toat detail screen with quick actions, typed capture mode, a smaller empty-state capture CTA, and a real settings/profile flow for General, Phone, Handle, and Pings
- Expanded the mobile data layer with settings models/provider support plus toat fetch/update/delete/duplicate helpers and capture-mode handling so the new UI is backed by the existing web APIs
- Updated Android app build configuration for the current Flutter plugin set: `compileSdk 36`, `minSdk 23`, `ndkVersion 27.0.12077973`, core-library desugaring, a minimal `proguard-rules.pro`, and Android `.kotlin` ignore coverage
- Validation: `flutter analyze`, `flutter test`
- Local Windows note: release Android builds now clear the earlier SDK/NDK/desugaring/ProGuard blockers but still crash the Gradle/JVM during R8 minification on this 15 GB host; Codemagic remains the authoritative next build check

### Session 2026-04-27 (mobile web parity + Codemagic deploy prep) — completed
- Added Flutter timeline parity for the web dock affordances: interactive Search, People, Inbox, and Calendar controls from the mobile timeline
- Added a mobile Search screen over existing toat data with title, notes, kind, tier, location, and people matching plus tap-through to toat detail
- Added a mobile People screen derived from people mentioned in toats, with person drilldowns and tap-through to related toats
- Added a mobile Inbox placeholder surface for incoming shared toats/invites until the sharing backend is active
- Matched the web capture review flow more closely by adding select-all/all-selected controls and disabling timeline confirmation when no toats are selected
- Fixed Codemagic iOS publishing after the parity push by using Codemagic's build number for `CFBundleVersion` and disabling external beta-review submission until App Store Connect TestFlight metadata is completed
- Codemagic iOS Release build `#9` (`69efc5032b567ec8ad824de3`) finished successfully from `main` commit `4bb903a`, produced `toatre.ipa`, and completed publishing
- Validation: `flutter analyze`, `flutter test`, VS Code Problems check, Codemagic build `#9`

### Session 2026-04-26 (web settings saves + Twilio verify rename) — completed
- Fixed `/api/settings` upserts so profile, SMS Ping, and per-kind Ping preference saves no longer collide on Mongo update paths when defaults are inserted
- Tightened the phone empty-timeline state so the no-toats view is materially smaller, with denser copy and smaller capture actions
- Updated the live Twilio Verify service friendly name from `Plotto` to `Toatre` so SMS verification copy uses the current brand
- Validation: `npm run build`

### Session 2026-04-26 (web share previews + mobile timeline density) — completed
- Tightened the phone-sized Up Next card on the web timeline so the first card reads denser and wastes less vertical space
- Added branded Toatre OG/Twitter metadata and app-icon metadata at the app level so shared links no longer render as blank previews
- Added a dedicated `opengraph-image` route using the Toatre app icon and opened `/toats/[id]` to crawlers for preview rendering while keeping those routes `noindex`
- Validation: `npm run build`

### Session 2026-04-26 (web onboarding + timeline/detail polish) — completed
- Reproduced the live `https://toatre.com/signup` handle-submit failure and traced the user-facing crash to an empty-body 500 response from `POST /api/auth/profile`
- Fixed the production Mongo helper after DigitalOcean runtime logs showed the custom promise-like client export resolving to a value without `.db()`, causing the `POST /api/auth/profile` 500
- Confirmed a second production-only blocker: DigitalOcean's auto-selected Node `22.22.2` breaks Atlas SRV/TLS connectivity for this app, so the web runtime is now pinned to Node `22.18.0`
- Hardened handle onboarding by returning JSON errors from `POST /api/auth/profile` and by parsing non-JSON error responses safely in `web/src/app/signup/page.tsx`
- Reworked `web/src/app/timeline/page.tsx` to match the latest mobile-style design direction with the bottom tab bar, floating capture mic, Up Next card, grouped sections, and direct tap-through into toat detail
- Added shared `web/src/components/mobile-ui.tsx` primitives and a new `web/src/app/toats/[id]/page.tsx` full toat view with kind-aware layouts and quick actions
- Validation: `npm run lint` (warnings only), `npm run typecheck`, and `npm run build`

### Session 2026-04-26 (web auth localhost fix) — completed
- Added `web/src/app/auth/finish/page.tsx` so Firebase email magic-link sign-in has a real completion route
- Reproduced localhost Google sign-in failure in Playwright MCP and traced it to a stale Next dev server where App Router `/api/*` handlers were returning 404
- Cleared `web/.next`, restarted `npm run dev`, and verified `/api/auth/session` recovered and Google sign-in reached `/timeline`

### Session 2026-04-26 (web capture mic fix) — completed
- Reproduced the `/capture` mic-start failure in Playwright MCP with microphone permission granted
- Traced the crash to `AnalyserNode.fftSize = 80`, which throws `IndexSizeError` because Web Audio requires a power-of-two FFT size
- Updated the capture page to use a valid analyser FFT size, keep startup errors accurate, and verified `/capture` records, uploads to `/api/captures`, and reaches the review state

### Session 2026-04-26 (web settings + typed capture + observability) — completed
- Added a real web settings surface with General, Phone, Handle, and Pings tabs, plus a visible sign-out path from the profile area
- Added typed capture mode and timeline entry points so captures can start from text as well as voice
- Tightened the mobile web timeline and toat-detail views for phone-sized layouts, including denser cards and larger actionable tap targets
- Added Langfuse instrumentation around server-side Whisper transcription and extraction, then verified a fresh live trace end to end
- Fixed Twilio Verify route failures caused by Mongo upsert path conflicts in the settings document flow, then completed a live localhost send/check round-trip successfully
- Restored temporary verification state after testing so the local account and Twilio service returned to their original baseline
- Validation: `npm run typecheck`, `npm run build`, Playwright localhost settings/timeline/detail checks, live Langfuse trace verification, and live Twilio verify round-trip

### Session 2026-04-25 (CI unblocking) — completed
- Created iOS Distribution cert `SJ5FF9432Y` (iPhone Distribution: Saraf Talukder, expires 2027-04-25)
- Generated private key + P12 (`ios_distribution.p12`, password: `toatre2026`)
- Created App Store provisioning profile `2J2XK85JLQ` ("toatre app AppStore", com.toatre.app)
- Uploaded P12 + profile to Codemagic Code signing identities (`toatre-ios-distribution`, `toatre-appstore-profile`)
- Updated `codemagic.yaml`: replaced `distribution_type/bundle_identifier` with explicit `provisioning_profiles/certificates` references → bypasses Apple portal pre-flight check
- Created `mobile/ios/Podfile` (was missing) with `platform :ios, '16.0'` for audioplayers 6.x
- Updated `Runner.xcodeproj` `IPHONEOS_DEPLOYMENT_TARGET` 12.0 → 16.0
- **Build `69ececd78a01dd78a19bb6fb` SUCCEEDED 2026-04-25T16:41:49** — all 11 steps green
- **First Toatre iOS IPA deployed to TestFlight** ✅

### Session 2026-04-25 — completed
- Flutter mobile scaffold: bundle ID `com.toatre.app`, pubspec, all lib/ dirs, providers, splash/timeline screens, fonts, icons
- `dart analyze`: 0 issues
- Next.js 16 + React 19 web scaffold: brand CSS vars, landing page, `/api/health`
- `next build`: clean
- `codemagic.yaml`: ios-release/adhoc/android-release/flutter-test workflows
- `.do/app.yaml`: DO App Platform spec + 2 cron jobs
- First commit `2f6a81d` (126 files)
- **Blocked on Playwright session:** git push, Firebase, Apple Dev, ASC, Codemagic, MongoDB, DO deployment, Resend, Twilio, domain wiring

### Session 2026-04-25 (feature pass) — completed
- Web landing page redesigned to the shipped two-column hero with mountain phone mockup; design spec updated to `docs/designs/toatre home.png`
- Web auth is live; capture pipeline now uses Whisper + GPT extraction + Mongo persistence through `/api/captures`
- Web toats CRUD routes are live; timeline loads real data from `/api/toats`
- Mobile auth now has `auth_service.dart`, a real `AuthProvider`, splash routing, login, and handle creation screens
- Mobile timeline now fetches real toats; mobile capture records audio and posts to `/api/captures`
- Pushed commits `108ee63`, `5f98e45`, and `6bf31df` to `main`
- Verified live `https://toatre.com` homepage content after push: Blog nav present, updated hero copy present, trust logo row present
- Mobile push should trigger Codemagic `flutter-test` + `ios-release`, but TestFlight verification still requires dashboard visibility
- Validation: `npm run build`, `flutter analyze`, and `flutter test` all clean on 2026-04-25

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
- [x] Create `Toatre/.gitignore` (Flutter + Node + IDEs + secrets) (2026-04-25)
- [x] Create `Toatre/.env.example` (matches `ARCHITECTURE.md §13`) (2026-04-25)
- [x] Create `Toatre/CLAUDE.md` (agent operating rules) (2026-04-25)
- [x] Create `Toatre/PLAN.md` (this file) (2026-04-25)
- [x] `git init` on `Toatre/`, branch `main` (2026-04-25)
- [ ] Add remote `origin git@github.com:realsaraf/toatre.git` — **needs owner to confirm push (destructive: overwrites old Plotto Expo code)**
- [x] First commit: `chore: Phase 0 scaffold — Flutter mobile + Next.js web (com.toatre.app)` commit `2f6a81d` (2026-04-25)

### 0.2 — Flutter app scaffold (`mobile/`)
- [x] `flutter create --org com.toatre --project-name toatre --platforms ios,android mobile` (2026-04-25)
- [x] Verify `mobile/ios/Runner.xcodeproj` bundle id is `com.toatre.app` (2026-04-25)
- [x] Verify `mobile/android/app/build.gradle.kts` applicationId is `com.toatre.app` (2026-04-25)
- [x] Replace generated `pubspec.yaml` with the locked deps from `ARCHITECTURE.md §4` (2026-04-25)
- [x] Replace `mobile/lib/main.dart` with Sentry+Firebase init + `runApp(const ToatreApp())` (2026-04-25)
- [x] Create `mobile/lib/app.dart` (MultiProvider + MaterialApp, dark theme) (2026-04-25)
- [x] Create `mobile/lib/config/theme_config.dart` (2026-04-25)
- [x] Create `mobile/lib/utils/app_colors.dart` with single-source brand gradient (2026-04-25)
- [x] Create `mobile/lib/utils/text_styles.dart` (Inter) (2026-04-25)
- [x] Stub all directories from `ARCHITECTURE.md §4` with `.gitkeep` files (2026-04-25)
- [x] Stub `mobile/lib/ui/splash/splash_screen.dart` (logo + 1s pause → Timeline) (2026-04-25)
- [x] Stub `mobile/lib/ui/timeline/timeline_screen.dart` (empty state + mic FAB) (2026-04-25)
- [x] Stub providers (auth, toats, capture, pings, people, share, settings, connectivity) as empty ChangeNotifiers (2026-04-25)
- [x] `flutter pub get` runs clean (2026-04-25)
- [x] `flutter analyze` runs clean — 0 issues (2026-04-25)
- [ ] App boots on iOS simulator showing dark splash → empty Timeline
- [ ] App boots on Android emulator showing same

### 0.3 — Next.js app scaffold (`web/`)
- [x] `npx create-next-app@latest web --ts --tailwind --app --src-dir --import-alias '@/*' --use-npm --no-git` (2026-04-25)
- [x] Next.js 16.2.4, React 19.2.4 — already at latest (2026-04-25)
- [x] Tailwind v4 with brand gradient CSS vars (2026-04-25)
- [x] Create `web/src/app/globals.css` with single-source brand gradient + glass-card utility classes (2026-04-25)
- [x] Replace `web/src/app/page.tsx` with placeholder landing ("Toatre — coming soon") (2026-04-25)
- [x] Stub `web/src/app/api/health/route.ts` (returns `{ status: "ok", service, timestamp }`) (2026-04-25)
- [ ] Stub all directories from `ARCHITECTURE.md §5` with `.gitkeep`
- [ ] Add `eslint`, `prettier`, `tsc --noEmit` to npm scripts
- [x] `npm run build` clean (2026-04-25)
- [ ] `npm run dev` shows the placeholder at `localhost:3000`

### 0.4 — Brand assets generation
- [ ] Port `scripts/generate-icons.mjs` from old PLOTTO repo
- [ ] Generate `web/public/icon-*.png`, `web/public/og-image.png`, `web/src/app/icon.png`, `web/src/app/apple-icon.png`, `web/public/favicon.ico`
- [ ] Generate `mobile/assets/icon.png` (1024), `mobile/assets/adaptive-icon.png`, `mobile/assets/splash.png`
- [x] Run `flutter_launcher_icons` to push into iOS + Android native projects (2026-04-25)
- [ ] Verify on simulator: home-screen icon is the Toatre mark
- [ ] Build `mobile/lib/widgets/toatre_mark.dart` (SVG wordmark)
- [ ] Build `web/src/components/ToatreMark.tsx` (SVG wordmark)

### 0.5 — Mobile CI/CD (Codemagic)
- [x] Author `codemagic.yaml` at repo root, bundle `com.toatre.app`, team `8B9NZ6FRKF` (2026-04-25)
- [x] Workflows: `ios-release`, `ios-adhoc`, `android-release` (disabled), `flutter-test` (2026-04-25)
- [ ] **[Playwright + user]** Codemagic dashboard: add Toatre app, link `realsaraf/toatre` repo
- [ ] **[Playwright + user]** Codemagic: link App Store Connect API key integration
- [ ] **[Playwright + user]** Codemagic: link Google Play service account (defer until Phase 8 Android submission)
- [x] First Codemagic build triggered — build `69ececd78a01dd78a19bb6fb` **SUCCEEDED**, IPA deployed to TestFlight (2026-04-25)

### 0.6 — Web CI/CD (DigitalOcean App Platform)
- [x] Create `.do/app.yaml` spec (web service + 2 cron jobs fire-pings/cleanup-captures) (2026-04-25)
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
- [x] `mobile/lib/services/auth_service.dart` — Firebase Auth + Google + Apple (2026-04-25)
- [ ] Email link + phone OTP in mobile auth service
- [x] `mobile/lib/providers/auth_provider.dart` — state machine for sign-in + handle flow (2026-04-25)
- [ ] `mobile/lib/services/token_manager.dart` — attaches Firebase ID token to every API request
- [ ] `mobile/lib/services/api_service.dart` — http wrapper with retry + token refresh on 401
- [x] `mobile/lib/ui/auth/login_screen.dart` — Google + Apple entry screen (2026-04-25)
- [ ] `mobile/lib/ui/auth/email_link_screen.dart`
- [ ] `mobile/lib/ui/auth/phone_otp_screen.dart`
- [x] `mobile/lib/ui/auth/handle_screen.dart` — handle creation step (2026-04-25)
- [x] `mobile/lib/ui/splash/splash_screen.dart` — routes to login, handle, or timeline based on auth state (2026-04-25)
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
- [x] `mobile/lib/providers/capture_provider.dart` — state machine (idle → recording → processing → review | error) (2026-04-25)
- [x] `mobile/lib/ui/capture/capture_screen.dart` — full-screen capture + review flow wired to `/api/captures` (2026-04-25)
- [ ] `mobile/lib/ui/capture/components/mic_button.dart` — pulse animation, haptics, accessibility
- [ ] `mobile/lib/ui/capture/components/transcript_preview.dart`
- [ ] `mobile/lib/ui/capture/components/extracted_toats_list.dart` — confirm/edit before save
- [ ] Permission flow: mic + speech recognition (iOS) + record_audio (Android)
- [ ] Manual entry fallback (`manual_form.dart`)

### 2.2 — Server-side extraction pipeline
- [ ] `web/src/lib/ai/openai.ts` — client + retry + cost capture
- [ ] `web/src/lib/ai/langfuse.ts` — trace wrapper
- [x] `web/src/lib/ai/prompts/extract.system.md` — locked extraction prompt (2026-04-25)
- [ ] `web/src/lib/ai/prompts/extract.examples.md` — few-shot examples
- [x] `web/src/lib/ai/extract.ts` — Structured Outputs call, returns Zod-validated `ExtractionResult` (2026-04-25)
- [x] `POST /api/captures` — store capture, transcribe/extract, persist toats (sync for now) (2026-04-25)
- [ ] `POST /api/extract` — runs the pipeline, low-confidence escalation to GPT-4o
- [x] `POST /api/transcribe` — Whisper fallback when on-device STT failed/unconfident (2026-04-25)
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
- [x] `mobile/lib/providers/toats_provider.dart` — fetch real data from `/api/toats` (2026-04-25)
- [x] `mobile/lib/ui/timeline/timeline_screen.dart` — Today view + grouped sections + Up Next card (2026-04-25)
- [ ] `mobile/lib/ui/timeline/components/toat_card.dart` — kind-aware rendering
- [ ] Tier indicator + people pills + quick-action row (Done / Snooze)
- [x] Pull-to-refresh (2026-04-25)
- [ ] Empty states per section

### 3.2 — Mobile detail editor
- [ ] `mobile/lib/ui/toat_detail/toat_detail_screen.dart`
- [ ] Kind picker, tier picker, time picker, people picker
- [ ] Audit log tab (collapsed by default)

### 3.3 — Web timeline + editor
- [ ] `web/src/app/timeline/page.tsx` — same sections + filtering by kind/tier/person
- [ ] `web/src/app/toats/[id]/page.tsx` — editor

### 3.4 — APIs
- [x] `GET /api/toats?range=today|week|upcoming|past|all` (2026-04-25)
- [x] `POST /api/toats`, `GET /api/toats/[id]`, `PATCH /api/toats/[id]`, `DELETE /api/toats/[id]` (2026-04-25)
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
