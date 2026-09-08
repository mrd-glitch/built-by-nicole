import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import {
  actualSetError,
  documentError,
  resolvePrescription,
} from "../src/lib/plans/model";
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
