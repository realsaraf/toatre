# Toatre — Architecture & Build Reference

> **Single source of truth** for engineering. Read this completely
> before making any changes. For *what* we're building and *why*, see
> [PRODUCT.md](PRODUCT.md). This file is *how*.

> **Modeled on the Mutqin Mobile + Mutqin Web pattern.** When in doubt,
> the answer is "do it like Mutqin." This is intentional — the user has
> validated the architecture in production with Mutqin and we are
> reusing every pattern that worked.

---

## 0. Status

- **Repo:** `github.com/realsaraf/toatre` (will be force-pushed clean,
  replacing the legacy Plotto/Expo codebase)
- **Local workspace:** `C:\DRIVE\src\Toatre\`
- **Stage:** Greenfield. Nothing built yet.
- **Active phase:** Phase 0 — accounts + scaffolding.

---

## 1. Tech Stack (Locked)

| Layer | Choice | Why |
|---|---|---|
| **Mobile** | Flutter 3.32+ / Dart 3.8+ | Mutqin parity; one codebase iOS+Android. |
| **Mobile state** | Provider + ChangeNotifier | Same pattern as Mutqin. Battle-tested for this scale. |
| **Mobile architecture** | Layered (UI → Provider → Service → Model) + feature-first folders | Mutqin pattern. |
| **Web** | Next.js 16 (App Router) + React 19 + TypeScript strict | Mutqin Web pattern. |
| **Web styling** | Tailwind CSS v4 + custom CSS vars (dark only) | Mutqin Web pattern. |
| **Auth** | Firebase Auth (Google + Apple + Email magic link + Phone OTP) | One auth provider for both mobile + web; manages sessions, MFA, phone OTP for free. |
| **Database** | MongoDB Atlas (M0 free tier → M10 prod) | Mutqin parity; document model fits toats well; managed; free tier covers MVP. |
| **Object storage** | DigitalOcean Spaces (S3-compatible) | Voice clips (opt-in retention), avatars, attachments. |
| **Backend hosting** | DigitalOcean App Platform (push-to-deploy from `main`) | Mutqin Web parity; no Vercel lock-in; cheaper at scale. |
| **AI** | OpenAI GPT-4o-mini (extraction) + GPT-4o (escalation) + Whisper (STT fallback) | Mutqin parity. |
| **On-device STT** | Apple Speech (iOS) + `speech_to_text` plugin (Android) | Saves Whisper cost; faster perceived UX. |
| **LLM observability** | Langfuse (cloud) | Cost + trace inspection per call. |
| **Error tracking** | Sentry (mobile + web + API) | Standard. |
| **Product analytics** | PostHog (cloud) | No PII; product-led growth tracking. |
| **Email (transactional)** | Resend (`hello@toatre.com`) | Magic links, reminder emails, welcome. |
| **SMS** | Twilio Verify (phone OTP) + Twilio Programmable SMS (urgent reminders) | Mutqin parity. |
| **Push notifications** | Firebase Cloud Messaging (FCM) | Cross-device Ping delivery. |
| **Mobile CI/CD** | Codemagic → TestFlight (iOS) + Play Internal Track (Android) | Mutqin parity; user has account. |
| **Web CI/CD** | DigitalOcean App Platform GitHub integration → auto deploy on push to `main` | Mutqin Web parity. |
| **Domain** | `toatre.com` (Squarespace DNS) | Already owned; reuse. |

### Stack diff vs. Mutqin (intentional)
- **Web framework version:** Toatre uses Next.js 16 (latest); Mutqin Web is on 16 already.
- **No RevenueCat / no IAP for v1** — Toatre has no paid tier yet.
- **No bundled font assets for Arabic** — Toatre is English-first; Noto
  Naskh Arabic is *not* loaded by default.

### Stack diff vs. legacy Plotto/Expo (intentional)
- Flutter replaces Expo + React Native (Expo build pipeline + signing
  has been unreliable; Flutter via Codemagic is proven on Mutqin).
- MongoDB replaces Supabase Postgres (matches Mutqin; document model is
  simpler for toat `kind_data` polymorphism).
- DigitalOcean replaces Vercel + Supabase (consolidates infra under one
  bill, no Supabase lock-in).
- Firebase Auth replaces Supabase Auth (matches Mutqin; better mobile
  SDK, free phone OTP).

### Trade-off: MongoDB vs Postgres (decision log)
**Decision:** MongoDB Atlas, **co-tenanted with the existing Mutqin
org/cluster**, isolated by a dedicated database name `toatre`.
**Why:** stack alignment with Mutqin, simpler `kind_data` polymorphism,
zero new infra to provision, no extra Atlas org/cluster bill until
Toatre actually needs the headroom. **Loses:** native RLS (we enforce
authorization in API layer instead), strong joins (we denormalize where
needed), native RRULE (we'll evaluate recurrence in code on read).

**Future split-out path** (when Toatre traffic warrants its own org or
Mutqin needs the headroom back):
1. Provision a new Atlas org `toatre` + new cluster (e.g. `toatre-prod-0`).
2. Use **Atlas Live Migration** (cluster-to-cluster, near-zero downtime,
   built-in Atlas tool) — OR — `mongodump` from old cluster + `mongorestore`
   into new during a planned 5–10 minute maintenance window.
3. Update `MONGODB_URI` (and `MONGODB_DB` if renamed) in DigitalOcean App
   Platform + Codemagic env vars + locally.
4. Redeploy web; mobile is unaware (it never sees the URI).
5. Verify writes against the new cluster, then decommission the old DB
   in the Mutqin cluster.

Migration is a **3–4 hour operation** at any scale up to a few million
toats. There is no architectural lock-in from co-tenancy because we
never join across databases and every collection is namespaced under
`toatre.*`.

**Mongo ↔ Postgres migration risk** (separate concern — different DB
engine entirely): at <10k users, a 1–2 day script. Re-evaluate at the
10k DAU mark.

---

## 2. Repository Layout

Single GitHub repo, two top-level apps, shared docs at root.

```
Toatre/                              # = realsaraf/toatre
├── PRODUCT.md                       # what + why + vocabulary lock
├── ARCHITECTURE.md                  # this file
├── PLAN.md                          # phased build plan + status (created Phase 0)
├── CLAUDE.md                        # AI agent operating instructions (created Phase 0)
├── README.md                        # public stub (toatre.com link, contact)
├── .gitignore
├── .env.example                     # documents required keys (no secrets)
│
├── assets/
│   └── brand/
│       └── icon-source.png          # 1024×1024 master icon
│
├── mobile/                          # Flutter app (iOS + Android)
│   ├── pubspec.yaml
│   ├── analysis_options.yaml
│   ├── codemagic.yaml               # CI/CD → TestFlight + Play Internal
│   ├── firebase.json                # FlutterFire config
│   ├── android/
│   ├── ios/
│   ├── lib/                         # see §4 for full structure
│   ├── test/
│   └── assets/
│       ├── data/                    # static JSON (timezones, kind defaults)
│       ├── fonts/                   # Inter
│       ├── icons/
│       └── images/
│
├── web/                             # Next.js 16 app
│   ├── package.json
│   ├── next.config.mjs
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── postcss.config.mjs
│   ├── .env.local                   # gitignored
│   ├── public/
│   ├── src/
│   │   ├── app/                     # see §5 for full structure
│   │   ├── components/
│   │   ├── lib/
│   │   ├── hooks/
│   │   └── types/
│   └── tests/
│
├── docs/
│   ├── runbooks/                    # one .md per service: rotate-keys, restore-mongo, etc.
│   ├── decisions/                   # ADRs (architectural decision records)
│   └── api/                         # OpenAPI-style endpoint reference (generated + curated)
│
└── scripts/
    ├── seed-mongo.mjs               # seed reminder_policies, dev users
    ├── generate-icons.mjs           # mobile + web icon generation from icon-source.png
    └── rotate-secrets.ps1           # interactive helper (writes nothing automatically)
```

There is intentionally **no monorepo tooling** (no Turbo, no pnpm
workspaces). The web app uses npm (Mutqin parity). The Flutter app uses
pub. They share nothing at the dependency level — they share a contract
(API + types) which is documented and version-locked instead of
imported.

---

## 3. System Diagram

```
┌────────────────────────┐    ┌────────────────────────┐
│  Flutter Mobile        │    │  Next.js Web           │
│  (iOS + Android)       │    │  (toatre.com)          │
│  - Mic capture         │    │  - Landing             │
│  - Timeline            │    │  - Dashboard parity    │
│  - Local Pings         │    │  - Settings            │
│  - FCM push            │    │  - Sharing preview /j  │
└──────────┬─────────────┘    └────────┬───────────────┘
           │   Firebase ID Token Bearer auth (both)
           └────────────┬─────────────────┘
                        ▼
        ┌────────────────────────────────────────┐
        │  Next.js API Routes (App Router)        │
        │  Hosted on DigitalOcean App Platform    │
        │   ├─ /api/auth/*       (session bridge) │
        │   ├─ /api/captures     (POST mic input) │
        │   ├─ /api/extract      (LLM pipeline)   │
        │   ├─ /api/toats        (CRUD + share)   │
        │   ├─ /api/reminders    (cron + manual)  │
        │   ├─ /api/people       (graph)          │
        │   ├─ /api/share/[t]    (public preview) │
        │   ├─ /api/upload       (signed Spaces)  │
        │   ├─ /api/twilio       (verify + SMS)   │
        │   └─ /api/webhooks/*   (FCM, Twilio)    │
        └─────┬────────────┬───────────┬──────────┘
              │            │           │
   ┌──────────▼──┐ ┌───────▼────┐ ┌───▼──────────┐
   │ MongoDB     │ │ DO Spaces  │ │ External APIs │
   │ Atlas       │ │ (S3-compat)│ │  - OpenAI     │
   │  - users    │ │  - voice/  │ │  - Whisper    │
   │  - toats    │ │  - avatars │ │  - Twilio     │
   │  - captures │ │  - attach/ │ │  - Resend     │
   │  - people   │ └────────────┘ │  - FCM        │
   │  - acl      │                │  - Langfuse   │
   │  - settings │                │  - Sentry     │
   │  - reminders│                │  - PostHog    │
   │  - audit    │                │  - Firebase   │
   └─────────────┘                └───────────────┘
```

**Key rule:** Mobile **never** talks directly to MongoDB, Spaces, OpenAI,
Twilio, Resend, or any third-party except Firebase Auth + FCM + Sentry +
PostHog (each has its own SDK with its own credentials baked into the
client). All other secrets live server-side. Mobile authenticates to the
Next.js API with the Firebase ID token; the API verifies it via the
Firebase Admin SDK and uses it as the user identity.

---

## 4. Mobile (Flutter) — Full Structure

Modeled directly on `Mutqin Mobile/lib/` with names adapted.

```
mobile/lib/
├── main.dart                              # Firebase init, Sentry init, runApp(ToatreApp)
├── app.dart                               # MultiProvider + MaterialApp + dark theme
├── firebase_options.dart                  # FlutterFire generated
├── responsive.dart                        # breakpoints + helpers
│
├── config/
│   ├── app_config.dart                    # API_BASE_URL, env-driven
│   ├── remote_config.dart                 # Firebase Remote Config keys + defaults
│   └── theme_config.dart                  # ThemeData factory (dark only)
│
├── enum/
│   ├── api_error.dart                     # network, timeout, unauthorized, server, unknown
│   ├── api_methods.dart                   # GET, POST, PUT, PATCH, DELETE
│   ├── toat_kind.dart                     # task, event, meeting, idea, errand, deadline
│   ├── toat_tier.dart                     # urgent, important, regular
│   ├── toat_status.dart                   # active, snoozed, done, cancelled, archived
│   ├── capture_source.dart                # mic, manual, share_sheet, email, screenshot
│   ├── capture_status.dart                # idle, recording, transcribing, extracting, done, error
│   ├── ping_channel.dart                  # local, push, email, sms, critical_alert
│   ├── share_role.dart                    # view, edit
│   └── auth_provider.dart                 # google, apple, email_magic, phone_otp
│
├── models/
│   ├── user_profile.dart
│   ├── toat.dart                          # discriminated by `kind`, holds `kind_data`
│   ├── kind_data/
│   │   ├── task_data.dart
│   │   ├── event_data.dart
│   │   ├── meeting_data.dart
│   │   ├── idea_data.dart
│   │   ├── errand_data.dart
│   │   └── deadline_data.dart
│   ├── capture.dart
│   ├── ping.dart                          # reminder
│   ├── person.dart
│   ├── toat_acl.dart
│   ├── user_settings.dart
│   ├── api_response.dart                  # generic { success, data, error }
│   └── extraction_result.dart             # LLM output wrapper
│
├── providers/
│   ├── auth_provider.dart                 # Firebase Auth wrapper, all 4 sign-in methods
│   ├── toats_provider.dart                # Timeline state: today/week/upcoming/past + cache
│   ├── capture_provider.dart              # Mic recording → STT → API/extract → toats
│   ├── pings_provider.dart                # Local notifications + FCM token registration
│   ├── people_provider.dart               # People graph + handle lookup
│   ├── share_provider.dart                # Outgoing/incoming share state
│   ├── settings_provider.dart             # User settings (synced to API)
│   └── connectivity_provider.dart         # Offline queue indicator
│
├── services/
│   ├── api_service.dart                   # http wrapper → Toatre Web API
│   ├── auth_service.dart                  # Firebase Auth + Google/Apple sign-in
│   ├── audio_service.dart                 # Mic record (record plugin), playback, silence detect
│   ├── stt_service.dart                   # On-device STT first, /api/transcribe fallback
│   ├── notifications_service.dart         # flutter_local_notifications + FCM
│   ├── storage_service.dart               # Get signed URL → upload to Spaces
│   ├── db_service.dart                    # SQLite (offline queue + cache index)
│   ├── preference_service.dart            # SharedPreferences (tokens, quick prefs)
│   ├── remote_config_service.dart         # Firebase Remote Config wrapper
│   ├── analytics_service.dart             # PostHog + Firebase Analytics
│   ├── sentry_service.dart                # Wrapper around sentry_flutter
│   └── token_manager.dart                 # Firebase ID token refresh + attach to requests
│
├── ui/
│   ├── splash/
│   │   └── splash_screen.dart
│   ├── auth/
│   │   ├── login_screen.dart              # Google + Apple + Email + Phone tabs
│   │   ├── email_link_screen.dart         # Magic link entry
│   │   ├── phone_otp_screen.dart          # SMS OTP entry
│   │   └── components/
│   │       └── social_button.dart
│   ├── timeline/
│   │   ├── timeline_screen.dart           # ★ home — today/week/upcoming/past
│   │   └── components/
│   │       ├── timeline_section.dart
│   │       ├── toat_card.dart             # renders by kind
│   │       ├── tier_indicator.dart
│   │       ├── people_pills.dart
│   │       └── empty_state.dart
│   ├── capture/
│   │   ├── capture_screen.dart            # ★ mic FAB modal
│   │   └── components/
│   │       ├── mic_button.dart            # pulse animation
│   │       ├── transcript_preview.dart
│   │       ├── extracted_toats_list.dart  # confirm/edit before save
│   │       └── manual_form.dart           # fallback typed entry
│   ├── toat_detail/
│   │   ├── toat_detail_screen.dart        # editor for one toat
│   │   └── components/
│   │       ├── kind_picker.dart
│   │       ├── tier_picker.dart
│   │       ├── time_picker_block.dart
│   │       ├── people_picker.dart
│   │       └── share_sheet.dart
│   ├── people/
│   │   ├── people_screen.dart
│   │   └── components/
│   │       └── person_tile.dart
│   ├── settings/
│   │   ├── settings_screen.dart
│   │   └── components/
│   │       ├── work_schedule_block.dart
│   │       ├── voice_retention_toggle.dart
│   │       ├── timezone_picker.dart
│   │       └── account_block.dart
│   └── share/
│       └── share_preview_screen.dart      # in-app preview of /j/[token]
│
├── utils/
│   ├── app_colors.dart
│   ├── text_styles.dart
│   ├── constants.dart
│   ├── navigation.dart
│   ├── validators.dart
│   ├── extensions.dart
│   ├── date_helpers.dart                  # group by today/week/upcoming/past, RRULE eval
│   └── session_manager.dart
│
├── widgets/
│   ├── glass_card.dart
│   ├── gradient_text.dart
│   ├── loading_widget.dart
│   ├── app_back_button.dart
│   ├── page_header.dart
│   ├── bottom_nav.dart                    # Timeline / People / Settings (mic = FAB on Timeline)
│   └── toatre_mark.dart                   # SVG wordmark widget
│
└── resources/
    ├── asset_paths.dart
    └── string_resources.dart              # all UI strings centralized
```

### Mobile coding conventions
- **Dart 3 strict** — sound null safety, no `dynamic` except JSON parse boundary.
- **`const` constructors** wherever possible.
- **`final` over `var`** for class fields.
- **Named parameters** with `required` keyword for widget constructors.
- **Trailing commas** always.
- **Effective Dart** naming: `lowerCamelCase` methods, `UpperCamelCase` types, `_private` for file-private.
- **Imports order:** Dart SDK → Flutter SDK → packages → relative, separated by blank lines.
- **Class member order:** static → instance fields → constructors → lifecycle → public methods → private methods → `build`.
- **No magic strings** — enums for all categorical values.
- **Provider rule:** Providers call services; services own external I/O.
- **Service rule:** Services are stateless singletons; state lives in providers.
- **Widget rule:** Shared widgets are dumb (constructor + callbacks); screens read providers.

### Mobile dependencies (pubspec.yaml — locked plan)
```yaml
dependencies:
  flutter: { sdk: flutter }
  cupertino_icons: ^1.0.8
  flutter_svg: ^2.2.1
  cached_network_image: ^3.4.1
  shimmer: ^3.0.0

  # State
  provider: ^6.1.5

  # Firebase
  firebase_core: ^4.1.1
  firebase_auth: ^6.1.0
  firebase_analytics: ^12.0.2
  firebase_messaging: ^16.0.0
  firebase_remote_config: ^6.0.2

  # Auth providers
  google_sign_in: ^6.2.1
  sign_in_with_apple: ^7.0.1

  # Network
  http: ^1.5.0

  # Storage
  shared_preferences: ^2.5.3
  sqflite: ^2.4.2
  path_provider: ^2.1.5
  path: ^1.9.1

  # Audio + STT
  record: ^6.2.0
  audioplayers: ^6.5.1
  speech_to_text: ^7.0.0
  permission_handler: ^11.4.0

  # Notifications
  flutter_local_notifications: ^18.0.0
  timezone: ^0.10.0

  # Crypto / utils
  crypto: ^3.0.6
  uuid: ^4.5.1
  intl: ^0.20.2
  collection: ^1.19.1

  # Animation
  flutter_animate: ^4.5.2

  # Error tracking
  sentry_flutter: ^9.7.0

  # Analytics
  posthog_flutter: ^4.0.0

dev_dependencies:
  flutter_test: { sdk: flutter }
  flutter_lints: ^5.0.0
  mockito: ^5.4.6
  build_runner: ^2.4.15
  flutter_launcher_icons: ^0.14.3
```

---

## 5. Web (Next.js 16) — Full Structure

```
web/src/
├── app/
│   ├── layout.tsx                         # AppShell + AuthProvider + PostHog provider
│   ├── globals.css                        # CSS vars, dark theme, glass-card, gradient-border, etc.
│   ├── page.tsx                           # Landing
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── timeline/page.tsx                  # ★ dashboard (today/week/upcoming/past)
│   ├── capture/page.tsx                   # Typed capture (mic optional)
│   ├── toats/[id]/page.tsx                # Detail editor
│   ├── people/page.tsx
│   ├── people/[id]/page.tsx               # Filter timeline by person
│   ├── settings/page.tsx
│   ├── j/[token]/page.tsx                 # Public share preview (no auth)
│   ├── privacy/page.tsx
│   ├── terms/page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   ├── session/route.ts           # exchange Firebase ID token → server session cookie
│   │   │   └── logout/route.ts
│   │   ├── captures/route.ts              # POST: store capture, kick off extraction
│   │   ├── extract/route.ts               # POST: run LLM, create toats, return result
│   │   ├── transcribe/route.ts            # POST: Whisper fallback
│   │   ├── toats/route.ts                 # GET (list), POST (create)
│   │   ├── toats/[id]/route.ts            # GET / PATCH / DELETE
│   │   ├── toats/[id]/share/route.ts      # POST share, DELETE revoke
│   │   ├── people/route.ts
│   │   ├── people/[id]/route.ts
│   │   ├── reminders/route.ts             # GET upcoming, POST manual
│   │   ├── settings/route.ts              # GET / PATCH user settings
│   │   ├── upload/sign/route.ts           # POST: returns signed Spaces URL
│   │   ├── share/[token]/route.ts         # GET preview payload (public)
│   │   ├── twilio/
│   │   │   ├── verify/start/route.ts      # POST: send OTP
│   │   │   └── verify/check/route.ts      # POST: verify OTP
│   │   ├── cron/
│   │   │   ├── fire-pings/route.ts        # GET: fires due Pings (DO scheduled job hits this)
│   │   │   └── cleanup-captures/route.ts  # GET: prune old llm_input/llm_output > 30 days
│   │   └── webhooks/
│   │       ├── twilio/inbound/route.ts    # SMS replies (future: STOP keyword)
│   │       └── fcm/feedback/route.ts      # delivery feedback
│
├── components/
│   ├── AppShell.tsx
│   ├── AuthProvider.tsx
│   ├── LoginScreen.tsx
│   ├── ToatCard.tsx
│   ├── TimelineSection.tsx
│   ├── KindBadge.tsx
│   ├── TierBadge.tsx
│   ├── PeoplePills.tsx
│   ├── MicButton.tsx                      # web mic (MediaRecorder)
│   ├── ToatreMark.tsx                     # SVG wordmark
│   └── ... (mirror mobile UI patterns)
│
├── lib/
│   ├── firebase/
│   │   ├── client.ts                      # browser SDK init
│   │   └── admin.ts                       # server SDK init (verify ID tokens)
│   ├── mongo/
│   │   ├── client.ts                      # MongoClient singleton
│   │   ├── collections.ts                 # typed collection getters
│   │   └── indexes.ts                     # one-time index ensure on boot
│   ├── ai/
│   │   ├── openai.ts                      # OpenAI client + retry
│   │   ├── extract.ts                     # Structured Outputs prompt
│   │   ├── prompts/
│   │   │   ├── extract.system.md
│   │   │   └── extract.examples.md
│   │   └── langfuse.ts                    # trace wrapper
│   ├── auth/
│   │   ├── session.ts                     # cookie session helpers
│   │   └── require-user.ts                # server-side auth guard
│   ├── spaces/
│   │   └── client.ts                      # @aws-sdk/client-s3 pointed at DO Spaces
│   ├── twilio/
│   │   ├── client.ts
│   │   ├── verify.ts
│   │   └── sms.ts
│   ├── resend/
│   │   ├── client.ts
│   │   ├── templates/
│   │   │   ├── magic-link.tsx             # @react-email
│   │   │   ├── welcome.tsx
│   │   │   └── reminder.tsx
│   │   └── send.ts
│   ├── fcm/
│   │   └── send.ts                        # via Firebase Admin
│   ├── pings/
│   │   ├── policies.ts                    # default offsets per kind × tier
│   │   ├── compute.ts                     # generate ping rows for a toat
│   │   └── dispatch.ts                    # cron handler logic
│   ├── types/
│   │   └── toat.ts                        # discriminated union (Zod)
│   ├── posthog/
│   │   └── server.ts
│   └── sentry/
│       ├── client.ts
│       └── server.ts
│
├── hooks/
│   ├── useUser.ts
│   ├── useToats.ts
│   ├── useCapture.ts
│   └── useNetworkStatus.ts
│
├── types/
│   └── index.ts                           # shared TS types (mirror mobile models)
│
└── tests/
    ├── api/
    └── components/
```

### Web coding conventions
- **TypeScript strict** — no `any`, no `ts-ignore`.
- **App Router** with React Server Components by default. Add `"use
  client"` only when needed.
- **No `next/font`** — Inter loaded via CSS variable from `globals.css`.
- **Tailwind v4** utility-first; reusable patterns in `globals.css`
  (`.glass-card`, `.gradient-border`, `.toat-card`, etc.).
- **API routes are thin** — they validate input (Zod), call into
  `lib/*`, and return typed JSON. No business logic in route files.
- **All API routes auth-guarded** — use `requireUser()` helper that
  verifies the Firebase ID token and loads the Mongo user doc.
- **Zod everywhere** at boundaries (request body, env vars, LLM output).

---

## 6. Data Model (MongoDB)

All collections live in database `toatre`. All `_id` fields are
auto-generated `ObjectId`. All timestamps stored as BSON `Date`.

### Collection: `users`
```
{
  _id: ObjectId,
  firebase_uid: string,           // unique index
  email: string,                  // unique index, lowercased
  email_verified: bool,
  phone: string?,                 // E.164, unique sparse index
  phone_verified: bool,
  handle: string,                 // unique index, lowercased, /^[a-z0-9_]{3,20}$/
  handle_changed_at: Date?,
  display_name: string,
  photo_url: string?,
  timezone: string,               // IANA
  locale: string,                 // BCP-47
  providers: ["google" | "apple" | "email" | "phone"],
  fcm_tokens: [
    { token: string, platform: "ios" | "android" | "web", updated_at: Date }
  ],
  created_at: Date,
  updated_at: Date,
}
```

### Collection: `toats`
```
{
  _id: ObjectId,
  owner_id: ObjectId,             // → users._id, indexed
  kind: "task" | "event" | "meeting" | "idea" | "errand" | "deadline",
  tier: "urgent" | "important" | "regular",
  status: "active" | "snoozed" | "done" | "cancelled" | "archived",
  title: string,
  notes: string?,
  starts_at: Date?,               // indexed
  ends_at: Date?,
  all_day: bool,
  tz: string,                     // IANA, captured at create time
  recurrence_rule: string?,       // RRULE string, eval in code on read
  recurrence_exceptions: [Date]?,
  location: { name?, address?, lat?, lng?, place_id? } | null,
  kind_data: object,              // discriminated by `kind` (validated server-side w/ Zod)
  confidence: number,             // 0..1 from LLM
  source_capture_id: ObjectId?,
  parent_toat_id: ObjectId?,
  people: [ObjectId],             // → people._id (denormalized for fast list)
  shared_with: [ObjectId],        // → users._id (acl summary, denormalized)
  created_at: Date,
  updated_at: Date,
}
```
Indexes: `{ owner_id: 1, starts_at: 1 }`, `{ owner_id: 1, status: 1, starts_at: 1 }`, `{ shared_with: 1, starts_at: 1 }`.

### Collection: `captures`
```
{
  _id: ObjectId,
  user_id: ObjectId,
  source: "mic" | "manual" | "share_sheet" | "email" | "screenshot",
  raw_transcript: string?,
  audio_url: string?,             // DO Spaces, only if user opted into retention
  llm_model: string,
  llm_input: object,              // truncated after 30 days by cron
  llm_output: object,             // truncated after 30 days
  llm_cost_cents: number,
  langfuse_trace_id: string?,
  toat_ids: [ObjectId],           // toats produced by this capture
  processed: bool,
  error: string?,
  created_at: Date,                // TTL on a separate audit field after retention
}
```

### Collection: `pings` (reminders)
```
{
  _id: ObjectId,
  toat_id: ObjectId,
  recipient_user_id: ObjectId,    // owner OR shared user — each gets their own pings
  fires_at: Date,                 // indexed
  channel: "local" | "push" | "email" | "sms" | "critical_alert",
  fired: bool,                    // indexed
  fired_at: Date?,
  source: "policy" | "manual",
  policy_id: string?,             // reference into reminder_policies
  created_at: Date,
}
```
Index: `{ fired: 1, fires_at: 1 }` — used by cron dispatcher.

### Collection: `people`
```
{
  _id: ObjectId,
  owner_id: ObjectId,
  display_name: string,
  linked_user_id: ObjectId?,      // populated if this person is also a Toatre user
  handle: string?,                // if linked
  email: string?,
  phone: string?,
  color: string,                  // hex
  created_at: Date,
}
```

### Collection: `toat_acl`
```
{
  _id: ObjectId,
  toat_id: ObjectId,              // indexed
  user_id: ObjectId,              // indexed
  role: "view" | "edit",
  invited_by: ObjectId,
  invite_token: string?,          // for /j/[token] preview
  invite_expires_at: Date?,
  accepted_at: Date?,
  created_at: Date,
}
```

### Collection: `settings`
```
{
  _id: ObjectId,
  user_id: ObjectId,              // unique
  work_schedule: {
    days: [0..6],                 // 0=Sun
    start: "HH:MM",
    end: "HH:MM",
  },
  voice_retention: bool,          // default false
  email_reminders: bool,
  sms_reminders: bool,            // urgent only
  push_critical_alerts: bool,
  default_tier: "regular" | "important" | "urgent",
  language: string,
  created_at: Date,
  updated_at: Date,
}
```

### Collection: `audit_log`
Append-only. Used for the toat detail "history" tab and incident review.
```
{
  _id: ObjectId,
  toat_id: ObjectId,
  actor_id: ObjectId,
  action: string,                 // "created" | "edited:title" | "shared" | ...
  before: object?,
  after: object?,
  created_at: Date,
}
```

### Collection: `reminder_policies` (seed data)
```
{
  _id: ObjectId,
  kind: string,
  tier: string,
  offsets_minutes: [number],
}
```
Seeded once at deploy via `scripts/seed-mongo.mjs`. Matches the table in
`PRODUCT.md §7`.

### Authorization
Mongo has no row-level security. **Every API handler that touches user
data** calls `requireUser()` first, then scopes its query by
`{ owner_id: user._id }` or, for shared toats, joins `toat_acl`. There
is one and only one place this rule lives: `lib/auth/require-user.ts`
plus a `lib/mongo/scoped.ts` helper that wraps `find/findOne/update/delete`
with a mandatory ownership predicate. **No raw collection access** in
route handlers.

---

## 7. AI Extraction Pipeline

```
User mic input on mobile
      │
      ▼
Apple Speech / Android STT (on-device, free, fast)  ──┐
      │                                                │ if STT fails or
      ▼                                                │ confidence < 0.7
Transcript (string)                                    │
      │                                                ▼
      │                                          Whisper via /api/transcribe
      │                                                │
      └────────────────────┬───────────────────────────┘
                           ▼
                POST /api/captures { transcript, audio_url? }
                           │
                           ▼
                POST /api/extract (server-side)
                           │
                           ▼
            OpenAI GPT-4o-mini (Structured Outputs)
            with Zod schema for:
             { toats: [
                 { kind, tier, title, notes?, starts_at?, ends_at?,
                   tz, location?, recurrence_rule?, kind_data, confidence }
               ],
               people: [{ display_name }] }
                           │
                           ▼
            For each toat with confidence < 0.6:
              ↪ escalate to GPT-4o
                           │
                           ▼
            Resolve people (dedup by display_name + owner_id)
            Compute pings via reminder_policies
            Insert toats + pings + capture in one Mongo session
            Trace cost + tokens to Langfuse
                           │
                           ▼
            Return { capture_id, toats: [...] }
                           │
                           ▼
            Client shows confirm sheet → user accepts/edits → done.
```

**Cost target:** < $0.005 per capture average. GPT-4o-mini at structured
output sees ~80% hit rate; escalation to GPT-4o on low confidence keeps
quality up.

---

## 8. Notification (Ping) Pipeline

### Local pings (mobile only, fastest)
Mobile schedules `flutter_local_notifications` for any ping in the next
72h whose `fires_at - now < 72h`. Re-scheduled on app foreground. No
network needed at fire time.

### Push pings (cross-device, beyond 72h or after device reboot)
Server-side cron at `/api/cron/fire-pings` runs every minute on
DigitalOcean's scheduled jobs. Picks up pings where
`{ fired: false, fires_at: { $lte: now + 90s } }`. For each:
1. Send FCM message to user's `fcm_tokens`.
2. If `channel == email`, also send via Resend.
3. If `channel == sms`, send via Twilio (rate-limited per user).
4. If `channel == critical_alert`, FCM payload uses `apns-priority: 10` + critical alert sound (requires Apple entitlement).
5. Mark `fired: true, fired_at: now`.

### Idempotency
The cron fetches with `findOneAndUpdate({ fired: false, fires_at: $lte },
{ $set: { fired: true, fired_at: now } })` so two concurrent dispatchers
can't double-fire.

---

## 9. Authentication Flow

### Mobile
1. User picks provider (Google / Apple / Email / Phone) on `LoginScreen`.
2. Firebase SDK handles OAuth / magic link / OTP — no user creation in
   our DB yet.
3. On success, mobile calls `POST /api/auth/session` with the Firebase
   ID token in the Authorization header.
4. Server verifies token via `firebase-admin`, upserts `users` doc by
   `firebase_uid`, registers/updates the FCM token, returns the user
   profile.
5. From now on, every API call attaches the Firebase ID token. The SDK
   refreshes it automatically.

### Web
1. Same Firebase Auth flow, browser SDK.
2. After sign-in, browser POSTs to `/api/auth/session` which sets an
   HTTP-only, secure, SameSite=lax cookie scoped to `.toatre.com` with
   the Firebase ID token (short-lived) + a refresh trigger.
3. Server-rendered routes read the cookie via a middleware and call
   `requireUser()`.

### Account linking
Same email across providers auto-links to one `users` row, keyed by
verified email. Phone numbers verified via Twilio Verify get attached to
the existing user, never create a new user.

---

## 10. Sharing Flow

1. Owner picks a toat → "Share" → enters one or more handles or emails.
2. Server creates `toat_acl` rows with `invite_token` (unguessable, 32B base64url) for any non-Toatre recipient.
3. Resend email goes out with link `https://toatre.com/j/<token>`.
4. Recipient hits `/j/<token>`:
   - **Not signed in:** sees a public preview (title, owner display name, when, kind, location). No private notes.
   - **Signed in:** sees full toat per their granted role; preview screen also offers "Add to my Toatre" which materializes a copy on their timeline (or links to the original if they have edit role).
5. Owner can revoke access at any time: `DELETE /api/toats/[id]/share`.

---

## 11. Offline Strategy (Mobile)

- **All captures work offline.** Mic recording, transcription via Apple
  Speech / Android STT, manual entry — all happen locally first.
- Captures and edits while offline are queued in SQLite under
  `pending_mutations` with idempotency keys (UUID v4).
- A `sync_service` flushes the queue on connectivity change with
  exponential backoff (1s → 2s → 4s → 30s cap).
- The timeline shows a small offline indicator and a "queued" badge on
  toats not yet acked by the server.

---

## 12. Storage (DigitalOcean Spaces)

- Bucket: `toatre-prod` in NYC3 region (or closest to majority users).
- Folder layout:
  ```
  voice/{user_id}/{capture_id}.m4a       # only if voice_retention = true
  avatars/{user_id}.jpg
  attachments/{toat_id}/{filename}
  ```
- Mobile + web never receive Spaces credentials. They:
  1. POST `/api/upload/sign` with `{ kind, content_type, byte_size }`.
  2. Get back a pre-signed PUT URL valid for 5 minutes.
  3. PUT the file directly to Spaces.
  4. POST the resulting URL back as part of the toat/capture/profile mutation.
- 30-day lifecycle rule on `voice/` if user disables retention.

---

## 13. Environments & Configuration

Three environments: `dev`, `staging`, `prod`. Each has its own:
- Firebase project (`toatre-dev`, `toatre-staging`, `toatre-prod`)
- MongoDB Atlas database — **co-tenanted in the existing Mutqin Atlas
  org + cluster**, isolated by database name: `toatre_dev`,
  `toatre_staging`, `toatre_prod`. Separate Atlas database users per
  env, each scoped only to its own DB. Future split-out documented in
  §1.
- DigitalOcean Spaces bucket (under DO team **`iReve`**): `toatre-dev`,
  `toatre-staging`, `toatre-prod`.
- DigitalOcean App Platform deployment (under DO team **`iReve`**),
  one app per env.
- Resend sender domain (sub-domains for dev/staging)
- Twilio sub-account
- Sentry project (per env)
- PostHog project (per env)

### `.env.example` (committed)
```
# === Web (server) ===
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Firebase Admin
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Firebase Web Client (public)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=

# Mongo
MONGODB_URI=
MONGODB_DB=toatre

# OpenAI
OPENAI_API_KEY=
OPENAI_EXTRACTION_MODEL=gpt-4o-mini
OPENAI_ESCALATION_MODEL=gpt-4o
OPENAI_WHISPER_MODEL=whisper-1

# Langfuse
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_HOST=https://cloud.langfuse.com

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_VERIFY_SERVICE_SID=
TWILIO_SMS_FROM=

# Resend
RESEND_API_KEY=
REMINDER_FROM_EMAIL=Toatre <hello@toatre.com>

# DO Spaces
SPACES_KEY=
SPACES_SECRET=
SPACES_REGION=nyc3
SPACES_BUCKET=toatre-prod
SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com

# Sentry
SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Cron
CRON_SECRET=                   # used to gate /api/cron/* endpoints
```

### Secrets management
- Never committed. `.env.local` is gitignored.
- DigitalOcean App Platform: env vars set per environment in the dashboard.
- Codemagic: secrets stored per-app in the Codemagic UI; surfaced as env vars + signing assets.
- Mobile uses `--dart-define` flags wired via Codemagic for `API_BASE_URL`, `SENTRY_DSN`, `POSTHOG_KEY`.

---

## 14. CI/CD

### Mobile — Codemagic
File: `mobile/codemagic.yaml`. Modeled directly on
`Mutqin Mobile/codemagic.yaml`.

Workflows:
- **`ios-release`** — push to `main` → archive → submit to TestFlight
  under team **Saraf Talukder** (Apple Team ID `8B9NZ6FRKF`), bundle
  `com.toatre.app`.
- **`ios-adhoc`** — manual trigger → ad-hoc IPA emailed to owner.
- **`android-release`** — push to `main` → AAB → Play Internal track,
  package `com.toatre.app`.
- **`flutter-test`** — every PR → `flutter analyze` + `flutter test`.

Codemagic uses the `app_store_connect` integration (ASC API key) and
Google Play service account JSON, both stored in Codemagic team-level
integrations.

### Web — DigitalOcean App Platform
- Connected to `realsaraf/toatre` via GitHub integration.
- Branch `main` → production deploy.
- PRs → preview deploys (DO App Platform feature).
- Build command: `cd web && npm ci && npm run build`.
- Run command: `cd web && npm run start`.
- Health check: `GET /api/health` (returns 200 + git sha).
- Scheduled jobs:
  - `* * * * *` → `GET /api/cron/fire-pings` with `CRON_SECRET` header.
  - `0 3 * * *` → `GET /api/cron/cleanup-captures`.

### Repo policy
- Branch `main` is protected.
- All changes via PR + at least `flutter test` + `next lint` + `tsc --noEmit` + unit tests pass.
- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `ci:`).
- No squash on merge — keep linear history with rebase.

---

## 15. Observability

| Concern | Tool | Notes |
|---|---|---|
| Crashes / exceptions (mobile) | Sentry (`sentry_flutter`) | Wired in `main.dart`. |
| Crashes / errors (web) | Sentry Next.js SDK | `sentry.client.config.ts`, `sentry.server.config.ts`. |
| Server logs | DigitalOcean App Platform → forwarded to Logtail (later) | Stdout for now. |
| Product analytics | PostHog | Cohort, funnels, retention. No PII. |
| LLM observability | Langfuse | Cost, latency, quality, prompt versions. |
| Uptime | DigitalOcean Uptime monitor → email on failure | Free tier. |

---

## 16. Security Checklist (must pass before public launch)

- [ ] All API routes call `requireUser()` or are explicitly marked public.
- [ ] All Mongo queries scoped via `lib/mongo/scoped.ts` — no raw `db.collection.find`.
- [ ] Zod-validated request bodies on every POST/PATCH.
- [ ] Rate limiting on `/api/captures`, `/api/extract`, `/api/twilio/verify/start`, `/api/auth/session` (per-IP + per-user).
- [ ] CORS restricted to known origins.
- [ ] CSP header on web (no `unsafe-inline` except for Next-injected styles).
- [ ] HTTPS-only cookies (`Secure`, `HttpOnly`, `SameSite=Lax`).
- [ ] No secrets in `NEXT_PUBLIC_*` except documented public ones.
- [ ] FCM tokens removed from user doc when token is invalidated.
- [ ] Twilio + Resend webhook signatures verified server-side.
- [ ] Account deletion truly deletes (toats, captures, voice clips, ACL rows, FCM tokens, Firebase user).
- [ ] PII redacted from Sentry breadcrumbs (configure `beforeSend`).
- [ ] OWASP Top 10 review at end of Phase 4.

---

## 17. Phased Build Plan (high level)

Detailed plan with checklists + status lives in `PLAN.md` (created in
Phase 0, day 1). Phase headlines:

**Platform launch order:** iOS first to TestFlight; Android remains a
first-class build target throughout (Flutter, no platform-specific
shortcuts), but Play Internal Track submission and any Android-only
polish ships in Phase 8. The Flutter codebase, plugins, and CI matrix
include Android from day one so we never build up an iOS-shaped debt.

| Phase | Goal | Exit criteria |
|---|---|---|
| **0 — Accounts + scaffold** | All third-party accounts ready, both apps booting locally, `main` deploys (empty) to DO. | Visiting `toatre.com` shows a placeholder. Flutter app boots on iOS sim **and** Android emulator with empty timeline. |
| **1 — Auth end-to-end** | Sign-in works on mobile + web with all 4 providers; users persist in Mongo. | Can sign in on TestFlight build and see one's own profile in `/api/users/me`. |
| **2 — Capture + extraction** | Mic capture → STT → AI → toats appear on timeline. | Capturing "Dinner with Priya tomorrow at 7" creates one `event` toat with the right time. |
| **3 — Timeline + detail editor** | Full CRUD parity mobile + web. | Can edit a toat on web, see change reflected on mobile, and vice versa. |
| **4 — Pings** | Local + push + email reminders fire on time. SMS opt-in toggle present but disabled. | Urgent toats fire on TestFlight build with critical alert; email reminders land in inbox. |
| **5 — Sharing + people** | Handle-based sharing works end-to-end including public `/j/[token]` preview. | Two test users can share a toat and both see it on their timelines. |
| **6 — Settings + privacy** | Settings page, account delete, data export, voice retention toggle (default off). | Account delete wipes everything in 30s; export downloads a JSON of all user data. |
| **7 — Polish + analytics** | Empty states, errors, dark theme audit, accessibility audit, PostHog events instrumented. | Crash-free > 99.5% over 7 days; all `Mobile NFR §9` targets hit. |
| **8 — Beta launch** | Public TestFlight + Play Internal Track + web at `toatre.com`. SMS reminders enabled (still free + opt-in). | First 50 invited beta users onboarded across both platforms. |
| **9 — Store submission** | App Store + Play Store production review pass. | Apps live in both stores. |
| **10 — Monetization (post-launch)** | SMS reminders move behind a paid Pro tier (Stripe via web; StoreKit/Google Play Billing on mobile). | Free users see the SMS toggle gated; paid users see it enabled. |

---

## 18. AI Agent Operating Notes (for whoever picks up the work)

- **Always read `PRODUCT.md` then this file before starting work.** Then
  open `PLAN.md` and find the first unchecked task in the active phase.
- **Locked vocabulary** is non-negotiable. Use *toat*, *Ping*, *Capture*,
  *Kind*, *Tier*, *Handle*. Never *event*, *notification*, *priority*.
- **Mirror Mutqin** for any Flutter pattern that has an obvious analog.
- **Mirror Mutqin Web** for any Next.js pattern that has an obvious analog.
- **Anti-patterns to avoid:**
  - Adding a monorepo tool (Turbo, Nx, pnpm workspaces). Two apps, two package managers, intentional.
  - Adding a state management library other than Provider for mobile.
  - Adding LangChain / LlamaIndex. Use OpenAI SDK directly.
  - Adding light theme. v1 is dark only.
  - Touching `bundleIdentifier` / `package` after Phase 0. They are forever.
- **When uncertain, ask** before guessing. Especially for: store
  metadata, copy that goes to users, schema migrations, anything that
  costs money.

---

## 19. Trademark / Legal

- Trademark filing for "Toatre" wordmark + logo via USPTO Intent-to-Use
  is **owner's** task. Tracked in `PLAN.md` Phase 8.
- Privacy policy + ToS authored under Saraf Talukder as the data
  controller. Sub-processors: Firebase (Google), MongoDB Inc., DigitalOcean,
  OpenAI, Twilio, Resend, Langfuse, Sentry, PostHog. Must be listed in
  `/privacy`.

---

## 20. Resolved Decisions (locked 2026-04-25)

- [x] **Apple Developer team:** Saraf Talukder, team ID `8B9NZ6FRKF`.
- [x] **Apple bundle ID:** `com.toatre.app`.
- [x] **MongoDB Atlas:** co-tenanted in the existing Mutqin Atlas org/
      cluster. Database name `toatre_prod` (and `_dev`/`_staging`).
      Future split-out path documented in §1. No new Atlas org until needed.
- [x] **DigitalOcean team:** `iReve`. Project name `toatre`. App
      Platform + Spaces both live under this team.
- [x] **Brand colors:** indigo `#4F46E5` → amber `#F59E0B` gradient. **All
      brand styling lives in exactly one source per app** so swapping the
      palette is a one-file change:
        - Mobile: `mobile/lib/utils/app_colors.dart` exposes
          `AppColors.gradientStart`, `AppColors.gradientEnd`, plus
          `AppColors.brandGradient` (LinearGradient). Every screen
          consumes these constants — no inline hex anywhere else.
        - Web: `web/src/app/globals.css` defines
          `--brand-gradient-start: #4F46E5` and `--brand-gradient-end:
          #F59E0B` plus a `--brand-gradient` shorthand. Tailwind theme
          extension reads these vars. No raw hex colors anywhere else.
        - Linter rule (added in Phase 0): grep CI step fails if any
          file under `mobile/lib/` or `web/src/` (excluding the two
          source files above) contains hardcoded brand hex.
- [x] **Launch order:** iOS first to TestFlight (Phase 0–7). Android
      kept buildable + tested every phase but doesn't ship to Play
      Internal Track until Phase 8.
- [x] **Voice retention default:** `false`. User must explicitly opt in
      under Settings → Privacy.
- [x] **SMS reminders:** opt-in only. **Free during beta**, becomes a
      paid Pro feature post-launch (Phase 10). UI gating is built in
      from Phase 4 (toggle + plan check stub) so the upgrade path is
      a flag flip, not a refactor.
