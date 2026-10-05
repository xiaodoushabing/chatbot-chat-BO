# UAT tab — minimal product spec (delta for the real backoffice)

**Date:** 2026-10-05 · **Branch:** `feat/uat-tab` · **Status:** draft for owner review
**For:** developers of the real backoffice, AI engine and orchestrator.
**Key ask:** a business user can verify a UAT intent and make a confident pass/fail call in under 2 minutes, unaided.
**References in this repo:**
- Look and behaviour: `mockups/proof-screen-uat.html`
- Visual spec: `docs/poc/design-system.md`
- Decisions: `docs/poc/brief.md`, including addenda 1–3

This spec only lists what changes. Anything not mentioned stays as it works today.

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
UatTest   { id, intent_id, tester, started_at, decided_at, result: pass|fail, reason?,
            turns: [{ question, answer, matched_intent_id?, score?, flagged: bool, error?: timeout|error }] }
```

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

### 5.1 UAT tab (new; under GOVERN, between Approvals and Intent Library)

- **Entry:** opens the test view with the first untested intent selected. There is no separate landing page.
- **Layout:** the main nav collapses to icons on this tab only. Left to right: checklist panel, intent column, UAT bot ("Customer view"), and the "Current bot · coming in v2" rail.
- **Checklist panel**, for the whole release candidate across topics, with a topic filter:
  - **Rows:** every intent at statuses 4–6, plus intents failed during the current release cycle.
  - **Tag:** New (not in the live artefact) or Updated (same ID in the live artefact with a different answer).
  - **Status:** to test · testing now · passed · in release vN · failed · sent back.
  - Click a row to open it. "Next untested →" jumps to the next untested intent. Testing can happen in any order.
  - **Owner only:** "Create release vN+1" in the footer. It opens the list of **UAT passed** intents with checkboxes; the owner submits the selected ones (status → 6).
- **"What changed for customers":**
  - **Customers today** is the intent's answer from the live artefact. For a New intent it reads "No answer today".
  - **After release** is the UAT answer.
  - **Show changes** (off by default) marks removed and added words. The diff is computed at word level in the client.
- **Ask it like a customer:** the intent's utterances, each with "Ask →". A question counts toward the "X of N phrasings" progress when `matched_intent_id` equals this intent. Phrasings already asked collapse to "✓ N asked". Free-typed questions count as questions but don't tick a phrasing.
- **UAT bot:**
  - Each answer shows "✓ Answered by this intent", or "✕ Answered by '<other intent name>'", or "No intent matched".
  - Any answer can be **Flagged**. A "no match" answer, or an answer by a different intent, is flagged automatically.
  - **Show match details** (off by default) shows the score and runner-up.
- **Decision bar:**
  - **Pass** is enabled once at least one answer has come from this intent.
  - The primary (filled) button is Pass when nothing is flagged and Fail when anything is flagged.
  - **Fail** opens an inline reason box, pre-filled from the first flagged turn. Send back saves the `UatTest` and applies R1.
- **Empty state:** "Nothing in UAT. Intents appear here once approved to UAT."

### 5.2 Approvals

- Two request types: **To UAT** (today's flow, unchanged) and **Release to live** (new).
- **Release detail:** the version, the submitter, and each intent with Customers today | After release. Each intent also shows its test evidence: tester, date, number of questions, and a link to the transcript.
- Approve / Reject (with a note) applies §3 and R2. R4 is enforced: the submitter sees their own release with no decision buttons.

### 5.3 Review

- Rename "Staged" to "Pending review".
- Intents returned by R1 show a "Failed in UAT" or "Rejected" tag, the reason, and a link to the transcript.

### 5.4 Intent Library

- The header reads "Live vN · since <date>".
- A new **Releases** tab lists the history (version, status, intent count, who and when). Owners can start **Roll back to vN** on any superseded version (§3).

### 5.5 Dashboard

- The pipeline counts add three stages: UAT · UAT passed · Pending approval to live.

## 6. Error states

| Situation | Behaviour |
|---|---|
| The engine times out or errors | The turn shows "No response · Retry" and is stored with `error`. It doesn't count as a question or a phrasing. |
| The intent isn't in the current UAT artefact yet (`artefact_version` is older than the intent's UAT approval) | The bot header shows "UAT bot updating (vN+1 pending)", and the composer is disabled until a newer version answers. |
| No intent matched | The answer shows "No intent matched" and is flagged automatically. |
| The status changed mid-test (edit or another tester's decision) | R5: the decision is refused, with a message, and the checklist row refreshes. |
| Release approval fails to publish | The release stays `pending_approval`, the approver sees an error with Retry, and no intent changes status. |

## 7. Out of scope (this version)

- The v2 "current bot" comparison. The layout reserves its rail.
- Automatically re-running saved tests when a release is approved.
- Removing live intents through UAT.
- Notifications.
- Mobile layout.

## 8. Acceptance: the demo script

1. A tester opens **UAT**. The checklist shows every intent at statuses 4–6 with New/Updated tags.
2. They open an **Updated** intent, turn on **Show changes**, ask 2–3 phrasings (each ✓ answered by this intent), and press **Pass**. The row shows passed, and the status is **UAT passed**.
3. They open a second intent and ask a question that another intent answers. The answer is flagged automatically, **Fail** becomes primary with the reason pre-filled, and they press **Send back**. The intent appears in **Review** as Pending review, with the reason and the transcript.
4. The owner opens **Create release vN+1**, ticks the passed intent and submits. It appears in **Approvals → Release to live**, and the owner can't approve it.
5. A different user approves it. The **Library** shows **Live vN+1**, and the live chatbot serves the new answer.
6. Each test decision (steps 2–3) takes under 2 minutes, unaided.

## 9. Workflow parity (adopt mode)

No existing screen is replaced. The four modified screens keep every current capability. See `docs/poc/workflow-parity.md`.
