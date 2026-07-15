import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Check,
  ChevronRight,
  ChevronsUpDown,
  DatabaseZap,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Link2,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { useStore } from '../../state/store';
import type { IndexStatus, Run, Source, Topic } from '../../data/types';
import { fmtDateTime, fmtDuration, plural } from '../../lib/format';
import { Button, Checkbox, SearchField, Select } from '../../components/ui/controls';
import {
  BatchChildPill,
  EmptyState,
  IndexStatusPill,
  PageHeader,
  Pill,
  RunStatusPill,
  SectionHeader,
  TableSkeleton,
} from '../../components/ui/display';
import { TableShell, Td, Th, Tr } from '../../components/ui/table';
import GenerationRail from './GenerationRail';

/* ── Topic dropdown (header context) ── */

function TopicSelect({ topics, value, onChange }: { topics: Topic[]; value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);
  const current = topics.find(t => t.id === value);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Topic"
        className="flex h-8 items-center gap-2 rounded-(--radius-field) border border-line bg-bg px-2.5 text-sm font-semibold text-ink transition-colors duration-150 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
      >
        <FolderOpen size={13} className="text-ink-3" aria-hidden />
        {current?.name ?? 'Choose a topic'}
        <ChevronsUpDown size={13} className="text-ink-3" aria-hidden />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label="Topics in this project"
          className="absolute left-0 top-9.5 z-(--z-dropdown) w-72 rounded-(--radius-card) border border-line bg-bg p-1 shadow-(--shadow-pop)"
        >
          {topics.map(t => (
            <button
              key={t.id}
              role="option"
              aria-selected={t.id === value}
              onClick={() => {
                onChange(t.id);
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center gap-2 rounded-(--radius-ctl) px-2.5 py-2 text-left text-sm transition-colors duration-150 hover:bg-surface-2',
                t.id === value ? 'font-semibold text-ink' : 'text-ink-2',
              )}
            >
              <span className="min-w-0 flex-1">
                {t.name}
                <span className="block truncate font-mono text-2xs text-ink-3">/{t.folderName}</span>
              </span>
              {t.id === value && <Check size={14} className="shrink-0 text-accent" aria-hidden />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Sources panel ── */

function SourceIcon({ source }: { source: Source }) {
  const Icon = source.kind === 'url' ? Link2 : source.isSpreadsheet ? FileSpreadsheet : FileText;
  return <Icon size={14} className="shrink-0 text-ink-3" aria-hidden />;
}

type TypeFilter = 'all' | 'sharepoint' | 'url';
type StatusFilter = 'all' | IndexStatus;

function SourcesPanel({
  topicId,
  topicSources,
  selected,
  setSelected,
}: {
  topicId: string;
  topicSources: Source[];
  selected: Set<string>;
  setSelected: (next: Set<string>) => void;
}) {
  const { user, enumeratedTopics, markEnumerated, refreshSources, syncToIndex } = useStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const enumerating = !enumeratedTopics[topicId];

  useEffect(() => {
    setSearch('');
    setTypeFilter('all');
    setStatusFilter('all');
  }, [topicId]);

  // First visit to a topic: simulated SharePoint enumeration
  useEffect(() => {
    if (enumeratedTopics[topicId]) return;
    const t = window.setTimeout(() => markEnumerated(topicId), 1400);
    return () => clearTimeout(t);
  }, [topicId, enumeratedTopics, markEnumerated]);

  const isContributor = user.role === 'contributor';
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return topicSources.filter(s => {
      if (typeFilter !== 'all' && s.kind !== typeFilter) return false;
      if (statusFilter !== 'all' && s.indexStatus !== statusFilter) return false;
      if (q && !s.name.toLowerCase().includes(q) && !s.path.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [topicSources, search, typeFilter, statusFilter]);

  const selectable = filtered.filter(s => !isContributor || s.accessible);
  const allSelected = selectable.length > 0 && selectable.every(s => selected.has(s.id));
  const someSelected = selectable.some(s => selected.has(s.id));

  const toggleAll = () => {
    const next = new Set(selected);
    if (allSelected) selectable.forEach(s => next.delete(s.id));
    else selectable.forEach(s => next.add(s.id));
    setSelected(next);
  };

  const toggleOne = (id: string, on: boolean) => {
    const next = new Set(selected);
    if (on) next.add(id);
    else next.delete(id);
    setSelected(next);
  };

  const syncable = topicSources.filter(
    s => selected.has(s.id) && (s.indexStatus === 'not_indexed' || s.indexStatus === 'stale'),
  );

  const doRefresh = async () => {
    setRefreshing(true);
    await refreshSources(topicId);
    setRefreshing(false);
  };

  return (
    <section aria-label="Sources">
      <SectionHeader
        title="Sources"
        meta={`${filtered.length} of ${plural(topicSources.length, 'source')}`}
        actions={
          <>
            <Button size="sm" loading={refreshing} onClick={doRefresh}>
              {!refreshing && <RefreshCw size={12} aria-hidden />}
              Refresh list
            </Button>
            <Button
              size="sm"
              variant="primary"
              disabled={syncable.length === 0}
              onClick={() => syncToIndex(syncable.map(s => s.id))}
              title={syncable.length === 0 ? 'Select at least one not-indexed or stale source' : undefined}
            >
              <DatabaseZap size={12} aria-hidden />
              Sync to index{syncable.length > 0 && ` · ${syncable.length}`}
            </Button>
          </>
        }
      />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchField value={search} onChange={setSearch} placeholder="Search sources" className="w-64" />
        <Select
          aria-label="Filter by type"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as TypeFilter)}
          className="w-36"
        >
          <option value="all">All types</option>
          <option value="sharepoint">SharePoint</option>
          <option value="url">URL</option>
        </Select>
        <Select
          aria-label="Filter by index status"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as StatusFilter)}
          className="w-40"
        >
          <option value="all">All statuses</option>
          <option value="indexed">Indexed</option>
          <option value="not_indexed">Not indexed</option>
          <option value="indexing">Indexing</option>
          <option value="stale">Stale</option>
        </Select>
      </div>

      {enumerating ? (
        <div className="rounded-(--radius-ctl) border border-line px-3 py-2">
          <p className="px-2 pt-2 text-xs text-ink-2" role="status">
            Enumerating SharePoint folder…
          </p>
          <TableSkeleton rows={7} />
        </div>
      ) : topicSources.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No sources in this topic yet"
          body="Drop documents into the topic's SharePoint folder, or add URLs to its manifest, then refresh the list to pull them in."
          action={
            <Button size="sm" onClick={doRefresh} loading={refreshing}>
              Refresh list
            </Button>
          }
        />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <Th className="w-9">
                <Checkbox
                  aria-label={allSelected ? 'Deselect all sources' : 'Select all sources'}
                  checked={allSelected}
                  indeterminate={someSelected && !allSelected}
                  onChange={toggleAll}
                  disabled={selectable.length === 0}
                />
              </Th>
              <Th>Name</Th>
              <Th>Type</Th>
              <Th>Modified</Th>
              <Th>Index status</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-sm text-ink-2">
                  No sources match the current filters.
                </td>
              </tr>
            )}
            {filtered.map(s => {
              const locked = isContributor && !s.accessible;
              return (
                <Tr key={s.id} selected={selected.has(s.id)} disabled={locked}>
                  <Td>
                    {locked ? (
                      <span title="You don't have access to this document in SharePoint">
                        <Lock size={13} className="text-ink-3" aria-label="No access" />
                      </span>
                    ) : (
                      <Checkbox
                        aria-label={`Select ${s.name}`}
                        checked={selected.has(s.id)}
                        onChange={e => toggleOne(s.id, e.target.checked)}
                      />
                    )}
                  </Td>
                  <Td className="max-w-90">
                    <span
                      className="flex items-center gap-2"
                      title={locked ? "You don't have access to this document in SharePoint" : s.path}
                    >
                      <SourceIcon source={s} />
                      <span className="truncate text-ink">{s.name}</span>
                    </span>
                  </Td>
                  <Td className="whitespace-nowrap text-ink-2">
                    {s.kind === 'url' ? 'URL' : 'SharePoint'}
                  </Td>
                  <Td mono className="whitespace-nowrap">
                    {fmtDateTime(s.modifiedAt)}
                  </Td>
                  <Td>
                    <IndexStatusPill status={s.indexStatus} />
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </TableShell>
      )}
    </section>
  );
}

/* ── Run history ── */

function RunHistory({ topicRuns }: { topicRuns: Run[] }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <section aria-label="Run history" className="mt-10">
      <SectionHeader title="Run history" meta={plural(topicRuns.length, 'run')} />
      {topicRuns.length === 0 ? (
        <EmptyState
          title="No runs yet for this topic"
          body="Select sources above and launch a GenAI run from the rail on the right. Each run's drafted intents land here, ready to stage."
        />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <Th className="w-9">
                <span className="sr-only">Expand</span>
              </Th>
              <Th>Run</Th>
              <Th>Type</Th>
              <Th>Status</Th>
              <Th className="text-right">Drafted</Th>
              <Th className="text-right">Duration</Th>
              <Th>Started by</Th>
              <Th>Started at</Th>
            </tr>
          </thead>
          <tbody>
            {topicRuns.map(run => (
              <RunRows
                key={run.id}
                run={run}
                open={expanded.has(run.id)}
                onToggle={() => toggle(run.id)}
                onOpen={() => navigate(`/studio/runs/${run.id}`)}
              />
            ))}
          </tbody>
        </TableShell>
      )}
    </section>
  );
}

function RunRows({
  run,
  open,
  onToggle,
  onOpen,
}: {
  run: Run;
  open: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const isBatch = run.type === 'batch';
  return (
    <>
      <Tr onClick={onOpen}>
        <Td>
          {isBatch && (
            <button
              aria-label={open ? `Collapse rows of ${run.id}` : `Expand rows of ${run.id}`}
              aria-expanded={open}
              onClick={e => {
                e.stopPropagation();
                onToggle();
              }}
              className="flex h-6 w-6 items-center justify-center rounded-(--radius-ctl) text-ink-3 transition-colors duration-150 hover:bg-surface-3 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
            >
              <ChevronRight
                size={13}
                className={cn('transition-transform duration-200 ease-(--ease-out)', open && 'rotate-90')}
                aria-hidden
              />
            </button>
          )}
        </Td>
        <Td mono className="whitespace-nowrap text-ink">
          {run.id}
        </Td>
        <Td className="whitespace-nowrap text-ink-2">{isBatch ? 'GenAI · Batch' : 'GenAI · Single'}</Td>
        <Td>
          <RunStatusPill status={run.status} />
        </Td>
        <Td mono className="text-right tabular-nums">
          {run.progress.intentsDrafted}
        </Td>
        <Td mono className="text-right tabular-nums">
          {run.durationSec != null ? fmtDuration(run.durationSec) : '—'}
        </Td>
        <Td className="whitespace-nowrap text-ink-2">{run.startedBy}</Td>
        <Td mono className="whitespace-nowrap">
          {fmtDateTime(run.startedAt)}
        </Td>
      </Tr>
      {isBatch &&
        open &&
        run.children.map(c => (
          <Tr key={c.id} className="bg-surface-2/60">
            <Td />
            <Td mono className="whitespace-nowrap">
              row {c.row}
            </Td>
            <Td>
              <span className="block max-w-72 truncate text-xs text-ink">{c.intentQuestion}</span>
              {c.note && <span className="block max-w-72 truncate text-2xs text-ink-3">{c.note}</span>}
            </Td>
            <Td>
              <BatchChildPill status={c.status} />
            </Td>
            <Td mono className="text-right tabular-nums">
              {c.intentIds.length}
            </Td>
            <Td mono className="text-right tabular-nums">
              {c.durationSec != null ? fmtDuration(c.durationSec) : '—'}
            </Td>
            <Td />
            <Td />
          </Tr>
        ))}
    </>
  );
}

/* ── Page ── */

export default function IntentStudio() {
  const { projectId, topics, sources, runs, topicId, setTopic } = useStore();
  const projectTopics = useMemo(() => topics.filter(t => t.projectId === projectId), [topics, projectId]);
  const topic = projectTopics.find(t => t.id === topicId) ?? null;

  // Topic is required context: auto-select the project's first topic when unset.
  useEffect(() => {
    if (!topic && projectTopics.length > 0) setTopic(projectTopics[0].id);
  }, [topic, projectTopics, setTopic]);

  const topicSources = useMemo(
    () => (topic ? sources.filter(s => s.topicId === topic.id) : []),
    [sources, topic],
  );
  const topicRuns = useMemo(() => (topic ? runs.filter(r => r.topicId === topic.id) : []), [runs, topic]);
  const notIndexed = topicSources.filter(s => s.indexStatus === 'not_indexed').length;
  const stale = topicSources.filter(s => s.indexStatus === 'stale').length;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const topicKey = topic?.id;
  useEffect(() => setSelected(new Set()), [topicKey]);

  if (projectTopics.length === 0) {
    return (
      <>
        <PageHeader
          title="Intent Studio"
          sub="Pick a topic, sync its sources, and generate intent–response drafts."
        />
        <EmptyState
          icon={FolderOpen}
          title="This project has no topics yet"
          body="Promote subfolders of the project's SharePoint root to topics in Project Settings, then come back to generate intents."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Intent Studio"
        sub="Pick a topic, sync its sources, and generate intent–response drafts."
        context={
          topic && (
            <div className="flex flex-wrap items-center gap-3">
              <TopicSelect topics={projectTopics} value={topic.id} onChange={setTopic} />
              <span className="font-mono text-xs text-ink-2">
                {topic.lastSyncedAt ? `Last synced ${fmtDateTime(topic.lastSyncedAt)}` : 'Never synced'}
              </span>
              {notIndexed > 0 && <Pill tone="warn">{notIndexed} not indexed</Pill>}
              {stale > 0 && <Pill tone="warn">{stale} stale</Pill>}
            </div>
          )
        }
      />
      {topic && (
        <div className="flex items-start gap-6">
          <div className="min-w-0 flex-1">
            <SourcesPanel
              topicId={topic.id}
              topicSources={topicSources}
              selected={selected}
              setSelected={setSelected}
            />
            <RunHistory topicRuns={topicRuns} />
          </div>
          <GenerationRail topicId={topic.id} topicSources={topicSources} selectedSourceIds={[...selected]} />
        </div>
      )}
    </>
  );
}
