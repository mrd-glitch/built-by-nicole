# Client plan editing and workout tracking

Branch: `codex/client-plan-editor`. Built from the restored landing-page version. Josh authorized production release on September 8, 2026, with Nicole reviewing the live update.

## Review locally

From `web/`, run `npm run dev -- --hostname 127.0.0.1 --port 3000`, then open:

http://127.0.0.1:3000/dev/plan-review

This development-only route uses the real editor, client workout component, history component, and meal-removal control with injected local adapters. Alex is a synthetic client. Changes are kept in this browser's local storage; no production accounts or records are written. The route returns HTTP 404 under `next start`.

Try these flows with Josh and Nicole:

1. **Build plan:** rename the plan/day/exercise; change sets, reps, or target pounds. Tab and Shift+Tab move between inputs; Enter saves. Add, duplicate, move, remove, and group exercises into supersets. Weighted exercises in Week 2 start with a separate 4 × 6–8 override.
2. Turn on **Simulate a save failure**, edit a cell, and verify the value stays visible and Apply is disabled. Turn the simulator off and Retry. Refresh after “Draft saved” to resume.
3. **Preview client view** is read-only. **Apply changes** updates the example client's plan. **Discard draft** leaves the applied plan intact.
4. **Client workout:** select Week 1, Day 2 and enter 50 lb × 7, 55 lb × 6, and 55 lb × 4. Navigate away and back or refresh. **Nicole’s review** shows the exact three results. An unfinished session keeps its own targets even if a draft is applied.
5. Finish with blank sets to check the incomplete confirmation. Simulate a finish failure to confirm that it remains in progress.
6. In **Nicole’s review**, remove the example meal assignment. Test a failed removal and retry. The empty state should say “No meal plan assigned.”

Use **Reset examples** to start over. The sample is a six-week plan with four workout days and one exercise per day initially; add more to assess building density. Week 1, Day 1 includes illustrative saved pull-up results (7, 7, 7, 7, 7, 5, 4). Library links outside the preview lead to the normal authenticated app, not mock pages.

## Implementation

- Server actions remain the application interface. New database functions make draft creation/application and session/set writes transactional.
- Drafts store the entire editable plan plus source version/assignment and an optimistic revision. Applying clones a new program/version, preserves the source assignment's start date, and deactivates the previous assignment only within the successful transaction. Assignment conflicts retain the draft.
- Assigned prescriptions are protected from mutation through legacy builder actions. Renaming an exercise affects only its plan label; library replacement is a separate control.
- New sessions store the resolved workout week and full prescription snapshot. Existing session and set-entry identities are reused; session creation is serialized by client/day/week, set saves use the existing unique session/exercise-row/set-index key, and finish locks and saves atomically.
- Coach history is paginated newest first, with original targets and every prescribed set. Missing results say “Not logged.” Historical sessions without a snapshot keep it null and explicitly identify unavailable original targets; no backfill guesses were made. Older unfinished sessions can continue using available plan reference values with an explicit notice.
- Meal removal only deactivates the selected client assignment. Templates, meal history, and food journals are retained.
- Explicit coach checks, client ownership, exercise/day/assignment validation, RLS, and restricted function grants cover the new reads/writes. Supabase service credentials are not used by these workflows.

## Schema evidence and migration gate

The signed-in Supabase SQL editor was used for a read-only catalog SELECT against project `wueilsgthxgfyjrtvxus`. It retrieved definitions, foreign keys, unique indexes, RLS policies, and migration SQL—not client records. Relevant schema metadata is recorded in `web/tests/fixtures/schema-snapshot.json`.

The original applied core and workout migrations were missing from Git. Their exact SQL was recovered as `001_bbn_core.sql` and `002_bbn_programs_workouts.sql`. These are historical baseline/reference files, **not new production migrations**. The isolated fixture also replays the recovered version-policy fix, exercise thumbnails, and builder-v2 definitions from the metadata fixture, followed by existing 007.

The only new feature migration is `web/supabase/migrations/008_bbn_plan_drafts_workout_history.sql`. It passed isolated PGlite PostgreSQL tests and a transaction rehearsal against hosted Supabase, ending with ROLLBACK so the rehearsal made no persistent changes. Do not run a blanket migration push: reconcile existing production migration history first so already-applied baseline SQL is not replayed.

Production release is authorized. The production catalog preflight matched the recovered baseline and all migration statements passed the hosted transaction rehearsal. Coordinate migration and app release. 008 removes old direct client session/set write policies and guards assigned prescriptions, so the restored production app cannot simply continue unchanged after migration. Existing open browser sessions should reload during the coordinated release. A rollback must account for those policy/guard changes; do not delete snapshots, versions, assignments, drafts, or recorded results to roll back UI code.

## Verification completed

- `npm run test:plans`: 13 passing tests using isolated PostgreSQL with synthetic coach/client/other-client roles and records. Covers resumable drafts, stale revisions, private edits, separate set results, idempotent retries, late transaction rollback, unfinished session preservation, start dates, weekly overrides, superset order, duplicated days, assignment conflicts, meal removal, and unauthorized/direct writes.
- `npx tsc --noEmit`: passed.
- Scoped ESLint for the new plan modules/components and changed builder/client routes: passed.
- `npm run build`: passed. Existing Next middleware deprecation and outside-repository lockfile warnings remain.
- Production-mode local check: `/dev/plan-review` returns 404.
- Browser checks: desktop grid and labeled phone rows; keyboard editing; failure/retry; apply/discard; read-only preview; three independent weights/reps; reload/navigation persistence; coach review; incomplete finish/error; removal failure/retry. No browser console errors in the fresh final review tab.
- Impeccable layout detector: no findings on the changed editor, workout component, and plan components. Existing brand styles are retained.

The UI review uses mock adapters and the database suite runs PostgreSQL functions/RLS separately. The hosted transaction rehearsal verifies migration compatibility. End-to-end behavior with Nicole’s actual account and client records still needs her live review; no synthetic users or workouts were inserted into production for testing.

## Week and day navigation update (September 8)

The client Fitness page now has week navigation above numbered workout-day navigation. A six-week/four-day program exposes all 24 periods. Each period loads through the read-only `bbn_client_workout` function; browsing does not create sessions. Starting or saving a workout uses the existing transactional actions. Session uniqueness now includes assignment, day, and stored program week; returning to a completed period opens its saved results rather than starting a duplicate session.

Each exercise groups its name, set/rep/rest prescription, expandable instructions, and individual set boxes. A coach-specified target of 0 lb uses reps-only bodyweight boxes, saving an explicit 0 lb with each result. “Log added weight” reveals independent weight fields for weighted pull-ups. Other exercises always show weight and actual reps per set.

Tab changes flush valid edits first, block on invalid/failed entries, and retain the current workout on errors. The selected week/day survives reload. Completed sessions stay read-only and show their training date and original snapshot. The read function follows the assigned plan's edit lineage for the same client and start date so prior weeks and unfinished workouts remain accessible after Apply changes. Legacy unfinished sessions without a stored week have a separate link and are never placed into guessed week tabs.

Additional verification: 6 × 4 period lookup; completed-session reuse; separate same-day sessions in different weeks; history across plan edits; bodyweight saving; weighted 50×7 / 55×6 / 55×4 results; navigation blocked during simulated save failure and successful retry; selected period and values after reload; desktop and 390px layouts without horizontal page overflow. Final review tab console had no errors or warnings. The new read function and unique index are part of the 008 migration included in this release.

## Warm-up and working-set labels (local addition)

Each exercise has a **Warm-up sets** shortcut: choose the first one, two, or more sets. **Label individual sets** supports custom arrangements. These sets are included in the prescribed total; the label does not add sets or change reps/weight targets. Labels follow numbered sets across weeks. Weekly set-count overrides show only their prescribed number of sets, with additional unlabeled sets defaulting to Working set. Higher-numbered labels remain available when another week has more sets.

Labels are included in draft autosave, duplication, template assignment copies, client preview, new workout snapshots, and coach history. Existing in-progress/completed snapshots are never rewritten; snapshots that predate labels display only their original set numbers. Each warm-up and working set still records its own actual reps and pounds.

`009_bbn_set_types.sql` is a new, **unapplied production migration** extending the verified 008 release. It adds the validated `block_exercises.set_types` JSON array and updates four existing RPCs with unchanged authorization. Existing drafts without labels remain valid. Deploy this migration before the accompanying app code because the builder and template-copy query now select the new column. This addition has not been pushed or deployed.

Verification: 15 passing isolated PostgreSQL/model tests, including upgrade from 008 with existing drafts and workouts, label validation, autosave round-trip, custom labels, duplication, weekly count changes, exact per-set results, and immutable history. Scoped lint and production build passed. Browser checks covered two warm-ups/two working sets, individual changes, Tab navigation, failed save blocking Apply, recovery, apply to the mock client, reload persistence, coach history, and desktop/390px layouts without overflow. No browser warnings or errors were observed. Local mock data remains separate from production.
