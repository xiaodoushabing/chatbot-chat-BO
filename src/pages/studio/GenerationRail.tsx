import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Plus, Sparkles, X, XCircle } from 'lucide-react';
import { useStore } from '../../state/store';
import type { Run, Source } from '../../data/types';
import { fmtDuration, plural } from '../../lib/format';
import {
  Button,
  Field,
  IconButton,
  Input,
  Select,
  SegmentedControl,
  Textarea,
  Checkbox,
} from '../../components/ui/controls';
import { Mono, ProgressBar, RunStatusPill } from '../../components/ui/display';
import { Drawer } from '../../components/ui/overlay';

const EASE = [0.22, 1, 0.36, 1] as const;

type Mode = 'single' | 'batch' | 'manual';

function Elapsed({ startedAt, running, durationSec }: { startedAt: string; running: boolean; durationSec: number | null }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => setTick(x => x + 1), 1000);
    return () => clearInterval(t);
  }, [running]);
  const secs = running
    ? Math.max(0, Math.round((Date.now() - new Date(startedAt).getTime()) / 1000))
    : (durationSec ?? 0);
  return <span className="font-mono text-sm tabular-nums text-ink">{fmtDuration(secs)}</span>;
}

/* ── Live run card: the signature moment ── */

function LiveRunCard({ run, onDismiss }: { run: Run; onDismiss: () => void }) {
  const navigate = useNavigate();
  const running = run.status === 'running';
  const p = run.progress;
  const unitLabel = run.type === 'batch' ? 'rows' : 'sources';
  return (
    <motion.div
      key="run-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22, ease: EASE }}
      className="flex flex-col gap-4"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">
            {run.type === 'batch' ? 'GenAI · Batch run' : 'GenAI · Single run'}
          </p>
          <Mono className="block truncate">{run.id}</Mono>
        </div>
        <RunStatusPill status={run.status} />
      </div>

      <ProgressBar value={p.done} max={p.total} />

      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-2xs font-bold tracking-wider text-ink-3 uppercase">{unitLabel} done</p>
          <p className="font-mono text-sm tabular-nums text-ink">
            {p.done}<span className="text-ink-3"> / {p.total}</span>
          </p>
        </div>
        <div>
          <p className="text-2xs font-bold tracking-wider text-ink-3 uppercase">Intents drafted</p>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.p
              key={p.intentsDrafted}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: EASE }}
              className="font-mono text-sm font-semibold tabular-nums text-accent"
            >
              {p.intentsDrafted}
            </motion.p>
          </AnimatePresence>
        </div>
        <div>
          <p className="text-2xs font-bold tracking-wider text-ink-3 uppercase">Elapsed</p>
          <Elapsed startedAt={run.startedAt} running={running} durationSec={run.durationSec} />
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!running && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.25, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 border-t border-line pt-4">
              <div className="flex items-center gap-2">
                <motion.span
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.25, ease: EASE, delay: 0.08 }}
                >
                  {run.status === 'completed' ? (
                    <CheckCircle2 size={17} className="text-ok" aria-hidden />
                  ) : (
                    <XCircle size={17} className="text-err" aria-hidden />
                  )}
                </motion.span>
                <p className="text-sm font-semibold text-ink">
                  {run.status === 'completed' ? 'Run completed' : 'Run failed'}
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <dt className="text-ink-2">Succeeded</dt>
                <dd className="text-right font-mono tabular-nums text-ok">{p.succeeded}</dd>
                <dt className="text-ink-2">Skipped</dt>
                <dd className="text-right font-mono tabular-nums text-warn">{p.skipped}</dd>
                <dt className="text-ink-2">Failed</dt>
                <dd className="text-right font-mono tabular-nums text-err">{p.failed}</dd>
                <dt className="text-ink-2">Duration</dt>
                <dd className="text-right font-mono tabular-nums text-ink">
                  {fmtDuration(run.durationSec ?? 0)}
                </dd>
              </dl>
              <div className="flex flex-col gap-2">
                <Button variant="primary" onClick={() => navigate(`/studio/runs/${run.id}`)}>
                  View intents
                </Button>
                <Button variant="ghost" onClick={onDismiss}>
                  Start another run
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Manual intent composer drawer ── */

function ManualComposer({
  open,
  onClose,
  topicId,
  topicSources,
}: {
  open: boolean;
  onClose: () => void;
  topicId: string;
  topicSources: Source[];
}) {
  const { createManualIntent, user } = useStore();
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [utterances, setUtterances] = useState<string[]>(['']);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const pickable = topicSources.filter(s => user.role !== 'contributor' || s.accessible);
  const valid = question.trim().length > 0 && response.trim().length > 0;

  const reset = () => {
    setQuestion('');
    setResponse('');
    setUtterances(['']);
    setPicked(new Set());
  };

  const save = () => {
    createManualIntent({
      topicId,
      question: question.trim(),
      response: response.trim(),
      utterances: utterances.map(u => u.trim()).filter(Boolean),
      sourceIds: [...picked],
    });
    reset();
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="New manual intent"
      meta={<span className="text-xs text-ink-2">Saved straight to staging — no generation run.</span>}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!valid} onClick={save}>
            Create intent
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Field label="Intent question" htmlFor="manual-question">
          <Input
            id="manual-question"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="How do I claim for a delayed flight?"
          />
        </Field>
        <Field label="Response" htmlFor="manual-response" hint="The answer the chatbot will give, grounded in the sources below.">
          <Textarea
            id="manual-response"
            rows={5}
            value={response}
            onChange={e => setResponse(e.target.value)}
            placeholder="State the policy, limits and exact steps…"
          />
        </Field>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-xs font-semibold text-ink">Utterances</legend>
          {utterances.map((u, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                aria-label={`Utterance ${i + 1}`}
                value={u}
                onChange={e =>
                  setUtterances(list => list.map((x, j) => (j === i ? e.target.value : x)))
                }
                placeholder="Alternative phrasing of the question"
              />
              <IconButton
                label={`Remove utterance ${i + 1}`}
                disabled={utterances.length === 1}
                onClick={() => setUtterances(list => list.filter((_, j) => j !== i))}
              >
                <X size={13} />
              </IconButton>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="self-start"
            onClick={() => setUtterances(list => [...list, ''])}
          >
            <Plus size={13} aria-hidden /> Add utterance
          </Button>
        </fieldset>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1 text-xs font-semibold text-ink">Source documents</legend>
          <div className="max-h-52 overflow-y-auto rounded-(--radius-field) border border-line">
            {pickable.length === 0 && (
              <p className="px-3 py-3 text-sm text-ink-2">No accessible sources in this topic.</p>
            )}
            {pickable.map(s => (
              <label
                key={s.id}
                className="flex cursor-pointer items-center gap-2.5 border-b border-line px-3 py-2 text-sm text-ink transition-colors duration-150 last:border-b-0 hover:bg-surface-2"
              >
                <Checkbox
                  checked={picked.has(s.id)}
                  onChange={e =>
                    setPicked(prev => {
                      const next = new Set(prev);
                      if (e.target.checked) next.add(s.id);
                      else next.delete(s.id);
                      return next;
                    })
                  }
                />
                <span className="min-w-0 flex-1 truncate">{s.name}</span>
                <span className="shrink-0 text-xs text-ink-3">{s.kind === 'url' ? 'URL' : 'SharePoint'}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </Drawer>
  );
}

/* ── The rail ── */

export default function GenerationRail({
  topicId,
  topicSources,
  selectedSourceIds,
}: {
  topicId: string;
  topicSources: Source[];
  selectedSourceIds: string[];
}) {
  const { startRun, runs, tonalities } = useStore();
  const [mode, setMode] = useState<Mode>('single');
  const [composerOpen, setComposerOpen] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  // Single
  const [question, setQuestion] = useState('');
  const [requirements, setRequirements] = useState('');
  // Shared run settings
  const [maxIntents, setMaxIntents] = useState(5);
  const [tonality, setTonality] = useState(tonalities[0]);
  // Batch
  const spreadsheets = useMemo(() => topicSources.filter(s => s.isSpreadsheet), [topicSources]);
  const [batchFileId, setBatchFileId] = useState('');

  useEffect(() => {
    // topic changed: the rail resets to a clean launcher
    setActiveRunId(null);
    setBatchFileId('');
  }, [topicId]);

  const activeRun = runs.find(r => r.id === activeRunId && r.topicId === topicId) ?? null;
  const sourceCount = selectedSourceIds.length;

  const launchSingle = () => {
    const id = startRun({
      topicId,
      type: 'single',
      params: {
        maxIntents,
        tonality,
        intentQuestion: question.trim() || undefined,
        contentRequirements: requirements.trim() || undefined,
      },
      sourceIds: selectedSourceIds,
    });
    setActiveRunId(id);
  };

  const launchBatch = () => {
    const file = spreadsheets.find(s => s.id === batchFileId);
    if (!file) return;
    const id = startRun({
      topicId,
      type: 'batch',
      params: { maxIntents, tonality, batchFile: file.name },
      sourceIds: [file.id],
    });
    setActiveRunId(id);
  };

  const runSettings = (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Max intents" htmlFor="rail-max">
        <Input
          id="rail-max"
          type="number"
          min={1}
          max={20}
          value={maxIntents}
          onChange={e => setMaxIntents(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
        />
      </Field>
      <Field label="Tonality guide" htmlFor="rail-tonality">
        <Select id="rail-tonality" value={tonality} onChange={e => setTonality(e.target.value)}>
          {tonalities.map(t => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );

  return (
    <aside
      aria-label="Generate intents"
      className="sticky top-0 w-80 shrink-0 self-start rounded-(--radius-card) border border-line bg-surface-2 p-4"
    >
      <div className="mb-4 flex items-center gap-2">
        <Sparkles size={15} className="text-accent" aria-hidden />
        <h2 className="text-md font-semibold text-ink">Generate</h2>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {activeRun ? (
          <LiveRunCard run={activeRun} onDismiss={() => setActiveRunId(null)} />
        ) : (
          <motion.div
            key="launcher"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="flex flex-col gap-4"
          >
            <SegmentedControl<Mode>
              options={[
                { value: 'single', label: 'GenAI · Single' },
                { value: 'batch', label: 'GenAI · Batch' },
                { value: 'manual', label: 'Manual' },
              ]}
              value={mode}
              onChange={m => {
                setMode(m);
                if (m === 'manual') setComposerOpen(true);
              }}
            />

            {mode === 'single' && (
              <>
                <Field label="Intent (specific question)" htmlFor="rail-question">
                  <Input
                    id="rail-question"
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    placeholder="Claims for flight disruption"
                  />
                </Field>
                <Field
                  label="Content requirements"
                  htmlFor="rail-reqs"
                  hint="What the drafted answers must cover."
                >
                  <Textarea
                    id="rail-reqs"
                    rows={3}
                    value={requirements}
                    onChange={e => setRequirements(e.target.value)}
                    placeholder="Cover delay tiers and required documents. Cite payout caps."
                  />
                </Field>
                {runSettings}
                <div className="border-t border-line pt-3">
                  <p className="mb-2.5 text-xs text-ink-2" aria-live="polite">
                    {sourceCount > 0
                      ? `Source data: ${plural(sourceCount, 'selected source')}.`
                      : 'Select at least one source on the left to run.'}
                  </p>
                  <Button
                    variant="primary"
                    className="w-full"
                    disabled={sourceCount === 0}
                    onClick={launchSingle}
                  >
                    Generate intents · {plural(sourceCount, 'source')}
                  </Button>
                </div>
              </>
            )}

            {mode === 'batch' && (
              <>
                <Field
                  label="Batch file (.xlsx)"
                  htmlFor="rail-batch-file"
                  hint="Intent questions and content requirements are read from the file."
                >
                  <Select
                    id="rail-batch-file"
                    value={batchFileId}
                    onChange={e => setBatchFileId(e.target.value)}
                  >
                    <option value="" disabled>
                      {spreadsheets.length === 0 ? 'No spreadsheets in this topic' : 'Choose a spreadsheet…'}
                    </option>
                    {spreadsheets.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                {runSettings}
                <div className="border-t border-line pt-3">
                  <Button
                    variant="primary"
                    className="w-full"
                    disabled={!batchFileId}
                    onClick={launchBatch}
                  >
                    Run batch
                  </Button>
                </div>
              </>
            )}

            {mode === 'manual' && (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-ink-2">
                  Write an intent yourself — question, response and utterances. It skips generation
                  and lands in staging, ready for review.
                </p>
                <Button variant="primary" className="w-full" onClick={() => setComposerOpen(true)}>
                  Open composer
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ManualComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        topicId={topicId}
        topicSources={topicSources}
      />
    </aside>
  );
}
