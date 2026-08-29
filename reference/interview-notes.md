# Nicole Interview — Client Check-In Portal: Features and Workflow Design
Source: Granola meeting notes (https://notes.granola.ai/t/a3ee0631-31f5-49eb-95b2-49a17df62abd-009c2hma), pasted by Josh 2026-08-28.

## Weekly Check-In Form

- Submitted once per week (Sunday)
- Required fields:
  - Date of check-in
  - Dry weight (morning weight, before eating)
  - Front, side, and back progress photos (swimwear or fitted athletic wear encouraged)
  - Meal plan adherence: 5-star self-rating + written explanation
  - Fitness plan adherence: 5-star self-rating + written explanation
  - Open comments, questions, or concerns for the week
- Optional mindset prompts (e.g. "What actions were you proud of?" / "What are you excited for next week?")
- No daily reporting required; daily food journaling is client-dependent

## Client Dashboard (User Portal)

- Bottom-nav tab structure envisioned:
  - Home: summary stats and progress overview
  - Fitness: current workout plan, with previous plans accessible
  - Nutrition: current meal plan (in-app view, no download needed), with previous plans accessible
  - Check-ins: weekly submission history
  - Progress: check-in streak, average self-ratings over time
- Messaging feature within the app (in addition to texting)

## Workout Tracking

- Nicole inputs the prescribed plan: sets, rep range, and target weight
- Clients log actuals per set: reps completed and weight used
- Enables progress tracking over time (weight and reps increasing)
- Exercise video support: YouTube links embedded per movement (no self-produced video)

## Nutrition Plan and Food Logging

- Meal plan displayed in-app (Nicole prescribes; clients follow)
- Admin-controlled toggles per client:
  - Macros display (fats, carbs, protein)
  - Calorie display
  - Food journal / daily logging (on or off per client)
- If food journal is on: photo-per-meal logging preferred over manual food entry
  - Full food tracker (search-and-log by item) is a possible future feature, not MVP
- Daily nutrition self-rating (optional): lets Nicole spot trends (e.g. consistent Monday dips)

## Admin Portal and Aesthetic

- Admin needs:
  - Notification feed: messages and check-ins from all clients, actionable inline
  - Ability to build and edit workout and nutrition plans directly in the portal
  - Per-client feature toggles (macros, calories, food journal, photo logging)
  - Two login types: admin and client
- Color scheme: magenta pink, black, white, yellow
- Feel: clean but energetic; screenshots shared are inspiration only, not a spec

## Next Steps (from meeting)

- Share app screenshots and inspiration references (Nicole). Confirm which UI elements to carry forward vs. use as loose inspiration only.
- Decide on MVP scope for food logging (Nicole). Confirm whether photo-per-meal logging is in MVP or deferred alongside the full food tracker.

## Decisions made after the meeting (grill session, 2026-08-28)
- Photo-per-meal logging IS in MVP (per-client toggle, off by default). Full food tracker deferred.
- Red/white app screenshots = the app Nicole currently uses; layout/feature inspiration only. NS design system rules the visual design.
