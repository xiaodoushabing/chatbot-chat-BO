import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { FileSpreadsheet, Info, PencilLine, Plus, Sparkles, Target, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useStore } from '../../state/store';
import type { Source } from '../../data/types';
import { plural } from '../../lib/format';
import { Button, Field, IconButton, Input, Select, Textarea } from '../../components/ui/controls';

const EASE = [0.22, 0.61, 0.36, 1] as const;

export type Mode = 'single' | 'batch' | 'manual';

export interface GenConfig {
  mode: Mode;
  question: string;
  requirements: string;
  tonality: string;
  maxIntents: number;
  batchFileId: string;
  manualQuestion: string;
  manualResponse: string;
  manualUtterances: string[];
}

const MODES: { value: Mode; name: string; desc: string; icon: LucideIcon }[] = [
  {
    value: 'single',
    name: 'GenAI · Single',
    desc: 'One focused set of intents from a question you have in mind.',
    icon: Target,
  },
  {
    value: 'batch',
    name: 'GenAI · Batch',
    desc: 'Sweep a control spreadsheet, one intent seed per row.',
    icon: Sparkles,
  },
  {
    value: 'manual',
    name: 'Manual',
    desc: 'Write the question and answer yourself, sourced for citation.',
    icon: PencilLine,
  },
];

function ModeCard({
  mode,
  selected,
  reduce,
  onSelect,
}: {
  mode: (typeof MODES)[number];
  selected: boolean;
  reduce: boolean;
  onSelect: () => void;
}) {
  const Icon = mode.icon;
  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      whileHover={reduce ? undefined : { y: -3 }}
      transition={{ duration: 0.2, ease: EASE }}
      className={cn(
        'group relative flex flex-col rounded-(--radius-md) border bg-bg p-4 text-left',
        'transition-[border-color,box-shadow] duration-200 ease-(--ease-out)',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
        selected ? 'border-accent shadow-(--shadow-accent)' : 'border-line hover:shadow-(--shadow-2)',
      )}
    >
      <span
        className={cn(
          'absolute right-4 top-4 grid h-4.5 w-4.5 place-items-center rounded-full border-2 transition-colors duration-200',
          selected ? 'border-accent' : 'border-line',
        )}
        aria-hidden
      >
        {selected && <span className="h-2 w-2 rounded-full bg-accent" />}
      </span>
      <span
        className={cn(
          'mb-3 grid h-10 w-10 place-items-center rounded-(--radius-ctl) transition-transform duration-300 ease-(--ease-out)',
          'bg-accent-wash text-accent group-hover:-rotate-3 group-hover:scale-105',
        )}
      >
        <Icon size={20} aria-hidden />
      </span>
      <span className="text-sm font-semibold text-ink">{mode.name}</span>
      <span className="mt-1 text-xs leading-relaxed text-ink-3">{mode.desc}</span>
    </motion.button>
  );
}

function Reveal({ children, reduce }: { children: React.ReactNode; reduce: boolean }) {
  return (
    <motion.div
      key="reveal"
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={{ duration: reduce ? 0.15 : 0.28, ease: EASE }}
      className="mt-6 border-t border-line pt-6"
    >
      {children}
    </motion.div>
  );
}

/* ── Step 2: Configure generation ── */

export default function StepConfigure({
  config,
  patch,
  topicSources,
  sourceCount,
}: {
  config: GenConfig;
  patch: (p: Partial<GenConfig>) => void;
  topicSources: Source[];
  sourceCount: number;
}) {
  const { tonalities } = useStore();
  const reduce = !!useReducedMotion();
  const spreadsheets = topicSources.filter(s => s.isSpreadsheet);

  return (
    <section
      aria-label="Configure generation"
      className="rounded-(--radius-card) border border-line bg-bg p-6 shadow-(--shadow-2) sm:p-7"
    >
      <h2 className="font-display text-lg font-medium tracking-[-0.01em] text-ink">
        Configure generation
      </h2>
      <p className="mt-1 mb-5 text-sm text-ink-2">
        Pick how the model should work through your sources.
      </p>

      <div
        role="radiogroup"
        aria-label="Generation mode"
        className="grid gap-3 sm:grid-cols-3"
      >
        {MODES.map(m => (
          <ModeCard
            key={m.value}
            mode={m}
            selected={config.mode === m.value}
            reduce={reduce}
            onSelect={() => patch({ mode: m.value })}
          />
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {config.mode === 'single' && (
          <Reveal key="single" reduce={reduce}>
            <div className="flex flex-col gap-4">
              <Field label="Target intent / question" htmlFor="cfg-question">
                <Input
                  id="cfg-question"
                  value={config.question}
                  onChange={e => patch({ question: e.target.value })}
                  placeholder="Claims for flight disruption"
                />
              </Field>
              <Field
                label="Content requirements (optional)"
                htmlFor="cfg-reqs"
                hint="What the drafted answers must cover."
              >
                <Textarea
                  id="cfg-reqs"
                  rows={3}
                  value={config.requirements}
                  onChange={e => patch({ requirements: e.target.value })}
                  placeholder="Cover delay tiers and required documents. Cite payout caps."
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tonality guide" htmlFor="cfg-tonality">
                  <Select
                    id="cfg-tonality"
                    value={config.tonality}
                    onChange={e => patch({ tonality: e.target.value })}
                  >
                    {tonalities.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Max intents" htmlFor="cfg-max">
                  <Input
                    id="cfg-max"
                    type="number"
                    min={1}
                    max={20}
                    value={config.maxIntents}
                    onChange={e =>
                      patch({ maxIntents: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })
                    }
                  />
                </Field>
              </div>
              <p className="text-xs text-ink-2" aria-live="polite">
                {sourceCount > 0
                  ? `Source data: ${plural(sourceCount, 'selected source')} from step 1.`
                  : 'No sources selected — go back to step 1 to add source data.'}
              </p>
            </div>
          </Reveal>
        )}

        {config.mode === 'batch' && (
          <Reveal key="batch" reduce={reduce}>
            <div className="flex flex-col gap-4">
              <Field label="Batch file (.xlsx)" htmlFor="cfg-batch-file">
                <Select
                  id="cfg-batch-file"
                  value={config.batchFileId}
                  onChange={e => patch({ batchFileId: e.target.value })}
                >
                  <option value="" disabled>
                    {spreadsheets.length === 0
                      ? 'No spreadsheets in this topic'
                      : 'Choose a spreadsheet…'}
                  </option>
                  {spreadsheets.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="flex items-start gap-2.5 rounded-(--radius-ctl) border border-info/30 bg-info-bg px-3.5 py-3">
                <FileSpreadsheet size={15} className="mt-0.5 shrink-0 text-info" aria-hidden />
                <p className="text-xs text-ink-2">
                  The seed intent and content requirements are read from the spreadsheet's control
                  block, one intent per row. Single-run fields are bypassed.
                </p>
              </div>
            </div>
          </Reveal>
        )}

        {config.mode === 'manual' && (
          <Reveal key="manual" reduce={reduce}>
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-2.5 rounded-(--radius-ctl) border border-info/30 bg-info-bg px-3.5 py-3">
                <Info size={15} className="mt-0.5 shrink-0 text-info" aria-hidden />
                <p className="text-xs text-ink-2">
                  A manual intent skips generation and lands directly in staging, ready for review.
                  Use the footer to create it.
                </p>
              </div>
              <Field label="Intent question" htmlFor="cfg-manual-q">
                <Input
                  id="cfg-manual-q"
                  value={config.manualQuestion}
                  onChange={e => patch({ manualQuestion: e.target.value })}
                  placeholder="How do I claim for a delayed flight?"
                />
              </Field>
              <Field
                label="Response"
                htmlFor="cfg-manual-r"
                hint="The answer the chatbot will give, grounded in the selected sources."
              >
                <Textarea
                  id="cfg-manual-r"
                  rows={5}
                  value={config.manualResponse}
                  onChange={e => patch({ manualResponse: e.target.value })}
                  placeholder="State the policy, limits and exact steps…"
                />
              </Field>
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-0.5 text-xs font-semibold text-ink">Utterances</legend>
                {config.manualUtterances.map((u, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      aria-label={`Utterance ${i + 1}`}
                      value={u}
                      onChange={e =>
                        patch({
                          manualUtterances: config.manualUtterances.map((x, j) =>
                            j === i ? e.target.value : x,
                          ),
                        })
                      }
                      placeholder="Alternative phrasing of the question"
                    />
                    <IconButton
                      label={`Remove utterance ${i + 1}`}
                      disabled={config.manualUtterances.length === 1}
                      onClick={() =>
                        patch({
                          manualUtterances: config.manualUtterances.filter((_, j) => j !== i),
                        })
                      }
                    >
                      <X size={13} />
                    </IconButton>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="self-start"
                  onClick={() =>
                    patch({ manualUtterances: [...config.manualUtterances, ''] })
                  }
                >
                  <Plus size={13} aria-hidden /> Add utterance
                </Button>
              </fieldset>
              <p className="text-xs text-ink-2" aria-live="polite">
                {sourceCount > 0
                  ? `Source references: ${plural(sourceCount, 'selected source')} from step 1.`
                  : 'No sources selected — add references by selecting sources in step 1.'}
              </p>
            </div>
          </Reveal>
        )}
      </AnimatePresence>
    </section>
  );
}
