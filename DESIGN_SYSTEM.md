# CampusConnect Design System (v1.0)
**Theme:** Student Premium (Discord + Linear + Apple)

## 1. Color System
Core palette is based on a deep-dark aesthetic with vibrant secondary accents.

| Category | Token | Value | Usage |
| :--- | :--- | :--- | :--- |
| **Neutral** | `zinc-950` | `#09090b` | Global Background |
| **Neutral** | `zinc-900` | `#18181b` | Primary Surface / Card Base |
| **Neutral** | `zinc-800` | `#27272a` | Secondary Surface / Hover |
| **Neutral** | `zinc-500` | `#71717a` | Muted Text / Icons |
| **Neutral** | `zinc-50` | `#fafafa` | Primary Text |
| **Brand** | `indigo-500` | `#6366f1` | Primary Actions / Selection |
| **Brand** | `violet-500` | `#8b5cf6` | Accents / Identity |
| **Accent** | `cyan-400` | `#22d3ee` | Verification / Success |
| **Accent** | `amber-400` | `#fbbf24` | Warning / Confessions |
| **Accent** | `red-400` | `#f87171` | Danger / Delete |

## 2. Typography Hierarchy
Typography is split between a "Display" font for character and a "Body" font for readability.

*   **Heading (Display):** `Hanken Grotesk`
    *   `tracking-tighter` (-0.05em)
    *   Used for: Page Titles, Card Titles, Hero sections.
*   **Body (Primary):** `Inter`
    *   Standard tracking.
    *   Used for: Post content, descriptions, forms.
*   **Data (Mono):** `Geist Mono`
    *   Used for: Timestamps, counts, metadata, IDs.

### Scale
- **H1:** 36px / Bold / Hanken
- **H2:** 24px / Semibold / Hanken
- **H3:** 18px / Semibold / Hanken
- **Body Large:** 15px / Regular / Inter
- **Body Small:** 13px / Regular / Inter
- **Metadata:** 11px / Medium / Geist Mono

## 3. Spacing Scale
Based on an 8px grid system.

- **4px (xs):** Component internals (icon-text gap)
- **8px (sm):** Small paddings (chips, compact buttons)
- **16px (md):** Standard padding (cards, list items)
- **24px (lg):** Section gaps, page padding (mobile)
- **48px (xl):** Page header bottom margins

## 4. Card System
Every card must use one of these three variants. **No generic white borders.**

1.  **`.card-premium` (Linear Style):**
    - Background: `zinc-900/40`
    - Backdrop Blur: `20px`
    - Border: `white/[0.08]`
    - Shadow: `0 8px 32px rgba(0,0,0,0.4)`
    - Hover: Border glows with `brand-500/30`.
2.  **`.card-glass` (Apple Style):**
    - Background: `white/[0.02]`
    - Backdrop Blur: `40px`
    - Border: `white/[0.05]`
3.  **`.card-elevated` (Raycast Style):**
    - Background: `zinc-900`
    - Shadow: Deep layered shadow (`premium-shadow`).

## 5. Button Hierarchy
1.  **Primary:** Linear gradient (`indigo-500` to `violet-500`), white text, shadow-glow.
2.  **Ghost/Pro:** `zinc-900/50` background, `white/[0.08]` border, `zinc-400` text.
3.  **Accent:** Solid `cyan-500` or `amber-500` (used for verification/warning).

## 6. Input System
- **Style:** `.input-pro`
- **Logic:** `bg-white/[0.03]`, `border-white/[0.08]`.
- **Focus:** `border-brand-500`, `ring-4`, `ring-brand-500/10`.

## 7. Motion & Animation Standards
Using `framer-motion` for all interactions.

- **Page Transitions:** `opacity: 0, y: 10` -> `opacity: 1, y: 0` (Spring: `mass: 1, stiffness: 170, damping: 26`).
- **List Stagger:** 0.05s delay per item.
- **Haptic Pop:** Buttons scale to `0.95` on click, Icons scale to `1.2` on active states.
- **Loading:** Use shimmering skeletons with `animate-pulse`.

## 8. Navigation Standards
- **Desktop Sidebar:**
    - Fixed left (256px).
    - Blur background.
    - Grouped items with `.nav-pro` tokens.
- **Mobile Bottom Dock:**
    - Fixed bottom.
    - Floating glass-morphism container.
    - 4 primary icons: Home, Discover, Messages, Profile.

## 9. Empty State Standard
- Every feature must show a `.card-premium` with:
    - Large faded icon.
    - Title in `Hanken Grotesk`.
    - Descriptive subtext.
    - Primary CTA button.
