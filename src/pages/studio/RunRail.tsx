import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence } from 'motion/react';
import { ChevronRight, History } from 'lucide-react';
import type { Run } from '../../data/types';
import { fmtDateTime, fmtDuration } from '../../lib/format';
import { EmptyState, Mono, RunStatusPill, SectionHeader } from '../../components/ui/display';
import { LiveRunCard } from './LiveRunCard';

/* ── Compact history run card ── */

function RunCard({ run }: { run: Run }) {
  const navigate = useNavigate();
  const meta =
    run.type === 'batch'
      ? (run.params.batchFile ?? 'Batch file')
      : `max ${run.params.maxIntents} · ${run.params.tonality}`;
  return (
    <button
      onClick={() => navigate(`/studio/runs/${run.id}`)}
      className="group flex w-full items-center gap-2.5 rounded-(--radius-field) border border-line bg-bg px-4 py-3 text-left transition-colors duration-150 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
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
    <section aria-label={title}>
      <SectionHeader title={title} count={runs.length} />
      {runs.length === 0 ? (
        <p className="rounded-(--radius-field) border border-dashed border-line px-4 py-3 text-sm text-ink-3">
          No {title.toLowerCase()} yet for this topic.
        </p>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {runs.map(r => (
            <RunCard key={r.id} run={r} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ── Run output & history: the run list, full width ── */

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

  if (!activeRun && topicRuns.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No runs yet for this topic"
        body="Launch a run from the Generation engine tab. Its live progress appears here, then it joins the history grouped by batch and single runs."
      />
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <AnimatePresence initial={false}>
        {activeRun && (
          <section aria-label="Live run">
            <SectionHeader title="Live run" />
            <LiveRunCard run={activeRun} onDismiss={onDismiss} />
          </section>
        )}
      </AnimatePresence>
      <RunGroup title="Batch runs" runs={history.batch} />
      <RunGroup title="Single runs" runs={history.single} />
    </div>
  );
}
