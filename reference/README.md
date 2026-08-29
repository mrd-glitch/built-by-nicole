# Reference materials — Built by Nicole

Everything the build draws from. Read `../PLAN.md` first.

| Path | What it is |
| --- | --- |
| `NS-Design-System/` | Nicole's full design system export from Claude Design (her personal-brand project). **This rules the visual design**: tokens, fonts (MOONTIME licensed, in `assets/fonts/`), voice guide (`readme.md` — no em-dashes, no corporate cliches, no emoji in UI), 6 logo marks, 17 real photos of Nicole in `assets/photography/`, 16 React components, specimen cards. Palette: ink `#0D0D0F`, paper `#FAFAF8`, hot pink `#FF1F6B`, deep pink `#C9004E`, yellow `#FFE500`. |
| `interview-notes.md` | The Granola interview with Nicole defining the feature set, plus post-meeting decisions. This is the requirements source of truth. |
| `inspiration/` | App screenshots Nicole liked. The red/white app = the platform she currently uses (feature/layout reference: plates & snacks dashboard, consistency calendar, superset workout builder, weight/measurements/photos progress). Pastel dashboards = mood only. **Inspiration, not spec — NS system wins on visuals.** |
| `legacy-build/` | The previous static build (`built-by-nicole-marie`). Do NOT extend it. Mine it for: landing copy skeleton, intake field list + goal taxonomy, her original check-in question set (deviation, protein days, hunger, water, steps, Mama Burner — see `docs/checkin-mapping.md` task in PLAN), branded Resend email templates in `api/*.js`. Its fire-orange palette is retired. |

## Future notes
- Stripe: no payments in v1. `profiles.status` + a future `subscriptions` table are the reserved path. See PLAN.md "Payments".
- AI plan drafting (Claude API) comes after Nicole's system settles — intake snapshot is rule-based in v1.
- Images: real Nicole photos only for Nicole; Higgsfield/GPT for any other imagery.
