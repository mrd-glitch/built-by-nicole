# NS Design System

Brand and interface system for **NS**, the coaching practice of a 5th degree black belt, former
Taekwon-Do world champion and WNBF pro bodybuilder who coaches health and habits.

She works with women, mostly moms in their mid-30s to mid-40s, juggling full lives, who want to feel
stronger, fitter and more in control of their bodies and habits. The promise is real accountability and a
tested process, not hype. Nothing changes if nothing changes.

The work spans one-to-one and group coaching, a small group programme for mothers ("Mom's Club"), and a
recurring endurance event ("Women's Misogi Challenge", now in its 2.0/3.0 editions).

## Sources given to me

| Source | What it was |
| --- | --- |
| `uploads/NS-*.png` (3) | NS brush-ring lockups: ink+pink on paper, paper+pink on ink, pink-leading on ink |
| `uploads/swirl-*.png` (3) | The same brush ring without the NS letters, in three colourways |
| `uploads/Screenshot … 9.17.45.png` | "Mom's Club" neon title graphic |
| `uploads/Screenshot … 9.18.28.png` | "All Womens Misogi Challenge" flyer, March 9, 10 AM–10 PM |
| `uploads/Screenshot … 9.18.44.png` | "Women's Misogi 2.0 Challenge" circular badge, June 22 2025 |
| 17 × `uploads/*.jpeg` | Coach photography: portraits, gym candids, NPC stage shots, a Team Impact athlete tank |
| Chat notes | The palette: ink `#0D0D0F`, paper `#FAFAF8`, hot pink `#FF1F6B`, deep pink `#C9004E`, grey `#6E6E76`, bright yellow `#FFE500`, deep yellow `#E8C400` |

**No codebase, Figma file, live URL, font files or slide deck were provided.** Everything below is derived
from the assets and palette above. Where I had to extrapolate (site layout, component inventory, fonts,
icons) it is flagged in place — see **Gaps & substitutions**.

---

## Index

| Path | What's in it |
| --- | --- |
| `styles.css` | The single entry point consumers link. `@import` list only. |
| `tokens/` | `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `shape.css`, `elevation.css`, `motion.css`, `base.css` |
| `components/core/` | Button, IconButton, Icon, Badge, Tag, Card, Logo |
| `components/forms/` | Input, Select, Checkbox, Radio, Switch |
| `components/navigation/` | Tabs |
| `components/feedback/` | Dialog, Toast, Tooltip |
| `guidelines/` | 25 foundation specimen cards (Colors, Type, Spacing, Brand) |
| `ui_kits/website/` | Four-page click-through marketing site — see its README |
| `ui_kits/social/` | Four square social/event templates — see its README |
| `assets/logos/` | 6 supplied brand marks |
| `assets/event-graphics/` | 3 supplied event graphics |
| `assets/photography/` | 17 supplied photographs, renamed descriptively |
| `thumbnail.html` | Homepage tile |
| `SKILL.md` | Agent-Skills wrapper so this folder works as a Claude Code skill |

### Components

Button · IconButton · Icon · Badge · Tag · Card · Logo · Input · Select · Checkbox · Radio · Switch ·
Tabs · Dialog · Toast · Tooltip

Each lives beside a `.d.ts` (props contract) and a `.prompt.md` (what & when, one usage example).
`Radio` ships inside `Checkbox.jsx` because the two share one visual rule.

**Intentional additions** (no source defined a component inventory, so this is the standard set, plus):
- `Icon` — a wrapper for the substituted Lucide glyph set, so icon usage stays consistent.
- `Logo` — points at the six supplied brand marks so no one is ever tempted to redraw the ring.

---

## CONTENT FUNDAMENTALS

Written from the coach's own voice guide. She is a 5th degree black belt, former Taekwon-Do world
champion, and WNBF pro bodybuilder who coaches health and habits. Her clients are women, mostly moms in
their mid-30s to mid-40s, with full lives, who want to feel stronger, fitter, and more in control of their
bodies and habits. The promise is real accountability and a tested process, not hype.

**The five voice traits.** Direct (say the thing plainly, no hedging). Warm (care about the person, not
the sale). Blunt (name the hard truth instead of softening it into mush). Story-driven (teach through real
moments, not abstract advice). Grounded (every claim backed by a real number, name, or date).

**Person.** First person for the coach, second person for the reader. "I'm speaking, not writing a memo."
Never "we" for a solo practice, never third-person "NS believes...".

**No em-dashes. Ever.** Use commas, periods, or line breaks instead. This is a hard rule in every piece of
customer-facing copy: headlines, body, buttons, emails, captions, error states.

**Rhythm.** Mix short punchy sentences with longer ones. The short line lands the idea; the long one
carries the story. Contractions always. Short paragraphs, sometimes a single line. Repetition as a device:
"Maybe it's not about the workout. Maybe it's about the fact that you keep quitting on Wednesday."
Occasional caps or bold for emphasis (FINALLY!), sparingly, and never more than once per screen.

**Casing.** Sentence case in body copy and UI labels. Headline Case is fine for display headlines, and
UPPERCASE stays a *typographic* device (eyebrows, buttons, mono spec lines), not a writing one.

**Phrases she uses.**
- "Nothing changes if nothing changes."
- "If it matters, it matters enough to..."
- "Show up with what you can."
- "That doesn't happen by accident."
- "The quiet work nobody sees."
- "Are you willing to do the work?"

**Credibility terms, used only when they matter:** pro card, hypertrophy, 5th degree black belt, world
champion, WNBF pro. Real names, numbers and dates over vague claims: "300 lb deadlift", "20 lbs in 4
months", never "amazing results".

**Words she refuses.** No corporate motivational cliches: "crush your goals", "unlock your potential",
"transform your life", "just believe in yourself", "no excuses". No vague filler: "great results",
"quality coaching", "amazing experience". Never "just figure it out", it dismisses real struggle. No fake
positivity that ignores real constraints like time, sleep, or injury. Also out: "beast mode", "snatched",
"bikini body", "shredded", "girl boss". No shame framing about food or bodies. No countdown-timer urgency;
scarcity is stated plainly ("Six spots. They go when they go.").

**By copy type.**
| Type | Rule | Example |
| --- | --- | --- |
| Headline | Bold and specific. A real outcome or number, not a vague promise. | "Nothing Changes If Nothing Changes." |
| Subhead | Name the reader's actual reality or objection before answering it. | "You don't need more motivation. You need a weekly check-in and someone who won't let you off the hook." |
| Body | Story first, proof woven in, plain language. | "She texted me at 9pm on week three, ready to quit. We changed two things. She deadlifted 300 lbs in October." |
| CTA | Direct, one clear ask, no pressure tactics. | "Start Your Check-In." |
| Microcopy | Warm and human, never robotic or legal-sounding. | "No payment today. I read every one of these myself." |

**Emoji: no.** None in product UI, buttons, labels or headlines. A personal Instagram caption is her
voice, not the system's.

**The feeling to leave behind:** seen and challenged at the same time. Like someone finally told them the
truth and also believes they can handle it.

---

## VISUAL FOUNDATIONS

**The idea.** Ink and paper, cut once with hot pink. The brush ring in the logo is the only organic mark
in the system; everything around it is flat, square and quiet so the ring and the photography carry the
personality.

**Colour.** Three roles only:
1. **Ink `#0D0D0F` / paper `#FAFAF8`** carry ~85% of every surface. Sections alternate paper → sunken
   `#F2F2EE` → ink; there are never more than two background colours competing on one screen.
2. **Hot pink `#FF1F6B`** is the action colour: primary buttons, active tab rules, links, accent badges,
   the accent card gradient. Deep pink `#C9004E` is hover/press and link colour on paper. Pink also serves
   as danger — there is no separate red.
3. **Bright yellow `#FFE500`** is the highlight, used at most once per screen (the loudest CTA, the neon
   treatment, focus rings). Deep yellow `#E8C400` is its pressed/depth value.
   Grey `#6E6E76` is metadata only. Green (`--success`) is *derived*, not supplied.

**Type.** Five voices: Montserrat (display/heading, 800-900, uppercase, -0.03em on hero), Barlow (body
18/1.55, UI labels 14 at +0.06em, eyebrows 12 at +0.26em), Cinzel (events and challenges only, the
ceremonial register), **MOONTIME** (`--font-script`: the flowy, feminine accent, one word at a time, set
large and usually glowing, as in the yellow "Club" of Mom's Club), and JetBrains Mono for every number,
timer, price and spec line. Kaushan Script stays available as `--font-script-brush` when a brushier,
rougher script is wanted.

MOONTIME is licensed to the brand and ships from the project: `assets/fonts/MoonTime-Regular.woff` (plus
otf and ttf), wired up in `tokens/fonts.css` and exposed as `--font-script`. Its character sheet is at
`assets/fonts/moontime-specimen.png`. Never set body copy, buttons, labels or long headlines in it: one
word, or one short phrase, maximum. Allura and Sacramento sit at the end of the stack as emergency
fallbacks only.

**Spacing & layout.** 4px grid; sections 96px vertical; container 1200 with 40px gutters, 720 for reading
columns. Card inset 24 (32 for lg). Nav 72px tall and sticky — the only fixed element; nothing else pins.
Touch targets never below 44px.

**Corners.** Near-square: cards 14, media 8, inputs 4, sheets 20. The pill (999) is reserved for
controls — buttons, badges, switch tracks — so "rounded" reads as "clickable".

**Borders.** 1px hairline `rgb(13 13 15 / .12)` on cards and rows; 2px solid ink on outline controls and
choice boxes; 3px pink as the active-tab and quote rule. No coloured left-border accent cards, ever.

**Shadows.** Ink-tinted, tight, low: `--shadow-1` at rest, `--shadow-3` on hover, `--shadow-4` for modals
and floating artwork. Pressed controls use an inset shadow instead of a drop shadow. Neon glow
(`--glow-pink`, `--glow-yellow`) is a text-shadow stack reserved for the club/event treatment.

**Backgrounds & imagery.** Full-bleed photography behind heroes at 50–72% opacity over an ink scrim
(`--grad-scrim-bottom` or a 90° ink ramp) — that scrim, not a capsule, is how text stays legible on photos.
No repeating patterns, no textures, no illustration. Gradients are pink-only, taken from the event flyers
(`--grad-flyer`, `--grad-flyer-diag`); never blue, never purple.

**Photography vibe.** Warm, high-contrast, unretouched — phone-camera gym candids and hard-lit NPC stage
shots side by side. Skin tones stay warm; no cool filters, no black-and-white, no added grain. Crop tight
on effort (hands, backs, plates) or full-length for stage work.

**Motion.** Short and flat: 80ms press, 140ms hover, 220ms toggles, 380ms dialog rise (16px up + fade).
`--ease-standard` (0.2,0,0.2,1) everywhere; `--ease-snap` is the single bounce and belongs only to the
switch knob. Nothing loops, nothing parallaxes, nothing autoplays.

**States.** Hover = darker fill (pink→deep pink, ink→ink-600) or a filled inversion on outline buttons —
never opacity fades. Press = `translateY(1px)` plus an inset shadow; never a scale-down. Focus = 3px
yellow ring (`--focus-shadow`), the one place yellow appears in a form. Disabled = 38% opacity, no
pointer. Cards lift 2px on hover and settle to 0 on press.

**Transparency & blur.** Used in exactly two places: the modal scrim (72% ink + 3px blur) and hero photo
scrims. No frosted-glass panels, no translucent nav.

**Cards** are white, 14px radius, 1px hairline, `--shadow-1`, with optional flush top media. Four
alternates: ink, pink-gradient, yellow, and flat/sunken (no shadow).

---

## ICONOGRAPHY

**No icon assets were supplied** — no icon font, no sprite, no SVGs, and no product UI to lift them from.
Substitution, flagged for review: **Lucide** (2px stroke, square caps, 24px grid), loaded from CDN through
the Iconify web component, wrapped by the `Icon` component:

```html
<script src="https://code.iconify.design/iconify-icon/2.1.0/iconify-icon.min.js"></script>
```
```jsx
<Icon name="dumbbell" size={24} />
```

Rules: single-line stroke only, `currentColor`, 20px in UI / 24px in nav / 16px in dense rows. Icons never
sit alone as decoration — they either label an action or head a feature. **No emoji, no unicode glyphs
(✓, ★, →) used as icons** — the only unicode characters in the system are the ✕ close mark inside Dialog,
Tag and Toast, and the mono `·` separator. Illustration: none — photography does that job. The brush ring
from `assets/logos/` doubles as the avatar/favicon/watermark mark.

---

## Gaps & substitutions — please review

1. **Fonts: the script is real, the rest are substitutions.** MOONTIME is in the project and shipping.
   Montserrat, Barlow, Cinzel and JetBrains Mono are still Google Fonts stand-ins matched to the artwork
   (the NS wordmark reads as a heavy geometric sans; the Misogi flyers use an all-caps display serif). Send
   licensed files for those and I will swap `tokens/fonts.css` to local `@font-face` rules.
2. **Icons are Lucide, not NS.** See above.
3. **No product UI existed**, so `ui_kits/website/` is an extrapolation from brand assets, not a
   recreation. A client-facing training app was deliberately *not* built — no source described one.
4. **The athlete silhouette** on the Misogi artwork is raster-only and was not reproduced.
5. **Green `--success`** is derived in oklch; the brand supplied no success colour.
6. **Legal name / tagline unknown.** The system spells the brand "NS" and uses "NS Coaching" in footers as
   a placeholder.
