# Design — Guided Canvas

A guided, spatial, softly-elevated product that turns a compliance-heavy banking chore into a calm, confidence-building flow. "An instrument you're walked through, not a dashboard you decode." Reference prototype: `docs/design-directions/guided-canvas.html` (the approved direction). Light + dark, user-toggleable; both are first-class and share one warm identity.

## Identity

- **Ground:** warm off-white canvas (`--canvas`) with a subtle top-right radial glow; content sits on it as **white, softly-elevated cards** (`--bg` = white in light). Dark theme: warm deep-graphite canvas, elevated warm-charcoal cards, a faint violet glow.
- **Accent:** one considered **indigo-violet** (`--accent` #4B41C4 light / luminous #9488F7 dark). Used for primary actions, active nav, selection, the wizard rail, focus. Not decoration.
- **Type:** `Fraunces` (variable serif) for display — page titles, big numerals (pipeline counts, the run ring), step titles, intent questions. `Hanken Grotesk` for all UI/body/labels. `JetBrains Mono` for ids/paths/timestamps only. Fraunces carries the warmth and the "designed" feel; Hanken keeps UI crisp.
- **Shape:** generous radii — cards `--radius-card` 22px, inputs/buttons `--radius-field` 12px, small `--radius-ctl` 11px, pills fully round. Soft diffuse shadows (`--shadow-soft/2/pop`), never hard boxes. Accent buttons get `--shadow-accent`.
- **Status = named lifecycle colors**, each a text color on its own tint: draft (warm gray), staged (ochre), pending (violet), live (emerald). Always paired with a label; never color alone.

## Motion (part of the build, not decoration)

- Curve `--ease-out` cubic-bezier(.22,.61,.36,1). Screens fade-up on enter. Cards lift on hover (translateY + shadow). Nav items nudge + an accent rail scales in on active.
- **Signature — the Intent Studio wizard:** a horizontal step flow **Select sources → Configure → Generate → Review**. An animated **progress rail** fills node-to-node; steps **slide** (enter from the right, exit left) with fade. The **Generate** step is the theatre: an easing **SVG progress ring** with a Fraunces count-up, sources **ticking off** with checkmarks that draw, a pulsing status pill, resolving into a completion summary that rises in. Reduced-motion: crossfade to end states, no slide.
- Toasts rise from the bottom; the run completion badge draws its check.

## Shell

- Grid: 248px brand+nav column · top bar. Brand: gradient violet mark + "Intent Studio" (Fraunces) / "Knowledge Operations" sub. Top bar (translucent canvas, blurred): project switcher (card with a violet monogram tile), spacer, a top action or two, theme toggle, avatar (conic-violet).
- **Grouped nav** with uppercase group labels — **BUILD** (Dashboard, Project Settings, Intent Studio) and **GOVERN** (Review, Approvals, Intent Library). Active item: white card + accent text + soft shadow + a 3px accent rail on its left edge; hover nudges right. Badges (counts) as violet pills.

## Components (rebuild the primitives to this language)

Buttons: primary (accent fill, white text, accent shadow, lifts on hover), ghost (white card + border), subtle (transparent). Inputs/selects: white, 12px radius, violet focus ring. Cards: white, 22px radius, soft shadow. Pills: lifecycle colors. SegmentedControl: soft warm track, active = white chip + accent text + soft shadow. Tabs: use these ONLY for genuine view-switching; where the client wants topic scoping (Review), use a topic **filter dropdown**, not tabs. Tables can render as airy rows or as cards depending on the page (Review = cards; Intent Library = dense table). Skeletons for loading, teaching empty states, absolute SGT timestamps.

## Voice

Warm but precise. Labels are nouns, buttons are verbs. No exclamation marks. The one flourish is Fraunces on the numbers and titles.
