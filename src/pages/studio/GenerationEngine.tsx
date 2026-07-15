import { useEffect, useMemo, useState } from 'react';
import { Info, Plus, Sparkles, X } from 'lucide-react';
import { useStore } from '../../state/store';
import type { Source } from '../../data/types';
import { plural } from '../../lib/format';
import {
  Button,
  Checkbox,
  Field,
  IconButton,
  Input,
  SegmentedControl,
  Select,
  Textarea,
} from '../../components/ui/controls';
import { Drawer } from '../../components/ui/overlay';

type Mode = 'single' | 'batch' | 'manual';

/* ── Manual intent composer drawer (unchanged flow) ── */

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

/* ── The generation engine card (main column, below sources) ── */

export default function GenerationEngine({
  topicId,
  topicSources,
  selectedSourceIds,
  running,
  onLaunched,
}: {
  topicId: string;
  topicSources: Source[];
  selectedSourceIds: string[];
  running?: boolean;
  onLaunched: (runId: string) => void;
}) {
  const { startRun, tonalities } = useStore();
  const [mode, setMode] = useState<Mode>('single');
  const [composerOpen, setComposerOpen] = useState(false);

  // Single
  const [question, setQuestion] = useState('');
  const [requirements, setRequirements] = useState('');
  // Run settings
  const [maxIntents, setMaxIntents] = useState(5);
  const [tonality, setTonality] = useState(tonalities[0]);
  // Batch
  const spreadsheets = useMemo(() => topicSources.filter(s => s.isSpreadsheet), [topicSources]);
  const [batchFileId, setBatchFileId] = useState('');

  useEffect(() => {
    // topic changed: the engine resets to a clean launcher
    setBatchFileId('');
  }, [topicId]);

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
    onLaunched(id);
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
    onLaunched(id);
  };

  return (
    <section
      aria-label="Generation engine"
      className="mt-10 rounded-(--radius-card) border border-line bg-surface-2"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-accent" aria-hidden />
          <h2 className="text-md font-semibold text-ink">Generation engine</h2>
        </div>
        <SegmentedControl<Mode>
          className="ml-auto"
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
      </div>

      <div className="p-4">
        {mode === 'single' && (
          <div className="flex flex-col gap-4">
            <Field label="Target intent / question" htmlFor="engine-question">
              <Input
                id="engine-question"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="Claims for flight disruption"
              />
            </Field>
            <Field
              label="Content requirements (optional)"
              htmlFor="engine-reqs"
              hint="What the drafted answers must cover."
            >
              <Textarea
                id="engine-reqs"
                rows={3}
                value={requirements}
                onChange={e => setRequirements(e.target.value)}
                placeholder="Cover delay tiers and required documents. Cite payout caps."
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tonality guide" htmlFor="engine-tonality">
                <Select id="engine-tonality" value={tonality} onChange={e => setTonality(e.target.value)}>
                  {tonalities.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Max intents" htmlFor="engine-max">
                <Input
                  id="engine-max"
                  type="number"
                  min={1}
                  max={20}
                  value={maxIntents}
                  onChange={e => setMaxIntents(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                />
              </Field>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-3">
              <p className="text-xs text-ink-2" aria-live="polite">
                {sourceCount > 0
                  ? `Source data: ${plural(sourceCount, 'selected source')} from the table above.`
                  : 'Select at least one source in the table above to run.'}
              </p>
              <Button
                variant="primary"
                className="ml-auto"
                disabled={sourceCount === 0 || running}
                onClick={launchSingle}
                title={running ? 'A run is already in progress' : undefined}
              >
                Generate intents · {plural(sourceCount, 'source')}
              </Button>
            </div>
          </div>
        )}

        {mode === 'batch' && (
          <div className="flex flex-col gap-4">
            <Field label="Batch file (.xlsx)" htmlFor="engine-batch-file">
              <Select
                id="engine-batch-file"
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
            <div className="flex items-start gap-2.5 rounded-(--radius-ctl) border border-info/30 bg-info/8 px-3 py-2.5">
              <Info size={14} className="mt-0.5 shrink-0 text-info" aria-hidden />
              <p className="text-xs text-ink-2">
                Spreadsheet control block: seed intent &amp; content requirements are read from the
                Excel file; single-run fields are bypassed.
              </p>
            </div>
            <div className="flex justify-end border-t border-line pt-3">
              <Button
                variant="primary"
                disabled={!batchFileId || running}
                onClick={launchBatch}
                title={running ? 'A run is already in progress' : undefined}
              >
                Run batch
              </Button>
            </div>
          </div>
        )}

        {mode === 'manual' && (
          <div className="flex flex-wrap items-center gap-3">
            <p className="max-w-prose text-sm text-ink-2">
              Write an intent yourself — question, response and utterances. It skips generation and
              lands in staging, ready for review.
            </p>
            <Button variant="primary" className="ml-auto" onClick={() => setComposerOpen(true)}>
              Open composer
            </Button>
          </div>
        )}
      </div>

      <ManualComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        topicId={topicId}
        topicSources={topicSources}
      />
    </section>
  );
}
