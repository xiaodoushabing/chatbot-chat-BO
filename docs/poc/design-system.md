# UAT tab — design system (delta against the existing app)

**Base:** the existing backoffice (`src/index.css` "Drafting Studio" tokens: crimson accent, oxblood nav column, porcelain canvas; Bricolage Grotesque display, Hanken Grotesk UI, JetBrains Mono). Brand tokens: **kept**. This file only states what the UAT tab adds or changes.
**Locked candidate:** V4 Ledger × Device (`docs/poc/compositions/uat-ledger-device.json`).
**Proof screen:** `mockups/proof-screen-uat.html` (interactive; the fidelity reference for Stage 5). Static renders: `mockups/variety-round/mix-{light,dark}{,-diff}.png`.
**Mode scope:** both (light + dark), equal priority.

## Palette — additions and changes

| Token | Light | Dark | Why |
|---|---|---|---|
| `--prelive` / `--prelive-bg` | `#2c55a8` / `#e2eafa` | `#8fb0f2` / `#1a2440` | New lifecycle state "Pre-live", added to the governance vocabulary (draft grey · pending review amber · pending approval teal · **pre-live blue** · live green · rejected red). Always paired with a label. |
| `--staged` (text use) | `#84560a` (was `#9a6510`) | unchanged | The existing value fails AA on `--staged-bg` (4.23:1). The new value is 5.42:1. **This applies app-wide**, so fix it in `index.css`. |
| `--ink-3` | `#566762` (was `#6a7b76`) | `#9a8b88` | Muted text has to pass 4.5:1 on `--surface-2` wells. The new value is 5.01:1. |

**Accent rule (binding on this tab):** a solid crimson fill appears on **one control per view**, the primary decision button. Crimson does not mark content: not stripes, not borders on the "What changed" card. Red/coral (`--err`) means "this failed" and nothing else. The flagged turn and the Fail button share it on purpose, as cause and action.

## Type, shape, density (differs from the base)

- **Shape:** flat. Radius 6px on cards, 5px on controls (the base uses 18/9). No lift shadows on the UAT tab. 1px `--border` rules carry the hierarchy.
- **Density:** compact. Card padding 16px, gaps 14px, body 14px.
- **Type:** same families as the base. "After release" text sits **one step larger** (15.5px, weight 500) than "Customers today" (13.5px, `--ink-2`). Mono is used only for IDs and match scores, never for plain counts.
- **Chat bubbles:** the customer's questions use a `--surface-3` tint with `--ink` text (not solid ink), so the chat never outweighs the signature card. Bot answers use `--surface-2`.

## Signature element — "What changed for customers"

The signature is fused to the core mechanic: the tester is verifying a *change*.

- **Structure:** two columns, **Customers today | After release**, each shown as a reply bubble. "After release" is bordered and one type step larger; "Customers today" is muted.
- **Show changes toggle (off by default):** off shows two plain answers, which keeps the load low. On shows removed text in `--ink-3` with a strike-through on the left, and added text with a `--live-bg` highlight and a `--live` underline on the right. Colour appears only when the tester asks for it. *(Owner: "good to have a toggle to show diff (where the colors come in)".)*
- **New intent (no live equivalent):** the left column reads "No answer today", or shows the current fallback reply in muted text. The right column is unchanged.
- **Toggle tracks:** 1px `--ink-3` border (5.3–6.0:1 non-text contrast). The on state is `--live` for Show changes and `--prelive` for Show match details.

## Customer view (the pre-live bot)

- A light device frame: 6px `--surface-3` border, 28px radius, max-width 500px, labelled "CUSTOMER VIEW" above it. **Not** a heavy black bezel.
- A flagged answer gets an `--err-bg` fill, a 1.5px `--err` outline, and a "Flagged" chip.
- **Show match details** (idea 1, off by default) reveals a mono line under each answer: the match score and the runner-up intent.
- **v2 slot:** a 44px dashed rail on the right, labelled "Current bot · coming in v2". It stays in the layout and expands into the live bot later.

## Decision bar

- Sticky at the bottom. On the left, the tally: "N questions · X of 6 phrasings · Y flagged".
- **Pass · add to release vN** and **Fail → back to Pending review**. Whichever is primary takes the single crimson fill: Pass when nothing is flagged, Fail once any answer is flagged.
- Fail expands inline into a reason field, pre-filled from the flagged turn, with Cancel and Send back. It doesn't open a modal.

## Owner's binding rules (their words)

- "too much information at a go" → progressive disclosure: diff colours, match details and asked phrasings are collapsed by default.
- "good to have a toggle to show diff (where the colors come in)".
- "I quite like the Device screen" → the bot keeps a device frame, kept light.
- Keep the existing brand (crimson/oxblood/porcelain).

## Motion

Inherits the base: `--ease-out`, about 150–200ms for state changes, and the bot's "typing…" placeholder. Every animation has a `prefers-reduced-motion` fallback. Nothing decorative.
