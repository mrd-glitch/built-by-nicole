---
name: Built by Nicole — public landing page
description: Personal editorial within the current Nicole brand.
colors:
  ink: "#0D0D0F"
  paper: "#FAFAF8"
  pink: "#FF1F6B"
  pink-deep: "#C9004E"
  pink-hover: "#a60040"
  pink-soft: "#FF7AA6"
  pink-selected: "#FFE4EE"
  service-accent: "#9e1546"
  yellow: "#FFE500"
  muted: "#55555d"
  coaching-surface: "#efefeb"
  application-surface: "#f2eae7"
  application-muted: "#554e4c"
  white: "#FFFFFF"
  quiet-surface: "#F2F2EE"
  quiet-hover: "#E2E2E0"
  input-border: "#C4C4CA"
  divider: "#d6d6d1"
  dark-muted: "#c4c4c6"
typography:
  display:
    fontFamily: 'Montserrat, "Helvetica Neue", Arial, sans-serif'
    fontSize: "clamp(60px, 6.6vw, 96px)"
    fontWeight: 800
    lineHeight: 1.03
    letterSpacing: "-0.04em"
  headline:
    fontFamily: 'Montserrat, "Helvetica Neue", Arial, sans-serif'
    fontSize: "clamp(34px, 3.5vw, 52px)"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.035em"
  title:
    fontFamily: 'Montserrat, "Helvetica Neue", Arial, sans-serif'
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  body:
    fontFamily: 'Barlow, "Helvetica Neue", Arial, sans-serif'
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: 'Barlow, "Helvetica Neue", Arial, sans-serif'
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "0.07em"
  script:
    fontFamily: 'MoonTime, "Moon Time", Allura, Sacramento, "Kaushan Script", cursive'
    fontSize: "1.6em"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "0"
rounded:
  control: "3px"
  form: "4px"
spacing:
  gutter-mobile: "20px"
  gutter-tablet: "36px"
  gutter-desktop: "56px"
  column-gap: "100px"
  column-gap-tablet: "52px"
  section-mobile: "64px"
components:
  button-apply:
    backgroundColor: "{colors.pink}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "17px 25px"
  button-apply-hover:
    backgroundColor: "{colors.pink-deep}"
    textColor: "{colors.white}"
  button-form:
    backgroundColor: "{colors.pink-deep}"
    textColor: "{colors.white}"
    rounded: "{rounded.control}"
    padding: "12px 22px"
  button-form-hover:
    backgroundColor: "{colors.pink-hover}"
  button-quiet:
    backgroundColor: "{colors.quiet-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 14px"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
  form-card:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.form}"
    padding: "36px"
---

# Design System: Built by Nicole — public landing page

## Overview

**Creative North Star: "Personal editorial within the current Nicole brand"**

A warm, direct coaching page with strong typography, real Nicole photography, generous paper surfaces, and confident pink actions. The visual authority is the current circular `NSBadge` and supplied logo in `docs/brand-source`; `reference/NS-Design-System` is a historical brand and asset reference.

This document describes the implemented public landing page only. Source of truth: `web/src/app/page.tsx`, its scoped `landing.module.css`, and the shared tokens consumed there. Landing-specific intake styling lives beneath `.formWrap`; these rules do not redefine the client or admin portal. Product commitments live in `PRODUCT.md`; page strategy and pending content live in `docs/landing-direction.md`.

**Key Characteristics:**

- Real, unretouched Nicole photography with responsive crops.
- Ink and paper fields, hot pink actions, sparing yellow details.
- Large sentence-case headings, readable supporting copy, brief script accents.
- Flat sections, fine dividers, native navigation and disclosure behavior.

## Colors

Hot pink punctuates warm photographic and paper surfaces; ink anchors the opening, process section, and footer. Frontmatter records the actual values rather than introducing a new palette.

- **Primary:** `pink` fills application links with ink text. `pink-deep` supports readable accent text, script, light-surface focus outlines, and white-label form actions. Application-link hover changes to deep pink and white. Service labels use the darker `service-accent`.
- **Secondary:** `yellow` appears in process numbers and focus outlines on dark sections.
- **Neutral:** `paper` is the main canvas; `coaching-surface` and `application-surface` distinguish longer sections. `muted` supports body copy on light surfaces, `dark-muted` on ink. The form is white, with a grey input border and a quiet paper back button.
- **State:** `pink-soft` marks navigation hover on dark backgrounds; `pink-selected` fills selected intake choices with a hot pink border. Pink selection highlighting uses ink text.

## Typography

The declared display family is Montserrat, the body family is Barlow, and the brief personal accents use MoonTime. The exact fallback stacks appear above. Fonts are configured in `web/src/app/fonts.ts` and `web/src/styles/tokens/fonts.css`; the later imported `typography.css` supplies the effective family declarations. Do not infer portal Bricolage or ceremonial Cinzel usage on this page.

- **Display:** the hero lead uses the display token; the following lines use 700 weight and `clamp(40px, 4.3vw, 64px)`. On mobile these become `clamp(40px, 9.9vw, 64px)` and `clamp(31px, 7.6vw, 48px)` respectively.
- **Headline:** section headings use the headline token and balanced wrapping. Mobile uses `clamp(32px, 8vw, 42px)`.
- **Title:** service headings use the title token; process headings are 22px and FAQ summaries are 17px Barlow at 600 weight.
- **Body:** long copy uses 17–18px with approximately 1.65 line height. The introduction is capped at 47ch, application copy at 36ch. Hero copy is 20px/1.5, becoming 18px on mobile.
- **Label:** uppercase credential labels use the label token. Form progress uses an 11px Montserrat eyebrow with 0.06em tracking.
- **Script:** short emphasis and the Nicole signature only; the signature is explicitly 56px. Keep paragraphs in the body face.

## Layout

The supporting container is `min(1240px, calc(100% - 112px))`, with 56px desktop gutters. At 1100px and below, gutters become 36px and paired columns narrow from 100px to 52px gaps. At 760px and below, gutters become 20px and introduction, services, FAQ, application, and process layouts become single-column. Major mobile section padding is 64px; desktop sections typically use 100–128px.

The hero is a full-width photographic field with left-side copy and Nicole on the right. Its desktop minimum height is `max(780px, 94svh)`. The image starts at 22% of the width, 15% below 1100px, and 32% above 1700px. On mobile it occupies the top 620px, with copy starting at 340px and a vertical scrim supporting readability; hero minimum height is 880px. Preserve and recheck these crops when photography changes.

Desktop navigation shares a ruled header with the badge, wordmark, and client login. The final navigation link hides below 1100px; the central navigation hides below 760px, while client login and the page's application action remain available. This implementation has no mobile menu or sticky header.

## Elevation & Depth

Depth comes from alternating flat surfaces, photography, and fine dividers. Layered directional hero scrims and a bottom gradient on the training caption protect legibility. The intake card and its primary button explicitly remove shared shadows; there is no floating-card shadow vocabulary for this landing page.

## Shapes

Photography has square corners. Controls use 3px radii and the white application card uses 4px. The circular NS badge is the distinctive brand geometry: paper ring and lettering with a pink dash on the ink header/footer, 58px in the header, 52px in the footer, and 44px on mobile. Preserve the existing SVG implementation.

## Components

- **Application link:** a sentence-case 600-weight Barlow action with a small line-arrow SVG, 58px minimum height, and 30px internal gap. Hover changes pink/ink to deep pink/white; active translates down 1px. It navigates to `#apply`.
- **Text links and navigation:** ink on paper, paper on dark fields, with color feedback and no underline rule. Most key links have a 44px minimum target height. The keyboard skip link becomes visible at the top when focused.
- **FAQ:** native `details`/`summary`, thin dividers, a 16px plus that becomes a minus when open, pink hover, and roomy 25px vertical summary padding. Native disclosure behavior remains keyboard accessible.
- **Intake card:** the existing twelve-question intake component remains intact. Its landing wrapper applies a flat white 4px card, 36px padding, and 24px/18px mobile padding. Progress bars, labelled fields, selected choices, Back/Next actions, consent, error, and success states stay with the existing component. Choice buttons retain a 2px hot pink selected border and pale pink fill.
- **Form controls:** white inputs use 3px corners and a 48px minimum height; textareas retain a 96px minimum. The submit/Next button is deep pink with white uppercase text, and Back is quiet paper. Disabled buttons use 0.5 opacity. Preserve fields and submission behavior when adjusting appearance.
- **Focus and motion:** landing links, buttons, disclosures, and text fields use a 3px deep pink focus outline with 5px offset; hero, process, and footer links use yellow. Input focus also sets the border to ink. CTA and disclosure transitions last 140ms with `ease`; inherited links use the shared 140ms standard easing. Reduced-motion preferences remove landing transitions.
- **Photography and preview content:** the current hero uses Josh's outdoor portrait (Dumoulin Family 2026-7). The introduction uses the whole family (2026-15) as a full-width photographic field, fading into paper behind the text. A second editorial row pairs the existing athletic credentials with the WNBF sword celebration at its complete original ratio. The gym mirror image continues to supply training context. Asset origins are in `docs/landing-assets.md`; new delivery files are optimized WebP copies with provenance sidecars. Only placeholder client stories remain server-gated to development; obsolete pending-photo notes have been removed.
- **Photographic layout:** the hero keeps its existing responsive field, with a 12% horizontal edge fade on desktop and no edge fade on mobile. Its source-size hint accounts for the wider image required by the portrait mobile crop (960px), so the face remains sharp. The family image uses a responsive cover crop that preserves all four people, with a horizontal fade on desktop and a downward fade below 900px. The athlete row has two columns with a 100px gap (52px on tablet), then stacks on mobile with a 30px gap. The athletic story image retains its natural aspect ratio.

## Do's and Don'ts

- **Do** preserve the current circular NSBadge and Built by Nicole identity.
- **Do** use real Nicole photographs and check facial visibility and text contrast at desktop and mobile crops.
- **Do** keep landing adjustments scoped to the CSS module and its intake wrapper.
- **Do** keep visible focus, native FAQ disclosure, and reduced-motion handling.
- **Don't** invent testimonials, results, or family imagery; keep unapproved client stories out of production.
- **Don't** replace the current logo with a historical reference asset.
- **Don't** apply these landing-specific layout, shape, or shadow rules to the portals.
