# Plan: Built by Nicole — Coaching Platform (Landing + Admin + Client Portal)
_Locked via grill — by Claude + Josh_

## Context
Nicole (5th-degree black belt, TKD world champion, WNBF pro) is starting to take fitness + nutrition coaching clients. She needs one platform: public landing page with intake application, an admin portal where she builds workout/nutrition plans and reviews check-ins, and a mobile-first client portal her clients actually enjoy using ("less of a workout than working out"). A prior build (`Downloads/📁 Personal/built-by-nicole-marie`) is static HTML + email-only Resend handlers — reusable for copy, intake fields, and her check-in question set, but has no database, auth, or portal. Her interview notes (Granola, pasted 2026-08-28) define the feature set. Her NS design system export (Claude Design) supplies fonts, colors, voice, logos, and real photography.

## Goal
Ship v1 of "Built by Nicole": Next.js PWA on Vercel + Supabase. Stranger → applies via landing intake → Nicole approves → invited client sets password → follows workout plan (logs sets), views meal plan (structured + optional PDF), submits Sunday weekly check-in with photos, messages Nicole in-app, watches progress (weight chart, photo compare, streak, adherence trends). Nicole runs everything from an admin portal with a notification feed and per-client toggles. So user-friendly a busy mom uses it one-handed on her phone.

## Key decisions (grill-resolved)
1. **Design**: NS design system rules — ink `#0D0D0F` / paper `#FAFAF8` / hot pink `#FF1F6B` / yellow `#FFE500` accents, Montserrat/Barlow/MOONTIME/JetBrains Mono, her voice guide (no em-dashes, no corporate cliches, no emoji in UI). Screenshots of her current red app + pastel dribbble shots = layout/feature inspiration only. Old fire-orange palette retired.
2. **Brand**: "Built by Nicole". NS ring lockup as logo mark. Real Nicole photos from `assets/photography/`; Higgsfield/GPT imagery only for non-Nicole visuals.
3. **Onboarding**: public intake form (no account) → application row → Nicole approves in admin → Supabase auth email invite → client sets password → intake data pre-fills profile. Invite-only portal.
4. **Intake smarts v1**: structured intake (goal, experience, days/week, equipment, injuries, nutrition habits, lifestyle) auto-builds a rule-based **Client Snapshot** card in admin: goal type, suggested split + frequency, starting plates/snacks target, red flags. AI (Claude API) plan drafting is explicitly future, once her system settles.
5. **Workouts v1**: Nicole's own exercise library (name, YouTube embed link, cue, optional image). Program = weeks × days; day = ordered blocks (single or superset), sets × rep-range × target weight, optional-exercise flag. Client logs actual reps + weight per set; sees last-time numbers and personal bests. No rest timers/tempo v1.
6. **Nutrition v1**: structured meal-plan builder (meals → foods/portions) rendered as mobile cards, plus optional per-client PDF attach viewed in-app. Per-client admin toggles: show macros, show calories, food journal on/off. Food journal = **photo-per-meal** logging + optional daily self-rating (spots trend dips). Full search-and-log tracker deferred.
7. **Weekly check-in (Sunday)**: date, dry weight, front/side/back photos, meal adherence 5★ + text, fitness adherence 5★ + text, open comments; optional mindset prompts (proud / excited). No required daily reporting.
8. **Messaging v1**: one thread per client (client ↔ Nicole), Supabase Realtime, photo attachments. No read receipts/typing.
9. **Progress tab**: dry-weight chart, photo timeline + side-by-side compare, check-in streak, adherence-rating trends. No body measurements v1.
10. **Notifications v1**: Resend email — Sunday reminder to clients; new check-in/message/application to Nicole. Admin in-app notification feed, inline-actionable. Web push deferred.
11. **Payments**: none in v1. Schema + README/handoff docs reserve a clean Stripe path (client `status`, future `subscriptions` table noted, no billing logic).
12. **Platform**: single Next.js (App Router, TypeScript, Tailwind mapped to NS tokens) repo on Vercel. Supabase: Auth, Postgres + RLS, Storage (progress/meal photos, PDFs), Realtime. Installable PWA (manifest, icons, offline shell). Two roles: admin, client — enforced by RLS + route guards.

## Approach
1. **Catalogue references** — create `~/Documents/Claude/Projects/built-by-nicole/` with `reference/` holding: `NS-Design-System/` (unzipped), `interview-notes.md` (pasted Granola notes), `inspiration/` (design screenshots), `legacy-build/` (copy of old `built-by-nicole-marie` for copy + check-in questions), `README.md` indexing it all.
2. **Scaffold** — Next.js 15 + TS + Tailwind; port NS `tokens/*.css` into theme; MOONTIME from `assets/fonts/`; PWA manifest + icons from NS logos. Route groups: `(marketing)/`, `(client)/app/*`, `(admin)/admin/*`, plus `/login`, `/apply`.
3. **Supabase schema + RLS** (new project `ca-central-1`, migrations) — canonical table list: `user_roles` (locked, service-role writes only), `profiles` (display data, timezone, toggles show_macros/show_calories/food_journal_enabled, status active|paused|archived — toggles/status admin-writable only), `applications` (intake jsonb + snapshot jsonb + status new|approved|declined; declined/abandoned auto-deleted after 90 days, deletable on request pre-approval), `exercises` (library: name, youtube_url, cue, image), `programs` → `program_versions` (immutable published) → `program_days` → `day_blocks` (superset grouping, order) → `block_exercises` (exercise_id ref, sets, rep_range, target_weight, optional flag — prescription snapshotted in version), `program_assignments` (client, version, start date, timezone, active/skip semantics), `workout_sessions` → `set_entries` (assignment version, exercise, set index, actual reps/weight, unit, timestamp, idempotency key), `meal_plans` → `meal_plan_versions` (immutable) → `meals` → `meal_items`, `meal_plan_assignments` (client, version, effective dates), `meal_plan_pdfs` (attached to version), `checkins` (unique client+ISO-week, dry weight, adherence ratings, texts, submitted/updated timestamps) → `checkin_photos` (pose enum, unique checkin+pose), `food_logs` (photo, note, meal label) + `daily_ratings`, `messages` → `message_attachments`, `notifications`, `outbox_events`. RLS: clients only own rows via user_roles helper; admin all. Private buckets: `progress-photos`, `food-photos`, `meal-pdfs`, `message-photos` (owner-prefixed keys, signed URLs, per-bucket storage.objects policies).
4. **Landing page** — single mobile-first page in NS system: hero (real photo, "Nothing Changes If Nothing Changes." register), credibility, how it works, what you get, intake application (multi-step, one question in view at a time, big touch targets), client login link. Rewrite legacy copy per NS voice guide.
5. **Intake + snapshot** — multi-step form → `applications`; rule engine builds snapshot server-side; admin application review screen with Approve (sends Supabase invite) / Decline.
6. **Client portal** — bottom nav: **Home** (today's focus, streak, next check-in), **Fitness** (current program → day view → set logging with last-time prefill + PB), **Nutrition** (meal plan cards per toggles, PDF viewer, photo food journal if enabled), **Check-in** (Sunday flow: weight → photos → ratings → notes; history), **Progress** (weight chart, photo compare, streak, rating trends). Messages reachable from Home header.
7. **Admin portal** — desktop-friendly, mobile-capable: notification feed (inline reply/review), client list → client detail (snapshot, toggles, plans, check-ins, photos, thread), exercise library CRUD, program builder (weeks/days/supersets), meal-plan builder + PDF upload, application review.
8. **Email** — Resend: application received (to Nicole), invite/welcome, Sunday check-in reminder (Vercel cron), new check-in (to Nicole), new message nudge. Templates in NS voice.
9. **Verification** — seed script (Nicole admin + demo client + demo program/meal plan); browser-pane walkthrough at mobile viewport of full loop: apply → approve → invite → login → log workout → photo meal log → Sunday check-in → admin feed → reply message → progress chart. Supabase advisors check on RLS. Lighthouse mobile + PWA install check.
10. **Handoff docs** — README + `docs/` covering env vars, Stripe-future plan, toggle semantics, how Nicole uses admin.

## Hardening requirements (Codex review round 1, incorporated)
**Auth & authorization**
- Role/status/toggles are NEVER client-writable: role lives in a locked `user_roles` table, read via a `SECURITY DEFINER` helper function with fixed `search_path`, referenced by RLS; per-operation RLS policies with negative tests (client cannot alter role, toggles, ownership, others' rows).
- Every service-role operation (approve, invite, role change, deletion, storage cleanup) first verifies the caller's server-side session is an active admin before the service-role client is even constructed.
- Single authoritative invite flow: Supabase Auth `inviteUserByEmail` with allowlisted redirect → set-password page; Resend sends welcome content only after activation. Approval is an idempotent state machine (normalized unique email, unique constraints, invite recorded/retryable separately from DB transaction).
- Auth lifecycle covered: password reset, invite resend/expiry UX, logout, server-side session checks; permission matrix per client status (active/paused/archived × login/upload/message/reminders) enforced in RLS + workflows, not just UI.

**Public surface & uploads**
- `/apply` endpoint: zod validation, length caps, rate limiting, Cloudflare Turnstile, explicit duplicate-email policy (update-or-reject).
- All uploads: direct signed upload from the browser into a private owner-prefixed quarantine path (never proxied through Vercel handlers — iPhone photos exceed body limits), then server-side validation (signature/type/size), EXIF strip, and move to final owner path. `storage.objects` RLS policies per bucket (progress-photos, food-photos, meal-pdfs, message-photos), size + count caps, per-client quotas.
- `message_attachments` table + private `message-photos` bucket; Realtime uses private per-client channels with authenticated membership and cross-client negative tests.

**Schema correctness**
- Programs/meal plans are versioned: template → per-client assignment → immutable published version; prescriptions snapshotted so old logs never change meaning. Assignments carry start date, client IANA timezone (default `America/Edmonton` — Lethbridge), active-version + skip semantics.
- `set_logs` → `workout_sessions` + set entries keyed (assignment version, exercise, set index, client, timestamp, unit) with idempotency key. `youtube_url` lives on `exercises` only (privacy-enhanced embed, host allowlist).
- Check-ins keyed `(client, ISO week)` unique, week timezone + grace period defined, submitted/updated timestamps. `checkin_photos`: pose enum, unique `(checkin_id, pose)`, replacement rules.
- Ratings UI: accessible labeled 1–5 control (no unicode-star glyph icons, per NS icon rule).

**Delivery & ops**
- Notifications via outbox/event table (unique event key, retry state) → Resend, webhook reconciliation; cron dedupe key for Sunday reminders; cron heartbeat + error reporting (Sentry), structured logs, no health data or signed URLs in logs.
- Fonts self-hosted (subset MOONTIME + Google families via next/font local), preload used weights only.
- PWA v1: private/media responses excluded from service-worker cache; writes online-only with preserved local drafts. Drafts hold non-photo form fields only (never image blobs or signed URLs), expire on submission or 7-day TTL, cleared on logout.
- Seed/bootstrap tooling fails closed outside local/dev; service-role key server-only; demo data separate from admin bootstrap.
- Privacy basics before real clients: intake + portal privacy notice with explicit consent checkbox (photos, health info). One admin "Delete client" workflow removing Auth user, all owned DB rows (check-ins, logs, messages, notifications, outbox payloads), and storage objects; backup-retention window documented. Supabase region pinned: `ca-central-1` (Canada) — Auth/DB/Storage/logs/backups follow it.
- Check-in field mapping doc (`docs/checkin-mapping.md`): each legacy question (deviation, protein days, hunger, water, steps, Mama Burner) marked retained/replaced/removed per Nicole's interview decisions; Nicole signs off before the check-in migration is frozen. Interview-defined fields are the default; legacy items become optional prompts only if she asks.
- Verification beyond happy path: RLS-negative tests (SQL), approval-idempotency test, Playwright mobile flows for client + admin, axe accessibility pass (44px targets, chart text alternatives, reduced-motion), real-iPhone upload test.

**Build order (scope kept, sequenced as slices)**: 1) auth/intake/approval + RLS spine → 2) workout assignment + logging → 3) weekly check-in + admin review feed → 4) nutrition builder + PDFs + photo journal → 5) messaging + notifications → 6) progress views + PWA polish. Each slice verified before next.

## Risks / open questions
- iOS PWA quirks (photo upload UX, storage eviction) — mitigate: standard `<input capture>` flows, test on real iPhone.
- Program builder is the largest admin surface; keep v1 forms plain (no drag-drop polish required to ship).
- Sunday reminders computed per client's stored IANA timezone (default `America/Edmonton`); cron selects due recipients with dedupe key.
- Nicole's domain/hosting email (Resend verified domain) still needed before real sends; use test mode until she confirms domain.

## Out of scope (v1)
Payments/Stripe (path documented only), full food search tracker, AI plan drafting, body measurements, native iOS, web push, group coaching/Mom's Club/Misogi event pages, read receipts, multi-coach support.
