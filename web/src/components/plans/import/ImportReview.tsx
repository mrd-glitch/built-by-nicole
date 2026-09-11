"use client";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { WorkoutImporter } from "./WorkoutImporter";
import { MealImportPreview } from "./MealImportPreview";
import { ProgramBuilder } from "@/components/builder/ProgramBuilder";
import {
  parseCoachingText,
  type CoachingImport,
} from "@/lib/plans/import/coaching";
import { importDocument } from "@/lib/plans/import/format";
import {
  documentError,
  type BuilderAPI,
  type BuilderVersion,
  type Draft,
  type PlanDocument,
} from "@/lib/plans/model";
const storageKey = "bbn-local-coaching-import-review-v1";
const library = [
  {
    id: "00000000-0000-4000-8000-000000000004",
    name: "Goblet squat",
    youtube_url: null,
    cue: null,
  },
  {
    id: "00000000-0000-4000-8000-000000000005",
    name: "Dumbbell row",
    youtube_url: null,
    cue: null,
  },
];
export function ImportReview() {
  const [review, setReview] = useState<{
      plan: CoachingImport;
      document: PlanDocument | null;
    } | null>(null),
    [fail, setFail] = useState(false),
    [privateNotes, setPrivateNotes] = useState(true);
  const pending = useRef<typeof review>(null);
  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "24px 16px" }}>
      <Link href="/dev/plan-review">Back to plan review</Link>
      <p className="card" style={{ margin: "16px 0" }}>
        Local review only. Uses synthetic examples and this browser’s storage.
        Nothing is sent to Supabase or assigned to a real client.
      </p>
      {!review ? (
        <>
          <label>
            <input
              type="checkbox"
              checked={fail}
              onChange={(e) => setFail(e.target.checked)}
            />{" "}
            Simulate a failed import
          </label>
          <WorkoutImporter
            library={library}
            create={async (text, matches) => {
              if (fail)
                return {
                  error:
                    "Simulated connection failure. Uncheck the failure option and retry.",
                };
              try {
                const p = await parseCoachingText(text);
                const key = p.plan.plan_id + ":" + p.plan.revision;
                const ledger = JSON.parse(
                  localStorage.getItem(storageKey) ?? "{}",
                );
                if (ledger[key] && ledger[key].checksum !== p.checksum)
                  return {
                    error:
                      "This revision has different data. Export a new revision.",
                  };
                const document = p.plan.workout
                  ? importDocument(p.plan.workout, matches, library)
                  : null;
                const r = ledger[key] ?? {
                  checksum: p.checksum,
                  plan: p.plan,
                  document,
                };
                pending.current = r;
                const reused = !!ledger[key];
                ledger[key] = r;
                localStorage.setItem(storageKey, JSON.stringify(ledger));
                return {
                  data: {
                    versionId: document ? "local-workout" : null,
                    mealVersionId: p.plan.meal ? "local-meal" : null,
                    reused,
                    state: "editing",
                  },
                };
              } catch (e) {
                return {
                  error:
                    e instanceof Error ? e.message : "Local import failed.",
                };
              }
            }}
            onCreated={() => setReview(pending.current)}
          />
        </>
      ) : (
        <>
          <button className="btn btn--quiet" onClick={() => setReview(null)}>
            Import another PDF
          </button>
          {review.document && <LocalWorkout document={review.document} />}
          {review.plan.meal && (
            <>
              <label>
                <input
                  type="checkbox"
                  checked={privateNotes}
                  onChange={(e) => setPrivateNotes(e.target.checked)}
                />{" "}
                Show Nicole’s private meal notes
              </label>
              <MealImportPreview
                meal={review.plan.meal}
                privateNotes={privateNotes}
              />
            </>
          )}
        </>
      )}
    </main>
  );
}
function LocalWorkout({ document }: { document: PlanDocument }) {
  const current = useRef<Draft>({
    id: crypto.randomUUID(),
    revision: 1,
    document,
    sourceAssignmentId: null,
  });
  const version = useMemo<BuilderVersion>(
    () => ({
      id: "local-workout",
      programs: {
        id: "local",
        name: document.name,
        description: document.description,
        weeks: Number(document.weeks),
        is_template: false,
      },
      program_assignments: [],
      program_days: [
        {
          id: "seed",
          title: document.days[0].title,
          day: 1,
          position: 1,
          day_blocks: [],
        },
      ],
    }),
    [document],
  );
  const api = useMemo<BuilderAPI>(
    () => ({
      open: async () => ({ data: structuredClone(current.current) }),
      save: async (_id, revision, doc) => {
        if (revision !== current.current.revision)
          return { error: "Draft changed; reopen it." };
        const problem = documentError(doc);
        if (problem) return { error: problem };
        current.current = {
          ...current.current,
          revision: revision + 1,
          document: structuredClone(doc),
        };
        return { data: { revision: revision + 1 } };
      },
      apply: async () => ({ data: { versionId: version.id, clientId: null } }),
      discard: async () => {
        current.current = {
          ...current.current,
          document: structuredClone(document),
          revision: current.current.revision + 1,
        };
        return { data: null };
      },
    }),
    [document, version.id],
  );
  return (
    <ProgramBuilder
      version={version}
      clients={[]}
      exercises={library}
      api={api}
    />
  );
}
