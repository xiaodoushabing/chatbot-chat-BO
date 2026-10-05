# Backoffice UAT tab — confirmed brief

**Key ask:** A business user can verify a pre-live intent and make a confident approve/reject call in under 2 minutes, unaided.
**Demo audience:** The same client stakeholders who approved the earlier backoffice rounds — convinced if they can approve one and reject one intent unaided.
**End-user:** UAT testers — anyone except the person who submitted the intent for approval (segregation of duties).

**Outcome:** Pre-live intents get tested in a chatbot mockup before going live.
**Primary user and moment:** A tester working through checker-approved intents waiting in UAT.
**Proof moment:** Tester aims at a pre-live intent → asks 3–4 phrasings, ticking off utterance coverage → sees the pre-live answer next to today's live answer → Approve → intent shows Live in the Library.
**Headline numbers:** "< 2 min per intent"
**Riskiest assumption:** Live vs pre-live side by side, plus an utterance checklist, gives a non-technical tester enough confidence to decide without seeing classifier internals.

**Flow change:** staged → pending_approval → (checker approves) → **pre_live** → UAT approve → live · UAT reject → back to **staged** (Review) with the failing Q&A attached.
**In scope:** New "UAT" nav item under GOVERN; new `pre_live` state across the state vocabulary; idea 2 (live vs pre-live comparison) + idea 3 (aim mode + utterance coverage); mocked engine behind config-defined endpoints (`uat.chatEndpoint`, `channel: "uat"` contract documented).
**Good to have:** 4 (transcript attached as approval evidence), 5 (reject → maker feedback note), 1 (match trace behind a toggle, off by default).
**Not in scope:** Real endpoint wiring, regression replay suite, batch/release-level approval.
**Timebox:** 2–3 days
**Tier:** T2 (working demo to keep)
**Baseline:** docs/poc/baseline/ — boot ok — branch feat/uat-tab

**Visual direction:** Existing app — brand tokens: keep (crimson sidebar, warm canvas).
**Signature element:** The live vs pre-live comparison — decided now.
**Mode scope:** both

**Real:** State transitions in the in-memory store; SoD rule (submitter ≠ UAT approver).
**Mocked:** AI engine responses (fixture-matched via the configured endpoint adapter).
**Reuse:** Shell, tables, state pills, toasts, role switcher, fixtures.
**Constraints:** Vite + React 19 + Tailwind v4; WCAG 2.1 AA; reduced-motion fallbacks.

**Success signal:** Demo audience completes one approve and one reject unaided.
**Stop condition:** If the audience can't decide in under 2 min after two attempts → rethink the interaction model.

## Addendum 1 — 2026-10-05 (owner, concept round)

1. **Lifecycle (replaces "Flow change"):** draft → *submit for review* → **pending review** → *submit for approval for pre-live* → (checker) → **UAT / pre-live** → *submit for approval for live* → (checker) → **live**.
2. **UAT decision is Pass / Fail per intent.** Fail = removed from pre-live, back to **pending review** with the failing question and answer attached.
3. **Interaction model:** C3-based, two chatbots — *current* (live) and *pre-live*. **Build pre-live first**; the *current* bot is deferred, but the layout reserves its slot.
4. **Entry:** list of intents that changed in pre-live → click one → test it in the pre-live bot → Pass / Fail.
5. **Signature element (v1):** while the current bot is deferred, the comparison comes from the intent's "what changed" data (new or updated, and the previous live answer). The full two-bot comparison arrives with the current bot.
6. **Open:** what happens between Pass and Live (whether a live staging step is needed) — see the recommendation in the session.

## Addendum 2 — 2026-10-05 (owner, concept lock)

1. **Concept locked: C4 Pre-live chatbot**, with the reviewer's three fixes: the queue is the hero with one "Test next" action; Fail becomes the primary button once a turn is flagged, with its reason pre-filled; the v2 current-bot slot is a narrow labelled rail.
2. **Releases (replaces "Not in scope: batch/release-level approval"):** passed intents are grouped into a **release**. Every release is a new versioned **snapshot** of the backoffice intent set (live N + the passed changes). The release is submitted for live approval as one unit; on approval it becomes the live snapshot the orchestrator serves. Rollback = point back to the previous snapshot.
3. **State mapping:** draft → **pending review** (renamed from "Staged", Review page) → **pending pre-live approval** (was "Pending approval") → **pre-live** (UAT tab) → passed → in **release vN** → **pending live approval** (Approvals) → **live (vN)**. UAT Fail, and a checker reject at either gate → pending review. Segregation of duties ("you can't approve your own submission") applies at every gate.
4. **Guardrails:** editing an intent after it passes cancels the pass. At live approval, the passed intents' saved test questions are re-run against the release snapshot and any change in match is flagged. The re-run is mocked in this POC.

## Addendum 3 — 2026-10-05 (owner, checklist)

1. While testing, an always-visible **checklist panel** lists every changed intent in the release candidate, including passed and failed, with its status. The main nav collapses to icons on the UAT tab to make room (option A).
2. Testers can work in **any order**. "Next untested" jumps to the next untested intent.
3. There is **one checklist per release candidate, across topics**, with a topic filter.
