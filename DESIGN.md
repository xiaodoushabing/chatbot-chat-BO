# Design — Drafting Studio

A precise, guided instrument: cool porcelain content, white softly-elevated cards, and a **committed deep-teal nav column** as the signature. Warmth is carried by the accent, not the ground — a confident **amber**. Keeps the Guided Canvas STRUCTURE the client approved (grouped nav, the Intent Studio wizard, big display numerals, the motion); only the identity changed, to escape the warm-cream + serif + soft-violet "AI default" look. Reference: `docs/design-directions/unique-identities.html` (direction 1). Light + dark, both first-class; theme-toggleable.

## Identity

- **Ground:** cool porcelain (`--canvas`, a pale cool blue-gray, deliberately NOT warm cream) with a faint cool top-right glow. Content sits on it as **white cards** (`--bg`). Dark: deep teal-graphite canvas, elevated warm-charcoal-teal cards, a faint amber glow.
- **Committed nav:** the whole left column (brand + nav) is **deep teal** (`--nav`), light text (`--nav-ink`), with the **active item marigold** (`--nav-accent`) — a memorable colored-nav signature few defaults use. The top bar and content stay light.
- **Accent:** one confident **amber** (`--accent` #B3651A light / brighter #E0913E dark) for primary actions, selection, links, focus, the wizard rail. On the teal nav, the brighter marigold `--nav-accent` provides the active pop.
- **Type:** `Bricolage Grotesque` (variable, characterful) for display — page titles, step titles, big numerals (pipeline counts, run ring), intent QUESTIONS. `Hanken Grotesk` for UI/body/labels. `JetBrains Mono` for ids/paths/timestamps only. Bricolage gives the "designed" character that Fraunces used to, without the AI-serif cliché.
- **Shape:** cards `--radius-card` 18px, fields 11px, small 9px — a touch crisper than before. Cool-tinted soft shadows; amber buttons get `--shadow-accent`.
- **Status = lifecycle colors**, each text-on-tint: draft (cool gray), staged (gold), pending (teal), live (green). Always paired with a label.

## Motion

Unchanged from Guided Canvas: `--ease-out`, screen fade-up on route change, card hover-lift, the active-nav rail scaling in, and the Intent Studio **wizard** (progress rail fills node-to-node; steps animate in on mount — no exit-gating that can stall; the Generate step's easing SVG ring + count-up + source tick-list + live-run telemetry; completion summary rising in). Reduced-motion falls back to crossfades.

## Tokens (semantic; drive both themes)

Content: `bg-canvas` (page), `bg-bg` (white card), `bg-surface-2/3` (cool wells), `text-ink/ink-2/ink-3`, `border-line`. Accent: `bg-accent/text-accent/text-on-accent/bg-accent-wash`. **Nav column:** `bg-nav`, `text-nav-ink`, `text-nav-sub`, `bg-nav-on`, `text-nav-on-ink`, `text-nav-accent`/`bg-nav-accent`, `border-nav-line`. Lifecycle: `text-draft/staged/pending/live` + `bg-*-bg`; semantic `ok/warn/err/info`. Fonts: `font-display` (Bricolage), default sans (Hanken), `font-mono`. Radii `rounded-(--radius-ctl|field|md|card)`, shadows `shadow-(--shadow-soft|2|pop|accent)`.

## Voice

Precise, calm, quietly confident. Labels are nouns, buttons are verbs. No exclamation marks. Character comes from Bricolage on the titles/numerals and the teal-and-amber pairing.
