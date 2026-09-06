# Codex adversarial review — Coach HQ mobile nav, admin guard, builder v3 (2026-09-06)

Reviewer: codex-cli 0.144.4, model gpt-5.6-sol, read-only sandbox, same thread across rounds. Claude was final arbiter; every finding was accepted and fixed.

## Round 1

Found six issues:

- **P1 — Position collisions after removal/splitting:** [ProgramBuilder.tsx:117](/Users/joshdumoulin/Documents/Claude/Projects/built-by-nicole/web/src/components/builder/ProgramBuilder.tsx:117), [ProgramBuilder.tsx:185](/Users/joshdumoulin/Documents/Claude/Projects/built-by-nicole/web/src/components/builder/ProgramBuilder.tsx:185), and [ProgramBuilder.tsx:202](/Users/joshdumoulin/Documents/Claude/Projects/built-by-nicole/web/src/components/builder/ProgramBuilder.tsx:202) derive positions from array length. After deleting position 2 from `[1,2,3]`, the next insert receives position 3, colliding with the existing block; exercise positions can collide similarly after splitting a superset member. Fix: allocate `MAX(position) + 1` server-side under a lock, or atomically renumber siblings after every mutation.

- **P1 — Multi-table mutations leak empty blocks:** [actions-builder.ts:212](/Users/joshdumoulin/Documents/Claude/Projects/built-by-nicole/web/src/lib/actions-builder.ts:212) and [actions-builder.ts:239](/Users/joshdumoulin/Documents/Claude/Projects/built-by-nicole/web/src/lib/actions-builder.ts:239) create a block before moving/inserting its exercise, but failures return without deleting that block; [actions-builder.ts:233](/Users/joshdumoulin/Documents/Claude/Projects/built-by-nicole/web/src/lib/actions-builder.ts:233) also ignores source-block deletion failures. Fix: implement add/move/split as transactional database functions, or explicitly roll back created blocks and propagate cleanup errors.

- **P1 — Optimistic remove/superset reports “Saved” after database failure:** [ProgramBuilder.tsx:165](/Users/joshdumoulin/Documents/Claude/Projects/built-by-nicole/web/src/components/builder/ProgramBuilder.tsx:165) and [ProgramBuilder.tsx:186](/Users/joshdumoulin/Documents/Claude/Projects/built-by-nicole/web/src/components/builder/ProgramBuilder.tsx:186) mutate local state first, then ignore action results and always call `flashSaved()`. A failed request leaves Nicole editing a state that is not in the database. Fix: inspect every result and either commit UI state only after success or restore the captured previous state and show the error.

- **P2 — “Most recent” prefill is not chronological:** [actions-builder.ts:205](/Users/joshdumoulin/Documents/Claude/Projects/built-by-nicole/web/src/lib/actions-builder.ts:205) orders by `id`; UUID ordering does not represent insertion time, so arbitrary historical prescriptions can be selected. Fix: order by a real `created_at`/`prescribed_at` timestamp descending with `id` as a tie-breaker.

- **P2 — Exercise picker claims failed additions succeeded and permits races:** [ProgramBuilder.tsx:555](/Users/joshdumoulin/Documents/Claude/Projects/built-by-nicole/web/src/components/builder/ProgramBuilder.tsx:555) increments `added` regardless of whether `onPick` failed, while [ProgramBuilder.tsx:616](/Users/joshdumoulin/Documents/Claude/Projects/built-by-nicole/web/src/components/builder/ProgramBuilder.tsx:616) does not await creation at all. Rapid taps can also launch concurrent additions with the same block position. Fix: return a success result from both callbacks, await it, disable picker controls while pending, and update the count only on confirmed success.

- **P2 — Mobile admin navigation is incomplete and can overflow narrow phones:** [AdminNav.tsx:15](/Users/joshdumoulin/Documents/Claude/Projects/built-by-nicole/web/src/components/AdminNav.tsx:15) excludes Exercise Library from the dock while [globals.css:455](/Users/joshdumoulin/Documents/Claude/Projects/built-by-nicole/web/src/app/globals.css:455) hides the only navigation containing it. Additionally, five padded icons plus the active text label exceed the dock’s available width around 320px ([globals.css:189](/Users/joshdumoulin/Documents/Claude/Projects/built-by-nicole/web/src/app/globals.css:189)). Fix: provide a compact “More” item containing Exercise Library/logout and hide active labels or reduce dock items at narrow breakpoints.

No normal `/admin`↔`/app` redirect loop or RLS bypass was found. Targeted ESLint and `tsc --noEmit` passed; ESLint reported one unrelated existing warning.

VERDICT: REVISE
## Round 2

Four issues remain or were introduced:

- **P1 — Position allocation is still race-prone:** [actions-builder.ts:203](/Users/joshdumoulin/Documents/Claude/Projects/built-by-nicole/web/src/lib/actions-builder.ts:203) reads the highest position separately from the subsequent insert/update. Double-tapping “Split out” remains possible because [ProgramBuilder.tsx:440](/Users/joshdumoulin/Documents/Claude/Projects/built-by-nicole/web/src/components/builder/ProgramBuilder.tsx:440) has no pending guard; two requests can allocate the same position and create an empty block. Fix: allocate and mutate in one transactional Postgres RPC with a uniqueness constraint, and disable mutation buttons while pending.

- **P1 — Empty-block leaks are not fully fixed:** Cleanup errors are ignored at [actions-builder.ts:234](/Users/joshdumoulin/Documents/Claude/Projects/built-by-nicole/web/src/lib/actions-builder.ts:234) and [actions-builder.ts:265](/Users/joshdumoulin/Documents/Claude/Projects/built-by-nicole/web/src/lib/actions-builder.ts:265). Also, [actions-builder.ts:245](/Users/joshdumoulin/Documents/Claude/Projects/built-by-nicole/web/src/lib/actions-builder.ts:245) can successfully move an exercise and then fail to delete its old block, while singleton removal at [ProgramBuilder.tsx:185](/Users/joshdumoulin/Documents/Claude/Projects/built-by-nicole/web/src/components/builder/ProgramBuilder.tsx:185) can delete the exercise and subsequently fail to delete the block. Reloading exposes the partial database state rather than undoing it. Fix: make each compound mutation transactional; for singleton removal, delete the block directly and rely on its exercise cascade.

- **P2 — The `created_at` migration is absent from the working tree:** [actions-builder.ts:216](/Users/joshdumoulin/Documents/Claude/Projects/built-by-nicole/web/src/lib/actions-builder.ts:216) now requires `block_exercises.created_at`, but `git status` lists no migration or untracked file containing that schema change. The applied remote migration therefore cannot be reproduced in another environment. Fix: add the migration under `web/supabase/migrations/` with the column, default, backfill, and suitable index.

- **P2 — Picker failures remain invisible and its pending state is incomplete:** Errors are rendered behind the open modal at [ProgramBuilder.tsx:511](/Users/joshdumoulin/Documents/Claude/Projects/built-by-nicole/web/src/components/builder/ProgramBuilder.tsx:511), while [ProgramBuilder.tsx:580](/Users/joshdumoulin/Documents/Claude/Projects/built-by-nicole/web/src/components/builder/ProgramBuilder.tsx:580) has no `try/finally`, and the Done button at [ProgramBuilder.tsx:592](/Users/joshdumoulin/Documents/Claude/Projects/built-by-nicole/web/src/components/builder/ProgramBuilder.tsx:592) stays enabled during an addition. A thrown action freezes the picker, and closing during a request can make an exercise appear silently afterward. Fix: display errors inside the picker, wrap pending operations in `try/finally`, and disable closing while pending.

The chronological ordering, returned-error reconciliation, confirmed-add counting, narrow-dock overflow, Exercise Library reachability, and redirect behavior are otherwise addressed. TypeScript, targeted ESLint, and `git diff --check` pass; ESLint retains one unrelated existing warning.

VERDICT: REVISE
## Round 3

The prior four findings are closed for normal UI usage, but two new correctness gaps remain:

- **P1 — The RPCs read the source block before acquiring the day lock:** [007_bbn_builder_v3.sql:38](/Users/joshdumoulin/Documents/Claude/Projects/built-by-nicole/web/supabase/migrations/007_bbn_builder_v3.sql:38) and [007_bbn_builder_v3.sql:55](/Users/joshdumoulin/Documents/Claude/Projects/built-by-nicole/web/supabase/migrations/007_bbn_builder_v3.sql:55) capture `v_src` before the lock. Two concurrent splits of the same exercise can therefore serialize on the day but retain the same stale source: the second moves the exercise out of the first call’s new block yet deletes the original source, leaving the first new block empty. The move RPC also never verifies that source and target belong to the same day. Fix: acquire/derive the day, lock it, then re-read and lock the exercise’s current source block and reject cross-day moves before mutating.

- **P2 — Rejected server-action promises permanently leave builder controls busy:** [ProgramBuilder.tsx:176](/Users/joshdumoulin/Documents/Claude/Projects/built-by-nicole/web/src/components/builder/ProgramBuilder.tsx:176), [ProgramBuilder.tsx:200](/Users/joshdumoulin/Documents/Claude/Projects/built-by-nicole/web/src/components/builder/ProgramBuilder.tsx:200), and [ProgramBuilder.tsx:220](/Users/joshdumoulin/Documents/Claude/Projects/built-by-nicole/web/src/components/builder/ProgramBuilder.tsx:220) reset `busy` only after successful promise resolution. A transport failure or expired session causes the action to throw, leaving Superset/Split/Remove disabled until a manual reload. Fix: wrap each mutation in `try/catch/finally`, call `revert()` from the catch, and reset `busy` in `finally`.

The migration is now tracked, position allocation and writes are transactional, singleton removal is one write, and picker error/pending handling is fixed. TypeScript, targeted ESLint, and `git diff --check` pass; ESLint retains one unrelated existing warning.

VERDICT: REVISE
## Round 4

The two Round 3 findings are closed, but one structural race remains:

- **P1 — Remove does not participate in the per-day locking protocol:** [ProgramBuilder.tsx:184](/Users/joshdumoulin/Documents/Claude/Projects/built-by-nicole/web/src/components/builder/ProgramBuilder.tsx:184) still calls direct block/exercise deletes, while split only locks `program_days` and does not lock the exercise row ([007_bbn_builder_v3.sql:64](/Users/joshdumoulin/Documents/Claude/Projects/built-by-nicole/web/supabase/migrations/007_bbn_builder_v3.sql:64)). A concurrent removal can delete the exercise after split re-reads it; the split then inserts a block, updates zero rows without error, and returns success with an empty block. Fix: implement removal as a transactional RPC using the same day lock and current-block lookup, and make split verify that its `UPDATE` affected one row.

Lock ordering/no-op behavior, cross-day rejection, exception handling, and `busy` cleanup are otherwise correct. TypeScript and `git diff --check` pass; targeted ESLint has only the unrelated existing warning.

VERDICT: REVISE
## Round 5

All prior findings are closed. Removal now shares the transactional day-lock protocol, cleans empty blocks atomically, and split rolls back if its exercise update affects zero rows. Client wiring and failure recovery are correct.

No new concrete bugs found. TypeScript and `git diff --check` pass; targeted ESLint reports only the unrelated existing `_oldId` warning.

VERDICT: APPROVED