import type {
  ApprovalRequest,
  DiscoveredFolder,
  Intent,
  Project,
  Run,
  Source,
  Topic,
  User,
} from './types';

const ROOT = 'https://ocbcgroup.sharepoint.com/sites/gdo-chatbot';

export const users: User[] = [
  { id: 'u-lisa', name: 'Lisa Tan', initials: 'LT', role: 'owner' },
  { id: 'u-marcus', name: 'Marcus Chen', initials: 'MC', role: 'contributor' },
  { id: 'u-priya', name: 'Priya Nair', initials: 'PN', role: 'checker' },
];

export const projects: Project[] = [
  {
    id: 'p-cards',
    name: 'Cards & Payments',
    sharepointUrl: `${ROOT}/cards-payments`,
    createdBy: 'BO Superadmin',
    createdAt: '2026-05-04T09:00:00+08:00',
  },
  {
    id: 'p-wealth',
    name: 'Wealth Advisory',
    sharepointUrl: `${ROOT}/wealth-advisory`,
    createdBy: 'BO Superadmin',
    createdAt: '2026-07-01T09:00:00+08:00',
  },
];

export const topics: Topic[] = [
  { id: 't-travel', projectId: 'p-cards', name: 'Travel Insurance', folderName: 'travel-insurance', sharepointUrl: `${ROOT}/cards-payments/travel-insurance`, addedBy: 'Lisa Tan', addedAt: '2026-05-06T10:12:00+08:00', lastSyncedAt: '2026-07-15T09:42:00+08:00' },
  { id: 't-credit', projectId: 'p-cards', name: 'Credit Cards', folderName: 'credit-cards', sharepointUrl: `${ROOT}/cards-payments/credit-cards`, addedBy: 'Lisa Tan', addedAt: '2026-05-06T10:14:00+08:00', lastSyncedAt: '2026-07-14T17:20:00+08:00' },
  { id: 't-fx', projectId: 'p-cards', name: 'FX & Remittance', folderName: 'fx-remittance', sharepointUrl: `${ROOT}/cards-payments/fx-remittance`, addedBy: 'Marcus Chen', addedAt: '2026-05-20T14:02:00+08:00', lastSyncedAt: '2026-07-10T11:05:00+08:00' },
  { id: 't-deposits', projectId: 'p-cards', name: 'Deposits & Savings', folderName: 'deposits', sharepointUrl: `${ROOT}/cards-payments/deposits`, addedBy: 'Lisa Tan', addedAt: '2026-06-02T09:30:00+08:00', lastSyncedAt: '2026-06-28T15:44:00+08:00' },
  { id: 't-retire', projectId: 'p-wealth', name: 'Retirement Planning', folderName: 'retirement', sharepointUrl: `${ROOT}/wealth-advisory/retirement`, addedBy: 'Lisa Tan', addedAt: '2026-07-08T09:05:00+08:00', lastSyncedAt: null },
];

export const discoveredFolders: DiscoveredFolder[] = [
  { projectId: 'p-cards', folderName: 'travel-insurance', sharepointUrl: `${ROOT}/cards-payments/travel-insurance`, fileCount: 14 },
  { projectId: 'p-cards', folderName: 'credit-cards', sharepointUrl: `${ROOT}/cards-payments/credit-cards`, fileCount: 22 },
  { projectId: 'p-cards', folderName: 'fx-remittance', sharepointUrl: `${ROOT}/cards-payments/fx-remittance`, fileCount: 9 },
  { projectId: 'p-cards', folderName: 'deposits', sharepointUrl: `${ROOT}/cards-payments/deposits`, fileCount: 11 },
  { projectId: 'p-cards', folderName: 'giro-billing', sharepointUrl: `${ROOT}/cards-payments/giro-billing`, fileCount: 6 },
  { projectId: 'p-cards', folderName: 'archive-2025', sharepointUrl: `${ROOT}/cards-payments/archive-2025`, fileCount: 48 },
  { projectId: 'p-wealth', folderName: 'retirement', sharepointUrl: `${ROOT}/wealth-advisory/retirement`, fileCount: 5 },
  { projectId: 'p-wealth', folderName: 'unit-trusts', sharepointUrl: `${ROOT}/wealth-advisory/unit-trusts`, fileCount: 12 },
];

function src(
  id: string,
  topicId: string,
  kind: 'sharepoint' | 'url',
  name: string,
  modifiedAt: string,
  indexStatus: Source['indexStatus'],
  opts: Partial<Source> = {},
): Source {
  const topic = topics.find(t => t.id === topicId)!;
  return {
    id,
    topicId,
    kind,
    name,
    path: kind === 'sharepoint' ? `${topic.sharepointUrl}/${name}` : name,
    modifiedAt,
    modifiedBy: opts.modifiedBy ?? 'Marcus Chen',
    sizeKb: kind === 'sharepoint' ? (opts.sizeKb ?? 240) : null,
    indexStatus,
    lastIndexedAt: indexStatus === 'indexed' ? (opts.lastIndexedAt ?? '2026-07-14T22:10:00+08:00') : null,
    accessible: opts.accessible ?? true,
    isSpreadsheet: name.endsWith('.xlsx'),
    ...opts,
  };
}

export const sources: Source[] = [
  // Travel Insurance — 14 sources
  src('s-tr-01', 't-travel', 'sharepoint', 'Travel_Claims_FAQ_2026.docx', '2026-07-12T16:03:00+08:00', 'indexed', { sizeKb: 412 }),
  src('s-tr-02', 't-travel', 'sharepoint', 'Premium_Rate_Card_Q3.xlsx', '2026-07-10T11:30:00+08:00', 'not_indexed', { sizeKb: 96 }),
  src('s-tr-03', 't-travel', 'sharepoint', 'Baggage_Delay_Payouts.pdf', '2026-07-02T09:15:00+08:00', 'indexed', { sizeKb: 1180 }),
  src('s-tr-04', 't-travel', 'sharepoint', 'Policy_Wording_TIQ_v4.pdf', '2026-06-28T14:40:00+08:00', 'indexed', { sizeKb: 2340, modifiedBy: 'Lisa Tan' }),
  src('s-tr-05', 't-travel', 'sharepoint', 'COVID_Coverage_Addendum.docx', '2026-06-20T10:00:00+08:00', 'stale', { sizeKb: 188 }),
  src('s-tr-06', 't-travel', 'sharepoint', 'Adventure_Sports_Exclusions.docx', '2026-06-18T15:22:00+08:00', 'indexed', { sizeKb: 240 }),
  src('s-tr-07', 't-travel', 'sharepoint', 'intent_requests_jul.xlsx', '2026-07-08T09:00:00+08:00', 'indexed', { sizeKb: 64, modifiedBy: 'Lisa Tan' }),
  src('s-tr-08', 't-travel', 'sharepoint', 'url_manifest_travel.xlsx', '2026-07-01T09:00:00+08:00', 'indexed', { sizeKb: 22, modifiedBy: 'Lisa Tan' }),
  src('s-tr-09', 't-travel', 'sharepoint', 'Claims_Escalation_SOP.docx', '2026-05-30T13:10:00+08:00', 'indexed', { sizeKb: 310, accessible: false }),
  src('s-tr-10', 't-travel', 'url', 'ocbc.com/travel-insurance/tiq-promo', '2026-07-08T00:00:00+08:00', 'indexed'),
  src('s-tr-11', 't-travel', 'url', 'ocbc.com/travel-insurance/claims-guide', '2026-07-05T00:00:00+08:00', 'indexed'),
  src('s-tr-12', 't-travel', 'url', 'ocbc.com/travel-insurance/annual-plans', '2026-06-30T00:00:00+08:00', 'not_indexed'),
  src('s-tr-13', 't-travel', 'url', 'ocbc.com/help/travel-delays', '2026-06-22T00:00:00+08:00', 'indexed'),
  src('s-tr-14', 't-travel', 'sharepoint', 'Winter_Sports_Rider_2026.pdf', '2026-07-14T18:45:00+08:00', 'not_indexed', { sizeKb: 520 }),
  // Credit Cards — 8 shown
  src('s-cc-01', 't-credit', 'sharepoint', 'Card_Fees_Charges_2026.xlsx', '2026-07-11T10:00:00+08:00', 'indexed', { sizeKb: 140 }),
  src('s-cc-02', 't-credit', 'sharepoint', 'Rewards_Programme_TnC.pdf', '2026-07-09T16:30:00+08:00', 'indexed', { sizeKb: 890 }),
  src('s-cc-03', 't-credit', 'sharepoint', 'Cashback_Categories_Q3.docx', '2026-07-07T11:20:00+08:00', 'indexed', { sizeKb: 205 }),
  src('s-cc-04', 't-credit', 'sharepoint', 'Card_Activation_Journeys.docx', '2026-07-01T09:45:00+08:00', 'stale', { sizeKb: 330 }),
  src('s-cc-05', 't-credit', 'sharepoint', 'url_manifest_cards.xlsx', '2026-06-25T09:00:00+08:00', 'indexed', { sizeKb: 18, modifiedBy: 'Lisa Tan' }),
  src('s-cc-06', 't-credit', 'url', 'ocbc.com/credit-cards/365-cashback', '2026-07-06T00:00:00+08:00', 'indexed'),
  src('s-cc-07', 't-credit', 'url', 'ocbc.com/credit-cards/miles-comparison', '2026-07-03T00:00:00+08:00', 'indexed'),
  src('s-cc-08', 't-credit', 'sharepoint', 'Dispute_Chargeback_SOP.docx', '2026-06-15T14:00:00+08:00', 'indexed', { sizeKb: 415, accessible: false }),
  // FX — 4
  src('s-fx-01', 't-fx', 'sharepoint', 'FX_Board_Rates_Explainer.docx', '2026-07-09T10:30:00+08:00', 'indexed', { sizeKb: 260 }),
  src('s-fx-02', 't-fx', 'sharepoint', 'Remittance_Corridors_2026.xlsx', '2026-07-04T15:00:00+08:00', 'indexed', { sizeKb: 110 }),
  src('s-fx-03', 't-fx', 'url', 'ocbc.com/fx/daily-rates', '2026-07-10T00:00:00+08:00', 'indexed'),
  src('s-fx-04', 't-fx', 'sharepoint', 'Overseas_Transfer_FAQ.docx', '2026-06-29T09:00:00+08:00', 'not_indexed', { sizeKb: 190 }),
  // Deposits — 3
  src('s-dp-01', 't-deposits', 'sharepoint', 'Fixed_Deposit_Rates_Jul.xlsx', '2026-06-27T10:00:00+08:00', 'indexed', { sizeKb: 88 }),
  src('s-dp-02', 't-deposits', 'sharepoint', 'Savings_Bonus_Interest_Guide.docx', '2026-06-26T11:30:00+08:00', 'indexed', { sizeKb: 350 }),
  src('s-dp-03', 't-deposits', 'url', 'ocbc.com/deposits/360-account', '2026-06-25T00:00:00+08:00', 'stale'),
  // Retirement (sparse project) — 2
  src('s-rt-01', 't-retire', 'sharepoint', 'CPF_LIFE_Explainer_2026.docx', '2026-07-07T09:30:00+08:00', 'not_indexed', { sizeKb: 480 }),
  src('s-rt-02', 't-retire', 'sharepoint', 'SRS_Contribution_FAQ.docx', '2026-07-06T14:00:00+08:00', 'not_indexed', { sizeKb: 275 }),
];

/* ── Intents: generated corpus. ~140 live + working set in draft/staged/pending. ── */

const seedsByTopic: Record<string, Array<[string, string]>> = {
  't-travel': [
    ['How do I claim for a delayed flight?', 'You can file a travel delay claim once your flight is delayed 6 hours or more. Submit via the OCBC Travel Claims portal with your boarding pass and the airline delay letter; payouts are tiered at S$100 per 6-hour block, capped at S$500.'],
    ['Does my policy cover baggage loss?', 'Yes. Checked-in baggage loss is covered up to S$3,000 per insured person, with a per-item cap of S$500. File within 30 days with the airline Property Irregularity Report.'],
    ['Am I covered for skiing accidents?', 'Recreational winter sports are covered under the Adventure Rider from 1 Jan 2026, excluding off-piste skiing without a guide and competitive events.'],
    ['Can I extend my policy while overseas?', 'Single-trip policies can be extended once, up to 30 additional days, if requested before the original end date via the portal or hotline.'],
    ['What is the COVID-19 coverage limit?', 'Overseas medical expenses due to COVID-19 are covered up to S$150,000 on Elite plans and S$75,000 on Classic plans, including quarantine allowance of S$50 per day.'],
  ],
  't-credit': [
    ['How do I activate my new credit card?', 'Activate instantly in the OCBC app: Cards → Activate, or via internet banking. Physical activation stickers are no longer required.'],
    ['What is the annual fee for the 365 card?', 'The OCBC 365 card has an annual fee of S$196.20 (incl. GST), waived for the first two years and subsequently with S$10,000 annual spend.'],
    ['How do cashback categories work?', 'The 365 card earns 6% on dining, 3% on groceries and transport, and 0.3% on everything else, with a S$80 monthly cashback cap requiring S$800 minimum spend.'],
    ['How do I dispute a transaction?', 'Lodge a dispute within 60 days of the statement date via the app: Cards → Transactions → Report an issue. Provisional credit is typically issued within 10 business days.'],
  ],
  't-fx': [
    ['What are today’s FX board rates?', 'Live board rates for 40+ currency pairs are published on ocbc.com/fx/daily-rates and refreshed every 15 minutes during market hours.'],
    ['How long does an overseas transfer take?', 'Transfers to major corridors (MY, IN, PH, CN) arrive within minutes via instant rails; other markets settle in 1–2 business days.'],
    ['Are there fees for overseas transfers?', 'OCBC waives cable charges for online remittances; correspondent bank fees may apply for non-instant corridors and are shown before you confirm.'],
  ],
  't-deposits': [
    ['What is the 360 Account bonus interest?', 'The 360 Account pays bonus interest up to 4.65% p.a. on the first S$100,000 when you credit salary, save, and insure or invest with OCBC.'],
    ['What are the current fixed deposit rates?', 'July 2026 promotional FD rates start at 2.85% p.a. for 6-month SGD placements of S$30,000 and above; see the rates sheet for full tenors.'],
  ],
  't-retire': [
    ['How does CPF LIFE affect my retirement income?', 'CPF LIFE provides monthly payouts for life from age 65, based on your Retirement Account savings; the Standard Plan balances payout size and bequest.'],
  ],
};

function makeIntent(
  id: string,
  topicId: string,
  q: string,
  r: string,
  state: Intent['state'],
  origin: Intent['origin'],
  createdAt: string,
  extra: Partial<Intent> = {},
): Intent {
  return {
    id,
    topicId,
    question: q,
    response: r,
    utterances: [q, q.replace('How do I', 'How can I').replace('What is', 'Tell me about'), `${q.slice(0, -1)} for OCBC?`],
    sourceIds: sources.filter(s => s.topicId === topicId && s.accessible).slice(0, 2).map(s => s.id),
    state,
    origin,
    createdBy: 'Lisa Tan',
    createdAt,
    updatedAt: createdAt,
    ...extra,
  };
}

const liveIntents: Intent[] = [];
{
  // ~140 live intents across topics: expand seeds with numbered variants
  const perTopic: Record<string, number> = { 't-travel': 52, 't-credit': 48, 't-fx': 22, 't-deposits': 16, 't-retire': 2 };
  for (const [topicId, count] of Object.entries(perTopic)) {
    const seeds = seedsByTopic[topicId];
    for (let i = 0; i < count; i++) {
      const [q, r] = seeds[i % seeds.length];
      const variant = i < seeds.length ? q : `${q.slice(0, -1)} (${['weekend', 'joint account', 'supplementary card', 'overseas', 'expired card', 'minor', 'business account', 'promo period'][i % 8]})?`;
      liveIntents.push(
        makeIntent(
          `i-${topicId.slice(2)}-${String(i + 1).padStart(3, '0')}`,
          topicId,
          variant,
          r,
          'live',
          { kind: 'run', runId: 'r-hist-1' },
          `2026-0${5 + (i % 2)}-${String(4 + (i % 24)).padStart(2, '0')}T10:00:00+08:00`,
        ),
      );
    }
  }
}

const workingIntents: Intent[] = [
  makeIntent('i-w-01', 't-travel', 'Is trip cancellation due to haze covered?', 'Trip cancellation due to haze is covered when the PSI at your destination exceeds 300 within 7 days of departure, up to the plan’s cancellation limit.', 'draft', { kind: 'run', runId: 'r-single-1' }, '2026-07-15T09:50:00+08:00'),
  makeIntent('i-w-02', 't-travel', 'Can I claim for a missed connection?', 'Missed connections caused by a delayed inbound flight are covered up to S$400 for additional transport and accommodation, with receipts.', 'draft', { kind: 'run', runId: 'r-single-1' }, '2026-07-15T09:50:00+08:00'),
  makeIntent('i-w-03', 't-travel', 'Does the policy cover pre-existing conditions?', 'Pre-existing conditions are covered only on the Elite plan with the Enhanced PEC rider, subject to a 12-month stability period.', 'staged', { kind: 'run', runId: 'r-single-1' }, '2026-07-15T09:50:00+08:00'),
  makeIntent('i-w-04', 't-travel', 'How do I claim overseas hospitalisation expenses?', 'Submit itemised hospital bills and the discharge summary within 30 days of return; cashless admission is available at partner hospitals listed in the app.', 'staged', { kind: 'manual' }, '2026-07-14T16:20:00+08:00'),
  makeIntent('i-w-05', 't-credit', 'How do I request a credit limit increase?', 'Apply in the app under Cards → Manage → Credit limit review with your latest income documents; approvals take 3–5 business days.', 'pending_approval', { kind: 'run', runId: 'r-batch-1' }, '2026-07-13T11:00:00+08:00'),
  makeIntent('i-w-06', 't-credit', 'Can I convert purchases to instalments?', 'Purchases above S$100 can be converted to 3–24 month instalment plans in the app; a one-time processing fee from 3% applies depending on tenor.', 'pending_approval', { kind: 'run', runId: 'r-batch-1' }, '2026-07-13T11:00:00+08:00'),
  makeIntent('i-w-07', 't-fx', 'Can I lock in an FX rate in advance?', 'Yes, use FX Order Watch to set a target rate for 14 days; the conversion executes automatically when your target is hit.', 'rejected', { kind: 'run', runId: 'r-hist-2' }, '2026-07-09T10:00:00+08:00', { reviewNote: 'Response references 14 days; product team confirmed the watch window is now 30 days. Please amend and resubmit.' }),
  makeIntent('i-w-08', 't-travel', 'Are cruise holidays covered?', 'Cruise cover applies on Elite plans including cabin confinement benefit of S$100 per day, up to 10 days.', 'deleted', { kind: 'manual' }, '2026-06-10T09:00:00+08:00'),
];

export const intents: Intent[] = [...liveIntents, ...workingIntents];

export const runs: Run[] = [
  {
    id: 'r-single-1',
    topicId: 't-travel',
    type: 'single',
    status: 'completed',
    startedBy: 'Lisa Tan',
    startedAt: '2026-07-15T09:48:12+08:00',
    finishedAt: '2026-07-15T09:50:03+08:00',
    durationSec: 111,
    params: { maxIntents: 5, tonality: 'Professional', intentQuestion: 'Claims for flight disruption', contentRequirements: 'Cover delay tiers, missed connections and required documents. Cite payout caps explicitly.' },
    sourceIds: ['s-tr-01', 's-tr-03', 's-tr-11'],
    progress: { total: 3, done: 3, succeeded: 3, skipped: 0, failed: 0, intentsDrafted: 3 },
    children: [],
  },
  {
    id: 'r-batch-1',
    topicId: 't-credit',
    type: 'batch',
    status: 'completed',
    startedBy: 'Lisa Tan',
    startedAt: '2026-07-13T10:41:00+08:00',
    finishedAt: '2026-07-13T10:55:24+08:00',
    durationSec: 864,
    params: { maxIntents: 3, tonality: 'Professional', batchFile: 'intent_requests_jul.xlsx' },
    sourceIds: ['s-cc-01', 's-cc-02', 's-cc-03', 's-cc-06'],
    progress: { total: 18, done: 18, succeeded: 15, skipped: 2, failed: 1, intentsDrafted: 31 },
    children: [
      { id: 'r-batch-1-c01', row: 2, intentQuestion: 'Credit limit increase process', status: 'succeeded', intentIds: ['i-w-05'], durationSec: 44 },
      { id: 'r-batch-1-c02', row: 3, intentQuestion: 'Instalment conversion options', status: 'succeeded', intentIds: ['i-w-06'], durationSec: 51 },
      { id: 'r-batch-1-c03', row: 4, intentQuestion: 'Late fee waiver policy', status: 'skipped', intentIds: [], durationSec: 2, note: 'Duplicate of live intent i-credit-014' },
      { id: 'r-batch-1-c04', row: 5, intentQuestion: 'Lost card overseas replacement', status: 'succeeded', intentIds: [], durationSec: 47 },
      { id: 'r-batch-1-c05', row: 6, intentQuestion: 'Supplementary card eligibility', status: 'failed', intentIds: [], durationSec: 38, note: 'Source document lacked eligibility criteria; no grounded answer available.' },
      { id: 'r-batch-1-c06', row: 7, intentQuestion: 'Miles transfer partners', status: 'succeeded', intentIds: [], durationSec: 55 },
    ],
  },
  {
    id: 'r-hist-1',
    topicId: 't-travel',
    type: 'batch',
    status: 'completed',
    startedBy: 'Lisa Tan',
    startedAt: '2026-06-04T14:00:00+08:00',
    finishedAt: '2026-06-04T14:31:40+08:00',
    durationSec: 1900,
    params: { maxIntents: 3, tonality: 'Professional', batchFile: 'intent_requests_jun.xlsx' },
    sourceIds: ['s-tr-01', 's-tr-04'],
    progress: { total: 64, done: 64, succeeded: 60, skipped: 3, failed: 1, intentsDrafted: 140 },
    children: [
      { id: 'r-hist-1-c01', row: 2, intentQuestion: 'Initial corpus generation', status: 'succeeded', intentIds: [], durationSec: 40 },
    ],
  },
  {
    id: 'r-hist-2',
    topicId: 't-fx',
    type: 'single',
    status: 'completed',
    startedBy: 'Marcus Chen',
    startedAt: '2026-07-09T09:58:00+08:00',
    finishedAt: '2026-07-09T10:00:10+08:00',
    durationSec: 130,
    params: { maxIntents: 4, tonality: 'Concise', intentQuestion: 'FX rate alerts and orders', contentRequirements: 'Explain Order Watch mechanics.' },
    sourceIds: ['s-fx-01', 's-fx-03'],
    progress: { total: 2, done: 2, succeeded: 2, skipped: 0, failed: 0, intentsDrafted: 2 },
    children: [],
  },
  {
    id: 'r-hist-3',
    topicId: 't-deposits',
    type: 'single',
    status: 'failed',
    startedBy: 'Lisa Tan',
    startedAt: '2026-06-28T16:00:00+08:00',
    finishedAt: '2026-06-28T16:01:12+08:00',
    durationSec: 72,
    params: { maxIntents: 5, tonality: 'Professional', intentQuestion: 'FD early withdrawal penalties' },
    sourceIds: ['s-dp-03'],
    progress: { total: 1, done: 1, succeeded: 0, skipped: 0, failed: 1, intentsDrafted: 0 },
    children: [],
  },
];

export const approvals: ApprovalRequest[] = [
  {
    id: 'a-001',
    topicId: 't-credit',
    intentIds: ['i-w-05', 'i-w-06'],
    submittedBy: 'Lisa Tan',
    submittedAt: '2026-07-13T11:05:00+08:00',
    status: 'pending',
    decidedBy: null,
    decidedAt: null,
    note: 'Batch July run — instalments & credit limit set.',
  },
  {
    id: 'a-002',
    topicId: 't-travel',
    intentIds: ['i-travel-001', 'i-travel-002'],
    submittedBy: 'Marcus Chen',
    submittedAt: '2026-07-11T15:30:00+08:00',
    status: 'approved',
    decidedBy: 'Priya Nair',
    decidedAt: '2026-07-12T09:14:00+08:00',
  },
  {
    id: 'a-003',
    topicId: 't-fx',
    intentIds: ['i-w-07'],
    submittedBy: 'Marcus Chen',
    submittedAt: '2026-07-08T17:00:00+08:00',
    status: 'rejected',
    decidedBy: 'Priya Nair',
    decidedAt: '2026-07-09T10:02:00+08:00',
    note: 'Watch window outdated — see review note on the intent.',
  },
];

export const tonalities = ['Professional', 'Warm', 'Concise', 'Regulatory-safe'];
