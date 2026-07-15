import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ChevronDown,
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
import type { IndexStatus, Source } from '../../data/types';
import { fmtDate, plural } from '../../lib/format';
import { Button, Checkbox, SearchField, SegmentedControl, Select } from '../../components/ui/controls';
import { EmptyState, IndexStatusPill, TableSkeleton } from '../../components/ui/display';

const EASE = [0.22, 0.61, 0.36, 1] as const;

/* ── Two-axis sync control ── (kept from the original engine, restyled as a
   separate step-header control — it is NOT part of the generate action). */

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

  const candidates = topicSources.filter(
    s =>
      (category === 'all' || s.kind === category) &&
      (!isContributor || s.accessible) &&
      (s.indexStatus === 'not_indexed' || s.indexStatus === 'stale'),
  );
  const selectedCandidates = candidates.filter(s => selected.has(s.id));
  const vectorTargets = selectedCandidates.length > 0 ? selectedCandidates : candidates;
  const scopeNote =
    selectedCandidates.length > 0 ? 'from your source selection' : 'across the whole category';

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
        <ChevronDown
          size={12}
          className={cn('transition-transform duration-150', open && 'rotate-180')}
          aria-hidden
        />
      </Button>
      {open && (
        <div
          role="dialog"
          aria-label="Sync sources"
          className="absolute right-0 top-9.5 z-(--z-dropdown) w-84 rounded-(--radius-card) border border-line bg-bg p-4 shadow-(--shadow-pop)"
        >
          <div className="flex flex-col gap-4">
            <fieldset className="flex flex-col gap-1.5">
              <legend className="text-2xs font-bold tracking-wider text-ink-3 uppercase">
                1 · Source category
              </legend>
              <SegmentedControl<SyncCategory>
                options={[
                  { value: 'all', label: 'All sources' },
                  { value: 'sharepoint', label: 'SharePoint' },
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
                  { value: 'shallow', label: 'Shallow listing' },
                  { value: 'vector', label: 'Vector ingestion' },
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

/* ── A single selectable source row ── */

function SourceRow({
  source,
  selected,
  locked,
  reduce,
  onToggle,
}: {
  source: Source;
  selected: boolean;
  locked: boolean;
  reduce: boolean;
  onToggle: () => void;
}) {
  const Icon = source.kind === 'url' ? Link2 : source.isSpreadsheet ? FileSpreadsheet : FileText;
  const sub =
    source.kind === 'url'
      ? `Public URL · ${source.path}`
      : `SharePoint · ${source.isSpreadsheet ? 'Spreadsheet' : 'Document'}`;

  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-disabled={locked}
      onClick={onToggle}
      title={locked ? "You don't have access to this document in SharePoint" : source.path}
      whileHover={reduce || locked ? undefined : { y: -2 }}
      transition={{ duration: 0.2, ease: EASE }}
      className={cn(
        'flex items-center gap-4 rounded-(--radius-md) border bg-bg px-4 py-3.5 text-left',
        'transition-[border-color,box-shadow,background-color] duration-200 ease-(--ease-out)',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
        locked && 'cursor-not-allowed opacity-60',
        !locked && 'hover:shadow-(--shadow-2)',
        selected
          ? 'border-accent bg-gradient-to-b from-accent-wash to-bg'
          : 'border-line hover:border-accent-wash-2',
      )}
    >
      {locked ? (
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[8px] border border-line bg-surface-2">
          <Lock size={13} className="text-ink-3" aria-hidden />
        </span>
      ) : (
        <span
          className={cn(
            'grid h-6 w-6 shrink-0 place-items-center rounded-[8px] border-2 transition-colors duration-200 ease-(--ease-out)',
            selected ? 'border-accent bg-accent' : 'border-line bg-bg',
          )}
          aria-hidden
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--on-accent)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <motion.path
              d="M20 6L9 17l-5-5"
              initial={false}
              animate={{ pathLength: selected ? 1 : 0, opacity: selected ? 1 : 0 }}
              transition={{ duration: reduce ? 0 : 0.3, ease: EASE }}
            />
          </svg>
        </span>
      )}
      <span className="grid h-9.5 w-9.5 shrink-0 place-items-center rounded-(--radius-ctl) bg-surface-2 text-ink-2">
        <Icon size={18} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink">{source.name}</span>
        <span className="block truncate text-xs text-ink-3">
          {sub} · <span className="font-mono">{fmtDate(source.modifiedAt)}</span>
        </span>
      </span>
      <span className="shrink-0">
        <IndexStatusPill status={source.indexStatus} />
      </span>
    </motion.button>
  );
}

/* ── Step 1: Select sources ── */

type TypeFilter = 'all' | 'sharepoint' | 'url';
type StatusFilter = 'all' | IndexStatus;

export default function StepSources({
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
  const { user, enumeratedTopics, markEnumerated, refreshSources, toast } = useStore();
  const reduce = !!useReducedMotion();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const enumerating = !enumeratedTopics[topicId];
  const isContributor = user.role === 'contributor';

  useEffect(() => {
    setSearch('');
    setTypeFilter('all');
    setStatusFilter('all');
  }, [topicId]);

  // First visit to a topic: simulated SharePoint enumeration.
  useEffect(() => {
    if (enumeratedTopics[topicId]) return;
    const t = window.setTimeout(() => markEnumerated(topicId), 1400);
    return () => clearTimeout(t);
  }, [topicId, enumeratedTopics, markEnumerated]);

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

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const doRefresh = async () => {
    setRefreshing(true);
    await refreshSources(topicId);
    setRefreshing(false);
  };

  return (
    <section
      aria-label="Select sources"
      className="rounded-(--radius-card) border border-line bg-bg p-6 shadow-(--shadow-2) sm:p-7"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-medium tracking-[-0.01em] text-ink">
            Select sources
          </h2>
          <p className="mt-1 text-sm text-ink-2">
            Choose the documents and URLs to generate from. Only indexed sources can be used by GenAI.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button size="sm" loading={refreshing} onClick={doRefresh}>
            {!refreshing && <RefreshCw size={12} aria-hidden />}
            Refresh cache
          </Button>
          <SyncControl
            topicId={topicId}
            topicSources={topicSources}
            selected={selected}
            isContributor={isContributor}
          />
        </div>
      </div>

      {!enumerating && topicSources.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <SearchField value={search} onChange={setSearch} placeholder="Search sources" className="w-56" />
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
      )}

      {enumerating ? (
        <div className="rounded-(--radius-md) border border-line bg-surface-2 px-4 py-3">
          <p className="pt-1 text-xs text-ink-2" role="status">
            Enumerating SharePoint folder…
          </p>
          <TableSkeleton rows={6} />
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
          <div className="mb-3 flex flex-wrap items-center gap-3 rounded-(--radius-md) border border-line bg-surface-2 px-4 py-2.5">
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
            {someSelected && (
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto"
                onClick={() => setSelected(new Set())}
              >
                Clear selection
              </Button>
            )}
          </div>

          {filtered.length === 0 ? (
            <p className="rounded-(--radius-md) border border-dashed border-line px-4 py-8 text-center text-sm text-ink-2">
              No sources match the current filters.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filtered.map(s => (
                <SourceRow
                  key={s.id}
                  source={s}
                  selected={selected.has(s.id)}
                  locked={isContributor && !s.accessible}
                  reduce={reduce}
                  onToggle={() => {
                    if (isContributor && !s.accessible) {
                      toast('You do not have access to this document in SharePoint', 'info');
                      return;
                    }
                    toggleOne(s.id);
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
