Section switcher — programme phases, dashboard views, pricing periods.

```jsx
const [tab, setTab] = React.useState("week");
<Tabs items={[{id:"week",label:"This week"},{id:"block",label:"Block",count:4}]} value={tab} onChange={setTab} />
```

Active tab is ink text with a 3px pink underline; inactive is grey. `invert` on ink backgrounds, `fill` for mobile.
