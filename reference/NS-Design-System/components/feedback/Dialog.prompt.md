Modal for a decision or a short form — application step, cancel confirmation, waitlist sign-up.

```jsx
<Dialog open={open} title="Join the March challenge" onClose={close}
  footer={<><Button variant="ghost" onClick={close}>Not now</Button><Button>Lock it in</Button></>}>
  <p>12 hours, one team, no scrolling. Bring water.</p>
</Dialog>
```

Sheet radius is 20px — the widest in the system. Keep body copy to a few lines; anything longer belongs on a page.
