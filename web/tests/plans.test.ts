import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import {
  actualSetError,
  documentError,
  resolvePrescription,
  resolveSetTypes,
  setHeading,
} from "../src/lib/plans/model";
import { validateImport, importDocument, initialMatches } from "../src/lib/plans/import/format";
const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const [
  coach,
  client,
  other,
  exercise,
  exercise2,
  program,
  version,
  day,
  block,
  row,
  assignment,
] = Array.from({ length: 11 }, (_, i) => id(i + 1));
const db = new PGlite();
async function sql<T = Record<string, unknown>>(
  q: string,
  values: unknown[] = [],
) {
  return (await db.query<T>(q, values)).rows;
}
async function as(user: string) {
  await db.exec("reset role");
  await sql("select set_config('request.jwt.claim.sub',$1,false)", [user]);
  await db.exec("set role authenticated");
}
async function call(name: string, args: unknown[] = []): Promise<any> {
  return (
    await sql<{ result: unknown }>(
      `select public.${name}(${args.map((_, i) => "$" + (i + 1)).join(",")}) as result`,
      args,
    )
  )[0].result;
}
async function setup() {
  await db.exec(
    `create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;create schema storage;create table storage.buckets(id text primary key,name text,public boolean);create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);create function storage.foldername(text) returns text[] language sql as $$select string_to_array($1,'/')$$;`,
  );
  for (const file of [
    "001_bbn_core.sql",
    "002_bbn_programs_workouts.sql",
    "003_bbn_nutrition.sql",
    "004_bbn_checkins_messaging.sql",
  ])
    await db.exec(
      await readFile(
        new URL("../supabase/migrations/" + file, import.meta.url),
        "utf8",
      ),
    );
  const snapshot = JSON.parse(
    await readFile(
      new URL("./fixtures/schema-snapshot.json", import.meta.url),
      "utf8",
    ),
  );
  for (const name of [
    "bbn_fix_version_policies",
    "bbn_exercise_thumbs",
    "bbn_v2_builder_library_macros_media",
  ])
    await db.exec(
      snapshot.migrations
        .find((m: any) => m.name === name)
        .statements.join("\n"),
    );
  await db.exec(
    await readFile(
      new URL("../supabase/migrations/007_bbn_builder_v3.sql", import.meta.url),
      "utf8",
    ),
  );
  await db.exec(
    `grant select,insert,update,delete on all tables in schema public to authenticated;grant usage on all sequences in schema public to authenticated;`,
  );
  await sql("insert into auth.users(id) values ($1),($2),($3)", [
    coach,
    client,
    other,
  ]);
  await sql(
    "insert into user_roles(user_id,role) values ($1,'admin'),($2,'client'),($3,'client')",
    [coach, client, other],
  );
  await sql(
    "insert into profiles(id,full_name) values ($1,'Nicole'),($2,'Local client'),($3,'Other client')",
    [coach, client, other],
  );
  await sql("insert into exercises(id,name) values ($1,'Squat'),($2,'Row')", [
    exercise,
    exercise2,
  ]);
  await sql(
    "insert into programs(id,name,weeks,days_per_week) values($1,'Original',4,1)",
    [program],
  );
  await sql(
    "insert into program_versions(id,program_id,version,published_at) values($1,$2,1,now())",
    [version, program],
  );
  await sql(
    "insert into program_days(id,version_id,week,day,title,position) values($1,$2,1,1,'Strength',1)",
    [day, version],
  );
  await sql(
    "insert into day_blocks(id,day_id,label,position) values($1,$2,'',1)",
    [block, day],
  );
  await sql(
    "insert into block_exercises(id,block_id,exercise_id,exercise_name,sets,rep_range,position) values($1,$2,$3,'Squat',3,'5–7',1)",
    [row, block, exercise],
  );
  await sql(
    "insert into program_week_overrides(block_exercise_id,week,sets,rep_range,target_weight_lbs) values($1,2,4,'6–8',55)",
    [row],
  );
  await sql(
    "insert into program_assignments(id,client_id,version_id,start_date) values($1,$2,$3,'2026-09-01')",
    [assignment, client, version],
  );
  await db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/008_bbn_plan_drafts_workout_history.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
}

test("Drafts and workout history against isolated PostgreSQL", async (t) => {
  await setup();
  let draft: any, session: any, newVersion: string;
  await t.test("one resumable draft; no client access", async () => {
    await as(coach);
    draft = await call("bbn_open_plan_draft", [version]);
    assert.equal(draft.document.name, "Original");
    assert.equal(
      draft.document.days[0].blocks[0].exercises[0].overrides["2"].sets,
      "4",
    );
    assert.equal((await call("bbn_open_plan_draft", [version])).id, draft.id);
    await as(client);
    assert.deepEqual(await sql("select * from program_drafts"), []);
    await assert.rejects(
      call("bbn_open_plan_draft", [version]),
      /Coach access/,
    );
  });
  await t.test(
    "idempotent sessions, separate reps and weights per set, hydration",
    async () => {
      await as(client);
      session = await call("bbn_begin_workout", [day, assignment, 1]);
      assert.equal(
        (await call("bbn_begin_workout", [day, assignment, 1])).id,
        session.id,
      );
      const entries = [
        [7, 50],
        [6, 55],
        [4, 55],
      ].map(([reps, weight_lbs], set_index) => ({
        block_exercise_id: row,
        exercise_id: exercise,
        set_index,
        reps,
        weight_lbs,
      }));
      await call("bbn_save_workout_sets", [
        session.id,
        JSON.stringify(entries),
        false,
      ]);
      await call("bbn_save_workout_sets", [
        session.id,
        JSON.stringify(entries),
        false,
      ]);
      const restored = await call("bbn_begin_workout", [day, assignment, 1]);
      assert.equal(restored.entries.length, 3);
      assert.deepEqual(
        restored.entries
          .sort((a: any, b: any) => a.set_index - b.set_index)
          .map((e: any) => [e.reps, Number(e.weight_lbs)]),
        [
          [7, 50],
          [6, 55],
          [4, 55],
        ],
      );
      assert.equal(
        restored.day.day_blocks[0].block_exercises[0].rep_range,
        "5–7",
      );
    },
  );
  await t.test(
    "reject cross-client, cross-exercise, invalid and direct writes",
    async () => {
      await as(other);
      assert.deepEqual(await sql("select id from workout_sessions"), []);
      await assert.rejects(
        call("bbn_save_workout_sets", [session.id, "[]", false]),
        /not found/,
      );
      await assert.rejects(
        call("bbn_begin_workout", [day, assignment, 1]),
        /not found/,
      );
      await as(client);
      await assert.rejects(
        sql(
          "insert into workout_sessions(client_id,assignment_id,day_id) values($1,$2,$3)",
          [client, assignment, day],
        ),
        /row-level security/,
      );
      const e = {
        block_exercise_id: row,
        exercise_id: exercise2,
        set_index: 0,
        reps: 7,
        weight_lbs: 50,
      };
      await assert.rejects(
        call("bbn_save_workout_sets", [session.id, JSON.stringify([e]), false]),
        /does not belong/,
      );
      e.exercise_id = exercise;
      e.set_index = 4;
      await assert.rejects(
        call("bbn_save_workout_sets", [session.id, JSON.stringify([e]), false]),
        /outside/,
      );
      e.set_index = 0;
      e.weight_lbs = -1;
      await assert.rejects(
        call("bbn_save_workout_sets", [session.id, JSON.stringify([e]), false]),
        /valid numbers/,
      );
    },
  );
  await t.test(
    "validation, draft isolation and stale save protection",
    async () => {
      await as(coach);
      const invalid = structuredClone(draft.document);
      invalid.days[0].blocks[0].exercises[0].sets = "-2";
      assert.match(documentError(invalid)!, /Sets/);
      await assert.rejects(
        call("bbn_save_plan_draft", [
          draft.id,
          draft.revision,
          JSON.stringify(invalid),
        ]),
        /Sets/,
      );
      draft.document.name = "Updated plan";
      draft.document.days[0].title = "Upper body";
      const e = draft.document.days[0].blocks[0].exercises[0];
      e.name = "Slow squat";
      e.sets = "4";
      e.instructions = "Controlled lowering";
      draft.revision = (
        await call("bbn_save_plan_draft", [
          draft.id,
          draft.revision,
          JSON.stringify(draft.document),
        ])
      ).revision;
      await assert.rejects(
        call("bbn_save_plan_draft", [
          draft.id,
          1,
          JSON.stringify(draft.document),
        ]),
        /another window/,
      );
      await as(client);
      assert.equal(
        (
          await sql<{ name: string }>("select name from programs where id=$1", [
            program,
          ])
        )[0].name,
        "Original",
      );
    },
  );
  await t.test(
    "late publish failure rolls back every write and keeps the draft",
    async () => {
      await as(coach);
      const before = await sql("select count(*)::int n from programs");
      await db.exec("reset role");
      await db.exec(
        `create function test_fail_assignment() returns trigger language plpgsql as $$ begin raise exception 'Simulated assignment failure'; end $$; create trigger test_fail_assignment before insert on program_assignments for each row execute function test_fail_assignment();`,
      );
      await as(coach);
      await assert.rejects(
        call("bbn_apply_plan_draft", [draft.id, draft.revision, client]),
        /Simulated assignment failure/,
      );
      assert.deepEqual(
        await sql("select count(*)::int n from programs"),
        before,
      );
      assert.equal(
        (
          await sql<any>("select active from program_assignments where id=$1", [
            assignment,
          ])
        )[0].active,
        true,
      );
      assert.equal(
        (
          await sql<any>("select state from program_drafts where id=$1", [
            draft.id,
          ])
        )[0].state,
        "editing",
      );
      await db.exec(
        "reset role; drop trigger test_fail_assignment on program_assignments; drop function test_fail_assignment();",
      );
    },
  );
  await t.test(
    "atomic apply preserves start date, old targets and unfinished sessions",
    async () => {
      await as(coach);
      const result = await call("bbn_apply_plan_draft", [
        draft.id,
        draft.revision,
        client,
      ]);
      newVersion = result.versionId;
      assert.notEqual(newVersion, version);
      assert.equal(
        (await call("bbn_apply_plan_draft", [draft.id, draft.revision, client]))
          .versionId,
        newVersion,
      );
      const a = await sql<any>(
        "select * from program_assignments where client_id=$1 and active",
        [client],
      );
      assert.equal(a.length, 1);
      assert.equal(
        new Date(a[0].start_date).toISOString().slice(0, 10),
        "2026-09-01",
      );
      assert.equal(
        (
          await sql<any>(
            "select exercise_name from block_exercises where id=$1",
            [row],
          )
        )[0].exercise_name,
        "Squat",
      );
      await assert.rejects(
        sql("update block_exercises set sets=9 where id=$1", [row]),
        /read-only/,
      );
      await as(client);
      const beforeFailure = await sql(
        "select set_index,reps,weight_lbs from set_entries where session_id=$1 order by set_index",
        [session.id],
      );
      await assert.rejects(
        call("bbn_save_workout_sets", [
          session.id,
          JSON.stringify([
            {
              block_exercise_id: row,
              exercise_id: exercise,
              set_index: 0,
              reps: 1,
              weight_lbs: 99,
            },
            {
              block_exercise_id: row,
              exercise_id: exercise,
              set_index: 1,
              reps: -1,
              weight_lbs: 50,
            },
          ]),
          true,
        ]),
        /valid numbers/,
      );
      assert.deepEqual(
        await sql(
          "select set_index,reps,weight_lbs from set_entries where session_id=$1 order by set_index",
          [session.id],
        ),
        beforeFailure,
      );
      assert.equal(
        (
          await sql<any>(
            "select finished_at from workout_sessions where id=$1",
            [session.id],
          )
        )[0].finished_at,
        null,
      );
      await call("bbn_save_workout_sets", [
        session.id,
        JSON.stringify([
          {
            block_exercise_id: row,
            exercise_id: exercise,
            set_index: 2,
            reps: 5,
            weight_lbs: 0,
          },
        ]),
        true,
      ]);
      await call("bbn_save_workout_sets", [session.id, "[]", true]);
      assert.ok(
        (
          await sql<any>(
            "select finished_at from workout_sessions where id=$1",
            [session.id],
          )
        )[0].finished_at,
      );
      await assert.rejects(
        call("bbn_save_workout_sets", [session.id, "[]", false]),
        /finished/,
      );
    },
  );
  await t.test(
    "weekly targets, assignment conflict and discard preserve history",
    async () => {
      await as(coach);
      const current = (
          await sql<any>(
            "select * from program_assignments where client_id=$1 and active",
            [client],
          )
        )[0],
        newDay = (
          await sql<any>("select id from program_days where version_id=$1", [
            newVersion,
          ])
        )[0].id;
      const next = await call("bbn_open_plan_draft", [newVersion]);
      await as(client);
      const w = await call("bbn_begin_workout", [newDay, current.id, 2]);
      assert.equal(w.day.day_blocks[0].block_exercises[0].sets, 4);
      assert.equal(w.day.day_blocks[0].block_exercises[0].rep_range, "6–8");
      await as(coach);
      await sql("update program_assignments set active=false where id=$1", [
        current.id,
      ]);
      await assert.rejects(
        call("bbn_apply_plan_draft", [next.id, next.revision, client]),
        /assignment changed/,
      );
      assert.equal(
        (
          await sql<any>("select state from program_drafts where id=$1", [
            next.id,
          ])
        )[0].state,
        "editing",
      );
      await call("bbn_discard_plan_draft", [next.id, next.revision]);
      assert.equal(
        (
          await sql<any>(
            "select count(*)::int n from set_entries where session_id=$1",
            [session.id],
          )
        )[0].n,
        3,
      );
    },
  );
  await t.test(
    "meal removal preserves template and other assignments",
    async () => {
      await as(coach);
      const meal = (
          await sql<any>(
            "insert into meal_plans(name) values('Meals') returning id",
          )
        )[0].id,
        mv = (
          await sql<any>(
            "insert into meal_plan_versions(meal_plan_id,version) values($1,1) returning id",
            [meal],
          )
        )[0].id,
        ma = (
          await sql<any>(
            "insert into meal_plan_assignments(client_id,version_id) values($1,$2) returning id",
            [client, mv],
          )
        )[0].id;
      await sql(
        "insert into meal_plan_assignments(client_id,version_id) values($1,$2)",
        [other, mv],
      );
      await sql(
        "update meal_plan_assignments set active=false where id=$1 and client_id=$2 and active",
        [ma, client],
      );
      assert.equal(
        (
          await sql<any>(
            "select count(*)::int n from meal_plan_versions where id=$1",
            [mv],
          )
        )[0].n,
        1,
      );
      assert.equal(
        (
          await sql<any>(
            "select count(*)::int n from meal_plan_assignments where client_id=$1 and active",
            [other],
          )
        )[0].n,
        1,
      );
      await as(client);
      assert.equal(
        (
          await sql<any>(
            "select count(*)::int n from meal_plan_assignments where active",
          )
        )[0].n,
        0,
      );
    },
  );
  await t.test(
    "reordered rows, supersets, duplicated days and overrides survive publication",
    async () => {
      await as(coach);
      const edit = await call("bbn_open_plan_draft", [newVersion]);
      const doc = edit.document;
      const first = doc.days[0].blocks[0].exercises[0];
      const duplicate = {
        ...structuredClone(first),
        id: id(91),
        name: "Pause squat",
        exerciseId: exercise2,
        sets: "2",
      };
      doc.days[0].blocks[0].label = "Superset A";
      doc.days[0].blocks[0].rest = "Rest 90 seconds";
      doc.days[0].blocks[0].exercises = [duplicate, first];
      const secondDay = structuredClone(doc.days[0]);
      secondDay.id = id(92);
      secondDay.title = "Day two";
      secondDay.blocks[0].id = id(93);
      secondDay.blocks[0].exercises = [
        { ...structuredClone(first), id: id(94) },
      ];
      doc.days.push(secondDay);
      const saved = await call("bbn_save_plan_draft", [
        edit.id,
        edit.revision,
        JSON.stringify(doc),
      ]);
      const result = await call("bbn_apply_plan_draft", [
        edit.id,
        saved.revision,
        null,
      ]);
      const reopened = await call("bbn_open_plan_draft", [result.versionId]);
      assert.equal(reopened.document.days.length, 2);
      assert.equal(reopened.document.days[0].blocks[0].label, "Superset A");
      assert.equal(reopened.document.days[0].blocks[0].rest, "Rest 90 seconds");
      assert.deepEqual(
        reopened.document.days[0].blocks[0].exercises.map((e: any) => e.name),
        ["Pause squat", "Slow squat"],
      );
      assert.equal(reopened.document.days[1].blocks[0].exercises.length, 1);
      assert.equal(
        reopened.document.days[1].blocks[0].exercises[0].overrides["2"].sets,
        "4",
      );
    },
  );
  await t.test(
    "anonymous callers cannot execute draft or workout functions",
    async () => {
      await db.exec("reset role; set role anon");
      await assert.rejects(
        call("bbn_open_plan_draft", [version]),
        /permission denied/,
      );
      await assert.rejects(
        call("bbn_begin_workout", [day, assignment, 1]),
        /permission denied/,
      );
      await assert.rejects(
        call("bbn_workout_snapshot", [day, 1]),
        /permission denied/,
      );
    },
  );
  await t.test(
    "six-week, four-day navigation keeps separate sessions and completed history",
    async () => {
      await as(coach);
      const six = await call("bbn_open_plan_draft", [version]);
      six.document.weeks = "6";
      const base = six.document.days[0];
      six.document.days = Array.from({ length: 4 }, (_, i) => {
        const d = structuredClone(base);
        d.id = id(200 + i);
        d.title = `Day ${i + 1}`;
        d.blocks[0].id = id(210 + i);
        d.blocks[0].exercises[0].id = id(220 + i);
        return d;
      });
      const saved = await call("bbn_save_plan_draft", [
        six.id,
        six.revision,
        JSON.stringify(six.document),
      ]);
      const applied = await call("bbn_apply_plan_draft", [
        six.id,
        saved.revision,
        other,
      ]);
      await as(other);
      const first = await call("bbn_client_workout", [1, 1]);
      assert.equal(first.weeks, 6);
      assert.equal(first.days.length, 4);
      assert.equal(first.session, null);
      assert.equal(
        (await sql<any>("select count(*)::int n from workout_sessions"))[0].n,
        0,
        "Viewing tabs must not create logs",
      );
      const w1 = await call("bbn_begin_workout", [
        first.day.id,
        first.assignmentId,
        1,
      ]);
      const ex = first.day.day_blocks[0].block_exercises[0];
      const entries = [
        [7, 50],
        [6, 55],
        [4, 55],
      ].map(([reps, weight_lbs], set_index) => ({
        block_exercise_id: ex.id,
        exercise_id: ex.exercise_id,
        set_index,
        reps,
        weight_lbs,
      }));
      await call("bbn_save_workout_sets", [
        w1.id,
        JSON.stringify(entries),
        true,
      ]);
      const w2 = await call("bbn_begin_workout", [
        first.day.id,
        first.assignmentId,
        2,
      ]);
      assert.notEqual(w1.id, w2.id);
      assert.equal(w2.entries.length, 0);
      assert.equal(
        (await call("bbn_begin_workout", [first.day.id, first.assignmentId, 2]))
          .id,
        w2.id,
      );
      assert.equal(
        (await call("bbn_begin_workout", [first.day.id, first.assignmentId, 1]))
          .id,
        w1.id,
        "Revisiting completed periods must not create duplicates",
      );
      const later = await call("bbn_client_workout", [6, 4]);
      assert.equal(later.selectedDay, 4);
      assert.equal(later.selectedWeek, 6);
      assert.equal(later.session, null);
      const history = await call("bbn_client_workout", [1, 1]);
      assert.ok(history.session.finished_at);
      assert.deepEqual(
        history.session.entries
          .sort((a: any, b: any) => a.set_index - b.set_index)
          .map((e: any) => [Number(e.weight_lbs), e.reps]),
        [
          [50, 7],
          [55, 6],
          [55, 4],
        ],
      );
      assert.equal(
        (await call("bbn_client_workout", [2, 1])).session.id,
        w2.id,
      );
      const nextDay = await call("bbn_client_workout", [2, 2]);
      const d2 = await call("bbn_begin_workout", [
        nextDay.day.id,
        nextDay.assignmentId,
        2,
      ]);
      assert.notEqual(d2.id, w2.id);
      await assert.rejects(call("bbn_client_workout", [7, 1]), /Choose a week/);
      await as(coach);
      const changed = await call("bbn_open_plan_draft", [applied.versionId]);
      changed.document.days[0].blocks[0].exercises[0].sets = "8";
      const revision = await call("bbn_save_plan_draft", [
        changed.id,
        changed.revision,
        JSON.stringify(changed.document),
      ]);
      await call("bbn_apply_plan_draft", [
        changed.id,
        revision.revision,
        other,
      ]);
      await as(other);
      assert.equal(
        (await call("bbn_client_workout", [1, 1])).session.id,
        w1.id,
        "Saved earlier weeks survive a plan edit",
      );
      assert.equal(
        (await call("bbn_client_workout", [2, 1])).session.id,
        w2.id,
        "The unfinished period retains its original assignment and targets",
      );
      assert.equal(
        (await call("bbn_client_workout", [3, 1])).day.day_blocks[0]
          .block_exercises[0].sets,
        8,
      );
      await as(client);
      assert.equal(
        await call("bbn_client_workout", [1, 1]),
        null,
        "Never return another client's active plan",
      );
    },
  );
  await t.test("set labels upgrade, draft persistence, weekly counts and historical snapshots", async () => {
    await as(other);
    const before = await call("bbn_client_workout", [1, 1]);
    const originalSnapshot = before.session.day;
    assert.equal(originalSnapshot.day_blocks[0].block_exercises[0].set_types, undefined);
    const active = (await sql<{version_id: string}>("select version_id from program_assignments where client_id=$1 and active", [other]))[0];
    await as(coach);
    const legacyDraft = await call("bbn_open_plan_draft", [active.version_id]);
    await db.exec("reset role");
    await db.exec(await readFile(new URL("../supabase/migrations/009_bbn_set_types.sql", import.meta.url), "utf8"));
    await as(coach);
    const oldSave = await call("bbn_save_plan_draft", [legacyDraft.id, legacyDraft.revision, JSON.stringify(legacyDraft.document)]);
    const ex = legacyDraft.document.days[0].blocks[0].exercises[0];
    for (const invalid of [null, {}, ["cooldown"], [null], Array(31).fill("working")]) {
      ex.setTypes = invalid;
      assert.ok(documentError(legacyDraft.document));
      await assert.rejects(call("bbn_save_plan_draft", [legacyDraft.id, oldSave.revision, JSON.stringify(legacyDraft.document)]), /Set labels|Warm-up/);
    }
    ex.sets = "4";
    ex.setTypes = ["warmup", "warmup", "working", "working"];
    ex.overrides["5"] = { sets: "6", reps: "", weight: "" };
    const saved = await call("bbn_save_plan_draft", [legacyDraft.id, oldSave.revision, JSON.stringify(legacyDraft.document)]);
    assert.deepEqual((await call("bbn_open_plan_draft", [active.version_id])).document.days[0].blocks[0].exercises[0].setTypes, ex.setTypes);
    const published = await call("bbn_apply_plan_draft", [legacyDraft.id, saved.revision, other]);
    await as(other);
    const four = await call("bbn_client_workout", [4, 1]);
    assert.deepEqual(four.day.day_blocks[0].block_exercises[0].set_types, ex.setTypes);
    const six = await call("bbn_client_workout", [5, 1]);
    assert.deepEqual(six.day.day_blocks[0].block_exercises[0].set_types, [...ex.setTypes, "working", "working"]);
    const started = await call("bbn_begin_workout", [four.day.id, four.assignmentId, 4]);
    const newExercise = started.day.day_blocks[0].block_exercises[0];
    await call("bbn_save_workout_sets", [started.id, JSON.stringify(ex.setTypes.map((_: string, i: number) => ({
      block_exercise_id: newExercise.id, exercise_id: newExercise.exercise_id,
      set_index: i, reps: [8,8,7,5][i], weight_lbs: [0,10,50,55][i],
    }))), false]);
    await as(coach);
    const revised = await call("bbn_open_plan_draft", [published.versionId]);
    assert.deepEqual(revised.document.days[0].blocks[0].exercises[0].setTypes, ex.setTypes);
    revised.document.days[0].blocks[0].exercises[0].setTypes = ["working", "warmup", "working", "warmup"];
    const copy = structuredClone(revised.document.days[0].blocks[0].exercises[0]);
    copy.id = id(999);
    revised.document.days[0].blocks[0].exercises.push(copy);
    const next = await call("bbn_save_plan_draft", [revised.id, revised.revision, JSON.stringify(revised.document)]);
    await call("bbn_apply_plan_draft", [revised.id, next.revision, other]);
    await as(other);
    const resumed = await call("bbn_client_workout", [4, 1]);
    assert.equal(resumed.session.id, started.id);
    assert.deepEqual(resumed.session.day, started.day, "An unfinished workout retains its original labels");
    assert.deepEqual(resumed.session.entries.sort((a: any,b: any) => a.set_index-b.set_index).map((x: any) => [x.reps,x.weight_lbs]), [[8,0],[8,10],[7,50],[5,55]]);
    assert.deepEqual((await call("bbn_client_workout", [1, 1])).session.day, originalSnapshot, "No labels are invented for pre-migration workouts");
    const future = await call("bbn_client_workout", [6, 1]);
    assert.deepEqual(future.day.day_blocks[0].block_exercises.map((e: any) => e.set_types), [copy.setTypes,copy.setTypes], "Custom labels and duplicated rows survive publication");
    await as(coach);
    const history = (await sql<{prescription_snapshot: unknown}>("select prescription_snapshot from workout_sessions where id=$1", [started.id]))[0];
    assert.deepEqual(history.prescription_snapshot, started.day, "Coach history uses the same saved labels");
    await db.exec("reset role;set role anon");
    await assert.rejects(call("bbn_workout_snapshot", [four.day.id, 4]), /permission denied/);
  });
  await t.test("PDF import is atomic, private, idempotent and preserves exact weekly prescriptions", async () => {
    await db.exec("reset role");
    await db.exec(await readFile(new URL("../supabase/migrations/010_bbn_workout_pdf_import.sql",import.meta.url),"utf8"));
    const source=validateImport(JSON.parse(await readFile(new URL("./fixtures/workout-import.json",import.meta.url),"utf8")));
    const lib=[{id:exercise,name:"Goblet squat",youtube_url:null,cue:null},{id:exercise2,name:"Dumbbell row",youtube_url:null,cue:null}];
    const doc=importDocument(source,initialMatches(source,lib),lib);
    assert.equal(documentError(doc),null);
    await as(client);
    await assert.rejects(call("bbn_import_workout",[source.plan_id,1,"a".repeat(64),JSON.stringify(doc)]),/Coach/);
    await as(coach);
    const imported=await call("bbn_import_workout",[source.plan_id,1,"a".repeat(64),JSON.stringify(doc)]);
    assert.equal(imported.state,"editing");
    const retry=await call("bbn_import_workout",[source.plan_id,1,"a".repeat(64),JSON.stringify(doc)]);assert.equal(retry.versionId,imported.versionId);assert.equal(retry.reused,true);
    await assert.rejects(call("bbn_import_workout",[source.plan_id,1,"b".repeat(64),JSON.stringify(doc)]),/different data/);
    const draft=await call("bbn_open_plan_draft",[imported.versionId]);assert.deepEqual(draft.document,JSON.parse(JSON.stringify(doc)));
    const before=(await sql("select id from program_assignments where client_id=$1 and active",[other]))[0];assert.ok(before);
    const applied=await call("bbn_apply_plan_draft",[draft.id,draft.revision,other]);
    const opened=await call("bbn_open_plan_draft",[applied.versionId]);assert.equal(opened.document.explicitWeeks,true);assert.match(opened.document.coachNotes[0].text,/PRIVATE_COACH_ONLY/);
    assert.deepEqual(opened.document.days.map((d:any)=>d.week),[1,2]);assert.equal(documentError(opened.document),null);
    await as(other);
    assert.deepEqual(await sql("select * from program_coach_notes"),[]);assert.deepEqual(await sql("select * from workout_imports"),[]);
    const first=await call("bbn_client_workout",[1,1]);const second=await call("bbn_client_workout",[2,1]);
    assert.notEqual(first.day.id,second.day.id);assert.equal(first.day.title,"Strength foundations");assert.equal(second.day.title,"Upper body");
    assert.equal(first.day.week_instructions,"Week one: learn the movements.");assert.equal(first.day.instructions,"Take your time today.");
    assert.equal(first.day.day_blocks[0].block_exercises[0].set_targets[0].weight,"0");assert.equal(second.day.day_blocks[0].block_exercises[0].set_targets[0].weight,"");
    assert.ok(!JSON.stringify(first).includes('PRIVATE_COACH_ONLY'));assert.ok(!JSON.stringify(second).includes('coachNotes'));
    await assert.rejects(call("bbn_begin_workout",[first.day.id,first.assignmentId,2]),/different week/);
    const begun=await call("bbn_begin_workout",[first.day.id,first.assignmentId,1]);
    const x=begun.day.day_blocks[0].block_exercises[0];
    await call("bbn_save_workout_sets",[begun.id,JSON.stringify([{block_exercise_id:x.id,exercise_id:x.exercise_id,set_index:0,reps:10,weight_lbs:0}]),false]);
    await as(coach);
    opened.document.days[0].blocks[0].exercises[0].setTargets[0].reps="12";
    const saved=await call("bbn_save_plan_draft",[opened.id,opened.revision,JSON.stringify(opened.document)]);
    await call("bbn_apply_plan_draft",[opened.id,saved.revision,other]);
    await as(other);assert.equal((await call("bbn_client_workout",[1,1])).session.day.day_blocks[0].block_exercises[0].set_targets[0].reps,"10");
    await db.exec("reset role;set role anon");await assert.rejects(call("bbn_import_workout",[source.plan_id,1,"a".repeat(64),JSON.stringify(doc)]),/permission denied/);
  });

  await t.test("Meal and combined imports preserve content, privacy, atomic copies and retries", async()=>{
    await db.exec('reset role');
    await db.exec(await readFile(new URL('./fixtures/meal-layout-schema.sql',import.meta.url),'utf8'));
    await db.exec('grant select,insert,update,delete on meal_options to authenticated');
    await db.exec(await readFile(new URL('../supabase/migrations/011_bbn_coaching_pdf_import.sql',import.meta.url),'utf8'));
    const p=JSON.parse(await readFile(new URL('./fixtures/coaching-import.json',import.meta.url),'utf8'));
    const lib=[{id:exercise,name:'Goblet squat',youtube_url:null,cue:null},{id:exercise2,name:'Dumbbell row',youtube_url:null,cue:null}];
    const doc=importDocument(p.workout,initialMatches(p.workout,lib),lib);
    const args=[id(810),1,'c'.repeat(64),JSON.stringify(doc),JSON.stringify(p.meal)];
    await as(client);await assert.rejects(call('bbn_import_coaching',args),/Coach/);
    await as(coach);
    const before=await sql('select id from meal_plan_assignments where active order by id');
    const r=await call('bbn_import_coaching',args);assert.ok(r.versionId);assert.ok(r.mealVersionId);
    assert.deepEqual(await sql('select id from meal_plan_assignments where active order by id'),before);
    assert.equal((await call('bbn_import_coaching',args)).mealVersionId,r.mealVersionId);
    await assert.rejects(call('bbn_import_coaching',[id(810),1,'d'.repeat(64),JSON.stringify(doc),JSON.stringify(p.meal)]),/different data/);
    const mealOnly=await call('bbn_import_coaching',[id(811),1,'e'.repeat(64),null,JSON.stringify(p.meal)]);assert.equal(mealOnly.versionId,null);
    const v=(await sql('select intro,published_at from meal_plan_versions where id=$1',[r.mealVersionId]))[0];assert.equal(v.published_at,null);assert.match(v.intro as string,/Schedule: Repeat daily/);assert.ok(!JSON.stringify(v).includes('PRIVATE'));
    const items=await sql('select i.name,i.portion,i.fats,i.calories from meal_items i join meals m on m.id=i.meal_id where m.version_id=$1 order by i.position',[r.mealVersionId]);assert.equal(items[0].portion,'40 g dry');assert.equal(items[0].calories,null);assert.equal(items[1].fats,'0');
    const options=await sql('select o.text,o.tag from meal_options o join meals m on m.id=o.meal_id where m.version_id=$1 order by o.position',[r.mealVersionId]);assert.equal(options.length,2);assert.equal(options[1].tag,'zero_prep');
    await as(client);assert.deepEqual(await sql('select * from meal_plan_coach_notes'),[]);assert.deepEqual(await sql('select * from coaching_imports'),[]);assert.deepEqual(await sql('select * from meal_plan_versions where id=$1',[r.mealVersionId]),[]);
    await assert.rejects(call('bbn_assign_meal_copy',[r.mealVersionId,client]),/Coach/);
    await as(coach);
    const assigned=await call('bbn_assign_meal_copy',[r.mealVersionId,client]);assert.notEqual(assigned.versionId,r.mealVersionId);
    assert.match(JSON.stringify(await sql('select notes from meal_plan_coach_notes where version_id=$1',[assigned.versionId])),/PRIVATE_MEAL_ONLY/);
    await as(client);assert.equal((await sql('select * from meals where version_id=$1',[assigned.versionId])).length,2);assert.deepEqual(await sql('select * from meal_plan_coach_notes'),[]);
    await as(coach);
    const draft=await call('bbn_open_plan_draft',[r.versionId]);const published=await call('bbn_apply_plan_draft',[draft.id,draft.revision,null]);
    const copied=await call('bbn_assign_program_copy',[published.versionId,client]);const copyDoc=(await call('bbn_open_plan_draft',[copied.versionId])).document;
    assert.deepEqual(copyDoc.days.map((d:any)=>d.week),[1,2]);assert.deepEqual(copyDoc.days[0].blocks[0].exercises[0].setTargets,doc.days[0].blocks[0].exercises[0].setTargets);assert.match(copyDoc.coachNotes[0].text,/PRIVATE_COACH_ONLY/);
    await assert.rejects(call('bbn_assign_program_copy',[r.versionId,client]),/Apply changes/);
    // A failure after the workout was inserted rolls both components back.
    await db.exec('reset role');
    await db.exec("create function fail_import_meal() returns trigger language plpgsql as $$begin raise exception 'fixture late failure';end$$; create trigger fail_meal_import before insert on meal_options for each row execute function fail_import_meal();");
    await as(coach);await assert.rejects(call('bbn_import_coaching',[id(812),1,'f'.repeat(64),JSON.stringify(doc),JSON.stringify(p.meal)]),/fixture late failure/);
    assert.equal((await sql('select * from workout_imports where source_id=$1',[id(812)])).length,0);assert.equal((await sql('select * from coaching_imports where source_id=$1',[id(812)])).length,0);
    const activeBefore=await sql('select version_id from meal_plan_assignments where client_id=$1 and active',[client]);
    await assert.rejects(call('bbn_assign_meal_copy',[r.mealVersionId,client]),/fixture late failure/);assert.deepEqual(await sql('select version_id from meal_plan_assignments where client_id=$1 and active',[client]),activeBefore);
    await db.exec('reset role;drop trigger fail_meal_import on meal_options;set role anon');await assert.rejects(call('bbn_import_coaching',args),/permission denied/);
  });
  await db.close();
});
test("actual result and weekly target rules", () => {
  assert.equal(actualSetError("4", "55"), null);
  assert.equal(actualSetError("0", "0"), null);
  assert.notEqual(actualSetError("4.5", "50"), null);
  assert.notEqual(actualSetError("7", "-1"), null);
  assert.notEqual(actualSetError("", ""), null);
  assert.deepEqual(
    resolvePrescription(
      {
        sets: "3",
        reps: "5–7",
        weight: "0",
        overrides: { "2": { sets: "4", reps: "", weight: "55" } },
      } as any,
      2,
    ),
    { sets: "4", reps: "5–7", weight: "55" },
  );
});

test("set labels resolve new sets without guessing historical labels", () => {
  assert.deepEqual(resolveSetTypes(["warmup", "warmup", "working"], 4), ["warmup", "warmup", "working", "working"]);
  assert.deepEqual(resolveSetTypes(["warmup", "working", "warmup"], 2), ["warmup", "working"]);
  assert.deepEqual(resolveSetTypes(undefined, 2), ["working", "working"]);
  assert.equal(setHeading(0, ["warmup"]), "Set 1: Warm-up");
  assert.equal(setHeading(1, ["warmup", "working"]), "Set 2: Working set");
  assert.equal(setHeading(0), "Set 1");
});
