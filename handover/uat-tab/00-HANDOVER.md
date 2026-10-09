# Handover: UAT "Test in UAT" page (Phase 1)

**From:** design session on the prototype repo (`backoffice-ui-design`, branch `feat/uat-tab`), 2026-10-05.
**To:** the agent on the main workstation, which has the **real backoffice** codebase and backend access.

## The prompt (paste this to the workstation agent)

> You are implementing a new **"Test in UAT"** page in our real intent backoffice, plus the backend changes it needs. The design and product decisions are already made and approved by the owner. Your job is to fit them onto **this** codebase, not to redesign them.
>
> **Read, in this order, everything in `handover/uat-tab/`:**
> 1. `01-prd.md`: the product spec, written as a delta against the real backoffice. **Phase 1 only** (see §5.0 "Phasing"). Phase 2 (Review for Live, releases, the To Live approval, Library versions and rollback) is out of scope. Read it for context only.
> 2. `02-design-system.md`: the visual spec, written as a delta against the app's existing tokens. The **"Lean declutter" section at the end overrides earlier lines** where they conflict.
> 3. `03-proof-screen.html` (**iteration 1 behaviour.** For the intent review, bot verdicts and evidence card, `01-prd.md` §5.1 wins): open it in a browser and click around. It is the look and behaviour reference: checklist, What changed + Show changes toggle, UAT bot with "Try" phrasing pills (one per line), flagging, and Pass / Fail with the inline reason. **Port its tokens and behaviour into our stack. Do not copy its markup**; it is a standalone mock with fake data.
> 4. `reference/`: the owner's decisions and addenda (`decisions-brief.md`), the workflow-parity table, light and dark screenshots, and the baseline critique.
>
> **Before writing any code, verify these assumptions against our real code and backend, and report any that are false:**
> - Intents already have **Live** and **UAT** statuses, and the orchestrator receives **two artefacts**: a live one, and a UAT one (live + UAT intents).
> - Editing a live intent creates a UAT revision with the **same intent ID**.
> - The chat endpoint can be pointed at the UAT artefact via an endpoint set in config (`uat.chatEndpoint`).
> - The engine **does not yet** return the matched intent. Phase 1 adds `matched_intent_id`, `score`, `runner_up` (optional) and `artefact_version` to **UAT responses only**. Find out which service owns that change and whether `session_id` is already supported.
>
> **Then produce, for my approval, before building:**
> 1. A short **technical design**: data changes (the `UAT passed` status, the `Pending review` rename, the `UatTest` record, rules R1–R5 from PRD §2), the API endpoints, the engine contract change, how the UAT artefact rebuild is triggered and versioned, and where the UI page plugs into our nav/router.
> 2. A **phased implementation plan**: backend first (status and record, then the engine contract), then the UI page.
>
> **Build constraints:**
> - Use our existing component library, tokens, nav and patterns. The only new status colour is **UAT blue** (`--prelive`). One crimson-filled button per view.
> - WCAG 2.1 AA in light and dark mode, keyboard reachable, and a `prefers-reduced-motion` fallback.
> - Endpoints come from config, never hard-coded. No secrets in code.
> - Nav: add the **PRE-LIVE · UAT** section with **Review** (today's Review page, renamed in the UI) and **Test** (the new page). The LIVE section and the Approvals categories are Phase 2. Don't build them, but don't block them either.
> - Out of scope: the v2 "current bot" (reserve the space in code only), automatic re-run of saved tests, notifications, mobile.
>
> **Done means** the PRD §8 demo script, steps 1–3 and 6, runs against the real system:
> - A tester opens Test.
> - They pass an Updated intent with Show changes on.
> - They fail a second intent whose question gets answered by another intent; the answer is flagged automatically and the reason pre-filled. That intent then appears in Review as Pending review, with the reason and the transcript.
> - Each decision takes under 2 minutes, unaided.
>
> Show it working in both light and dark mode, compared side by side with `reference/screens/`.

## How to get this onto the workstation

**Option 1 (recommended): git.** This folder is committed on branch `feat/uat-tab` of `git@github.com:xiaodoushabing/chatbot-chat-BO.git`. Push it from this machine (`git push -u origin feat/uat-tab`), then on the workstation run `git fetch && git checkout feat/uat-tab -- handover/` to copy only this folder into the real backoffice's working tree. If the real backoffice is a different repo, copy the folder across.

**Option 2: zip.** `handover/uat-tab.zip` holds the same files. AirDrop or copy it and unzip it at the root of the real backoffice repo, so the paths read `handover/uat-tab/...`.

**Then tell the workstation agent:** *"Read `handover/uat-tab/00-HANDOVER.md` and follow the prompt in it."*

## Files

| File | What it is |
|---|---|
| `00-HANDOVER.md` | This file: the prompt and how to transfer the folder |
| `01-prd.md` | Product spec, a delta against the real backoffice. Phase 1 = Test in UAT |
| `02-design-system.md` | Visual spec: tokens, signature element, layout, lean declutter rules |
| `03-proof-screen.html` | Clickable reference (opens offline; fonts load from Google Fonts) |
| `reference/decisions-brief.md` | Key ask, audience, and every owner decision and addendum |
| `reference/workflow-parity.md` | Confirms no existing capability is lost |
| `reference/screens/*.png` | Light and dark renders of the target page |
| `reference/baseline-critique.md` | Fresh-eyes critique of today's screens (accent overuse, contrast fixes) |

## Open questions the workstation should resolve (not decided here)

1. Which service owns adding `matched_intent_id` / `score` / `artefact_version` to UAT responses (engine or orchestrator)?
2. What triggers the UAT artefact rebuild today (an event, a cron, or manual), and does it already carry a version?
3. Who is allowed to test (any authenticated user, or a role)? The owner's rule is only "submitter ≠ approver at approval gates"; testing has no submitter restriction.
