import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { FileSpreadsheet, FileText, FolderOpen, Link2, Lock, Sparkles } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useStore } from '../../state/store';
import type { IndexStatus, Source } from '../../data/types';
import { fmtDate, plural } from '../../lib/format';
import { Button, Checkbox, SearchField, Select } from '../../components/ui/controls';
import { EmptyState, IndexStatusPill, TableSkeleton } from '../../components/ui/display';

const EASE = [0.22, 0.61, 0.36, 1] as const;


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
  const { user, enumeratedTopics, markEnumerated, toast } = useStore();
  const reduce = !!useReducedMotion();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const enumerating = !enumeratedTopics[topicId];
  const isContributor = user.role === 'contributor';
  const notReady = topicSources.filter(
    s => s.indexStatus === 'not_indexed' || s.indexStatus === 'stale',
  ).length;

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

  return (
    <section
      aria-label="Select sources"
      className="rounded-(--radius-card) border border-line bg-bg p-6 shadow-(--shadow-2) sm:p-7"
    >
      <div className="mb-5">
        <h2 className="font-display text-lg font-medium tracking-[-0.01em] text-ink">Select sources</h2>
        <p className="mt-1 text-sm text-ink-2">
          Choose the documents and URLs to generate from. Only sources marked{' '}
          <span className="font-semibold text-ink">Ready</span> can be used.
        </p>
        {notReady > 0 && (
          <p className="mt-3 flex items-center gap-2 rounded-(--radius-field) bg-warn-bg px-3.5 py-2.5 text-xs font-medium text-warn">
            <Sparkles size={14} className="shrink-0" aria-hidden />
            {plural(notReady, 'source')} {notReady === 1 ? "isn't" : "aren't"} ready yet — use{' '}
            <span className="font-semibold">Manage&nbsp;sources</span> tab to prepare them.
          </p>
        )}
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
            aria-label="Filter by readiness"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as StatusFilter)}
            className="w-40"
          >
            <option value="all">All statuses</option>
            <option value="indexed">Ready</option>
            <option value="not_indexed">Not ready</option>
            <option value="indexing">Preparing</option>
            <option value="stale">Out of date</option>
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
          body="Drop documents into the topic's SharePoint folder, or add URLs to its manifest, then use the Manage sources tab to check SharePoint for changes."
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
