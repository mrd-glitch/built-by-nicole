Toggle for settings that apply immediately — reminders, rest-day alerts, public leaderboard.

```jsx
<Switch label="Rest-day reminders" defaultChecked />
<Switch label="Show me on the leaderboard" labelPosition="start" />
```

Knob travel uses the snap easing (`--ease-snap`) — the one bounce in the system. Use `Checkbox` instead when the value is only saved on submit.
