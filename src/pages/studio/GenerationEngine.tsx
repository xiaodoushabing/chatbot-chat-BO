import { useEffect, useMemo, useState } from 'react';
import { Info, Plus, Sparkles, X } from 'lucide-react';
import { useStore } from '../../state/store';
import type { Source } from '../../data/types';
import { plural } from '../../lib/format';
import {
  Button,
  Field,
  IconButton,
  Input,
  SegmentedControl,
  Select,
  Textarea,
} from '../../components/ui/controls';

type Mode = 'single' | 'batch' | 'manual';

/* ── The generation module ──
   Sits directly below the sources table as the second half of one flow: source
   selection above feeds every mode here (Single, Batch, Manual). Manual is an
   inline composer — no drawer — matching Single/Batch. */

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
  const { startRun, createManualIntent, tonalities } = useStore();
  const [mode, setMode] = useState<Mode>('single');

  // Single
  const [question, setQuestion] = useState('');
  const [requirements, setRequirements] = useState('');
  // Run settings (shared by Single + Batch)
  const [maxIntents, setMaxIntents] = useState(5);
  const [tonality, setTonality] = useState(tonalities[0]);
  // Batch
  const spreadsheets = useMemo(() => topicSources.filter(s => s.isSpreadsheet), [topicSources]);
  const [batchFileId, setBatchFileId] = useState('');
  // Manual
  const [manualQuestion, setManualQuestion] = useState('');
  const [manualResponse, setManualResponse] = useState('');
  const [manualUtterances, setManualUtterances] = useState<string[]>(['']);

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

  const manualValid = manualQuestion.trim().length > 0 && manualResponse.trim().length > 0;

  const saveManual = () => {
    createManualIntent({
      topicId,
      question: manualQuestion.trim(),
      response: manualResponse.trim(),
      utterances: manualUtterances.map(u => u.trim()).filter(Boolean),
      sourceIds: selectedSourceIds,
    });
    setManualQuestion('');
    setManualResponse('');
    setManualUtterances(['']);
  };

  return (
    <section
      aria-label="Generation engine"
      className="rounded-(--radius-card) border border-line bg-surface-2 shadow-(--shadow-soft)"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 border-b border-line px-5 py-4">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-accent" aria-hidden />
          <h3 className="text-md font-semibold text-ink">Generate intents</h3>
        </div>
        <span className="font-mono text-xs text-ink-2" aria-live="polite">
          {sourceCount > 0
            ? `${plural(sourceCount, 'source')} selected above`
            : 'No sources selected above'}
        </span>
        <SegmentedControl<Mode>
          className="ml-auto"
          options={[
            { value: 'single', label: 'GenAI · Single' },
            { value: 'batch', label: 'GenAI · Batch' },
            { value: 'manual', label: 'Manual' },
          ]}
          value={mode}
          onChange={setMode}
        />
      </div>

      <div className="p-5">
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
            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
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
            <div className="flex justify-end border-t border-line pt-4">
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
          <div className="flex flex-col gap-4">
            <p className="max-w-prose text-xs text-ink-2">
              Write an intent yourself. It skips generation and lands in staging, ready for review.
            </p>
            <Field label="Intent question" htmlFor="manual-question">
              <Input
                id="manual-question"
                value={manualQuestion}
                onChange={e => setManualQuestion(e.target.value)}
                placeholder="How do I claim for a delayed flight?"
              />
            </Field>
            <Field
              label="Response"
              htmlFor="manual-response"
              hint="The answer the chatbot will give, grounded in the selected sources above."
            >
              <Textarea
                id="manual-response"
                rows={5}
                value={manualResponse}
                onChange={e => setManualResponse(e.target.value)}
                placeholder="State the policy, limits and exact steps…"
              />
            </Field>

            <fieldset className="flex flex-col gap-2">
              <legend className="text-xs font-semibold text-ink">Utterances</legend>
              {manualUtterances.map((u, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    aria-label={`Utterance ${i + 1}`}
                    value={u}
                    onChange={e =>
                      setManualUtterances(list => list.map((x, j) => (j === i ? e.target.value : x)))
                    }
                    placeholder="Alternative phrasing of the question"
                  />
                  <IconButton
                    label={`Remove utterance ${i + 1}`}
                    disabled={manualUtterances.length === 1}
                    onClick={() => setManualUtterances(list => list.filter((_, j) => j !== i))}
                  >
                    <X size={13} />
                  </IconButton>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="self-start"
                onClick={() => setManualUtterances(list => [...list, ''])}
              >
                <Plus size={13} aria-hidden /> Add utterance
              </Button>
            </fieldset>

            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
              <p className="text-xs text-ink-2" aria-live="polite">
                {sourceCount > 0
                  ? `Source references: ${plural(sourceCount, 'selected source')} from the table above.`
                  : 'No sources selected — add references by selecting sources in the table above.'}
              </p>
              <Button
                variant="primary"
                className="ml-auto"
                disabled={!manualValid}
                onClick={saveManual}
              >
                Create intent
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
