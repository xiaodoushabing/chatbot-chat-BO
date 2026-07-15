import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, ChevronRight, History, XCircle } from 'lucide-react';
import type { Run } from '../../data/types';
import { fmtDateTime, fmtDuration } from '../../lib/format';
import { Button } from '../../components/ui/controls';
import { Mono, ProgressBar, RunStatusPill } from '../../components/ui/display';

const EASE = [0.22, 1, 0.36, 1] as const;

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

/* ── Live run card: the signature moment (unchanged motion) ── */

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
      className="flex flex-col gap-4 rounded-(--radius-card) border border-line bg-surface-2 p-4"
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

/* ── Compact history run card ── */

function RunCard({ run }: { run: Run }) {
  const navigate = useNavigate();
  const meta =
    run.type === 'batch'
      ? run.params.batchFile ?? 'Batch file'
      : `max ${run.params.maxIntents} · ${run.params.tonality}`;
  return (
    <button
      onClick={() => navigate(`/studio/runs/${run.id}`)}
      className="group flex w-full items-center gap-2.5 rounded-(--radius-ctl) border border-line bg-bg px-3 py-2.5 text-left transition-colors duration-150 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
      aria-label={`Open run ${run.id}`}
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <Mono className="truncate">{run.id}</Mono>
          <RunStatusPill status={run.status} />
        </span>
        <span className="mt-1 block truncate text-2xs text-ink-3">
          <span className="font-mono">{fmtDateTime(run.startedAt)}</span>
          {' · '}
          <span className="font-mono tabular-nums">{fmtDuration(run.durationSec ?? 0)}</span>
          {' · '}
          {meta}
        </span>
      </span>
      <ChevronRight
        size={14}
        className="shrink-0 text-ink-3 transition-transform duration-150 group-hover:translate-x-0.5"
        aria-hidden
      />
    </button>
  );
}

function RunGroup({ title, runs }: { title: string; runs: Run[] }) {
  return (
    <section aria-label={title} className="flex flex-col gap-1.5">
      <h3 className="text-2xs font-bold tracking-wider text-ink-3 uppercase">
        {title} ({runs.length})
      </h3>
      {runs.length === 0 ? (
        <p className="rounded-(--radius-ctl) border border-dashed border-line px-3 py-2.5 text-xs text-ink-3">
          None yet for this topic.
        </p>
      ) : (
        runs.map(r => <RunCard key={r.id} run={r} />)
      )}
    </section>
  );
}

/* ── The rail: run output & history ── */

export default function RunRail({
  topicRuns,
  activeRun,
  onDismiss,
}: {
  topicRuns: Run[];
  activeRun: Run | null;
  onDismiss: () => void;
}) {
  const history = useMemo(() => {
    const rest = topicRuns
      .filter(r => r.id !== activeRun?.id)
      .slice()
      .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
    return {
      batch: rest.filter(r => r.type === 'batch'),
      single: rest.filter(r => r.type === 'single'),
    };
  }, [topicRuns, activeRun]);

  return (
    <aside
      aria-label="Run output and history"
      className="sticky top-0 flex w-80 shrink-0 flex-col gap-4 self-start"
    >
      <div className="flex items-center gap-2">
        <History size={15} className="text-accent" aria-hidden />
        <h2 className="text-md font-semibold text-ink">Run output &amp; history</h2>
      </div>

      <AnimatePresence initial={false}>
        {activeRun && <LiveRunCard run={activeRun} onDismiss={onDismiss} />}
      </AnimatePresence>

      {!activeRun && topicRuns.length === 0 ? (
        <p className="rounded-(--radius-card) border border-dashed border-line px-3 py-4 text-xs text-ink-2">
          No runs yet for this topic. Launch one from the generation engine — the live run appears
          here, then joins the history below.
        </p>
      ) : (
        <>
          <RunGroup title="Batch runs" runs={history.batch} />
          <RunGroup title="Single runs" runs={history.single} />
        </>
      )}
    </aside>
  );
}
