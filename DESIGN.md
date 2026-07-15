# Design

One identity, two rooms, one cool-blue bloodline. **Light — "Gallery":** Swiss white-cube; pure white ground, near-black ink, a single cobalt accent, near-square corners; typography does the work. **Dark — "Deep Harbor":** blue-black harbor night with a cyan beacon; cool, technical, wide-awake. Daylight cobalt becomes harbor cyan after dark: the same product under two lights. Color strategy: **Restrained** in both themes; the login screen alone earns a Committed, luminous treatment (drifting-orb backdrop behind a glass card, rendered per-theme). Theme is user-toggleable; both are first-class. Nothing warm, nothing orange, no corporate red.

## Color (OKLCH; CSS vars on `:root`, overridden under `.dark`)

| Token | Light (Gallery) | Dark (Deep Harbor) | Role |
|---|---|---|---|
| `--bg` | `oklch(1 0 0)` | `oklch(0.205 0.015 235)` | Body ground. |
| `--surface-2` | `oklch(0.966 0.003 250)` | `oklch(0.17 0.014 235)` | Sidebar, toolbars, wells. |
| `--surface-3` | `oklch(0.947 0.004 250)` | `oklch(0.245 0.016 235)` | Table headers, insets, run cards. |
| `--ink` | `oklch(0.215 0.01 250)` | `oklch(0.93 0.008 230)` | Primary text. |
| `--ink-2` | `oklch(0.40 0.012 250)` | `oklch(0.76 0.015 230)` | Secondary text and table metadata — **must pass 4.5:1** (client flagged faint meta text; never lighten this role). |
| `--ink-3` | `oklch(0.50 0.012 250)` | `oklch(0.64 0.015 230)` | Uppercase column headers and ≥12px-semibold labels only. Never cell/body text. |
| `--border` | `oklch(0.905 0.005 250)` | `oklch(0.30 0.018 235)` | 1px hairlines. |
| `--accent` | `oklch(0.46 0.21 264)` cobalt | `oklch(0.76 0.115 210)` cyan | Primary actions, selection, active nav, focus ring. |
| `--accent-press` | `oklch(0.40 0.20 264)` | `oklch(0.70 0.115 210)` | Hover/pressed. |
| `--on-accent` | white | `oklch(0.17 0.04 225)` | Text on accent fills. |
| `--accent-wash` | `oklch(0.955 0.018 264)` | `oklch(0.29 0.05 220)` | Selected rows, active nav/chips (paired with accent-colored text). |
| `--ok` | `oklch(0.50 0.13 155)` | `oklch(0.76 0.14 155)` | Indexed / approved / succeeded / live. |
| `--warn` | `oklch(0.52 0.12 80)` | `oklch(0.80 0.13 85)` | Pending / stale / not-indexed / skipped. |
| `--err` | `oklch(0.50 0.19 27)` | `oklch(0.72 0.16 22)` | Failed / rejected / dead. |
| `--info` | `oklch(0.48 0.11 255)` | `oklch(0.76 0.115 210)` | Running / informational (accent-adjacent by design). |

Rules: accent = action/selection/state, never decoration. Status pills tint via `color-mix` (~12% of semantic color) and always pair color with a label — never color alone. No side-stripe borders, no gradient text; glass only on the login card.

## Typography

- **UI:** `Instrument Sans Variable` (self-hosted via @fontsource) — the Swiss voice; weights 400/500/600/700 for headings, labels, buttons, body.
- **Data:** `JetBrains Mono Variable` — run IDs, counts, timestamps, URLs, paths, table numerics. Always `tabular-nums`.
- Fixed rem scale ≈1.2: `12 / 13 / 14 (base) / 16 / 19 / 23 / 28`. Page titles 23px/600; section heads 16px/600. Prose ≤72ch. Uppercase only for 10.5–11px column headers and tiny role badges, +0.05em tracking.

## Layout & structure

- Shell: 232px side nav on `--surface-2` (collapsible to 64px), 56px top bar on `--bg`, 1px hairlines everywhere. Top bar: product mark, **global project switcher**, page search slot, role badge, theme toggle, user menu.
- Content: forms/settings max 1200px; data tables to 1440px. Section spacing 32–48px; intra-panel 16–20px. Radii: 4px controls, 6px inputs/menus, 10px cards/modals — crisp, never pillowy (pills are the one exception).
- Cards only for real groupings (run summary, topic tile); ruled tables and wells elsewhere; never nested cards.
- z-scale: dropdown 10 · sticky 20 · overlay 30 · modal 40 · toast 50 · tooltip 60.

## Components

Primitives in `src/components/ui/` are the only interaction vocabulary: Button (primary/secondary/ghost/danger), IconButton, Input, Textarea, Select, Checkbox, SegmentedControl, StatusPill, Tabs, Table (dense, sticky header, selectable rows), SearchField, Modal (native `<dialog>`), Drawer, Toast, Skeleton, EmptyState, ProgressBar, KeyValue meta row. Every interactive component: default / hover / focus-visible / active / disabled / loading. Skeletons for loading; teaching empty states; no bare spinners mid-content.

## Motion

- 150–250ms, `cubic-bezier(0.22, 1, 0.36, 1)`. No bounce; no page-load choreography inside the shell.
- Motion = state: selection wash, staging bar slide-up, approval flip, toast entry, theme cross-fade (120ms).
- **Signature moment — the run:** launcher morphs into a live run card; progress track fills as source ticks feed a mono count-up of drafted intents; pill pulses while running, resolves to a drawn check with the summary settling in. Batch = segmented track. Reduced motion: crossfade to end states.
- Login: slow drifting luminous orbs (cobalt/graphite by day, cyan/abyss at night) behind the glass card; static under reduced motion.

## Voice

Labels are nouns, buttons are verbs ("Generate intents", "Submit for approval", "Withdraw"). Meta text states facts with counts and absolute SGT timestamps. No exclamation marks.
