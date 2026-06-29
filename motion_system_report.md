# CampusConnect Motion System Report

## 1. Living Background & Time Environments
The background is rendered in [MotionProvider.tsx](file:///Users/anzarakhtar/Downloads/iilm-production/src/components/providers/MotionProvider.tsx) and transitions automatically by local client clock hours:

- **Morning (5 AM–11 AM)**: Golden orange gradients with sunrise rays radiating from the top-left and soft cloud shapes drifting across.
- **Afternoon (11 AM–5 PM)**: Bright sky-blue atmosphere with floating soft radial light blobs.
- **Evening (5 PM–8 PM)**: Purple-orange sunset gradients with floating wavy aurora bands.
- **Night (8 PM–5 AM)**: Deep navy starry skies with twinkling dots, constellation connection lines, and a soft moon glow.

---

## 2. Reusable Animation Components

### A. GSAP Transitions
- **Page Transitions**: Intercepts pathname changes, fading and sliding page content (`y: 15` to `y: 0`, `opacity: 0` to `1`) using smooth power2 eases.
- **Hide-on-Scroll Navbar**: Navbar hides automatically (`y: -100`, `opacity: 0`) when scrolling down past 80px and reveals itself (`y: 0`, `opacity: 1`) on scroll-up or top margins.
- **Counter & Staggers**: Dashboard metrics count up on entrance using GSAP counters. Skeletons and cards fade/slide in staggered patterns.

### B. Framer Motion Interactions
- **Active Pill Indicator**: Embedded Framer Motion `layoutId="navbar-active-pill"` inside the Navbar links, causing the tab underline pill to slide smoothly between routes.
- **Micro-Interactions**: Hover, click, and toggles on buttons and inputs utilize Framer Motion spring physics.

---

## 3. GPU Transitions & Elevation
- Updated `.card-premium`, `.card-glass`, and `.card-elevated` classes to use hardware-accelerated 3D transforms (`translate3d(x,y,z)`).
- Hovering raises cards smoothly (`translate3d(0, -4px, 0)`), scales them slightly (`1.01x`), and deepens the shadow.
- Hovering search triggers expand the width.
- Twinkling stars at night oscillate opacity smoothly using random time loops.
