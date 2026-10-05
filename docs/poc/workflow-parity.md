# Workflow parity — UAT tab (adopt mode)

The PRD replaces **no** screen. It adds the UAT tab and modifies four screens. This table lists each modified screen's current capabilities, read from `src/state/store.tsx` and the page code, and their status under the PRD.

| Screen | Current capability | Status |
|---|---|---|
| Review | Search and topic filter over staged intents | COVERED (unchanged; label renamed to Pending review) |
| Review | Edit intent (drawer) | COVERED (unchanged; R3 adds the status reset when the intent is in UAT or later) |
| Review | Remove from staging (unstage) | COVERED (unchanged) |
| Review | Submit selected for approval, with a note | COVERED (now "submit for approval to UAT") |
| Approvals | Inbox / History tabs, topic and submitter filters | COVERED (adds the "Release to live" request type) |
| Approvals | Approve request | COVERED (To UAT approval now moves intents to UAT) |
| Approvals | Reject with a note (maker notified) | COVERED (R1: back to Pending review) |
| Approvals | Withdraw own pending request | COVERED (unchanged; also applies to own releases) |
| Intent Library | Current / Deleted tabs, search, topic filter | COVERED (adds the Releases tab and the live version header) |
| Intent Library | Delete / restore intent | COVERED (unchanged) |
| Dashboard | Pipeline counts, needs-attention, recent runs | COVERED (pipeline adds three stages) |

No GAP or DROP-CANDIDATE rows.
