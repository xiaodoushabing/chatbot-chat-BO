import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardCheck, Inbox, Sparkles, TrendingUp } from 'lucide-react';
import { useStore } from '../../state/store';
import { fmtDateTime, plural } from '../../lib/format';
import { cn } from '../../lib/cn';
import { Button } from '../../components/ui/controls';
import {
  ApprovalStatusPill,
  EmptyState,
  IntentStatePill,
  Mono,
  PageHeader,
  Pill,
  RunStatusPill,
  SectionHeader,
} from '../../components/ui/display';
import { TableShell, Th, Tr, Td } from '../../components/ui/table';
import type { Intent, Run, Topic } from '../../data/types';

const STALE_MS = 7 * 24 * 60 * 60 * 1000;

function isStale(iso: string | null): boolean {
  return iso !== null && Date.now() - new Date(iso).getTime() > STALE_MS;
}

/* Shared card shell for the dashboard's summary cards — white, 22px radius, soft shadow. */
const CARD = 'rounded-(--radius-card) border border-line bg-bg p-6 shadow-(--shadow-soft) sm:p-7';

/* ── Pipeline flow: draft → staged → pending approval → live ──
   Big Fraunces numerals in lifecycle colors, each a link into the stage's home
   screen, with a thin gradient connector that fills on first paint. */

const STAGE_TONE = {
  draft: { text: 'text-draft', dot: 'bg-draft' },
  staged: { text: 'text-staged', dot: 'bg-staged' },
  pending: { text: 'text-pending', dot: 'bg-pending' },
  live: { text: 'text-live', dot: 'bg-live' },
} as const;

function FlowStrip({ intents }: { intents: Intent[] }) {
  const count = (state: Intent['state']) => intents.filter(i => i.state === state).length;
  const stages: Array<{ key: keyof typeof STAGE_TONE; label: string; count: number; to: string; hint: string }> = [
    { key: 'draft', label: 'Draft', count: count('draft'), to: '/studio', hint: 'awaiting staging in Studio' },
    { key: 'staged', label: 'Staged', count: count('staged'), to: '/review', hint: 'in Review' },
    { key: 'pending', label: 'Pending', count: count('pending_approval'), to: '/approvals', hint: 'with checkers' },
    { key: 'live', label: 'Live', count: count('live'), to: '/library', hint: 'in the Intent Library' },
  ];

  return (
    <div role="navigation" aria-label="Intent pipeline" className="flex items-stretch gap-2">
      {stages.map(s => {
        const tone = STAGE_TONE[s.key];
        return (
          <Link
            key={s.key}
            to={s.to}
            aria-label={`${plural(s.count, `${s.label.toLowerCase()} intent`)} — ${s.hint}`}
            title={s.hint}
            className="group min-w-0 flex-1 rounded-(--radius-field) px-3 py-4 text-center transition-colors duration-150 ease-(--ease-out) hover:bg-surface-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--accent)"
          >
            <span
              className={cn(
                'block font-display text-[2.75rem] leading-none font-semibold tracking-[-0.02em] tabular-nums transition-transform duration-200 ease-(--ease-out) group-hover:scale-[1.04]',
                tone.text,
              )}
            >
              {s.count}
            </span>
            <span className="mt-3 block text-xs font-semibold tracking-wide text-ink-2 uppercase">{s.label}</span>
            <span className={cn('mx-auto mt-3.5 block h-2.5 w-2.5 rounded-full', tone.dot)} aria-hidden />
          </Link>
        );
      })}
    </div>
  );
}

/* ── Needs my attention ── */

interface AttentionItem {
  id: string;
  title: string;
  meta: string;
  pill: React.ReactNode;
  to: string;
  action: string;
}

function AttentionList({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) {
    return (
      <p className="flex items-center gap-2.5 rounded-(--radius-field) border border-dashed border-line px-4 py-4 text-sm text-ink-2">
        <CheckCircle2 size={15} className="shrink-0 text-ok" aria-hidden />
        Nothing needs your attention right now.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map(item => (
        <li key={item.id}>
          <Link
            to={item.to}
            className="group flex items-start gap-3.5 rounded-(--radius-md) border border-line bg-canvas/50 px-4 py-3.5 transition-[background-color,border-color,transform,box-shadow] duration-200 ease-(--ease-out) hover:-translate-y-px hover:border-accent/30 hover:bg-bg hover:shadow-(--shadow-soft) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--accent)"
          >
            <span className="mt-0.5 shrink-0">{item.pill}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-ink">{item.title}</span>
              <span className="mt-0.5 block text-xs text-ink-3 line-clamp-2">{item.meta}</span>
            </span>
            <span className="mt-0.5 flex shrink-0 items-center gap-1 text-xs font-semibold text-accent">
              {item.action}
              <ArrowRight size={12} className="transition-transform duration-150 ease-(--ease-out) group-hover:translate-x-0.5" aria-hidden />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* ── Recent runs ── */

function RecentRuns({ runs, topics }: { runs: Run[]; topics: Topic[] }) {
  const navigate = useNavigate();
  if (runs.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No generation runs yet"
        body="Sync your topic sources to the index, then generate intents from them in Intent Studio. Completed runs appear here with their counts and durations."
        action={
          <Button variant="primary" onClick={() => navigate('/studio')}>
            Generate intents
          </Button>
        }
      />
    );
  }
  return (
    <div className="overflow-hidden rounded-(--radius-card) border border-line bg-bg shadow-(--shadow-soft)">
      <ul>
        {runs.map(run => {
          const topic = topics.find(t => t.id === run.topicId);
          return (
            <li key={run.id} className="border-b border-line-soft last:border-b-0">
              <Link
                to={`/studio/runs/${run.id}`}
                className="group flex items-center gap-4 px-5 py-4 transition-colors duration-150 ease-(--ease-out) hover:bg-surface-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--accent)"
              >
                <span className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-(--radius-ctl) bg-accent-wash text-accent transition-transform duration-200 ease-(--ease-out) group-hover:scale-105">
                  <Sparkles size={16} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="truncate text-sm font-semibold text-ink">
                      {topic?.name ?? 'Unknown topic'}
                      <span className="font-normal text-ink-3"> · {run.type === 'batch' ? 'Batch' : 'Single'}</span>
                    </span>
                    <RunStatusPill status={run.status} />
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-ink-3">
                    {run.startedBy} · {fmtDateTime(run.startedAt)} · {plural(run.sourceIds.length, 'source')}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-display text-lg leading-none font-medium tabular-nums text-ink">
                    {run.progress.intentsDrafted}
                  </span>
                  <span className="mt-1 block text-2xs font-semibold tracking-wide text-ink-3 uppercase">Intents</span>
                </span>
                <ArrowRight
                  size={15}
                  className="shrink-0 text-ink-3 transition-[transform,color] duration-150 ease-(--ease-out) group-hover:translate-x-0.5 group-hover:text-accent"
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ── Topic freshness ── */

function TopicFreshness({ topics }: { topics: Topic[] }) {
  const { sources, setTopic } = useStore();
  const navigate = useNavigate();
  if (topics.length === 0) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="No topics in this project"
        body="Promote subfolders of the project's SharePoint root to topics in Project Settings. Each topic carries its own sources and intents."
        action={
          <Button variant="primary" onClick={() => navigate('/settings')}>
            Open Project Settings
          </Button>
        }
      />
    );
  }
  const openInStudio = (topicId: string) => {
    setTopic(topicId);
    navigate('/studio');
  };
  return (
    <TableShell>
      <thead>
        <tr>
          <Th>Topic</Th>
          <Th className="text-right">Sources</Th>
          <Th className="text-right">Not indexed</Th>
          <Th>Last synced</Th>
          <Th>
            <span className="sr-only">Actions</span>
          </Th>
        </tr>
      </thead>
      <tbody>
        {topics.map(topic => {
          const topicSources = sources.filter(s => s.topicId === topic.id);
          const notIndexed = topicSources.filter(s => s.indexStatus === 'not_indexed').length;
          const stale = isStale(topic.lastSyncedAt);
          return (
            <Tr key={topic.id} onClick={() => openInStudio(topic.id)}>
              <Td>
                <span className="block text-sm font-medium text-ink">{topic.name}</span>
                <Mono className="text-2xs">{topic.folderName}</Mono>
              </Td>
              <Td mono className="text-right tabular-nums">
                {topicSources.length}
              </Td>
              <Td className="text-right">
                {notIndexed > 0 ? (
                  <span className="font-mono text-xs font-semibold text-warn tabular-nums">
                    {notIndexed} not indexed
                  </span>
                ) : (
                  <Mono className="tabular-nums">0</Mono>
                )}
              </Td>
              <Td>
                <span className="flex items-center gap-2">
                  {topic.lastSyncedAt !== null ? (
                    <Mono>{fmtDateTime(topic.lastSyncedAt)}</Mono>
                  ) : (
                    <Pill tone="warn">Never synced</Pill>
                  )}
                  {stale && <Pill tone="warn">Stale</Pill>}
                </span>
              </Td>
              <Td className="text-right">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={e => {
                    e.stopPropagation();
                    openInStudio(topic.id);
                  }}
                >
                  Open in Studio
                  <ArrowRight size={12} aria-hidden />
                </Button>
              </Td>
            </Tr>
          );
        })}
      </tbody>
    </TableShell>
  );
}

/* ── Page ── */

export default function Dashboard() {
  const { user, projectId, projects, topics, runs, intents, approvals } = useStore();
  const navigate = useNavigate();
  const project = projects.find(p => p.id === projectId)!;

  const projectTopics = useMemo(() => topics.filter(t => t.projectId === projectId), [topics, projectId]);
  const topicIds = useMemo(() => new Set(projectTopics.map(t => t.id)), [projectTopics]);

  const projectIntents = useMemo(() => intents.filter(i => topicIds.has(i.topicId)), [intents, topicIds]);
  const projectRuns = useMemo(
    () =>
      runs
        .filter(r => topicIds.has(r.topicId))
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()),
    [runs, topicIds],
  );
  const recentRuns = projectRuns.slice(0, 5);
  const projectApprovals = useMemo(() => approvals.filter(a => topicIds.has(a.topicId)), [approvals, topicIds]);

  // Calm, factual pulse for the pipeline card — intents touched in the last 7 days.
  const recentlyTouched = useMemo(
    () =>
      projectIntents.filter(i => i.state !== 'deleted' && Date.now() - new Date(i.updatedAt).getTime() <= STALE_MS)
        .length,
    [projectIntents],
  );

  const topicName = (id: string) => projectTopics.find(t => t.id === id)?.name ?? '—';

  const attention = useMemo<AttentionItem[]>(() => {
    if (user.role === 'checker') {
      // Maker–checker segregation: checkers act only on requests they did not submit.
      return projectApprovals
        .filter(a => a.status === 'pending' && a.submittedBy !== user.name)
        .map(a => ({
          id: a.id,
          title: `${plural(a.intentIds.length, 'intent')} for ${topicName(a.topicId)} awaiting your decision`,
          meta: `Request ${a.id} · submitted by ${a.submittedBy}, ${fmtDateTime(a.submittedAt)}`,
          pill: <ApprovalStatusPill status="pending" />,
          to: '/approvals',
          action: 'Review request',
        }));
    }
    const myPending: AttentionItem[] = projectApprovals
      .filter(a => a.status === 'pending' && a.submittedBy === user.name)
      .map(a => ({
        id: a.id,
        title: `${plural(a.intentIds.length, 'intent')} for ${topicName(a.topicId)} awaiting a checker`,
        meta: `Request ${a.id} · submitted ${fmtDateTime(a.submittedAt)}`,
        pill: <ApprovalStatusPill status="pending" />,
        to: '/approvals',
        action: 'View request',
      }));
    const myRejected: AttentionItem[] = projectIntents
      .filter(i => i.state === 'rejected' && i.createdBy === user.name)
      .map(i => ({
        id: i.id,
        title: i.question,
        meta: i.reviewNote
          ? `${topicName(i.topicId)} · Checker note: ${i.reviewNote}`
          : `${topicName(i.topicId)} · rejected — amend and resubmit`,
        pill: <IntentStatePill state="rejected" />,
        to: '/review',
        action: 'Amend in Review',
      }));
    return [...myPending, ...myRejected];
  }, [user.role, user.name, projectApprovals, projectIntents, projectTopics]);

  const pendingCount = projectApprovals.filter(a => a.status === 'pending').length;
  const attentionMeta =
    user.role === 'checker'
      ? `${plural(pendingCount, 'pending request')} in project`
      : attention.length > 0
        ? plural(attention.length, 'item')
        : undefined;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        sub={`${project.name} at a glance — pipeline state, recent generation runs, and topic freshness.`}
        actions={
          user.role === 'checker' ? (
            <Button variant="primary" onClick={() => navigate('/approvals')}>
              <Inbox size={14} aria-hidden />
              Open approvals
            </Button>
          ) : (
            <>
              <Button onClick={() => navigate('/review')}>Review staged</Button>
              <Button variant="primary" onClick={() => navigate('/studio')}>
                <Sparkles size={14} aria-hidden />
                Generate intents
              </Button>
            </>
          )
        }
      />

      <div className="flex flex-col gap-8">
        {/* Pipeline — full width */}
        <section aria-label="Intent pipeline" className={CARD}>
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <SectionHeader title="Pipeline" plain />
            {recentlyTouched > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-ink-3">
                <TrendingUp size={13} className="text-accent" aria-hidden />
                {plural(recentlyTouched, 'intent')} touched this week
              </span>
            )}
          </div>
          <FlowStrip intents={projectIntents} />
        </section>

        {/* Needs your attention — its own row */}
        <section aria-label="Needs my attention" className={CARD}>
          <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
            <h2 className="flex items-center gap-2 text-md font-semibold tracking-[-0.005em] text-ink">
              <AlertTriangle size={16} className="text-staged" aria-hidden />
              Needs your attention
            </h2>
            {attentionMeta && <span className="font-mono text-xs text-ink-3">{attentionMeta}</span>}
          </div>
          <AttentionList items={attention} />
        </section>

        <section aria-label="Recent runs">
          <SectionHeader
            title="Recent runs"
            meta={projectRuns.length > 0 ? `last ${recentRuns.length} of ${projectRuns.length}` : undefined}
            actions={
              projectRuns.length > 0 && (
                <Link
                  to="/studio"
                  className={cn(
                    'flex items-center gap-1 text-xs font-semibold text-accent transition-colors hover:underline',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)',
                  )}
                >
                  All runs in Studio
                  <ArrowRight size={12} aria-hidden />
                </Link>
              )
            }
          />
          <RecentRuns runs={recentRuns} topics={projectTopics} />
        </section>

        <section aria-label="Topic freshness">
          <SectionHeader
            title="Topic freshness"
            meta={projectTopics.length > 0 ? plural(projectTopics.length, 'topic') : undefined}
          />
          <TopicFreshness topics={projectTopics} />
        </section>
      </div>
    </div>
  );
}
