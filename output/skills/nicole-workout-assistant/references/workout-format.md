# Workout component

Read when the package includes workouts. Its identity fields must equal the outer coaching package.

### Normalized JSON shape

The following is a format example, not a workout recommendation. Replace its illustrative values with Nicole's approved plan. All keys shown are required; `client_name`, `library_id`, `superset_group`, `target_weight_lb`, and `rest_seconds` may be null. Preserve instruction strings even when empty.

```json
{
  "schema": "bbn.workout-import.v1",
  "plan_id": "b2384ed8-8607-4e0f-a6cb-dc13df510bb8",
  "revision": 1,
  "created_on": "2026-09-08",
  "name": "Example only",
  "client_name": null,
  "unit": "lb",
  "intro": "",
  "coach_notes": [],
  "weeks": [
    {
      "number": 1,
      "instructions": "",
      "days": [
        {
          "number": 1,
          "name": "Example day",
          "instructions": "",
          "exercises": [
            {
              "key": "w1-d1-e1",
              "name": "Goblet squat",
              "library_id": null,
              "superset_group": null,
              "optional": false,
              "instructions": "Move with control.",
              "sets": [
                {"number": 1, "type": "warmup", "target_reps": "10", "target_weight_lb": null, "rest_seconds": 60, "instructions": ""},
                {"number": 2, "type": "working", "target_reps": "5-7", "target_weight_lb": 30, "rest_seconds": 90, "instructions": ""}
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

Contract rules:

- `coach_notes` is always an array, empty when no private notes are supplied. Each note has exactly `scope`, `week`, `day`, `exercise_key`, and `text`. Scope is `client`, `plan`, `week`, `day`, or `exercise`. Client/plan notes use null targets; week notes have a valid week and null day/key; day notes have a valid week/day and null key; exercise notes have a valid week/day/exercise key. Text is nonempty, up to 2000 characters. An illustrative entry is `{"scope":"week","week":2,"day":null,"exercise_key":null,"text":"Ask about preferred training time at check-in."}`. It is private and must never be rendered in the client PDF.
- `intro` and all `instructions` fields are client-facing, including `weeks[].instructions`. Empty strings mean no note at that level. Never place private notes in those fields. Day/week instructions should remain under 2000 characters each; ask before shortening anything.

- `revision` is a positive integer; `created_on` is an ISO date. Plan IDs are valid UUIDs. Exercise keys are unique within the plan and stable when that exercise is corrected within a revision.
- Weeks are ordered and numbered consecutively 1–52 at most. Each week has 1–14 numbered workout days. Days are ordered and consecutively numbered within their week. Exercise array order is execution order.
- Each exercise has 1–30 sets, consecutively numbered from 1. `type` is exactly `warmup` or `working`. `target_reps` is a nonempty string up to 60 characters; preserve rep ranges as ranges. Target weight is null or a finite nonnegative number up to 3000 lb. Rest is null or a nonnegative whole number of seconds. Null means unspecified, not zero.
- Exercise names and day names are nonempty, up to 160 characters. Exercise and set instructions may contain up to 2000 characters each. Do not truncate longer content silently; ask Nicole to shorten it or extend the contract explicitly.
- A shared non-null `superset_group`, such as `A`, groups consecutive exercises within that day. `rest_seconds` means rest after that particular set. Any group-level rest/round sequence belongs in the day's or exercises' instructions, visible in both PDFs. Do not infer a different circuit structure from the group letter alone.
- `library_id` remains null unless an actual current portal library ID has been verified. The importer must match names or ask Nicole to select a library exercise; it must never invent IDs or silently substitute movements.
- This interchange format is not the existing internal `PlanDocument` object. A portal import adapter is required. It must reject or flag unsupported fields/targets rather than discarding them to fit today's editor.

