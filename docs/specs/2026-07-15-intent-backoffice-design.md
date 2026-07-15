# Intent Generation Backoffice — UX Design Spec (2026-07-15)

High-fidelity clickable prototype. Hardcoded fixture data + in-memory state (no API layer). Stack: Vite + React 19 + TS + Tailwind v4 + motion + lucide-react + react-router. Visual system: see `DESIGN.md`; strategy: see `PRODUCT.md`.

**Approved style (client round 2026-07-15): blend of "Instrument" + "Studio".** Instrument's density: toolbar-driven ruled tables, inline live run card, maximum information per screen. Studio's structure: editorial page headers (23px title + one-line purpose), and on Intent Studio a permanent right-hand generation rail so "create" is always visible. **Project and topic are both dropdowns** — project switcher in the top bar, topic dropdown in the page header (Intent Studio) or as a dropdown filter (all other pages). No topic chips, no topic tabs.

## Context model (approved)

- **Project is global.** Persistent switcher in the top bar; switching resets the workspace. Users with one project see it auto-selected.
- **Topic is local.** Required context on Intent Studio (topic selector at top of page, persisted per project). Filter elsewhere (Dashboard, Review, Approvals, Library default to "all accessible topics" with topic filter + search).
- **Roles** (switchable in the prototype via a role switcher in the user menu, for demo): `owner` (full control), `contributor` (view settings read-only; generate/stage only on sources they can access), `checker` (approvals; cannot approve own submissions). RBAC mirrors SharePoint access — fixtures include an inaccessible source/topic for the contributor to demonstrate this.

## Navigation

Side nav: Dashboard `/` · Project Settings `/settings` · Intent Studio `/studio` (+ `/studio/runs/:runId`) · Review `/review` · Approvals `/approvals` · Intent Library `/library`. Login at `/login` gates everything.

## Intent lifecycle (single state vocabulary everywhere)

`draft` (generated/authored) → `staged` (maker picked it) → `pending_approval` (submitted, in a request) → `live` (approved) | `rejected` (back to staged w/ note) | `withdrawn` (back to staged). Live intents can be `deleted` (soft, restorable from Library › Deleted).

## Pages

### Login
Kept concept: luminous orb backdrop (per-theme), glass card, staggered entrance. New identity per DESIGN.md. Mock sign-in: any credentials; "Sign in" lands on Dashboard as owner Lisa Tan.

### Dashboard
Project pulse, dense but calm: pipeline summary (draft/staged/pending/live counts as a flow strip, not hero-metric cards), recent runs (last 5, status + counts, link into run), pending approvals for my attention (checker sees actionable, maker sees own pending), topics freshness table (last source sync per topic, stale flagged), quick actions (Generate intents → Studio; Review staged). Empty states teach the journey for a fresh project.

### Project Settings (owner edit; others read-only)
- SharePoint root: URL input + **Test URL** button → simulated check (1.2s spinner → success with resolved site name, or error state for invalid URL). Root locked once topics exist (change requires confirm dialog).
- Topics: table (name, folder path, sources count, added by/at, actions rename/remove). **Add topics** opens modal that "enumerates" subfolders of the root (fixture list, ~1s skeleton on first open, cached after): checklist of discovered folders with their URLs → add selected as topics. Secondary path: **Create manually** (name + URL; URL must be a child of root — inline validation).
- Rename inline (topic identified by `topic_id`; name is free text).

### Intent Studio (the core; topic-scoped)
Header: topic selector (combobox, persisted per project) + last-synced meta + `2 not indexed` style badges.
1. **Sources panel:** table of SharePoint docs + URLs (from the topic's Excel manifest). Columns: checkbox, name, type (SharePoint/URL), modified, index status pill (`indexed` / `not indexed` / `stale`). Toolbar: search, filter by type/status, select/deselect all, **Refresh list** (re-enumerate: 1s simulated, per-source shimmer), **Sync to index** (ingests selected/not-indexed → status transitions not_indexed→indexing→indexed with progress). Contributor sees inaccessible rows disabled with lock + tooltip. First-ever load: full-table skeleton (~1.5s) explaining enumeration; cached afterward.
2. **Generate panel:** SegmentedControl — `GenAI · Single` | `GenAI · Batch` | `Manual`.
   - Single: fields `intent (specific question)`, `content requirements` (textarea), source data = current selection; run settings `max_intents` (stepper), `tonality guide` (select: Professional / Warm / Concise / Regulatory-safe). CTA **Generate intents**.
   - Batch: pick `.xlsx` from a dropdown of the topic's spreadsheet sources; content/intent fields hidden (read from file); run settings still available. CTA **Run batch**.
   - Manual: no run — opens intent composer (question, response, utterances, pick source docs) → saves straight to `draft` in Review-able set (appears in staging candidates).
3. **Live run card (signature moment):** on launch, panel morphs into run card: status pill (`Running` pulsing), progress track, mono counters (rows done / intents drafted), elapsed timer. Simulated: ticks every ~400ms; batch of N rows completes in ~8–15s; a few rows randomly skip/fail for realism. Completion: check draws in, summary settles (succeeded/skipped/failed, duration). Failed/dead state renders too. CTA → **View intents**.
4. **Run history:** table below (or tab): run id (mono), type, topic, status, counts, duration, started by/at. Batch rows expand (chevron) into child rows (one per xlsx row: intent question, status, count, duration). Click run → `/studio/runs/:runId`.
5. **Run detail** (`/studio/runs/:runId`): metadata header (params snapshot: max_intents, tonality, sources used; batch: file name; counts, duration). Body: generated intents as editable cards/rows (question, response preview expandable, utterances chips, source refs). Batch: "All intents" view + per-child-run filter. Select/deselect all → **Stage selected** / **Stage all** (slide-up staging bar with count). Staged items get `staged` pill and move to Review.

### Review (maker's staging area)
Staged intents across topics; topic filter chips + search (deep-link `?topic=` preselects when arriving from Studio). Row: intent question, topic, origin (run id / manual), staged by/at, state pill. Actions: inline edit (drawer with question/response/utterances), remove from staging (back to draft), select all → **Submit for approval** (per topic — submission groups by topic automatically; confirm dialog shows the grouping; creates approval request(s), items → `pending_approval`). Section below: **My submissions** — pending requests with **Withdraw** (returns items to staged).

### Approvals (checker inbox)
Requests for topics I can access: request id (mono), topic, # intents, submitted by/at, status. Filter by topic/status + search. Detail drawer: intent list with expand-to-read, request note. If checker AND not my own request: **Approve** / **Reject (with note)**. Own requests: **Withdraw** only. Everyone else: read-only. Approve → intents `live` (toast: "12 intents published to Cards & Payments / Travel Insurance"); reject → back to staged with note shown in Review. History tab: decided requests.

### Intent Library
Tabs: **Current** / **Deleted**. Dense table, hundreds of rows (fixtures ~140): question, topic, utterance count, sources, updated, state pill (`live`). Topic filter, full-text search (question + response), pagination (25/page). Row click → drawer: full response, utterances, sources, history (created by run…, approved by…). Owner: soft **Delete** (→ Deleted tab, restorable), edit → re-enters lifecycle as staged copy (badge "revision"). Deleted tab: restore.

## Simulated behaviors (all in-memory, deterministic-ish)

Store: React context + reducer; fixtures cloned at login. Run engine: interval ticks mutate run progress. Test URL / enumeration / sync latencies: 0.8–1.5s timeouts with skeleton/shimmer states. Toasts confirm every mutation. All state resets on reload (prototype).

## Fixtures

2 projects: **Cards & Payments** (rich: 4 topics, ~30 sources, 6 historical runs incl. an expanded batch, staged intents, 3 approval requests in mixed states, ~140 live intents) and **Wealth Advisory** (sparse: 1 topic, few sources — shows near-empty states). Users: Lisa Tan (owner), Marcus Chen (contributor), Priya Nair (checker). Timestamps absolute SGT around 2026-07.

## Adopted structural references (client screenshots, 2026-07-15 — structure only, NOT the dark/red skin)

- **Project Settings › Add topics:** side-by-side panels. Left "Auto-enumerate SharePoint subfolders": explainer line, scan button DISABLED until the root URL test has succeeded (inline hint states why), dashed empty well before first scan, results as a checkable folder list. Right "Create topic manually": name + child-URL fields, create button. Topics table: display name with inline-rename pencil + provenance meta line (folder name · "SharePoint enumeration" | "Manual creation"), SharePoint subfolder link (mono, truncated), delete action. **topic_id is hidden everywhere** (internal only).
- **Sources panel:** section header "Sources (N)" + "Refresh SharePoint cache" button; filter row = search + format (Files & URLs) + ingestion-state selects; a SELECTION BAR beneath ("Selected N of M" + header checkbox) carrying the bulk actions.
- **Sync console (two axes, structure from client):** step 1 choose source category — All sources / SharePoint files / URLs (from Excel manifest); step 2 choose sync level — "Shallow file listing" (re-enumerate names/paths into cache; fast) vs "Vector DB ingestion" (embed for GenAI matching); then one execute action. This expresses the two sync types from the journey; keep it compact (a popover/panel off the sources toolbar is fine), not a giant console.
- **Intent Studio layout (revised):** MAIN column = sources panel, then the Generation Engine card (segmented Single / Batch / Manual in the card header; Single fields: Target intent/question, Content requirements (optional) textarea, Tonality select + Max intents side by side, primary CTA. Batch: xlsx select + info callout "Spreadsheet control block: seed intent & content requirements are read from the Excel file; single-run fields are bypassed" + Run batch CTA). RIGHT RAIL = "Run output & history": live run card at top when running, then history split into "Batch runs (n)" and "Single runs (n)" groups of compact run cards (mono run id, timestamp, duration + key params meta, chevron → run detail).
- **Intent list/detail structure (RunDetail, Review, Library drawer):** intent cards with: checkbox + topic tag + state pill + edit/delete icon actions in the card header; labeled sections "Intent question (user query)" and "Expected response" with the response in readable prose; "Source references" as chips; created-by meta. Selection bar above the list: "Selected N of M filtered" + "Stage selected" / "Stage all filtered".

## Sleek revamp (client round 2026-07-16 — the new visual language)

Whole-app restyle toward sleek/modern/clean/roomy, keeping all functionality. Foundation already updated (tokens + primitives); pages must adopt these rules:

- **Type scale dialed back** from the earlier 1.5x blowup to a refined modern scale (base 15px, section heads 18px, page titles 26px). Readability now comes from whitespace + weight, not raw size. Don't hardcode font sizes; use the text-* utilities.
- **Softer radii** (control 6 / field 8 / card 14) and **softer diffuse shadows**; hard 1px boxes give way to airier grouping.
- **Section-header accent underline STAYS** (client is attached to it) via `SectionHeader` default. BUT when a SectionHeader sits **inside a card/bordered container**, pass `plain` to drop the underline (a red underline boxed inside a card reads cramped — client flagged the SharePoint-root card specifically). Rule: standalone page section → underline; header inside a card → `plain`.
- **Collapse less-critical content by default, make it expandable.** New `Collapsible` primitive (chevron header, `defaultOpen` controls initial state). Fold away things that are rarely touched or secondary: e.g. Project Settings' **SharePoint root** (locked once topics exist — collapse by default), long run-history lists, advanced/optional settings blocks, version history. Keep the primary task path expanded.
- **Roomier spacing:** card padding ~p-6, section spacing ~40px (mt-10 / space-y-10), generous table rows (handled by the Td primitive now). Don't cram.
- Tables, buttons, inputs, pills, tabs, empty states, KeyValue all restyled in the primitives — pages should just use them; avoid bespoke re-styling that fights the system.
