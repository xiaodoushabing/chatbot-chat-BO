import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ClipboardCheck,
  Lock,
  Pencil,
  RotateCcw,
  Send,
  Undo2,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { useStore } from '../../state/store';
import type { ApprovalRequest, Intent } from '../../data/types';
import { fmtDateTime, plural } from '../../lib/format';
import {
  Button,
  Checkbox,
  Field,
  IconButton,
  Input,
  SearchField,
  Select,
  Textarea,
} from '../../components/ui/controls';
import {
  ApprovalStatusPill,
  EmptyState,
  IntentStatePill,
  Mono,
  PageHeader,
  SectionHeader,
} from '../../components/ui/display';
import { TableShell, Th, Tr, Td } from '../../components/ui/table';
import { Drawer, Modal } from '../../components/ui/overlay';

/* Review — the maker's staging area. Staged intents gather here (across the
   project's topics) until the maker submits them for checker approval. */

const EASE = [0.22, 0.61, 0.36, 1] as const;

function OriginCell({ intent }: { intent: Intent }) {
  if (intent.origin.kind === 'manual') {
    return <span className="text-xs font-medium text-ink-2">Manual</span>;
  }
  const runId = intent.origin.runId;
  return (
    <Link
      to={`/studio/runs/${runId}`}
      className="font-mono text-xs text-accent underline-offset-2 transition-colors hover:underline focus-visible:underline"
    >
      {runId}
    </Link>
  );
}

/* ── Intent card (same structure as RunDetail's intent cards) ──
   Header: checkbox + topic tag + state pill + edit / remove-from-staging icons.
   Body: labeled "Intent question (user query)" and "Expected response" sections,
   source-reference chips, created-by meta. */

function IntentCard({
  intent,
  topicName,
  sourceNames,
  readOnly,
  selected,
  reduceMotion,
  onToggleSelect,
  onEdit,
  onUnstage,
}: {
  intent: Intent;
  topicName: string;
  sourceNames: string[];
  readOnly: boolean;
  selected: boolean;
  reduceMotion: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onUnstage: () => void;
}) {
  return (
    <motion.article
      layout={!reduceMotion}
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={
        reduceMotion
          ? { opacity: 0 }
          : { opacity: 0, y: 46, scale: 0.94, transition: { duration: 0.3, ease: EASE } }
      }
      whileHover={reduceMotion ? undefined : { y: -3 }}
      transition={{ duration: reduceMotion ? 0.01 : 0.3, ease: EASE }}
      aria-label={intent.question}
      className={cn(
        'rounded-(--radius-card) border bg-bg px-5 py-4 shadow-(--shadow-soft)',
        'transition-[box-shadow,background-color,border-color] duration-200 ease-(--ease-out)',
        'hover:shadow-(--shadow-2)',
        selected ? 'border-accent/60 bg-accent-wash/40' : 'border-line',
      )}
    >
      {/* Card header */}
      <div className="flex items-center gap-2.5">
        {!readOnly && (
          <Checkbox
            aria-label={`Select “${intent.question}”`}
            checked={selected}
            onChange={onToggleSelect}
          />
        )}
        <span className="rounded-full border border-line bg-surface-2 px-2 py-0.5 text-2xs font-semibold text-ink-2">
          {topicName}
        </span>
        <IntentStatePill state={intent.state} />
        {!readOnly && (
          <div className="ml-auto flex items-center gap-0.5">
            <IconButton label="Edit intent" className="h-7 w-7" onClick={onEdit}>
              <Pencil size={13} />
            </IconButton>
            <IconButton label="Remove from staging" className="h-7 w-7" onClick={onUnstage}>
              <Undo2 size={13} />
            </IconButton>
          </div>
        )}
      </div>

      {/* Intent question */}
      <div className="mt-3">
        <p className="text-2xs font-semibold tracking-wide text-ink-3 uppercase">
          Intent question (user query)
        </p>
        <p className="mt-1 font-display text-md font-medium tracking-[-0.01em] text-ink text-balance">
          {intent.question}
        </p>
      </div>

      <div className="my-3 h-px bg-line" aria-hidden />

      {/* Expected response */}
      <div>
        <p className="text-2xs font-semibold tracking-wide text-ink-3 uppercase">Expected response</p>
        <p className="mt-1 max-w-prose text-sm leading-relaxed text-ink-2">{intent.response}</p>
      </div>

      {/* Source references */}
      <div className="mt-3">
        <p className="text-2xs font-semibold tracking-wide text-ink-3 uppercase">Source references</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {sourceNames.length > 0 ? (
            sourceNames.map(n => (
              <span
                key={n}
                className="rounded-full border border-line bg-surface-2 px-2 py-0.5 font-mono text-2xs text-ink-2"
              >
                {n}
              </span>
            ))
          ) : (
            <span className="text-xs text-ink-3">None recorded</span>
          )}
        </div>
      </div>

      {/* Created-by meta */}
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-line pt-2.5">
        <span className="text-xs text-ink-2">Staged by {intent.createdBy}</span>
        <span className="text-ink-3" aria-hidden>
          ·
        </span>
        <Mono>{fmtDateTime(intent.updatedAt)}</Mono>
        <span className="text-ink-3" aria-hidden>
          ·
        </span>
        <OriginCell intent={intent} />
        <span className="text-ink-3" aria-hidden>
          ·
        </span>
        <span className="font-mono text-xs text-ink-2">
          {plural(intent.utterances.length, 'utterance')}
        </span>
      </div>
    </motion.article>
  );
}

/* ── Inline edit drawer (question / response / utterances) ── */

function EditDrawer({
  intent,
  topicName,
  onClose,
}: {
  intent: Intent | null;
  topicName: string;
  onClose: () => void;
}) {
  const { updateIntent } = useStore();
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [utterances, setUtterances] = useState('');
  const [loadedId, setLoadedId] = useState<string | null>(null);

  // Sync drafts when a different intent is opened (derived during render, no effect).
  if (intent && intent.id !== loadedId) {
    setLoadedId(intent.id);
    setQuestion(intent.question);
    setResponse(intent.response);
    setUtterances(intent.utterances.join('\n'));
  }
  if (!intent && loadedId !== null) setLoadedId(null);

  const canSave = question.trim().length > 0 && response.trim().length > 0;

  function save() {
    if (!intent || !canSave) return;
    updateIntent(intent.id, {
      question: question.trim(),
      response: response.trim(),
      utterances: utterances
        .split('\n')
        .map(u => u.trim())
        .filter(Boolean),
    });
    onClose();
  }

  return (
    <Drawer
      open={intent !== null}
      onClose={onClose}
      title="Edit intent"
      meta={
        intent && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <IntentStatePill state={intent.state} />
            <span className="text-xs text-ink-2">{topicName}</span>
            <Mono>
              {intent.origin.kind === 'run' ? intent.origin.runId : 'manual'} ·{' '}
              {fmtDateTime(intent.updatedAt)}
            </Mono>
          </div>
        )
      }
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!canSave} onClick={save}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Question" htmlFor="edit-question">
          <Input
            id="edit-question"
            value={question}
            onChange={e => setQuestion(e.target.value)}
          />
        </Field>
        <Field label="Response" htmlFor="edit-response" hint="The grounded answer the chatbot returns.">
          <Textarea
            id="edit-response"
            className="min-h-36"
            value={response}
            onChange={e => setResponse(e.target.value)}
          />
        </Field>
        <Field
          label="Utterances"
          htmlFor="edit-utterances"
          hint="One utterance per line — alternative phrasings that should match this intent."
        >
          <Textarea
            id="edit-utterances"
            className="min-h-28 font-mono text-xs"
            value={utterances}
            onChange={e => setUtterances(e.target.value)}
          />
        </Field>
      </div>
    </Drawer>
  );
}

/* ── Page ── */

export default function Review() {
  const {
    user,
    projectId,
    topics,
    sources,
    intents,
    approvals,
    unstageIntents,
    stageIntents,
    submitForApproval,
    withdrawRequest,
  } = useStore();

  const reduceMotion = !!useReducedMotion();
  const isChecker = user.role === 'checker';
  const projectTopics = useMemo(
    () => topics.filter(t => t.projectId === projectId),
    [topics, projectId],
  );
  const topicIds = useMemo(() => new Set(projectTopics.map(t => t.id)), [projectTopics]);
  const topicName = (id: string) => projectTopics.find(t => t.id === id)?.name ?? '—';
  const sourceName = (id: string) => sources.find(s => s.id === id)?.name ?? id;

  /* Topic filter lives in the URL so Studio can deep-link with ?topic=. */
  const [searchParams, setSearchParams] = useSearchParams();
  const topicParam = searchParams.get('topic');
  const topicFilter = topicParam && topicIds.has(topicParam) ? topicParam : 'all';
  const setTopicFilter = (v: string) =>
    setSearchParams(v === 'all' ? {} : { topic: v }, { replace: true });

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [note, setNote] = useState('');

  const staged = useMemo(
    () =>
      intents
        .filter(i => i.state === 'staged' && topicIds.has(i.topicId))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [intents, topicIds],
  );

  const q = query.trim().toLowerCase();
  const visible = staged.filter(
    i =>
      (topicFilter === 'all' || i.topicId === topicFilter) &&
      (!q || i.question.toLowerCase().includes(q) || i.response.toLowerCase().includes(q)),
  );

  /* Selection pruned to ids that are still staged. */
  const stagedIds = useMemo(() => new Set(staged.map(i => i.id)), [staged]);
  const selectedIds = [...selected].filter(id => stagedIds.has(id));
  const allVisibleSelected = visible.length > 0 && visible.every(i => selected.has(i.id));
  const someVisibleSelected = visible.some(i => selected.has(i.id));

  function toggleAll() {
    setSelected(prev => {
      const next = new Set(prev);
      if (allVisibleSelected) visible.forEach(i => next.delete(i.id));
      else visible.forEach(i => next.add(i.id));
      return next;
    });
  }
  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  /* Submission preview: selected intents grouped per topic (one request each). */
  const groups = useMemo(() => {
    const byTopic = new Map<string, Intent[]>();
    for (const id of selectedIds) {
      const intent = staged.find(i => i.id === id);
      if (!intent) continue;
      byTopic.set(intent.topicId, [...(byTopic.get(intent.topicId) ?? []), intent]);
    }
    return [...byTopic.entries()];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, staged]);

  function confirmSubmit() {
    submitForApproval(selectedIds, note.trim() || undefined);
    setSelected(new Set());
    setNote('');
    setSubmitOpen(false);
  }

  /* My submissions — this user's approval requests within the project, pending first. */
  const mySubmissions = useMemo(() => {
    const rank = (a: ApprovalRequest) => (a.status === 'pending' ? 0 : 1);
    return approvals
      .filter(a => a.submittedBy === user.name && topicIds.has(a.topicId))
      .sort((a, b) => rank(a) - rank(b) || b.submittedAt.localeCompare(a.submittedAt));
  }, [approvals, user.name, topicIds]);

  const editingIntent = intents.find(i => i.id === editingId) ?? null;
  const nothingStagedAtAll = staged.length === 0;

  return (
    <div>
      <PageHeader
        title="Review"
        sub="Staged intents for this project, gathered across topics. Edit, prune, then submit for checker approval — submissions group per topic automatically."
      />

      {isChecker && (
        <div
          role="note"
          className="mb-5 flex items-start gap-2.5 rounded-(--radius-card) border border-line bg-surface-2 px-4 py-3"
        >
          <Lock size={15} className="mt-0.5 shrink-0 text-ink-3" aria-hidden />
          <p className="text-sm text-ink-2">
            You are viewing as a <span className="font-semibold text-ink">checker</span>. Staging is a
            maker activity — editing, removing and submitting are disabled under maker–checker
            segregation. Pending requests await you in Approvals.
          </p>
        </div>
      )}

      {/* ── Staged intents ── */}
      <section aria-label="Staged intents">
        <SectionHeader title="Staged intents" meta={plural(staged.length, 'intent')} />
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search question or response"
            className="w-72"
          />
          <div className="w-52">
            <Select
              aria-label="Filter by topic"
              value={topicFilter}
              onChange={e => setTopicFilter(e.target.value)}
            >
              <option value="all">All topics</option>
              {projectTopics.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {nothingStagedAtAll ? (
          <EmptyState
            icon={ClipboardCheck}
            title="Nothing staged yet"
            body="Generate or author intents in Intent Studio, then stage the ones worth publishing. They gather here until you submit them for checker approval."
            action={
              <Link
                to="/studio"
                className="inline-flex h-8 items-center rounded-(--radius-ctl) border border-line bg-bg px-3 text-sm font-semibold text-ink transition-colors duration-150 hover:bg-surface-2"
              >
                Open Intent Studio
              </Link>
            }
          />
        ) : visible.length === 0 ? (
          <EmptyState
            title="No staged intents match"
            body="No staged intents match the current topic filter and search. Clear them to see the full staging set."
            action={
              <Button
                size="sm"
                onClick={() => {
                  setQuery('');
                  setTopicFilter('all');
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            {/* Selection bar — carries the bulk actions for the filtered card list. */}
            {!isChecker && (
              <div
                role="region"
                aria-label="Selection actions"
                className="mb-3 flex flex-wrap items-center gap-3 rounded-(--radius-card) border border-line bg-surface-2 px-3.5 py-2"
              >
                <Checkbox
                  aria-label="Select all filtered staged intents"
                  checked={allVisibleSelected}
                  indeterminate={!allVisibleSelected && someVisibleSelected}
                  onChange={toggleAll}
                />
                <span className="font-mono text-xs tabular-nums text-ink-2">
                  Selected {selectedIds.length} of {visible.length} filtered
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <Button
                    size="sm"
                    disabled={selectedIds.length === 0}
                    onClick={() => {
                      unstageIntents(selectedIds);
                      setSelected(new Set());
                    }}
                  >
                    <Undo2 size={13} aria-hidden /> Remove from staging
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={selectedIds.length === 0}
                    onClick={() => setSubmitOpen(true)}
                  >
                    <Send size={13} aria-hidden /> Submit selected for approval
                  </Button>
                </div>
              </div>
            )}

            {/* Intent cards — leaving cards (submitted or unstaged) fly out toward the toast. */}
            <div className="flex flex-col gap-3">
              <AnimatePresence mode="popLayout" initial={false}>
                {visible.map(intent => (
                  <IntentCard
                    key={intent.id}
                    intent={intent}
                    topicName={topicName(intent.topicId)}
                    sourceNames={intent.sourceIds.map(sourceName)}
                    readOnly={isChecker}
                    selected={!isChecker && selected.has(intent.id)}
                    reduceMotion={reduceMotion}
                    onToggleSelect={() => toggleOne(intent.id)}
                    onEdit={() => setEditingId(intent.id)}
                    onUnstage={() => {
                      unstageIntents([intent.id]);
                      setSelected(prev => {
                        const next = new Set(prev);
                        next.delete(intent.id);
                        return next;
                      });
                    }}
                  />
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </section>

      {/* ── My submissions (pending → withdraw; approved/rejected viewable with note) ── */}
      {!isChecker && (
        <section aria-label="My submissions" className="mt-10">
          <SectionHeader title="My submissions" meta={plural(mySubmissions.length, 'request')} />
          {mySubmissions.length === 0 ? (
            <EmptyState
              title="No submissions yet"
              body="When you submit staged intents for approval, your requests appear here so you can track — or withdraw — them while they wait on a checker."
            />
          ) : (
            <TableShell>
              <thead>
                <tr>
                  <Th>Request</Th>
                  <Th>Topic</Th>
                  <Th className="text-right">Intents</Th>
                  <Th>Note</Th>
                  <Th>Submitted at</Th>
                  <Th>Status</Th>
                  <Th className="w-24 text-right">
                    <span className="sr-only">Actions</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {mySubmissions.map(req => (
                  <Tr key={req.id}>
                    <Td mono>{req.id}</Td>
                    <Td className="whitespace-nowrap text-ink-2">{topicName(req.topicId)}</Td>
                    <Td mono className="text-right tabular-nums">
                      {req.intentIds.length}
                    </Td>
                    <Td className="max-w-xs">
                      <span className="block truncate text-ink-2" title={req.note}>
                        {req.note ?? '—'}
                      </span>
                    </Td>
                    <Td mono className="whitespace-nowrap">
                      {fmtDateTime(req.submittedAt)}
                    </Td>
                    <Td>
                      <ApprovalStatusPill status={req.status} />
                    </Td>
                    <Td className="text-right">
                      {req.status === 'pending' ? (
                        <Button size="sm" onClick={() => withdrawRequest(req.id)}>
                          Withdraw
                        </Button>
                      ) : req.status === 'rejected' && !isChecker ? (
                        <Button size="sm" onClick={() => stageIntents(req.intentIds)}>
                          <RotateCcw size={13} aria-hidden /> Restage
                        </Button>
                      ) : null}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </TableShell>
          )}
        </section>
      )}

      {/* ── Edit drawer ── */}
      <EditDrawer
        intent={isChecker ? null : editingIntent}
        topicName={editingIntent ? topicName(editingIntent.topicId) : ''}
        onClose={() => setEditingId(null)}
      />

      {/* ── Submit-for-approval confirmation ── */}
      <Modal
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        title="Submit for approval"
        footer={
          <>
            <Button onClick={() => setSubmitOpen(false)}>Cancel</Button>
            <Button variant="primary" disabled={selectedIds.length === 0} onClick={confirmSubmit}>
              Submit {plural(selectedIds.length, 'intent')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-2">
          Submissions group per topic — this creates{' '}
          <span className="font-semibold text-ink">{plural(groups.length, 'approval request')}</span>{' '}
          for a checker to decide.
        </p>
        <div className="mt-3 flex flex-col gap-2.5">
          {groups.map(([tid, list]) => (
            <div
              key={tid}
              className="rounded-(--radius-field) border border-line bg-surface-2 px-3 py-2.5"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-semibold text-ink">{topicName(tid)}</p>
                <Mono>{plural(list.length, 'intent')}</Mono>
              </div>
              <ul className="mt-1.5 flex flex-col gap-0.5">
                {list.slice(0, 4).map(i => (
                  <li key={i.id} className="truncate text-xs text-ink-2">
                    {i.question}
                  </li>
                ))}
                {list.length > 4 && (
                  <li className="text-xs text-ink-3">and {list.length - 4} more…</li>
                )}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Field
            label="Note to checker (optional)"
            htmlFor="submit-note"
            hint="Shared with every request created by this submission."
          >
            <Textarea
              id="submit-note"
              placeholder="Context the checker should know — sources refreshed, campaign dates, …"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
