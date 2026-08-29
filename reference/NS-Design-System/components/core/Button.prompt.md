Uppercase pill CTA — the only rounded shape in the system; use it for every action, from hero sign-ups to inline form submits.

```jsx
<Button variant="primary" size="lg" iconEnd={<Icon name="arrow-right" />}>Claim my spot</Button>
<Button variant="outline">See the plan</Button>
```

Variants: `primary` (hot pink, default CTA), `highlight` (yellow, used once per screen for the loudest action), `ink` (near-black, secondary on light), `outline` / `outline-invert` (light / dark backgrounds), `ghost` (low-stakes, text-level). Sizes `sm | md | lg`. Press state drops 1px with an inset shadow — never scale it.
