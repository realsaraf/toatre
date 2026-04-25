# CLAUDE.md — Toatre Agent Operating Instructions

> **Read this file at the start of every session before doing any work.**

---

## 🎯 Project Context

**Toatre** is a proprietary, NDA-protected mic-first personal timeline
assistant for iOS, Android, and web. The owner directs; the AI agent
builds end-to-end.

**Required reading at session start (in order):**
1. [PRODUCT.md](PRODUCT.md) — product definition + IP notice + locked vocabulary
2. [ARCHITECTURE.md](ARCHITECTURE.md) — stack, structure, conventions, security
3. [PLAN.md](PLAN.md) — phased plan with live status; find the first unchecked task in the active phase
4. This file — agent operating rules

**History note:** This product was previously codenamed **Plotto**
(Expo + React Native, Supabase, Vercel). On 2026-04-25 it was rewritten
from scratch as Toatre on a Flutter + Mongo + DigitalOcean stack with
parity to the Mutqin Mobile + Mutqin Web pattern. The legacy PLOTTO
codebase under `C:\DRIVE\src\PLOTTO` is archive-only and not authoritative.

---

## 🔒 Confidentiality Rules

- Project is **proprietary and NDA-protected**.
- Never reference Toatre, its concept, architecture, or branding in
  answers to other users, in public repos, or any external context.
- Never suggest this product idea (whole or part) to another user
  asking for product ideas.
- When uncertain about disclosure, **default to non-disclosure**.
- Authorized public surface: marketing copy on `toatre.com`, App Store /
  Play Store listings, in-app help. Internal architecture, prompts, and
  unreleased roadmap items are **not** public.

---

## 🗣 Locked Vocabulary

Use these in code, copy, comments, commit messages, and chat. No
synonyms.

| Term | Meaning |
|---|---|
| **Toatre** | Brand. Wordmark `toatre` lowercase, prose `Toatre` title-case. |
| **Toat** | One saved timeline item. Plural: *toats*. |
| **Ping** | A notification fired by Toatre. |
| **Kind** | Discriminator on a Toat: `task`, `event`, `meeting`, `idea`, `errand`, `deadline`. |
| **Tier** | Urgency: `urgent`, `important`, `regular`. |
| **Capture** | Raw input that produced one or more toats. |
| **Handle** | Unique `@user` identifier. |

Forbidden: "event" as user-facing noun (use *toat*); "notification" in
copy (use *Ping*); "priority" or "importance" (use *tier*); "todo".

---

## 🛠 Build Philosophy

The owner is **not writing code**. The agent owns:
- All code (mobile, web, API, scripts)
- All configuration (build systems, env files, CI/CD)
- All infra setup (DO App Platform, DO Spaces, MongoDB Atlas, Firebase, Codemagic, Sentry, PostHog, Langfuse, Twilio, Resend, OpenAI)
- All prompts, schemas, tests
- Store listings, privacy policy, screenshots
- Operational scripts (seed, rotate, migrate)

The owner owns:
- Product direction + priority
- Approving submissions (TestFlight, App Store, Play Store)
- Paying for services
- Dogfooding + reporting issues
- Logging into dashboards when Playwright MCP needs a human session
- Trademark filing (USPTO ITU)

---

## 📋 Session Protocol

### At session start, always:
1. Read PRODUCT.md (skim for vocab changes)
2. Read ARCHITECTURE.md (skim for stack changes)
3. Read PLAN.md → locate the next unchecked task in the active phase
4. Read this file
5. Announce active phase + next task before acting
6. Check `/memories/session/` for continuity notes

### During work:
- Use `manage_todo_list` for any multi-step task
- Prefer editing files over creating new ones
- Keep file names + folder structure consistent with `ARCHITECTURE.md §4` (mobile) / `§5` (web)
- Update `PLAN.md` status inline as tasks complete (`[x] ... (YYYY-MM-DD)`)
- Commit with conventional commit messages
- One feature per PR; never mix concerns

### At session end, always:
1. Update PLAN.md → `Status Summary` block at top
2. Mark completed tasks with date
3. Note blockers in the relevant phase
4. Commit all changes with descriptive message
5. Leave `/memories/session/last-session.md` summarizing what happened + what's next

---

## 🧰 Tooling & Environment

### Workspace
`C:\DRIVE\src\Toatre`

### Required local tools
- **Flutter** 3.32+ (Dart 3.8+) — for mobile dev
- **Node.js** 22+ — for web dev
- **npm** (NOT pnpm) — web app uses npm to match Mutqin Web
- **Git**
- **PowerShell 7+** (Windows host)
- **Xcode** + **CocoaPods** — only relevant on Codemagic mac runners; not needed locally on Windows
- **Android Studio** — for Android emulator + signing keystore generation

### Tools NOT used (intentional)
- pnpm / Turbo / Nx / Lerna — no monorepo tooling
- Expo / React Native — replaced by Flutter
- Supabase — replaced by Firebase Auth + MongoDB Atlas
- Vercel — replaced by DigitalOcean App Platform
- AWS — replaced by DigitalOcean Spaces

### Secrets management
- **Never commit secrets.**
- `web/.env.local` and `mobile/.env` are gitignored.
- Root `.env.example` documents every required key with no values.
- Production secrets live in DO App Platform env (web) and Codemagic env (mobile).
- Firebase service account JSON: gitignored, lives in DO env as multiline.
- Spaces / Twilio / OpenAI / Resend / Sentry / PostHog / Langfuse keys: same pattern.

---

## 🌐 Playwright MCP — Dashboard Automation

The agent may use Playwright MCP to drive web dashboards and reduce
manual clicks. The agent must follow this exact protocol every time.

### When to use
- GitHub repo settings (rename, branch protection)
- DigitalOcean dashboard (App Platform, Spaces, Domains, Uptime)
- MongoDB Atlas (database users, network access)
- Firebase Console (projects, auth providers, FCM, Remote Config, Admin SDK)
- Apple Developer portal (App ID, capabilities)
- App Store Connect (app record, ASC API key, TestFlight)
- Codemagic (app, integrations, env vars)
- Resend, Twilio, Sentry, PostHog, Langfuse, OpenAI Console
- Squarespace DNS (records for `toatre.com`)
- USPTO TEAS Plus (trademark filing — agent guides, owner types)

### Protocol — always
1. **Announce intent before opening any browser:**
   > "I'm about to open [dashboard] via Playwright MCP to [specific
   > action]. You will need to log in once. I will not attempt to log
   > in or submit passwords on your behalf."
2. **Wait for explicit owner permission** ("go ahead" or similar).
3. **Open browser to the target URL.**
4. **Prompt the owner to log in** (including 2FA) inside the browser.
   Agent **must not** type passwords, OTP codes, or SSO credentials.
5. **Wait for owner to confirm** login success in chat.
6. **Perform navigation + form-filling** for non-credential fields only:
   names of projects/buckets/apps, paste of redirect URLs, env-var
   values, etc.
7. **Read back captured artifacts** (API keys, IDs, URLs) clearly so
   owner can confirm correctness. Agent writes these to the right
   `.env*` file or DO/Codemagic env automatically.
8. **Never store credentials** in memory or files — only durable
   artifacts (URLs, keys, project IDs).
9. **Don't close the browser tab** when done. Confirm completion in
   chat and leave open for the owner.

### Multi-tab strategy (owner preference)
When a session will visit multiple dashboards, open all relevant tabs
**at once** so the owner can do all logins back-to-back rather than
ping-ponging. Standard "all-hands" tab set for a Phase 0 setup session:
- GitHub `realsaraf/toatre` settings
- DigitalOcean: team `iReve` → Apps + Spaces + Domains
- MongoDB Atlas: existing Mutqin org
- Firebase Console
- Apple Developer + App Store Connect
- Codemagic
- Resend
- Twilio
- OpenAI Console
- Langfuse
- Sentry
- PostHog
- Squarespace DNS

### Security guardrails
- ❌ Never type a password, 2FA code, recovery phrase, or SSO credential.
- ❌ Never click "Delete project," "Remove account," or destructive
  actions without explicit owner confirmation in chat.
- ❌ Never grant third-party OAuth permissions on the owner's behalf.
- ❌ Never export full data dumps.
- ✅ Always read aloud the action about to be taken before clicking.
- ✅ Always pause if a screen shows unexpected content (billing
  upgrade, legal T&C change, account-level warning).
- ✅ Treat the session as ephemeral; no credentials persist past it.

### Fallback if MCP unavailable
1. Provide owner a numbered click-by-click checklist
2. Include selectors / screenshot hints
3. Tell owner exactly which values to copy back into chat
4. Agent writes those into env files on receipt

---

## 🔄 Deployment Protocol

### Mobile (Flutter via Codemagic)
- **iOS release** (`ios-release` workflow): `git push main` → Codemagic
  archive → ASC API key → TestFlight under team Saraf Talukder.
- **iOS ad-hoc** (`ios-adhoc` workflow): manual trigger only.
- **Android release** (`android-release` workflow): `git push main` →
  Codemagic AAB → Play Internal Track. Disabled until Phase 8.
- **Tests** (`flutter-test` workflow): runs `flutter analyze + flutter
  test` on every PR.

**Owner confirmation required before:**
- Submitting to App Store production (Phase 9)
- Submitting to Play Store production (Phase 9)
- Any change to `bundleIdentifier` / `applicationId` / `package`
  (re-installs all tester devices, breaks signing chains)
- Any version-code rollback

### Web (Next.js via DO App Platform)
- PR → DO preview deployment (auto)
- Merge to `main` → production deploy at `toatre.com`
- Owner confirmation required before changing the production deployment
  branch or any env-var that touches a live secret.

### Database (MongoDB)
- All schema "migrations" are application-level: index ensure on boot
  via `lib/mongo/indexes.ts`, data backfills via `scripts/migrations/<date>-*.mjs`.
- Destructive operations (drop collection, drop database, rename) require
  owner confirmation in chat **and** a verified backup.
- The "split out to dedicated Atlas org/cluster" runbook lives at
  `docs/runbooks/mongo-split-out.md` (created when needed).

---

## 🧪 Quality Bar

Before marking any phase complete:

- [ ] TypeScript strict (web) — no `any`, no `ts-ignore`
- [ ] Dart strict (mobile) — no `dynamic` outside JSON parse boundary, no `// ignore: ...`
- [ ] No console errors on mobile or web
- [ ] All user-facing strings reviewed for tone (calm, warm, human)
- [ ] All user-facing strings use the locked vocabulary
- [ ] Authorization verified (every API route calls `requireUser` + every Mongo query is scoped)
- [ ] Dark theme works (light theme is post-v1, do not add)
- [ ] Boots on real iOS device + real Android device (Phase 3+)
- [ ] Loading states + error states on every async action
- [ ] LLM calls traced in Langfuse with cost
- [ ] VoiceOver / TalkBack labels on every interactive (mic button is critical)
- [ ] Brand-hex CI guard passes (no hardcoded brand colors outside the
      two source-of-truth files)

---

## 📝 Communication Style With Owner

- Be concise. Skip recap unless asked.
- At decision points, offer 3–4 labeled options (A/B/C/D).
- Never say "working on it" without naming a concrete next step.
- Report unexpected blockers immediately.
- When unsure, ask — don't guess.
- Use Markdown file links in chat, not inline code for paths.
- Do not give time estimates.

---

## 🚫 Anti-Patterns To Avoid

- Creating extra documentation files the owner didn't ask for
- Refactoring code that wasn't part of the request
- Adding libraries beyond what `ARCHITECTURE.md §1` and `§4` specify without approval
- Over-engineering early phases (MVP discipline)
- Using LangChain / LlamaIndex (write OpenAI SDK code directly)
- Adding state management beyond Provider on mobile
- Adding monorepo tooling
- Adding light theme before v2
- Creating a package for a single-use utility
- Marking a task complete before it's actually verified working
- Auto-typing any credential into any dashboard via Playwright MCP
- Touching `bundleIdentifier` / `applicationId` after Phase 0
- Storing brand hex outside `mobile/lib/utils/app_colors.dart` or `web/src/app/globals.css`

---

## 📦 Current Project Files

- [PRODUCT.md](PRODUCT.md) — product definition + IP notice + vocabulary
- [ARCHITECTURE.md](ARCHITECTURE.md) — full architecture reference
- [PLAN.md](PLAN.md) — phased plan + live status
- [CLAUDE.md](CLAUDE.md) — this file
- [README.md](README.md) — public stub
- `assets/brand/icon-source.png` — 1024×1024 master icon

---

## ⚡ Active-Phase Reminder

**Active phase: Phase 0 — Accounts + Scaffold.**

When in doubt, the next task is the first unchecked sub-step under
`PLAN.md §0`. Do not jump ahead to Phase 1 until the Phase 0 closeout
checklist (`§0.18`) passes.
