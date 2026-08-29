# Plan Review Log: Built by Nicole platform
Act 1 (grill) complete — plan locked with user. MAX_ROUNDS=5.

## Round 1 — Codex
Material problems remain in the [implementation plan](/Users/joshdumoulin/.claude/plans/users-joshdumoulin-downloads-design-sys-resilient-marshmallow.md).

1. **RLS privilege escalation:** Storing `role` in client-editable `profiles` can let a client promote themselves, while “admin sees all” is too vague to implement safely.  
   **Fix:** Keep authorization in admin-controlled `app_metadata` or a locked membership table and add explicit per-operation RLS policies plus tests proving clients cannot modify role, status, toggles, or ownership.

2. **Approval is a race-prone distributed operation:** Updating the application, creating an Auth user, creating a profile, and sending an invite can partially succeed or run twice.  
   **Fix:** Normalize email, enforce unique constraints, use an idempotent approval state machine, and record/retry the Auth invitation separately from the database transaction.

3. **The public application endpoint is undefended:** There is no rate limit, bot protection, payload limit, schema validation, or duplicate-submission strategy.  
   **Fix:** Add server-side validation, strict length limits, rate limiting, Turnstile or equivalent bot protection, and a deliberate duplicate-email policy.

4. **Sensitive-data governance is missing:** Weight, injury information, nutrition history, messages, and body photos require explicit handling rules beyond private buckets.  
   **Fix:** Define consent, privacy notice, retention, account deletion/export, photo deletion, backup retention, access logging, and cross-border data-hosting decisions before collecting real client data.

5. **Storage RLS is underspecified:** “Private, signed URLs” does not stop users from guessing or uploading paths unless `storage.objects` policies validate ownership.  
   **Fix:** Use non-guessable owner-prefixed object keys and explicit bucket policies tied to authenticated ownership and admin authorization.

6. **Uploads are an attack and cost surface:** The plan lacks limits and validation for image/PDF size, type, decompression bombs, executable content, EXIF location data, and upload quotas.  
   **Fix:** Validate signatures server-side, cap size/count/resolution, strip image metadata, constrain PDF delivery, set quotas, and never trust filename or browser MIME type.

7. **Message attachments have no schema or bucket:** Messaging promises photos, but the schema only lists `messages`, and the listed buckets omit message media.  
   **Fix:** Add `message_attachments` with owner/thread foreign keys and a private `message-photos` bucket governed by the same conversation authorization.

8. **Realtime authorization is not designed:** Table RLS alone is not a complete subscription and channel design, and careless filters can leak other clients’ events.  
   **Fix:** Specify private channels, authenticated topic membership, filtered subscriptions, reconnect/backfill behavior, and negative tests for cross-client message access.

9. **Programs cannot preserve history:** Editing a program or exercise would mutate the meaning of old set logs, PBs, and “last time” values.  
   **Fix:** Separate reusable templates from client assignments and publish immutable program versions whose prescribed exercise/set data is snapshotted for each workout.

10. **`set_logs` cannot uniquely identify a performed set:** Reps, weight, and date do not identify the client, workout occurrence, exercise, prescribed set number, or retries.  
    **Fix:** Model `workout_sessions` and set entries keyed to assignment/version, exercise, set index, client, completion timestamp, unit, and an idempotency key.

11. **Program scheduling is undefined:** “Weeks × days” does not establish start dates, active assignments, substitutions, skipped days, or what counts as today.  
    **Fix:** Add assignment start/end dates, client timezone, scheduled day offsets, active-version rules, and explicit skip/reschedule semantics.

12. **Check-in identity and streak rules are ambiguous:** A raw date permits duplicate submissions and makes late check-ins, edits, and streak calculations inconsistent.  
    **Fix:** Key check-ins by client plus canonical week, define the week timezone and grace period, enforce uniqueness, and record submitted/updated timestamps separately.

13. **Photo comparison metadata is insufficient:** Front/side/back photos need stable classification and missing-photo behavior.  
    **Fix:** Give `checkin_photos` a constrained pose enum, unique `(checkin_id, pose)` key, capture date, and explicit replacement/deletion rules.

14. **Reminder timezone is wrong and non-scalable:** The plan hard-codes `America/Toronto`, while the business context is Lethbridge and clients may live elsewhere; DST will produce incorrect sends.  
    **Fix:** Store IANA timezone and reminder preference per client, default deliberately, and make the cron select due recipients with a deduplication key.

15. **Emails and notifications can diverge:** Direct sends after writes can be lost, duplicated, or leave an in-app notification without its email counterpart.  
    **Fix:** Use an outbox/event table with unique event keys, retry state, delivery attempts, and Resend webhook reconciliation.

16. **The invite email design conflicts with itself:** The plan mentions both a Supabase Auth invite and a Resend invite/welcome without defining which contains the credential-setting link.  
    **Fix:** Choose one authoritative Auth invitation flow, allowlist its redirect URL, and separately send welcome content only after account activation.

17. **Auth lifecycle is incomplete:** Password reset, expired/reused invitations, email changes, logout, session revocation, and archived-user access are absent.  
    **Fix:** Add explicit recovery and invite-resend flows, token-expiry UX, server-side session checks, and authorization rules for every client status.

18. **Status and toggles are merely columns:** Nothing says whether paused or archived clients can log in, upload photos, message Nicole, or receive reminders.  
    **Fix:** Define a permission matrix for each status/toggle and enforce it in both RLS and server workflows, not just hidden UI.

19. **Exercise schema conflicts with the feature model:** YouTube belongs to the exercise library, yet `youtube_url` is listed on `block_exercises`, inviting duplication and drift.  
    **Fix:** Reference `exercise_id` from prescribed exercises and snapshot only version-sensitive presentation data; validate allowed video hosts and use privacy-enhanced embeds plus CSP.

20. **Meal plans have the same history problem as workouts:** Editing meals can retroactively change what a client was assigned, while PDF ownership and effective dates are unclear.  
    **Fix:** Publish immutable meal-plan versions through client assignments with effective dates and attach PDFs to the version, not loosely to a client.

21. **The stated legacy reuse is contradicted:** The prior check-in asks about deviations, protein days, hunger, water, steps, and Mama Burner, while the new plan replaces these with two adherence ratings without documenting that product decision.  
    **Fix:** Create an explicit field-mapping document and have Nicole approve which legacy questions are retained, transformed, or intentionally removed before freezing migrations.

22. **The PWA promise creates a privacy and consistency trap:** An “offline shell” does not explain whether authenticated pages, signed photo URLs, drafts, or workout writes are cached or queued.  
    **Fix:** Exclude private responses and media from service-worker caches and either declare writes online-only with preserved drafts or implement an idempotent encrypted sync queue.

23. **Accessibility is not an acceptance criterion:** Lighthouse alone will not verify keyboard flows, screen readers, chart alternatives, zoom, focus management, or accessible photo comparison.  
    **Fix:** Add WCAG 2.2 AA acceptance tests, semantic radiogroups, 44px targets, text alternatives for charts, reduced-motion handling, keyboard testing, and automated axe checks.

24. **The plan directly conflicts with the design system:** It specifies `5★`, while the NS guide forbids Unicode stars as icons; it also treats an “NS” lockup as settled even though the guide says the legal name/tagline are placeholders.  
    **Fix:** Use an accessible labeled 1–5 control and obtain explicit approval for the Built by Nicole wordmark/ring treatment before generating production icons.

25. **Font delivery is unresolved:** Porting `fonts.css` imports several Google-hosted substitutions, undermining the offline claim, CSP simplicity, privacy, and performance.  
    **Fix:** Self-host licensed fonts or use build-time font fetching with declared fallbacks, then subset and preload only weights actually used.

26. **Observability is effectively absent:** There is no plan for failed uploads, RLS denials, Auth invitation failures, cron health, Realtime disconnects, or email bounces.  
    **Fix:** Add structured request/event logs, error reporting, cron heartbeat alerts, delivery dashboards, audit events, and correlation IDs without logging health content or signed URLs.

27. **Verification is a happy-path demo, not a release gate:** One browser walkthrough and Supabase advisors will not catch authorization leaks, concurrent approvals, retries, migration breakage, or mobile upload failures.  
    **Fix:** Add automated unit, migration, RLS-negative, integration, concurrency/idempotency, and Playwright tests across client/admin accounts plus real iPhone upload testing.

28. **The seed script is a production security risk:** A script that creates Nicole’s admin and a demo client can accidentally seed production or expose service-role credentials.  
    **Fix:** Make production execution fail closed, separate bootstrap-admin tooling from demo data, require explicit environment confirmation, and keep service-role keys server-only.

29. **V1 is too broad to validate safely in one build:** Landing, intake, Auth, two portals, two builders, uploads, Realtime messaging, notifications, charts, PWA, and food journaling form several independent products.  
    **Fix:** Ship a vertical slice first: intake/approval, client assignment, workout logging, weekly check-in, and admin review; defer Realtime chat, food journal, advanced trends, and offline/PWA behavior until the security model is proven.

The frontend-specific review checklist exposed the missing accessibility, responsive interaction, font-delivery, offline-cache, and design-system acceptance criteria; these are plan defects, not polish tasks.

VERDICT: REVISE
### Claude's response
Accepted 1-20,22,25-28 as Hardening requirements section (condensed). #21 partially: new check-in fields are Nicole's own interview decision superseding legacy form; will note mapping in docs, not re-litigate. #24 accepted (accessible 1-5 control; wordmark approval noted). #29 rejected as descope but accepted as sequencing: full v1 scope kept, built as 6 verified slices. #14 accepted with America/Edmonton default (Lethbridge). #23 accepted as axe + targets + reduced-motion acceptance criteria, not full WCAG program.

## Round 2 — Codex
The revision addresses most prior findings and is now appropriately scoped for a solo coach with fewer than 50 clients. A few material contradictions remain.

## Prior findings addressed

Fully addressed: **#1–3, #5–13, #15–20, #22–23, and #25–28**.

That covers RLS hardening, idempotent approval, public-form abuse controls, storage policies, upload validation, attachments, Realtime isolation, immutable program/meal versions, workout-session identity, check-in uniqueness, outbox delivery, invite/auth lifecycle, status enforcement, schema conflicts, PWA caching, accessibility, fonts, observability, testing, and safe bootstrap tooling.

Partially addressed:

- **#4 Sensitive-data governance:** Privacy notice, retention, deletion, and region selection are added, but consent and complete account deletion remain underspecified.
- **#14 Reminder timezone:** Per-client timezones are introduced, but the old `America/Toronto` requirement remains and directly conflicts with `America/Edmonton`.
- **#24 Design-system conflicts:** The star control is fixed; the NS/Built by Nicole branding decision is still informal but is not implementation-blocking if Nicole has approved it.
- **#29 Scope:** The feature scope remains large, but the ordered vertical slices make this proportionate and manageable.

Unaddressed:

- **#21 Legacy check-in mapping:** The plan still says the legacy question set is reusable while defining a substantially different check-in.

## Remaining material issues

1. **Timezone requirements contradict each other:** Assignments default to `America/Edmonton` at [line 48](/Users/joshdumoulin/.claude/plans/users-joshdumoulin-downloads-design-sys-resilient-marshmallow.md:48), while reminders still use `America/Toronto` at [line 66](/Users/joshdumoulin/.claude/plans/users-joshdumoulin-downloads-design-sys-resilient-marshmallow.md:66).  
   **Fix:** Remove the single-Toronto requirement and calculate reminders from each client’s stored IANA timezone, defaulting to `America/Edmonton`.

2. **The authorization architecture still says “user_roles table (or app_metadata)”:** Those choices require different claim-refresh and RLS designs, so leaving both open risks inconsistent implementation.  
   **Fix:** Choose one now; for this app, use a locked `user_roles` table referenced by a `SECURITY DEFINER` authorization helper with a fixed `search_path`.

3. **Service-role endpoints could bypass every RLS guarantee:** Admin approval, role changes, invites, deletion, and storage cleanup will need service-role access, but the plan does not require those handlers to authenticate Nicole before invoking it.  
   **Fix:** Require every service-role operation to verify the server-side session and admin role before constructing or calling the service-role client.

4. **Legacy check-in requirements remain contradictory:** The old form includes water, steps, hunger, deviations, protein days, and Mama Burner, while the new flow only specifies adherence ratings and mindset prompts.  
   **Fix:** Add a short approved mapping listing each legacy question as retained, replaced, optional, or removed before implementing the check-in migration.

5. **“Account deletion” does not define all deletion targets:** Removing storage objects alone can leave Auth identity, database health records, messages, notifications, and outbox payloads behind.  
   **Fix:** Define one admin deletion workflow covering Auth, owned database rows, storage objects, pending events, and documented backup-retention limits.

6. **“Canada-adjacent” is not a deployable region decision:** It leaves the actual Supabase project location ambiguous.  
   **Fix:** Name the exact selected Supabase region in deployment documentation and state that Auth, database, Storage, logs, and backups follow that selection where supported.

7. **The upload path is technically unresolved:** Proxying modern iPhone photos through Vercel handlers can hit request-size, memory, or execution limits before validation and EXIF stripping occur.  
   **Fix:** Specify direct signed upload into a private quarantine path, followed by server-side validation/processing before moving the object to its final owner path.

8. **Preserved local drafts may store sensitive health data on shared devices:** The PWA rule excludes server responses from cache but does not constrain draft contents or lifetime.  
   **Fix:** Limit drafts to non-photo form fields, expire them after submission or a short TTL, clear them on logout, and never persist signed URLs or image blobs.

These are narrow hardening edits, not reasons to reduce the feature set further. Once they are written into the plan, it is sound enough to implement.

VERDICT: REVISE
### Claude's response
All 8 accepted (narrow edits): Edmonton everywhere, user_roles + SECURITY DEFINER helper chosen, admin-session check before any service-role call, legacy check-in mapping doc task added, full deletion workflow defined, region pinned ca-central-1, direct signed uploads with quarantine path, draft constraints (no photos, TTL, clear on logout).

## Round 3 — Codex
All eight round-2 fixes are present and proportionate:

- Edmonton/per-client reminder timezone: addressed.
- Locked `user_roles` plus fixed-`search_path` `SECURITY DEFINER`: addressed.
- Active-admin verification before constructing service-role client: addressed.
- Legacy check-in mapping and Nicole sign-off: addressed.
- Auth/database/storage/outbox deletion workflow: addressed.
- `ca-central-1`: valid current Supabase region, and Supabase documents it as Canada Central. [Supabase regions](https://supabase.com/docs/guides/platform/regions)
- Signed quarantine upload and server-side processing: addressed.
- Draft content, expiration, submission, and logout constraints: addressed.

No new material frontend or scope problems surfaced. Two material plan-integrity issues remain:

1. **The original schema paragraph contradicts the hardening schema:** [line 27](/Users/joshdumoulin/.claude/plans/users-joshdumoulin-downloads-design-sys-resilient-marshmallow.md:27) still puts `role` in `profiles`, `youtube_url` in `block_exercises`, and uses the old `set_logs` model while omitting assignments, published versions, workout sessions, and message attachments.  
   **Fix:** Replace that paragraph with the canonical hardened table list so migrations cannot reasonably follow the obsolete model.

2. **Rejected applicants have no retention/deletion rule:** The full deletion workflow applies to clients, but declined applications can contain injuries and nutrition information and could remain indefinitely.  
   **Fix:** Add a simple application lifecycle, such as deleting declined/abandoned applications after 90 days and supporting deletion requests before approval.

These are small plan edits, but the schema contradiction is materially capable of producing the wrong database.

VERDICT: REVISE
### Claude's response
Both accepted: Approach step 3 rewritten to canonical hardened schema (user_roles, versioned programs/meal plans, assignments, workout_sessions/set_entries, message_attachments, outbox_events); application lifecycle added (declined/abandoned deleted after 90 days, pre-approval deletion on request).

## Round 4 — Codex
Both requested revisions are correctly incorporated:

- The canonical schema now matches the hardening requirements, including `user_roles`, immutable versions and assignments, `workout_sessions`/`set_entries`, exercise-owned YouTube URLs, message attachments, outbox events, and private buckets.
- Declined and abandoned applications now have a 90-day retention limit and pre-approval deletion support.

The final contradiction scan found no new material security, data-integrity, privacy, PWA, accessibility, or core-workflow problems. Remaining details are normal implementation decisions and are adequately covered by the slice-by-slice verification requirements.

The plan is sound and proportionate for a solo coach serving fewer than 50 clients.

VERDICT: APPROVED