Text input with uppercase label, hint and error states; `as="textarea"` for long answers (check-in notes, application forms).

```jsx
<Input label="Email" type="email" placeholder="you@email.com" required />
<Input label="Where are you at right now?" as="textarea" rows={5} />
<Input label="Body weight" adornment="lb" error="Numbers only" />
```

Focus is a 3px yellow ring plus an ink border — the only place yellow appears in forms. `invert` for ink backgrounds.
