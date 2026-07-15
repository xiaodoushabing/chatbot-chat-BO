import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, FileX2, Layers, Pencil, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useStore } from '../../state/store';
import type { Intent, Run } from '../../data/types';
import { fmtDateTime, fmtDuration, plural } from '../../lib/format';
import { Button, Checkbox, Field, IconButton, Input, SearchField, Textarea } from '../../components/ui/controls';
import {
  BatchChildPill,
  EmptyState,
  IntentStatePill,
  KeyValue,
  Mono,
  PageHeader,
  ProgressBar,
  RunStatusPill,
  SectionHeader,
  Tabs,
} from '../../components/ui/display';
import { TableShell, Td, Th, Tr } from '../../components/ui/table';
import { Drawer } from '../../components/ui/overlay';

const EASE = [0.22, 1, 0.36, 1] as const;

/* ── Inline edit drawer (question / response / utterances) ── */

function EditIntentDrawer({ intent, onClose }: { intent: Intent | null; onClose: () => void }) {
  const { updateIntent, toast } = useStore();
  // Keyed remount below guarantees fresh state per intent.
  const [question, setQuestion] = useState(intent?.question ?? '');
  const [response, setResponse] = useState(intent?.response ?? '');
  const [utterances, setUtterances] = useState((intent?.utterances ?? []).join('\n'));

  const save = () => {
    if (!intent) return;
    updateIntent(intent.id, {
      question: question.trim(),
      response: response.trim(),
      utterances: utterances
        .split('\n')
        .map(u => u.trim())
        .filter(Boolean),
    });
    toast('Intent updated');
    onClose();
  };

  return (
    <Drawer
      open={!!intent}
      onClose={onClose}
      title="Edit intent"
      meta={intent && (
        <span className="flex items-center gap-2">
          <Mono>{intent.id}</Mono>
          <IntentStatePill state={intent.state} />
        </span>
      )}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={!question.trim() || !response.trim()}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Field label="Intent question" htmlFor="edit-question">
          <Input id="edit-question" value={question} onChange={e => setQuestion(e.target.value)} />
        </Field>
        <Field label="Response" htmlFor="edit-response">
          <Textarea
            id="edit-response"
            className="min-h-40"
            value={response}
            onChange={e => setResponse(e.target.value)}
          />
        </Field>
        <Field
          label="Utterances"
          htmlFor="edit-utterances"
          hint="One utterance per line — alternative phrasings the chatbot should match."
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

/* ── One intent card (adopted structure: header row → labeled sections → chips → meta) ── */

const LONG_RESPONSE = 260;

function IntentCard({
  intent,
  topicName,
  sourceNames,
  canAct,
  selected,
  onToggleSelect,
  expanded,
  onToggleExpand,
  onEdit,
}: {
  intent: Intent;
  topicName: string;
  sourceNames: string[];
  canAct: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
}) {
  const stageable = canAct && intent.state === 'draft';
  const editable = canAct && (intent.state === 'draft' || intent.state === 'staged');
  const isLong = intent.response.length > LONG_RESPONSE;
  return (
    <article
      aria-label={`Intent: ${intent.question}`}
      className={cn(
        'rounded-(--radius-card) border bg-surface-2 px-4 py-3.5 transition-colors duration-150',
        selected ? 'border-accent/60' : 'border-line',
      )}
    >
      {/* Header row: checkbox (draft only) · topic tag · state pill · edit */}
      <div className="flex items-center gap-2.5">
        {stageable && (
          <Checkbox
            checked={selected}
            onChange={onToggleSelect}
            aria-label={`Select intent: ${intent.question}`}
          />
        )}
        <span className="rounded-full border border-line bg-bg px-2 py-0.5 text-2xs font-semibold text-ink-2">
          {topicName}
        </span>
        <IntentStatePill state={intent.state} />
        <div className="ml-auto flex items-center gap-1">
          {editable && (
            <IconButton label={`Edit intent: ${intent.question}`} onClick={onEdit}>
              <Pencil size={13} aria-hidden />
            </IconButton>
          )}
        </div>
      </div>

      {/* Intent question */}
      <div className="mt-3">
        <p className="text-2xs font-semibold tracking-wide text-ink-3 uppercase">
          Intent question (user query)
        </p>
        <p className="mt-1 text-sm font-semibold text-ink text-balance">{intent.question}</p>
      </div>

      <div className="my-3 h-px bg-line" aria-hidden />

      {/* Expected response */}
      <div>
        <p className="text-2xs font-semibold tracking-wide text-ink-3 uppercase">Expected response</p>
        <p
          className={cn(
            'mt-1 max-w-prose text-sm leading-relaxed text-ink-2',
            isLong && !expanded && 'line-clamp-3',
          )}
        >
          {intent.response}
        </p>
        {isLong && (
          <button
            onClick={onToggleExpand}
            aria-expanded={expanded}
            className="mt-1 text-xs font-semibold text-accent transition-colors duration-150 hover:underline focus-visible:outline-2 focus-visible:outline-accent"
          >
            {expanded ? 'Show less' : 'Show full response'}
          </button>
        )}
      </div>

      {/* Source references */}
      <div className="mt-3">
        <p className="text-2xs font-semibold tracking-wide text-ink-3 uppercase">Source references</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {sourceNames.length > 0 ? (
            sourceNames.map(n => (
              <span
                key={n}
                className="rounded-full border border-line bg-bg px-2 py-0.5 font-mono text-xs text-ink-2"
              >
                {n}
              </span>
            ))
          ) : (
            <span className="text-xs text-ink-3">None recorded</span>
          )}
        </div>
      </div>

      {/* Footer meta: utterances left, created-by right-aligned */}
      <div className="mt-3 flex items-baseline gap-3">
        <span className="font-mono text-xs text-ink-3">{plural(intent.utterances.length, 'utterance')}</span>
        <span className="ml-auto text-right text-xs text-ink-3">
          Created by {intent.createdBy} · {fmtDateTime(intent.createdAt)}
        </span>
      </div>
    </article>
  );
}

/* ── Page ── */

export default function RunDetail() {
  const { runId } = useParams<{ runId: string }>();
  const store = useStore();
  const { runs, topics, sources, intents, projectId, user, stageIntents } = store;

  const run: Run | undefined = runs.find(r => r.id === runId);
  const topic = run ? topics.find(t => t.id === run.topicId) : undefined;
  const inProject = !!topic && topic.projectId === projectId;

  const [tab, setTab] = useState<'all' | 'rows'>('all');
  const [search, setSearch] = useState('');
  const [childFilter, setChildFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Intent | null>(null);

  const canAct = user.role !== 'checker';

  const runIntents = useMemo(
    () => intents.filter(i => i.origin.kind === 'run' && i.origin.runId === runId),
    [intents, runId],
  );

  const activeChild = run?.children.find(c => c.id === childFilter) ?? null;

  const visibleIntents = useMemo(() => {
    let list = runIntents;
    if (activeChild) list = list.filter(i => activeChild.intentIds.includes(i.id));
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        i => i.question.toLowerCase().includes(q) || i.response.toLowerCase().includes(q),
      );
    }
    return list;
  }, [runIntents, activeChild, search]);

  if (!run || !inProject) {
    return (
      <div>
        <PageHeader
          title="Run not found"
          sub="This run does not exist in the current project. Switch projects from the top bar, or return to Intent Studio."
        />
        <EmptyState
          icon={FileX2}
          title="No run with this id in the current project"
          body="Runs live inside the project they were started in. Head back to Intent Studio to see this project's run history."
          action={
            <Button variant="secondary" onClick={() => history.back()}>
              Go back
            </Button>
          }
        />
        <div className="mt-4">
          <Link to="/studio" className="text-sm font-semibold text-accent hover:underline">
            Back to Intent Studio
          </Link>
        </div>
      </div>
    );
  }

  const running = run.status === 'running';
  const elapsedSec = running
    ? Math.max(0, Math.round((Date.now() - new Date(run.startedAt).getTime()) / 1000))
    : run.durationSec;

  const sourceName = (id: string) => sources.find(s => s.id === id)?.name ?? id;
  const usedSourceNames = run.sourceIds.map(sourceName);
  const p = run.progress;

  const stageableVisible = visibleIntents.filter(i => i.state === 'draft');
  const selectedIds = stageableVisible.filter(i => selected.has(i.id)).map(i => i.id);
  const allChecked = stageableVisible.length > 0 && selectedIds.length === stageableVisible.length;
  const someChecked = selectedIds.length > 0 && !allChecked;

  const toggleAll = () => {
    setSelected(prev => {
      const next = new Set(prev);
      if (allChecked) stageableVisible.forEach(i => next.delete(i.id));
      else stageableVisible.forEach(i => next.add(i.id));
      return next;
    });
  };
  const toggleOne = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleExpand = (id: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const stage = (ids: string[]) => {
    stageIntents(ids);
    setSelected(new Set());
  };

  const paramItems: Array<[string, React.ReactNode]> = [
    ['Type', <span className="text-sm capitalize">{run.type === 'batch' ? 'GenAI · Batch' : 'GenAI · Single'}</span>],
    ['Topic', topic.name],
    ['Max intents', <Mono className="text-ink">{run.params.maxIntents}</Mono>],
    ['Tonality', run.params.tonality],
    ...(run.type === 'batch'
      ? ([['Batch file', <Mono className="text-ink">{run.params.batchFile ?? '—'}</Mono>]] as Array<
          [string, React.ReactNode]
        >)
      : ([
          ['Intent question', run.params.intentQuestion ?? '—'],
          ['Content requirements', <span className="text-sm text-ink-2">{run.params.contentRequirements ?? '—'}</span>],
        ] as Array<[string, React.ReactNode]>)),
    [
      'Sources used',
      <span className="flex flex-wrap gap-x-2 gap-y-0.5">
        {usedSourceNames.map(n => (
          <Mono key={n}>{n}</Mono>
        ))}
      </span>,
    ],
    [
      'Counts',
      <span className="font-mono text-xs tabular-nums">
        <span className="text-ok">{p.succeeded} succeeded</span>
        <span className="text-ink-3"> · </span>
        <span className="text-warn">{p.skipped} skipped</span>
        <span className="text-ink-3"> · </span>
        <span className="text-err">{p.failed} failed</span>
        <span className="text-ink-3"> · </span>
        <span className="text-ink-2">{p.intentsDrafted} intents drafted</span>
      </span>,
    ],
    [
      'Duration',
      <Mono className="text-ink">{elapsedSec != null ? fmtDuration(elapsedSec) : '—'}{running && ' elapsed'}</Mono>,
    ],
  ];

  const intentTable = (
    <>
      <SectionHeader
        title={activeChild ? `Intents from row ${activeChild.row}` : 'Generated intents'}
        meta={plural(visibleIntents.length, 'intent')}
        actions={
          <>
            {activeChild && (
              <Button variant="ghost" size="sm" onClick={() => setChildFilter(null)}>
                <X size={12} aria-hidden /> Clear row filter
              </Button>
            )}
            {runIntents.length > 5 && (
              <SearchField
                value={search}
                onChange={setSearch}
                placeholder="Search question or response"
                className="w-64"
              />
            )}
          </>
        }
      />
      {visibleIntents.length === 0 ? (
        runIntents.length === 0 ? (
          run.status === 'failed' || run.status === 'dead' ? (
            <EmptyState
              icon={FileX2}
              title="This run produced no intents"
              body="The run ended without drafting any intents — check the source selection and try again from Intent Studio."
              action={
                <Link to="/studio">
                  <Button variant="secondary">Back to Intent Studio</Button>
                </Link>
              }
            />
          ) : running ? (
            <EmptyState
              icon={Layers}
              title="Drafting intents"
              body="The run is still working through its sources. Drafted intents will appear here as each item completes."
            />
          ) : (
            <EmptyState
              icon={Layers}
              title="No intents recorded for this run"
              body="This run completed without drafted intents in the working set — they may have been generated in an earlier session of this prototype."
              action={
                <Link to="/studio">
                  <Button variant="secondary">Back to Intent Studio</Button>
                </Link>
              }
            />
          )
        ) : (
          <EmptyState
            icon={Layers}
            title="No intents match"
            body={
              activeChild
                ? 'This spreadsheet row drafted no intents in the working set. Clear the row filter to see all intents from this run.'
                : 'No intents match your search. Try a different phrase.'
            }
          />
        )
      ) : (
        <>
          {/* Persistent selection bar above the list — present whenever there are stageable drafts */}
          <AnimatePresence initial={false}>
            {canAct && stageableVisible.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: EASE }}
                role="region"
                aria-label="Staging actions"
                className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-(--radius-card) border border-line bg-bg px-4 py-2.5"
              >
                <Checkbox
                  checked={allChecked}
                  indeterminate={someChecked}
                  onChange={toggleAll}
                  aria-label="Select all filtered draft intents"
                />
                <span className="font-mono text-xs tabular-nums text-ink-2">
                  Selected {selectedIds.length} of {stageableVisible.length} filtered
                </span>
                <div className="ml-auto flex items-center gap-2">
                  {selectedIds.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                      Clear
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={selectedIds.length === 0}
                    onClick={() => stage(selectedIds)}
                  >
                    Stage selected
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => stage(stageableVisible.map(i => i.id))}
                  >
                    Stage all {stageableVisible.length} filtered drafts
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex flex-col gap-3">
            {visibleIntents.map(intent => (
              <IntentCard
                key={intent.id}
                intent={intent}
                topicName={topic.name}
                sourceNames={intent.sourceIds.map(sourceName)}
                canAct={canAct}
                selected={selected.has(intent.id)}
                onToggleSelect={() => toggleOne(intent.id)}
                expanded={expanded.has(intent.id)}
                onToggleExpand={() => toggleExpand(intent.id)}
                onEdit={() => setEditing(intent)}
              />
            ))}
          </div>
        </>
      )}
    </>
  );

  return (
    <div className="pb-20">
      <Link
        to="/studio"
        className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-2 transition-colors duration-150 hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
      >
        <ArrowLeft size={13} aria-hidden /> Intent Studio
      </Link>
      <PageHeader
        title={run.type === 'batch' ? 'Batch run' : 'Generation run'}
        context={
          <span className="flex items-center gap-2.5">
            <Mono className="text-sm">{run.id}</Mono>
            <RunStatusPill status={run.status} />
          </span>
        }
        sub={
          <>
            Started by {run.startedBy} on {fmtDateTime(run.startedAt)}
            {run.finishedAt && <> · finished {fmtDateTime(run.finishedAt)}</>}
          </>
        }
      />

      <section
        aria-label="Run metadata"
        className="mb-8 rounded-(--radius-card) border border-line bg-surface-2 px-5 py-4"
      >
        {running && (
          <div className="mb-4">
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-xs font-semibold text-ink-2">Progress</span>
              <span className="font-mono text-xs tabular-nums text-ink-2">
                {p.done} / {p.total} items · {p.intentsDrafted} drafted
              </span>
            </div>
            <ProgressBar value={p.done} max={p.total} />
          </div>
        )}
        <KeyValue items={paramItems} />
      </section>

      {run.type === 'batch' ? (
        <>
          <div className="mb-4">
            <Tabs
              tabs={[
                { value: 'all' as const, label: 'All intents', count: runIntents.length },
                { value: 'rows' as const, label: 'By row', count: run.children.length },
              ]}
              value={tab}
              onChange={v => {
                setTab(v);
                if (v === 'all') setChildFilter(null);
              }}
            />
          </div>
          {tab === 'rows' && (
            <div className="mb-8">
              <SectionHeader
                title="Spreadsheet rows"
                meta={plural(run.children.length, 'row')}
                actions={
                  <span className="text-xs text-ink-2">Click a row to filter the intent list below</span>
                }
              />
              <TableShell>
                <thead>
                  <tr>
                    <Th className="w-16">Row</Th>
                    <Th>Intent question</Th>
                    <Th>Status</Th>
                    <Th>Duration</Th>
                    <Th>Note</Th>
                  </tr>
                </thead>
                <tbody>
                  {run.children.map(c => (
                    <Tr
                      key={c.id}
                      selected={childFilter === c.id}
                      onClick={() => setChildFilter(f => (f === c.id ? null : c.id))}
                    >
                      <Td mono>{c.row}</Td>
                      <Td>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setChildFilter(f => (f === c.id ? null : c.id));
                          }}
                          aria-pressed={childFilter === c.id}
                          className="text-left text-sm font-medium text-ink transition-colors duration-150 hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
                        >
                          {c.intentQuestion}
                        </button>
                      </Td>
                      <Td>
                        <BatchChildPill status={c.status} />
                      </Td>
                      <Td mono>{c.durationSec != null ? fmtDuration(c.durationSec) : '—'}</Td>
                      <Td className="max-w-72">
                        <span className="block truncate text-xs text-ink-2" title={c.note}>
                          {c.note ?? ''}
                        </span>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </TableShell>
            </div>
          )}
          {intentTable}
        </>
      ) : (
        intentTable
      )}

      <EditIntentDrawer key={editing?.id ?? 'none'} intent={editing} onClose={() => setEditing(null)} />
    </div>
  );
}
