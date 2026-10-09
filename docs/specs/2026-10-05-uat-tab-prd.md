# UAT tab — minimal product spec (delta for the real backoffice)

**Date:** 2026-10-05, revised 2026-10-09 (iteration 2: manual review first, the bot as a helper, and a consolidated test-evidence card) · **Branch:** `feat/uat-tab` · **Status:** draft for owner review
**For:** developers of the real backoffice, AI engine and orchestrator.
**Key ask:** a business user can verify a UAT intent and make a confident pass/fail call in under 2 minutes, unaided.
**References in this repo:**
- Look and behaviour: `mockups/proof-screen-uat.html`
- Visual spec: `docs/poc/design-system.md`
- Decisions: `docs/poc/brief.md`, including addenda 1–3

This spec only lists what changes. Anything not mentioned stays as it works today.

> **Iteration 2 precedence.** The mock and `design-system.md` still show iteration 1 in two places: the intent column (a response-only "What changed" with a Show changes toggle) and the bot's "Flag" control. **Where they differ from §5.1, this PRD wins.** Take the look (tokens, phone frame, checklist, type) from the mock, and the behaviour and structure of the intent review, bot verdicts and evidence card from §5.1.

---

## 1. What already exists (referenced, not specified)

- Intents have **Live** and **UAT** statuses.
- The orchestrator receives two artefacts:
  - **Live artefact:** serves customers.
  - **UAT artefact:** contains live intents plus intents in UAT, and serves testing.
- The orchestrator polls the backoffice for both artefacts.
- When a live intent is edited, its UAT revision **keeps the same intent ID**.

## 2. Intent statuses

| # | Status | Moved on by | Next | Served by |
|---|---|---|---|---|
| 1 | Draft | Maker: submit for review | 2 | — |
| 2 | **Pending review** (rename of "Staged") | Maker: submit for approval to UAT | 3 | — |
| 3 | Pending approval to UAT | Checker: approve / reject | 4 / 2 | — |
| 4 | UAT | Any tester: Pass / Fail | 5 / 2 | UAT artefact |
| 5 | **UAT passed** (new) | Owner: picks it into release vN+1 and submits | 6 | UAT artefact |
| 6 | **Pending approval to live** (new) | Checker: approve / reject the release | 7 / 5 | UAT artefact |
| 7 | Live | — | — | Live artefact vN+1 |

**Rules**
- **R1 · Fail goes back.** Fail at status 4, or a reject at status 3, moves the intent to **Pending review**. The reason and the test transcript go with it.
- **R2 · Rejected releases.** A rejected release moves its intents back to **UAT passed**. They don't need retesting.
- **R3 · Edits cancel testing.** Editing an intent at status 4, 5 or 6 moves it to **Pending review**. Any pass is discarded.
- **R4 · Separation of duties.** At each approval gate (3 and 6), the approver must not be the person who submitted. Testing (status 4) has no such restriction.
- **R5 · First decision wins.** If an intent's status changed after the tester opened it, Pass/Fail is refused with "This intent changed (now <status>)".

## 3. New data

```
Release   { version: int, intent_ids: [id], status: draft|pending_approval|live|superseded|rejected,
            submitted_by, submitted_at, approved_by, approved_at, rollback_of?: version }
UatTest   { id, intent_id, intent_revision, tester, started_at, decided_at,
            result: pass|fail, suggested: pass|fail, override_reason?, reason?,
            field_comments: [{ section, text, created_at }],
            turns: [{ question, answer, matched_intent_id?, score?, error?: timeout|error,
                      verdict?: correct|wrong, reason_code?: wrong_intent|no_match|outdated|incomplete|tone|other,
                      reason_text? }] }
```

- The **test evidence card** (§5.1.4) is generated from `UatTest`. It is not stored separately, so every screen that shows it shows the same thing.
- `section` is a section key from the intent template (§5.1.1). `reason_text` holds the reason chip's pre-filled sentence as the tester last edited it.

- **Release approval:**
  1. The backoffice publishes **live artefact vN+1**, which is live vN plus the release's intents.
  2. Those intents become **Live**.
  3. The previous release becomes `superseded`.
  4. The UAT artefact is rebuilt from the intents now at statuses 4–6.
- **Rollback** = a new release with `rollback_of: N`, whose content is snapshot N. It goes through the same approval (R4). Nothing else about rollback needs building.

## 4. Engine / orchestrator contract

| Item | Change |
|---|---|
| Config | `uat.chatEndpoint` (required). `live.chatEndpoint` (optional, reserved for v2). Both set in backoffice config, never hard-coded. |
| Request (UAT) | Same shape the MFE sends today, plus `session_id`, so follow-up and clarifying turns work within one test session. |
| Response (UAT only) | Adds `matched_intent_id` (null if nothing matched), `score` (0–1), `runner_up: {intent_id, score}` (optional), and `artefact_version`. |
| Response (live) | Unchanged. |
| Live artefact | Gains a `version` number. Publishing and polling stay as they are. |

## 5. Screens

### 5.0 Navigation (owner: pre-live and live are parallel processes)

```
Dashboard
BUILD           Project Settings · Intent Studio
PRE-LIVE · UAT  Review  (badge)  → page "Review for UAT"
                Test    (badge)  → page "Test in UAT"
LIVE            Review  (badge)  → page "Review for Live"
                Library          → page "Live library"
APPROVALS       Approvals (badge) → one page, categories: To UAT · To Live · History
```

- **Review is one page component used twice**, filtered by stage. "Review for UAT" is today's Review page: it lists *Pending review* intents, and its action is "Submit for approval to UAT". "Review for Live" lists *UAT passed* intents; its action is "Create release vN+1", and each card shows its test evidence.
- **Badges** count the items waiting at that step.
- **Phasing:** Phase 1 = the Test in UAT page, the statuses (§2), the engine contract (§4) and the error states (§6). Phase 2 = Review for Live, the To Live approval, and Library versions and rollback. Until Phase 2 ships, passed intents wait in UAT passed.

### 5.1 Test in UAT (new page; nav PRE-LIVE · UAT → Test)

**Model:** testing means **manual review first, with the bot as a helper**.
- The tester decides by reading what changed in the intent.
- The bot is there to run quick checks, such as whether the right intent answers and whether messy questions still land.
- Both kinds of feedback (comments on fields, and verdicts on bot answers) are combined into **one test evidence card**, which goes with the decision.

**Entry and layout:**
- The page opens on the first untested intent. There is no landing page.
- Three columns: checklist · intent review (the main work area, widest column) · UAT bot (phone frame).
- The main nav collapses to icons on this page only.
- The decision bar at the bottom holds the evidence card's summary (§5.1.4).

**Checklist panel:** covers the whole release candidate, across topics, with a topic filter.
- **Rows:** one line each (status disc + name). The header tally reads "2 ✓ 1 ✕ 4 left".
- **Which intents appear:** every intent at statuses 4–6, plus intents failed during the current release cycle.
- **Tag:** New (not in the live artefact) or Updated (same ID in the live artefact, but different content).
- **Statuses:** to test · testing now · passed · in release vN · failed · sent back.
- Testing can happen in any order. "Next untested →" jumps ahead.
- Footer link: "N passed · ready in Review for Live →".

#### 5.1.1 Intent review: a fixed skeleton that shows what changed

The tester must always see the **same template they already use**: the same sections, in the same order as the intent editor (Review drawer). What changes is **how much of each section is open**, never **which sections exist or where they sit**. If only the changed sections were shown, expanding would make unchanged sections appear between them, and that reads as new content inserted midway. The fixed skeleton prevents this.

**Sections:** the real intent template's sections, in its order. In the prototype that is Question · Response · Utterances (phrasings) · Sources · Topic. Any other editable field becomes a section too.

**Rules:**

| # | Rule |
|---|---|
| S1 | **Every section always renders**, in template order, with its header in the same place. |
| S2 | **A changed section is open.** It has a UAT-blue bar in the left margin, a `CHANGED` tag and the diff (S5). |
| S3 | **An unchanged section is folded to one muted line**, for example `Sources · unchanged · 2 sources ▸`. It never disappears. |
| S4 | **Unfolding happens in place.** `▸` on one section, or "Show unchanged" for all, opens the body under the header that was already there. No header moves, and no section is inserted. Folding reverses it. The choice persists while the tester moves between intents. |
| S5 | **Diffs keep their context.** Text fields (question, response) show the whole text with a word-level diff: removed words struck through and muted, added words highlighted. Short or rewritten fields show Today \| After release side by side. List fields (utterances, sources) show **every item**: unchanged items plain, added items marked `+`, removed items marked `−` with a strike-through. An added item is never shown on its own. |
| S6 | **A summary line sits on top**, for example "Changed: Response · Utterances (+2 −1)". Each entry is a jump link to its section. This is how the tester stays within 2 minutes: they see at a glance where to look. |
| S7 | **A New intent** (not in the live artefact) shows every section open and tagged `NEW`, with no Today side. Nothing is folded. |
| S8 | **Comment on a section.** Every section header has a "Comment" action in the same place, folded or open. A comment is a short note (for example "Source is the 2023 fee table, outdated"), saved as a `field_comment` that shows as a finding on the evidence card. A section with a comment shows a count chip on its header. |

**Example (Updated intent, collapsed):**

```
Changed: Response · Utterances (+2 −1)

  Question    unchanged                       ▸   [Comment]
▌ Response    CHANGED                             [Comment]
▌   Today: Annual fee ~~S$192.60~~, waived for the first ~~year~~…
▌   After release: Annual fee **S$196.20**, waived for the first **2 years and…**
▌ Utterances  CHANGED  +2 −1                      [Comment]
▌     whats the annual fee for 365
▌   + 365 card charges every year?
▌   + do i have to pay yearly fee on my 365 card
▌   − ~~annual fee waiver pls~~
  Sources     unchanged · 2 sources            ▸   [Comment]
  Topic       unchanged · Credit Cards         ▸   [Comment]
```

After "Show unchanged", the three folded lines open in place under their own headers. Response and Utterances don't move.

#### 5.1.2 UAT bot (the helper)

- **Quick prompts** sit above the composer, one per line:
  - every **untried utterance** of this intent (it disappears once asked);
  - **"✦ ask it badly"**, which puts a messy variant in the input to edit or send;
  - **"Ask a neighbour"**, which asks one utterance from the most similar *other* intent, to check that this intent doesn't take over its neighbour's questions.

  The tester can always type their own question.
- **Retrieval line on every answer:** "✓ Answered by this intent", or "✕ Answered by '<other intent>'", or "No intent matched". Match score and runner-up are behind the "⋯" menu.
- **Verdict on every answer:** `✓ Correct` or `✕ Wrong`.
  - `✕` opens reason chips: wrong intent · no match · outdated · incomplete · wrong tone · other.
  - Each chip **pre-fills an editable sentence**. Examples:
    - wrong intent: *"'annual fee' was answered by 'Card fees — which card?' instead of this intent."*
    - outdated: *"The answer quotes an outdated figure."*
    - incomplete: *"The answer leaves out ___."*
  - The tester can keep the sentence, edit it or replace it.
  - An answer from another intent, or one with no match, **arrives already marked** ✕ with the matching chip and sentence. The tester can change it.
  - Unmarked answers count as "not judged". They don't count as correct.
- **Phrasing coverage:** the bot header shows "X/N phrasings". An utterance counts as covered when the answer came from this intent.

#### 5.1.3 Decision

- The decision bar shows the evidence summary: "6 asked · 5 ✓ · 1 ✕ · 4/6 phrasings · 1 comment".
- **Suggested decision:** **Fail** if there is any ✕ verdict or any field comment, **Pass** otherwise. The suggested button is the filled (primary) one.
  - The tester **confirms** it with one click.
  - Or the tester **overrides** it. An override asks for a one-line reason (`override_reason`), for example "comment is a nit, not a blocker".
- **Pass** needs at least one answer from this intent marked ✓ Correct.
- **Fail** opens the reason box. The reason is **pre-built from the findings** (field comments first, then ✕ turns), one line each, and stays editable. **Send back** saves the `UatTest` and applies R1.

#### 5.1.4 The test evidence card (consolidation)

Generated from `UatTest`. It looks the same everywhere it appears.

```
TEST EVIDENCE · Mei Chen · 9 Oct, 14:02 · revision r7
Result: Fail (suggested Fail)        6 asked · 5 ✓ · 1 ✕ · 4/6 phrasings
Findings
  • Sources: "Source is the 2023 fee table, outdated"             (comment)
  • "annual fee" → answered by "Card fees — which card?"          (bot ✕ wrong intent)
Manual review: Response changed · Utterances +2 −1 · 2 sections unchanged
Transcript ▸
```

- It shows `Result: Pass (overridden from Fail): "<override_reason>"` when the tester overrode the suggestion.
- **Where it appears:**
  - Review for UAT, on intents sent back by R1, so the maker sees exactly what to fix;
  - Review for Live, on each UAT passed card;
  - Approvals → To Live, one card per intent in the release;
  - the checklist row's tooltip, after the decision.
- Several testers on one intent: each `UatTest` has its own card, and the latest decision is the one that counts. The other cards are listed under "Earlier tests".

**Empty state:** "Nothing in UAT. Intents appear here once approved to UAT."

### 5.2 Approvals (one page)

- Category tabs: **To UAT** (today's flow, unchanged), **To Live** (release requests, new) and **History**.
- **Release detail:** the version, the submitter, and for each intent its changed sections (the §5.1.1 summary line plus the diffs) and its **test evidence card** (§5.1.4).
- Approve / Reject (with a note) applies §3 and R2. R4 is enforced: the submitter sees their own release with no decision buttons.

### 5.3 Review for UAT / Review for Live (one component, two stages)

- **Review for UAT:** today's Review page. Rename "Staged" to "Pending review". Intents returned by R1 show a "Failed in UAT" or "Rejected" tag. A failed intent shows its **test evidence card**, with findings that link to the section they refer to.
- **Review for Live:** the same layout, listing **UAT passed** intents. Each card shows the changed-sections summary and its **test evidence card**. Checkboxes, then **Create release vN+1**, which submits to Approvals → To Live (status → 6). Owner only.

### 5.4 Intent Library

- The header reads "Live vN · since <date>".
- A **Releases** tab lists the history (version, status, intent count, who and when). Owners can start **Roll back to vN** on any superseded version (§3); it is submitted to Approvals → To Live.

### 5.5 Dashboard

- The pipeline counts add three stages: UAT · UAT passed · Pending approval to live.

## 6. Error states

| Situation | Behaviour |
|---|---|
| The engine times out or errors | The turn shows "No response · Retry" and is stored with `error`. It doesn't count as a question or a phrasing. |
| The intent isn't in the current UAT artefact yet (`artefact_version` is older than the intent's UAT approval) | The bot header shows "UAT bot updating (vN+1 pending)", and the composer is disabled until a newer version answers. |
| No intent matched | The answer shows "No intent matched" and arrives marked ✕ "no match", with its sentence pre-filled. |
| No live version of a section (New intent) | Every section is open and tagged NEW; there is no Today side and nothing folds (S7). |
| The status changed mid-test (edit or another tester's decision) | R5: the decision is refused, with a message, and the checklist row refreshes. |
| Release approval fails to publish | The release stays `pending_approval`, the approver sees an error with Retry, and no intent changes status. |

## 7. Out of scope (this version)

- The v2 "current bot" comparison. The layout reserves its rail.
- Automatically re-running saved tests when a release is approved.
- Removing live intents through UAT.
- Notifications.
- Mobile layout.

## 8. Acceptance: the demo script

1. A tester opens **PRE-LIVE · UAT → Test**. The checklist shows every intent at statuses 4–6 with New/Updated tags.
2. They open an **Updated** intent.
   - The summary line names the changed sections, and those are open in template order.
   - They press "Show unchanged": the folded sections open in place, and nothing moves.
   - They ask 2–3 quick prompts, marking each answer ✓.
   - The evidence card suggests **Pass**. They confirm, and the status becomes **UAT passed**.
3. They open a second intent.
   - They comment on **Sources** ("outdated").
   - They ask a question that another intent answers. The answer arrives marked ✕ "wrong intent", and they edit the pre-filled sentence.
   - The card suggests **Fail**, with both findings in the pre-built reason. They press **Send back**.
   - The intent appears in **Review for UAT** as Pending review, showing the same evidence card.
4. The owner opens **LIVE → Review** ("Review for Live"), ticks the passed intent and presses **Create release vN+1**. It appears in **Approvals → To Live** with each intent's evidence card, and the owner can't approve it.
5. A different user approves it. **LIVE → Library** shows **Live vN+1**, and the live chatbot serves the new answer.
6. Each test decision (steps 2–3) takes under 2 minutes, unaided.

## 9. Workflow parity (adopt mode)

No existing screen is replaced. The four modified screens keep every current capability. See `docs/poc/workflow-parity.md`.
