import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
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
import type { IndexStatus, Source, Topic } from '../../data/types';
import { fmtDate, fmtDateTime, plural } from '../../lib/format';
import { Button, Checkbox, SearchField, SegmentedControl, Select } from '../../components/ui/controls';
import {
  EmptyState,
  IndexStatusPill,
  PageHeader,
  Pill,
  SectionHeader,
  TableSkeleton,
} from '../../components/ui/display';
import { TableShell, Td, Th, Tr } from '../../components/ui/table';
import GenerationEngine from './GenerationEngine';
import RunRail from './RunRail';

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

/* ── Two-axis sync control (popover off the sources toolbar) ──
   Axis 1: source category. Axis 2: sync level — shallow file listing
   (re-enumerate the cache) vs vector DB ingestion (embed for GenAI). */

type SyncCategory = 'all' | 'sharepoint' | 'url';
type SyncLevel = 'shallow' | 'vector';

function SyncControl({
  topicId,
  topicSources,
  selected,
  isContributor,
}: {
  topicId: string;
  topicSources: Source[];
  selected: Set<string>;
  isContributor: boolean;
}) {
  const { refreshSources, syncToIndex } = useStore();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<SyncCategory>('all');
  const [level, setLevel] = useState<SyncLevel>('shallow');
  const [busy, setBusy] = useState(false);
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

  // Vector targets: not-indexed/stale sources in the chosen category, narrowed
  // to the table selection when it intersects.
  const candidates = topicSources.filter(
    s =>
      (category === 'all' || s.kind === category) &&
      (!isContributor || s.accessible) &&
      (s.indexStatus === 'not_indexed' || s.indexStatus === 'stale'),
  );
  const selectedCandidates = candidates.filter(s => selected.has(s.id));
  const vectorTargets = selectedCandidates.length > 0 ? selectedCandidates : candidates;
  const scopeNote =
    selectedCandidates.length > 0 ? 'from your table selection' : 'across the whole category';

  const execute = async () => {
    if (level === 'shallow') {
      setBusy(true);
      await refreshSources(topicId);
      setBusy(false);
    } else {
      syncToIndex(vectorTargets.map(s => s.id));
    }
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <Button size="sm" onClick={() => setOpen(v => !v)} aria-haspopup="dialog" aria-expanded={open}>
        <DatabaseZap size={12} aria-hidden />
        Sync
        <ChevronDown size={12} className={cn('transition-transform duration-150', open && 'rotate-180')} aria-hidden />
      </Button>
      {open && (
        <div
          role="dialog"
          aria-label="Sync sources"
          className="absolute right-0 top-8.5 z-(--z-dropdown) w-84 rounded-(--radius-card) border border-line bg-bg p-4 shadow-(--shadow-pop)"
        >
          <div className="flex flex-col gap-4">
            <fieldset className="flex flex-col gap-1.5">
              <legend className="text-2xs font-bold tracking-wider text-ink-3 uppercase">
                1 · Source category
              </legend>
              <SegmentedControl<SyncCategory>
                options={[
                  { value: 'all', label: 'All sources' },
                  { value: 'sharepoint', label: 'SharePoint files' },
                  { value: 'url', label: 'URLs' },
                ]}
                value={category}
                onChange={setCategory}
              />
            </fieldset>
            <fieldset className="flex flex-col gap-1.5">
              <legend className="text-2xs font-bold tracking-wider text-ink-3 uppercase">
                2 · Sync level
              </legend>
              <SegmentedControl<SyncLevel>
                options={[
                  { value: 'shallow', label: 'Shallow file listing' },
                  { value: 'vector', label: 'Vector DB ingestion' },
                ]}
                value={level}
                onChange={setLevel}
              />
              <p className="text-xs text-ink-2">
                {level === 'shallow'
                  ? 'Re-enumerates names and paths from SharePoint into the cache. Fast; does not touch the vector index.'
                  : `Embeds content for GenAI matching. Targets the not-indexed and stale sources ${scopeNote}.`}
              </p>
            </fieldset>
            <Button
              variant="primary"
              className="w-full"
              loading={busy}
              disabled={level === 'vector' && vectorTargets.length === 0}
              onClick={execute}
            >
              {level === 'shallow'
                ? 'Refresh file listing'
                : vectorTargets.length === 0
                  ? 'Nothing to ingest'
                  : `Ingest ${plural(vectorTargets.length, 'source')}`}
            </Button>
          </div>
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
  const selectedCount = selectable.filter(s => selected.has(s.id)).length;
  const allSelected = selectable.length > 0 && selectedCount === selectable.length;
  const someSelected = selectedCount > 0;

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
        title={`Sources (${topicSources.length})`}
        actions={
          <>
            <Button size="sm" loading={refreshing} onClick={doRefresh}>
              {!refreshing && <RefreshCw size={12} aria-hidden />}
              Refresh SharePoint cache
            </Button>
            <SyncControl
              topicId={topicId}
              topicSources={topicSources}
              selected={selected}
              isContributor={isContributor}
            />
          </>
        }
      />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchField value={search} onChange={setSearch} placeholder="Search sources" className="w-64" />
        <Select
          aria-label="Filter by format"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as TypeFilter)}
          className="w-40"
        >
          <option value="all">All formats</option>
          <option value="sharepoint">SharePoint files</option>
          <option value="url">URLs</option>
        </Select>
        <Select
          aria-label="Filter by ingestion state"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as StatusFilter)}
          className="w-40"
        >
          <option value="all">All states</option>
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
          body="Drop documents into the topic's SharePoint folder, or add URLs to its manifest, then refresh the cache to pull them in."
          action={
            <Button size="sm" onClick={doRefresh} loading={refreshing}>
              Refresh SharePoint cache
            </Button>
          }
        />
      ) : (
        <>
          <div className="mb-2 flex flex-wrap items-center gap-3 rounded-(--radius-ctl) border border-line bg-surface-2 px-3 py-2">
            <Checkbox
              aria-label={allSelected ? 'Deselect all sources' : 'Select all sources'}
              checked={allSelected}
              indeterminate={someSelected && !allSelected}
              onChange={toggleAll}
              disabled={selectable.length === 0}
            />
            <span className="text-xs font-semibold text-ink" aria-live="polite">
              Selected {selectedCount} of {selectable.length}
            </span>
            <div className="ml-auto flex items-center gap-2">
              {someSelected && (
                <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                  Clear selection
                </Button>
              )}
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
            </div>
          </div>
          <TableShell>
            <thead>
              <tr>
                <Th className="w-9">
                  <span className="sr-only">Select</span>
                </Th>
                <Th>Name</Th>
                <Th>Format</Th>
                <Th>Modified</Th>
                <Th>Ingestion state</Th>
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
                      {fmtDate(s.modifiedAt)}
                    </Td>
                    <Td>
                      <IndexStatusPill status={s.indexStatus} />
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </TableShell>
        </>
      )}
    </section>
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
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const topicKey = topic?.id;
  useEffect(() => {
    setSelected(new Set());
    setActiveRunId(null);
  }, [topicKey]);

  const activeRun = runs.find(r => r.id === activeRunId && r.topicId === topicKey) ?? null;

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
            <GenerationEngine
              topicId={topic.id}
              topicSources={topicSources}
              selectedSourceIds={[...selected]}
              running={activeRun?.status === 'running'}
              onLaunched={setActiveRunId}
            />
          </div>
          <RunRail topicRuns={topicRuns} activeRun={activeRun} onDismiss={() => setActiveRunId(null)} />
        </div>
      )}
    </>
  );
}
