# Coaching import format v1

Use exactly this outer object. All shown keys are required, with no extra fields. `kind` is `workout`, `meal`, or `both`. Set an omitted component to null. For workouts read [workout-format.md](workout-format.md): put that entire object under `workout`, with the SAME plan_id, revision, created_on and client_name as this wrapper. Names can differ between the package and its component plans. The legacy standalone workout format remains accepted, but create new exports with this wrapper.

## Meal-only format example

These are synthetic format examples, not recommendations or client prescriptions. Replace all illustrative values with Nicole's confirmed plan.

```json
{
  "schema": "bbn.coaching-import.v1",
  "plan_id": "d6a253ec-5ce0-4aab-a386-a157ba73df41",
  "revision": 1,
  "created_on": "2026-09-08",
  "name": "Coaching import example",
  "client_name": "Alex (example only)",
  "kind": "meal",
  "workout": null,
  "meal": {
    "name": "Meals for a full life",
    "intro": "Example only. Follow the portions Nicole has approved.",
    "schedule": "Repeat daily. Lunch alternatives are complete meals; choose one.",
    "targets": {
      "mode": "grams",
      "calories": null,
      "protein_g": null,
      "carbs_g": null,
      "fat_g": null,
      "protein_pct": null,
      "carbs_pct": null,
      "fat_pct": null
    },
    "meals": [
      {
        "name": "Breakfast",
        "note": "Prepare the oats the night before if helpful.",
        "items": [
          {
            "protein": null,
            "carbs": null,
            "fats": null,
            "calories": null,
            "name": "Rolled oats",
            "portion": "40 g dry"
          },
          {
            "protein": null,
            "carbs": null,
            "fats": 0,
            "calories": null,
            "name": "Plain Greek yogurt",
            "portion": "170 g"
          }
        ],
        "options": []
      },
      {
        "name": "Lunch",
        "note": "Choose one. Portions refer to cooked weights.",
        "items": [],
        "options": [
          {
            "protein": null,
            "carbs": null,
            "fats": null,
            "calories": null,
            "text": "120 g chicken, 150 g rice and 1 cup vegetables.",
            "tag": null
          },
          {
            "protein": null,
            "carbs": null,
            "fats": null,
            "calories": null,
            "text": "1 prepared chicken wrap (the agreed brand) and 1 apple.",
            "tag": "zero_prep"
          }
        ]
      }
    ],
    "coach_notes": []
  }
}
```

## Meal rules

- `name`: nonempty, 160 characters max. `intro`: client-facing text, up to 5000 characters. `schedule`: client-facing text up to 2000 characters. The portal displays schedule beneath the introduction. It does not automatically switch meals by date or week. Label training/rest-day variants and explain when they apply in these notes; ask Nicole before exporting if this representation cannot express her schedule faithfully.
- `targets`: all eight keys are required. `mode` is `grams` or `percent`. Use grams with null amounts when no numeric targets were supplied. No guessed nutrition totals. Calories may be null or 0–20000; gram fields null or 0–5000; percentage fields null or 0–100. Percent mode requires all three percentages totaling 100. Preserve supplied numbers; do not calculate clinical targets or infer calories from macros.
- `meals`: 1–30 ordered meals. Each has `name` (nonempty, max 160), `note` (max 2000), `items` and `options` arrays.
- Each meal uses EITHER a fixed list of 1–50 foods in `items` with `options: []`, OR 1–30 complete pick-one meals in `options` with `items: []`. Never populate both: the portal presents one mode per meal. For substitutions use complete alternatives including every food and portion, or clarify the substitution in a client-facing note. Do not silently turn an additional food into a replacement.
- Each item has exactly `name`, `portion`, `protein`, `carbs`, `fats`, `calories`. Name is nonempty up to 160, portion nonempty up to 500 characters. Preserve grams/cups/units and cooked versus raw measurements exactly. Missing portion is a clarification, not a guess.
- Each option has exactly `text`, `tag`, `protein`, `carbs`, `fats`, `calories`. Text is nonempty up to 2000 characters and includes the complete meal and portions. Tag is null, `zero_prep`, or `rough_day` only when Nicole requests that label.
- Item and option nutrition numbers are null when not supplied; explicit zero remains zero. Protein/carbs/fats are grams, max 5000; calories max 20000. All are finite, nonnegative numbers or null. Do not look up or estimate them without Nicole asking for that separate work and confirming its use.
- `coach_notes`: 0–1000 objects, each exactly `meal` and `text`. `meal: null` targets the whole meal plan; otherwise a 1-based integer referring to an existing meal. Text nonempty, max 2000. These fields are private and must never enter client-facing guidance, metadata, filenames, attachments or hidden PDF content.

## Identity and limits

New plan: random UUID, revision 1. Corrections keep UUID and increment revision, including note changes. Different clients get different UUIDs. `created_on` is a real YYYY-MM-DD date; `revision` 1–2147483647. Package name max 160, client name null or nonempty max 160. Limits: decoded JSON 400 KB; admin PDF 10 MB, 200 pages, 900000 extracted text characters. Split oversized plans with Nicole's approval; never truncate.

## Lossless PDF envelope

Both PDF renderers use ONE approved canonical object. Compute SHA256 over these exact canonical UTF-8 bytes:

```python
raw = json.dumps(plan, sort_keys=True, separators=(",", ":"), ensure_ascii=True, allow_nan=False).encode("utf-8")
sha256 = hashlib.sha256(raw).hexdigest()
payload_lines = textwrap.wrap(base64.b64encode(raw).decode("ascii"), 72)
```

Append the following envelope as actual selectable monospace text to the admin PDF only:

```text
BBN-COACHING-IMPORT-V1
Plan-ID: [actual UUID]
Revision: [actual revision]
SHA256: [actual 64-character digest]
BEGIN-BBN-PAYLOAD
[all base64 lines]
END-BBN-PAYLOAD
```

Replace brackets with real values. BEGIN and END occur exactly once. Payload pages contain no headers, footers, page numbers or interleaved text. No encryption, OCR, vector-outlined text, or attachment-only payload. Base64 is not encryption; this admin PDF contains private notes. Do not embed this object in the client PDF. Show the same ID/revision/digest on both files. The digest detects corruption, not authenticity or Nicole's approval.

The importer reads the envelope, rejects unsupported/missing fields, verifies identity/checksum, and asks for unresolved exercise-library matches. It does not interpret arbitrary scans or client PDFs. Imported workouts become private drafts; meals become unassigned versions in the meal-plan editor. Combined imports create both atomically. Existing assignments remain until Nicole explicitly applies/assigns the reviewed plans. Re-uploading the same ID/revision resumes existing work; changed data with that identity requires a new revision.
