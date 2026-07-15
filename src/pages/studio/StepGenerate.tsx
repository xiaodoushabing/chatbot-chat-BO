import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, Loader2, Minus, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import type { Run, Source } from '../../data/types';
import { fmtDuration } from '../../lib/format';
import { Button } from '../../components/ui/controls';
import { Pill } from '../../components/ui/display';

const EASE = [0.22, 0.61, 0.36, 1] as const;
const R = 92;
const CIRC = 2 * Math.PI * R; // ≈ 578

/* Smoothly tween a display number toward a target between discrete store ticks. */
function useCountUp(target: number, reduce: boolean) {
  const [val, setVal] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (reduce) {
      from.current = target;
      setVal(target);
      return;
    }
    const startVal = from.current;
    const delta = target - startVal;
    if (delta === 0) return;
    const start = performance.now();
    const dur = 500;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(startVal + delta * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, reduce]);
  return val;
}

/* Live elapsed seconds while running; frozen duration once finished. */
function useElapsed(run: Run) {
  const running = run.status === 'running';
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => setTick(x => x + 1), 400);
    return () => clearInterval(t);
  }, [running]);
  if (!running) return run.durationSec ?? 0;
  return Math.max(0.001, (Date.now() - new Date(run.startedAt).getTime()) / 1000);
}

type TickState = 'pending' | 'doing' | 'done';
type TickVariant = 'ok' | 'skip' | 'fail';

function Tick({
  label,
  state,
  variant,
  reduce,
}: {
  label: string;
  state: TickState;
  variant: TickVariant;
  reduce: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          'grid h-5.5 w-5.5 shrink-0 place-items-center rounded-[7px] border transition-colors duration-300 ease-(--ease-out)',
          state === 'pending' && 'border-line bg-bg',
          state === 'doing' && 'border-transparent bg-transparent',
          state === 'done' && variant === 'ok' && 'border-live bg-live text-on-accent',
          state === 'done' && variant === 'skip' && 'border-staged bg-staged-bg text-staged',
          state === 'done' && variant === 'fail' && 'border-err bg-err-bg text-err',
        )}
        aria-hidden
      >
        {state === 'doing' && <Loader2 size={14} className="animate-spin text-accent" />}
        {state === 'done' && variant === 'ok' && (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <motion.path
              d="M20 6L9 17l-5-5"
              initial={reduce ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: reduce ? 0 : 0.35, ease: EASE }}
            />
          </svg>
        )}
        {state === 'done' && variant === 'skip' && <Minus size={12} />}
        {state === 'done' && variant === 'fail' && <X size={12} />}
      </span>
      <span
        className={cn(
          'truncate text-sm transition-colors duration-300',
          state === 'pending' ? 'text-ink-3' : 'text-ink',
        )}
      >
        {label}
      </span>
    </div>
  );
}

function Telemetry({ run, elapsed }: { run: Run; elapsed: number }) {
  const { done, total, intentsDrafted } = run.progress;
  const running = run.status === 'running';
  const throughput = elapsed > 0 ? intentsDrafted / elapsed : 0;
  const remainingUnits = Math.max(0, total - done);
  const etaSec = running && done > 0 ? Math.round((elapsed / done) * remainingUnits) : null;

  return (
    <dl
      className="grid grid-cols-2 gap-3 rounded-(--radius-md) border border-line bg-surface-2 p-3"
      aria-label="Live run telemetry"
    >
      <div>
        <dt className="text-2xs font-bold tracking-wider text-ink-3 uppercase">Throughput</dt>
        <dd className="mt-0.5 text-sm font-semibold tabular-nums text-ink">
          {throughput.toFixed(1)}
          <span className="ml-0.5 text-xs font-medium text-ink-3">intents/s</span>
        </dd>
      </div>
      <div>
        <dt className="text-2xs font-bold tracking-wider text-ink-3 uppercase">Est. remaining</dt>
        <dd className="mt-0.5 font-mono text-sm tabular-nums text-ink">
          {running ? (etaSec === null ? '—' : fmtDuration(etaSec)) : '00:00'}
        </dd>
      </div>
    </dl>
  );
}

/* ── Step 3: Generate — the signature moment ── */

export default function StepGenerate({
  run,
  topicSources,
}: {
  run: Run;
  topicSources: Source[];
}) {
  const navigate = useNavigate();
  const reduce = !!useReducedMotion();
  const running = run.status === 'running';
  const { done, total, intentsDrafted, succeeded, skipped, failed } = run.progress;
  const frac = total > 0 ? Math.min(1, done / total) : running ? 0 : 1;
  const count = useCountUp(intentsDrafted, reduce);
  const elapsed = useElapsed(run);

  // Tick list — real telemetry off the run.
  const ticks: { label: string; state: TickState; variant: TickVariant }[] =
    run.type === 'batch'
      ? run.children.map(c => ({
          label: `Row ${c.row} · ${c.intentQuestion}`,
          state:
            c.status === 'pending'
              ? 'pending'
              : c.status === 'running'
                ? 'doing'
                : 'done',
          variant: c.status === 'skipped' ? 'skip' : c.status === 'failed' ? 'fail' : 'ok',
        }))
      : run.sourceIds.map((id, i) => {
          const src = topicSources.find(s => s.id === id);
          return {
            label: src?.name ?? id,
            state: (i < done ? 'done' : i === done && running ? 'doing' : 'pending') as TickState,
            variant: 'ok' as TickVariant,
          };
        });

  return (
    <section
      aria-label="Generate"
      className="rounded-(--radius-card) border border-line bg-bg p-6 shadow-(--shadow-2) sm:p-7"
    >
      <div className="grid items-center gap-8 md:grid-cols-[auto_1fr]">
        {/* ring */}
        <div className="relative mx-auto" style={{ width: 212, height: 212 }}>
          <svg width="212" height="212" viewBox="0 0 212 212" className="-rotate-90">
            <circle cx="106" cy="106" r={R} fill="none" stroke="var(--surface-3)" strokeWidth="14" />
            <circle
              cx="106"
              cy="106"
              r={R}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - frac)}
              style={{
                transition: reduce ? undefined : 'stroke-dashoffset 0.5s var(--ease-out)',
              }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="font-display text-2xl font-medium tabular-nums text-ink" aria-live="polite">
                {count}
              </div>
              <div className="mt-1 text-2xs font-bold tracking-wider text-ink-3 uppercase">
                Intents drafted
              </div>
            </div>
          </div>
        </div>

        {/* status + telemetry + ticks */}
        <div className="min-w-0">
          <div className="mb-3">
            {running ? (
              <Pill tone="info" icon={Loader2} pulse>
                Generating
              </Pill>
            ) : run.status === 'completed' ? (
              <Pill tone="ok" icon={Check}>
                Complete
              </Pill>
            ) : (
              <Pill tone="err" icon={X}>
                {run.status === 'failed' ? 'Failed' : 'Dead'}
              </Pill>
            )}
          </div>
          <h2 className="font-display text-lg font-medium tracking-[-0.01em] text-ink">
            {run.type === 'batch' ? 'GenAI · Batch run' : 'GenAI · Single run'}
          </h2>
          <p className="mt-1 mb-4 text-sm text-ink-2">
            {running
              ? 'Reading your sources and clustering answers into intents.'
              : 'Every source has been processed.'}
          </p>

          <Telemetry run={run} elapsed={elapsed} />

          <div className="mt-4 flex max-h-56 flex-col gap-2.5 overflow-y-auto pr-1">
            {ticks.map((t, i) => (
              <Tick key={i} label={t.label} state={t.state} variant={t.variant} reduce={reduce} />
            ))}
          </div>
        </div>
      </div>

      {/* completion summary rises in */}
      <AnimatePresence initial={false}>
        {!running && (
          <motion.div
            key="summary"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0.15 : 0.5, ease: EASE }}
            className="mt-7 border-t border-line pt-7 text-center"
          >
            <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-live-bg text-live">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <motion.path
                  d="M20 6L9 17l-5-5"
                  initial={reduce ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: reduce ? 0 : 0.6, ease: EASE, delay: reduce ? 0 : 0.2 }}
                />
              </svg>
            </span>
            <h3 className="font-display text-lg font-medium text-ink">
              {run.status === 'completed' ? 'Run complete' : 'Run finished with errors'}
            </h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-ink-2">
              {intentsDrafted} intents drafted. Nothing is live yet — review the drafts before staging
              them for the checker.
            </p>
            <dl className="mx-auto mt-5 flex max-w-md flex-wrap justify-center gap-x-9 gap-y-4">
              {[
                ['Succeeded', succeeded, 'text-ok'],
                ['Skipped', skipped, 'text-warn'],
                ['Failed', failed, 'text-err'],
                ['Duration', fmtDuration(run.durationSec ?? 0), 'text-ink'],
              ].map(([k, v, tone]) => (
                <div key={k as string}>
                  <dd className={cn('font-display text-xl font-medium tabular-nums', tone as string)}>
                    {v}
                  </dd>
                  <dt className="text-2xs font-bold tracking-wider text-ink-3 uppercase">{k}</dt>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex justify-center">
              <Button variant="ghost" size="sm" onClick={() => navigate(`/studio/runs/${run.id}`)}>
                View full run detail
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
