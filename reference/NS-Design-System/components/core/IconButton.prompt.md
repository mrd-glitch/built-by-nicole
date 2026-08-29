Circular icon-only button — toolbars, close affordances, media controls, mobile app bars.

```jsx
<IconButton label="Close" variant="ghost"><Icon name="x" /></IconButton>
<IconButton label="Play session" variant="highlight" size="lg"><Icon name="play" size={24} /></IconButton>
```

Same variants and press behaviour as `Button`. `md` is 44px — the minimum touch target; never go below `sm` (36px) on touch surfaces.
