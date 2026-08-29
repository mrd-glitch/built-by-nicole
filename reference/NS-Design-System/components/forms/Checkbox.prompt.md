Checkbox (multi-select) and Radio (single choice) share one file and one visual rule: 2px ink box, pink fill when on.

```jsx
<Checkbox label="Text me session reminders" hint="Two per week, no spam" defaultChecked />
<Radio name="tier" label="Group coaching" />
<Radio name="tier" label="1:1 coaching" />
```

Both accept `hint` for a second line and `invert` for ink backgrounds. `Radio` is exported from `Checkbox.jsx`.
