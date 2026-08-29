# NS website UI kit

Click-through recreation of the NS marketing site: **Home → Coaching → Events → Apply**, plus a
programme dialog and a toast.

| File | Contains |
| --- | --- |
| `index.html` | Entry point. Loads `styles.css`, `_ds_bundle.js`, Iconify, then the JSX files in order. |
| `SiteChrome.jsx` | `SiteHeader`, `SiteFooter`, and the shared `Section` / `Eyebrow` / `Display` layout helpers. |
| `HomePage.jsx` | Hero, programme cards, coach block, event strip, testimonials, CTA band. Owns `PROGRAMMES`. |
| `InnerPages.jsx` | `ProgrammesPage`, `EventsPage` (with sign-up dialog), `ApplyPage` (full form). Owns `EVENTS`. |
| `App.jsx` | Page state, programme dialog, toast, mount. |

Every primitive comes from the design system (`window.NSDesignSystem_14b176`) — Button, Card, Badge,
Tag, Tabs, Input, Select, Checkbox, Switch, Dialog, Toast, Tooltip, IconButton, Icon, Logo. Nothing is
re-implemented locally; the only local code is layout.

## Caveat on provenance

NS supplied brand assets (logo lockups, event graphics, photography, palette) but **no website code,
Figma file or live URL**. The layout here is therefore an extrapolation from the brand material, not a
recreation of an existing site. Colour, type, radii, shadows and copy voice all come from the supplied
assets and the tokens in `/tokens`. If a real site exists, send the URL or repo and this kit should be
rebuilt against it.
