# NS Design System — portable package

Everything needed to rebuild this design system on another account. Unzip and keep the folder structure intact.

## What's inside

| Folder | What it is |
| --- | --- |
| `readme.md` | The full design system guide: voice, color, type, spacing, motion, states, gaps. Read this first. |
| `styles.css` | Single entry point. Imports every token file. |
| `tokens/` | fonts, colors, typography, spacing, shape, elevation, motion, base. All CSS custom properties. |
| `components/` | 16 React components (`.jsx`) each with a `.d.ts` props contract and a `.prompt.md` usage note. |
| `guidelines/` | 28 specimen cards (HTML) documenting color, type, spacing, brand, voice. |
| `ui_kits/website/` | Four-page click-through marketing site. |
| `ui_kits/social/` | Four square social/event templates. |
| `assets/fonts/` | MOONTIME (woff/otf/ttf) — licensed to the brand, ships with the system. Plus its specimen sheet. |
| `assets/logos/` | 6 brand marks (NS lockups + brush rings). |
| `assets/event-graphics/` | Mom's Club neon, Misogi flyer, Misogi 2.0 badge. |
| `assets/photography/` | 17 coach photos, descriptively named. |
| `source-uploads/` | The original raw uploads the system was built from, kept for reference. |
| `SKILL.md` | Skill wrapper — lets an agent load this folder as a design system. |
| `_ds_bundle.js`, `_ds_manifest.json` | Prebuilt component bundle + manifest. |
| `_adherence.oxlintrc.json` | Lint rules that enforce token usage. |
| `thumbnail.html` | Cover tile. |

## To use it on another account

1. Upload the unzipped `NS-Design-System` folder as-is (or re-zip and upload the zip).
2. Point at `readme.md` and `SKILL.md` — together they are the complete brief; no other context is needed.
3. In any page, link `styles.css` (it pulls in every token file) and load `_ds_bundle.js` for the components.

```html
<link rel="stylesheet" href="NS-Design-System/styles.css">
<script src="NS-Design-System/_ds_bundle.js"></script>
```

## Fonts, one caveat

MOONTIME is included as real font files. Montserrat, Barlow, Cinzel and JetBrains Mono are loaded from Google Fonts as stand-ins matched to the artwork. If licensed files for those exist, drop them into `assets/fonts/` and swap the `@font-face` rules in `tokens/fonts.css`.

## The palette, for quick reference

Ink `#0D0D0F` · Paper `#FAFAF8` · Sunken `#F2F2EE` · Hot pink `#FF1F6B` · Deep pink `#C9004E` · Grey `#6E6E76` · Bright yellow `#FFE500` · Deep yellow `#E8C400`
