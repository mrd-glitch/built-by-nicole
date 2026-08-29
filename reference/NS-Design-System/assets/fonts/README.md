# Fonts

## MOONTIME (the brand script)

`MoonTime-Regular.woff` / `.otf` / `.ttf` are the real licensed files, supplied by the brand.
They are wired up in `tokens/fonts.css` as a single `@font-face` (woff first, otf/ttf behind it) and
exposed as `--font-script`.

`moontime-specimen.png` is the brand's own character sheet (A-Z upper and lower): thin monoline, slanted,
tall looping ascenders, almost no stroke contrast, letters connect. Keep it for reference when checking
rendering or hand-set lettering.

Usage rule: one word, or one short phrase. Event titles, an accent word, a signature line. Never body
copy, buttons, labels or long headlines. `--font-script-brush` (Kaushan Script) is the rougher alternate.

Licence: commercial (medialab.co via MyFonts). Do not redistribute the files outside this project.

## Everything else

Montserrat, Barlow, Cinzel and JetBrains Mono still load from Google Fonts as substitutions matched to the
artwork. If the brand licenses different display or body faces, add the files here and swap the Google
`@import` in `tokens/fonts.css` for local `@font-face` rules.
