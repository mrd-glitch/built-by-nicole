The system's only container primitive — programme cards, testimonial blocks, dashboard tiles.

```jsx
<Card media="assets/photography/gym-mirror-selfie.jpeg" onClick={open}>
  <Badge tone="accent">12 weeks</Badge>
  <h3>Off-season strength</h3>
</Card>
<Card tone="invert" padding="lg">…</Card>
```

Tones: `default` (white), `invert` (ink), `accent` (pink gradient), `highlight` (yellow), `flat` (sunken, no shadow). Hover lifts 2px and deepens the shadow; press returns to 0. Never add a coloured left border — accent goes in a `Badge` or the tone itself.
