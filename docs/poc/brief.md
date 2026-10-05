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
