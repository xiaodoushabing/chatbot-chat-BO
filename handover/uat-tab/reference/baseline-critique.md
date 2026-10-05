# Baseline critique — before (run point 0, fresh eyes)

Inputs: docs/poc/baseline/{dashboard,review,approvals,library,studio}-{light,dark}.png only (opus-critic, no source).
Key ask: A business user can verify a pre-live intent and make a confident approve/reject call in under 2 minutes, unaided.

## Approvals
UX laws: Fitts fail -> no visible row action; Von Restorff pass; Hick pass; Zeigarnik/goal-gradient fail -> no "0 of 2 decided"; Miller pass; Generic look pass.
- [buried -> primary flow] explicit "Review & decide" per row + intent preview.
- [indirect -> primary flow] own requests look actionable though SoD blocks them — split "Awaiting you" / "Yours, awaiting a checker".
- [boring -> layout] show the request's intents inline.

## Review
UX laws: Fitts pass; Von Restorff fail -> accent run IDs, badge and Submit compete; Hick pass; Zeigarnik/goal-gradient fail -> lifecycle position only in prose; Miller pass; Generic look fail -> mono on plain-language counts.
Dark: disabled Submit reads close to enabled.
- cited passage inline under Expected response; label Edit/Unstage; drop accent from run ID and badge.

## Dashboard
UX laws: Fitts fail -> "View request" is a small trailing link; Von Restorff fail -> CTA glow, big green 138, crimson slab, red links/avatar/chip compete; Hick pass; Zeigarnik/goal-gradient pass; Miller pass; Generic look fail -> sparkles everywhere + CTA glow.
- attention above pipeline with real buttons; emphasise actionable stage; one filled crimson per view.

## Intent Library
UX laws: Fitts pass; Von Restorff fail -> green Live stripe on every row; Hick pass; Zeigarnik n/a; Miller pass; Generic look fail -> duplicate/placeholder fixture rows.

## Intent Studio
UX laws: Fitts pass; Von Restorff fail -> step ring, tab, amber pills, banner, CTA compete; Hick pass; Zeigarnik pass; Miller pass; Generic look fail -> sparkle on a warning.
Dark: skeleton nearly invisible; disabled CTA close to enabled.

## App-wide
- Accent rule fails: crimson does too many jobs (slab, CTA, nav, tabs, badges, links, avatar, chip).
- Status colours pass — keep (draft grey / staged amber / pending teal / live green / rejected red).
- Grid mostly holds (Studio breaks the 288px edge). Radius vocabulary holds. Mono overused on plain counts.

## Key-ask readiness
Not reachable today: no approve/reject control on any baseline screen; the only pending request is the signed-in user's own (SoD blocks the demo persona); no try-it surface. UAT fixtures must seed pre-live intents submitted by someone other than the demo user.
