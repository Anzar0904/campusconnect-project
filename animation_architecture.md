# CampusConnect Animation Architecture

## Design Guidelines

To prevent timeline pollution, CPU spikes, and duplicate triggers, we adhere to a strict motion framework split:

```
┌────────────────────────────────────────────────────────┐
│                      MOTION STACK                      │
├───────────────────────────┬────────────────────────────┤
│           GSAP            │       FRAMER MOTION        │
├───────────────────────────┼────────────────────────────┤
│ • Scroll Storytelling     │ • Layout transitions       │
│ • Parallax & Skyline      │ • Modals & sheets          │
│ • Staggered reveals       │ • Hover states / button scale│
│ • Floating canvas loops   │ • Dropdowns / popovers     │
│ • Count-up counters       │ • Gestures (drag / swipe)  │
└───────────────────────────┴────────────────────────────┘
```

---

## 1. Central Utilities & Hooks

All layout nodes consume utilities from [useGsapMotion.ts](file:///Users/anzarakhtar/Downloads/iilm-production/src/hooks/useGsapMotion.ts):

- **`useGsapReveal(options)`**: Handles entrance animations (staggered, fade-in, zoom) relative to ScrollTrigger visibility bounds.
- **`useGsapNumberCounter(target, duration)`**: Animates statistics and XP counts smoothly using custom easing.
- **`useGsapMagnetic(strength)`**: Magnetic draw for action buttons.
- **`useGsapTilt(maxTilt)`**: Applies 3D perspective shifts on cards.
- **`useGsapFloating(y, duration)`**: Infinite yoyo loops for background illustration items.

---

## 2. Performance Engineering Rules

1. **GPU Acceleration**: Animations target `transform` properties (`x`, `y`, `scale`, `rotation`, `skew`) instead of layout properties (`top`, `margin`, `width`, `height`) to prevent browser reflow.
2. **Context Cleanup**: All GSAP animations are scoped using `@gsap/react` hooks or wrapped in cleanups, ensuring timelines are killed on component unmount to prevent leaks.
3. **Tab Visibility Throttling**: Particle canvases check `document.visibilityState === 'visible'` before updating, reducing background CPU load to 0% when the user minimizes the browser or shifts tabs.
4. **Prefers-Reduced-Motion Bypass**: Checks accessibility settings. If active, overrides heavy animations with simple instant displays.
5. **Batching**: Elements are animated in batches using ScrollTrigger's batch mode to minimize calculation loops.
