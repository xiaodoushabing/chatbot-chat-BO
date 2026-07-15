import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { FileText, Sparkles } from 'lucide-react';
import { cn } from '../../lib/cn';
import type { Intent } from '../../data/types';
import { Button, Checkbox } from '../../components/ui/controls';
import { IntentStatePill } from '../../components/ui/display';

const EASE = [0.22, 0.61, 0.36, 1] as const;

function IntentCard({
  intent,
  selected,
  sourceName,
  reduce,
  onToggle,
}: {
  intent: Intent;
  selected: boolean;
  sourceName: (id: string) => string;
  reduce: boolean;
  onToggle: () => void;
}) {
  const shownUtterances = intent.utterances.slice(0, 3);
  const extraUtterances = intent.utterances.length - shownUtterances.length;
  return (
    <motion.div
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, x: 30, scale: 0.98 }}
      transition={{ duration: reduce ? 0.15 : 0.32, ease: EASE }}
      className={cn(
        'rounded-(--radius-md) border bg-bg p-5 shadow-(--shadow-soft) transition-[border-color,box-shadow] duration-200 ease-(--ease-out)',
        selected ? 'border-accent' : 'border-line hover:shadow-(--shadow-2)',
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          aria-label={`Select intent: ${intent.question}`}
          checked={selected}
          onChange={onToggle}
          className="mt-1"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-md font-medium tracking-[-0.01em] text-ink text-balance">
              {intent.question}
            </h3>
            <IntentStatePill state={intent.state} />
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">{intent.response}</p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {shownUtterances.map((u, i) => (
              <span
                key={i}
                className="rounded-full bg-surface-2 px-2.5 py-1 text-2xs font-medium text-ink-2"
              >
                {u}
              </span>
            ))}
            {extraUtterances > 0 && (
              <span className="rounded-full bg-surface-2 px-2.5 py-1 text-2xs font-medium text-ink-3">
                +{extraUtterances} more
              </span>
            )}
          </div>
          {intent.sourceIds.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line-soft pt-3 text-xs text-ink-3">
              {intent.sourceIds.map(id => (
                <span key={id} className="flex items-center gap-1.5">
                  <FileText size={12} aria-hidden />
                  <span className="truncate">{sourceName(id)}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Step 4: Review generated intents ── */

export default function StepReview({
  draftIntents,
  selected,
  setSelected,
  sourceName,
  onStage,
}: {
  draftIntents: Intent[];
  selected: Set<string>;
  setSelected: (next: Set<string>) => void;
  sourceName: (id: string) => string;
  onStage: (ids: string[]) => void;
}) {
  const reduce = !!useReducedMotion();
  const selectedIds = draftIntents.filter(i => selected.has(i.id)).map(i => i.id);
  const allIds = draftIntents.map(i => i.id);

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  return (
    <section
      aria-label="Review generated intents"
      className="rounded-(--radius-card) border border-line bg-bg p-6 shadow-(--shadow-2) sm:p-7"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-medium tracking-[-0.01em] text-ink">
            Review generated intents
          </h2>
          <p className="mt-1 text-sm text-ink-2">
            Stage the drafts you want the checker to see. Staged intents move on to Review.
          </p>
        </div>
        {draftIntents.length > 0 && (
          <div className="flex shrink-0 items-center gap-2">
            <Button
              size="sm"
              disabled={selectedIds.length === 0}
              onClick={() => onStage(selectedIds)}
            >
              Stage selected{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
            </Button>
            <Button variant="primary" size="sm" onClick={() => onStage(allIds)}>
              Stage all {allIds.length}
            </Button>
          </div>
        )}
      </div>

      {draftIntents.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-(--radius-md) border border-dashed border-line px-6 py-14 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-accent-wash text-accent">
            <Sparkles size={19} aria-hidden />
          </span>
          <p className="text-sm font-semibold text-ink">All drafts staged</p>
          <p className="max-w-sm text-sm text-ink-2">
            Every intent from this run has been staged for review. Start another run or head to
            Review to submit them for approval.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {draftIntents.map(intent => (
              <IntentCard
                key={intent.id}
                intent={intent}
                selected={selected.has(intent.id)}
                sourceName={sourceName}
                reduce={reduce}
                onToggle={() => toggleOne(intent.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
