import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { Run } from '../../data/types';
import { fmtDuration } from '../../lib/format';
import { Button } from '../../components/ui/controls';
import { Mono, ProgressBar, RunStatusPill } from '../../components/ui/display';

/* ── The live run card: the signature moment ──
   Shared between the Generation engine tab (top, while a run is active) and the
   Run output & history tab. Pulsing status pill, progress track, mono count-up of
   drafted intents, elapsed timer; on completion the drawn-check summary settles in
   with a "View intents" link into the run detail. Motion unchanged. */

const EASE = [0.22, 1, 0.36, 1] as const;

function Elapsed({
  startedAt,
  running,
  durationSec,
}: {
  startedAt: string;
  running: boolean;
  durationSec: number | null;
}) {
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

export function LiveRunCard({ run, onDismiss }: { run: Run; onDismiss: () => void }) {
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
      className="flex flex-col gap-4 rounded-(--radius-card) border border-line bg-surface-2 p-5 shadow-(--shadow-soft)"
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
            {p.done}
            <span className="text-ink-3"> / {p.total}</span>
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
              <div className="flex flex-wrap gap-2">
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
