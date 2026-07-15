import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Inbox,
  Sparkles,
} from 'lucide-react';
import { useStore } from '../../state/store';
import { fmtDateTime, fmtDuration, plural } from '../../lib/format';
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

/* ── Pipeline flow strip: draft → staged → pending approval → live ── */

function FlowStrip({ intents }: { intents: Intent[] }) {
  const count = (state: Intent['state']) => intents.filter(i => i.state === state).length;
  const stages = [
    { key: 'draft', label: 'Draft', count: count('draft'), to: '/studio', hint: 'awaiting staging in Studio' },
    { key: 'staged', label: 'Staged', count: count('staged'), to: '/review', hint: 'in Review' },
    { key: 'pending', label: 'Pending approval', count: count('pending_approval'), to: '/approvals', hint: 'with checkers' },
    { key: 'live', label: 'Live', count: count('live'), to: '/library', hint: 'in the Intent Library' },
  ];
  return (
    <div
      role="navigation"
      aria-label="Intent pipeline"
      className="flex items-stretch overflow-x-auto rounded-(--radius-ctl) border border-line"
    >
      {stages.map((s, i) => (
        <div key={s.key} className="flex min-w-0 flex-1 items-stretch">
          {i > 0 && (
            <span className="flex items-center border-l border-line px-1 text-ink-3" aria-hidden>
              <ChevronRight size={13} />
            </span>
          )}
          <Link
            to={s.to}
            aria-label={`${plural(s.count, `${s.label.toLowerCase()} intent`)} — ${s.hint}`}
            className="group min-w-0 flex-1 px-4 py-3 transition-colors duration-150 hover:bg-surface-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--accent)"
          >
            <span className="block text-2xs font-bold tracking-wider text-ink-3 uppercase">{s.label}</span>
            <span className="mt-0.5 flex items-baseline gap-2">
              <span className="font-mono text-lg font-semibold text-ink tabular-nums">{s.count}</span>
              <span className="text-xs text-ink-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 max-lg:hidden">
                {s.hint}
              </span>
            </span>
          </Link>
        </div>
      ))}
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
      <p className="flex items-center gap-2 rounded-(--radius-ctl) border border-dashed border-line px-4 py-3.5 text-sm text-ink-2">
        <CheckCircle2 size={14} className="shrink-0 text-ok" aria-hidden />
        Nothing needs your attention right now.
      </p>
    );
  }
  return (
    <ul className="overflow-hidden rounded-(--radius-ctl) border border-line">
      {items.map(item => (
        <li key={item.id} className="border-b border-line last:border-b-0">
          <Link
            to={item.to}
            className="flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-surface-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--accent)"
          >
            {item.pill}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-ink">{item.title}</span>
              <span className="block truncate text-xs text-ink-2">{item.meta}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-accent">
              {item.action}
              <ArrowRight size={12} aria-hidden />
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
    <TableShell>
      <thead>
        <tr>
          <Th>Run</Th>
          <Th>Type</Th>
          <Th>Topic</Th>
          <Th>Status</Th>
          <Th className="text-right">Drafted</Th>
          <Th className="text-right">OK / Skip / Fail</Th>
          <Th className="text-right">Duration</Th>
          <Th>Started</Th>
        </tr>
      </thead>
      <tbody>
        {runs.map(run => {
          const topic = topics.find(t => t.id === run.topicId);
          const p = run.progress;
          return (
            <Tr key={run.id} onClick={() => navigate(`/studio/runs/${run.id}`)}>
              <Td mono>
                <Link
                  to={`/studio/runs/${run.id}`}
                  onClick={e => e.stopPropagation()}
                  className="text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--accent)"
                >
                  {run.id}
                </Link>
              </Td>
              <Td className="text-sm text-ink-2 capitalize">{run.type}</Td>
              <Td className="text-sm text-ink">{topic?.name ?? '—'}</Td>
              <Td>
                <RunStatusPill status={run.status} />
              </Td>
              <Td mono className="text-right tabular-nums">
                {p.intentsDrafted}
              </Td>
              <Td mono className="text-right tabular-nums">
                {p.succeeded} / {p.skipped} / {p.failed}
              </Td>
              <Td mono className="text-right tabular-nums">
                {run.durationSec !== null ? fmtDuration(run.durationSec) : '—'}
              </Td>
              <Td>
                <span className="block text-sm text-ink">{run.startedBy}</span>
                <Mono className="text-2xs">{fmtDateTime(run.startedAt)}</Mono>
              </Td>
            </Tr>
          );
        })}
      </tbody>
    </TableShell>
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

      <div className="flex flex-col gap-10">
        <section aria-label="Intent pipeline">
          <SectionHeader
            title="Pipeline"
            meta={`${plural(projectIntents.filter(i => i.state !== 'deleted').length, 'intent')} in flow`}
          />
          <FlowStrip intents={projectIntents} />
        </section>

        <section aria-label="Needs my attention">
          <SectionHeader
            title="Needs my attention"
            meta={
              user.role === 'checker'
                ? `${plural(pendingCount, 'pending request')} in project`
                : attention.length > 0
                  ? plural(attention.length, 'item')
                  : undefined
            }
          />
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
