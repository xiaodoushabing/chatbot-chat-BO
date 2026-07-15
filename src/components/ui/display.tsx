import type { ReactNode } from 'react';
import { CheckCircle2, Circle, CircleDashed, Clock3, FileQuestion, Loader2, MinusCircle, XCircle, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';
import type { ApprovalStatus, IndexStatus, IntentState, RunStatus } from '../../data/types';

/* ── StatusPill: the single governance vocabulary (DESIGN.md) ── */

type Tone = 'ok' | 'warn' | 'err' | 'info' | 'neutral';

const toneClass: Record<Tone, string> = {
  ok: 'text-ok bg-ok/12',
  warn: 'text-warn bg-warn/13',
  err: 'text-err bg-err/12',
  info: 'text-info bg-info/12',
  neutral: 'text-ink-2 bg-surface-3',
};

export function Pill({
  tone,
  icon: Icon,
  children,
  pulse,
  className,
}: {
  tone: Tone;
  icon?: LucideIcon;
  children: ReactNode;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-bold whitespace-nowrap',
        toneClass[tone],
        className,
      )}
    >
      {Icon && <Icon size={11} className={cn(pulse && 'animate-pulse')} aria-hidden />}
      {children}
    </span>
  );
}

export function IndexStatusPill({ status }: { status: IndexStatus }) {
  const map: Record<IndexStatus, [Tone, string, LucideIcon]> = {
    indexed: ['ok', 'Indexed', CheckCircle2],
    not_indexed: ['warn', 'Not indexed', Circle],
    indexing: ['info', 'Indexing', Loader2],
    stale: ['warn', 'Stale', Clock3],
  };
  const [tone, label, icon] = map[status];
  return (
    <Pill tone={tone} icon={icon} pulse={status === 'indexing'}>
      {label}
    </Pill>
  );
}

export function RunStatusPill({ status }: { status: RunStatus }) {
  const map: Record<RunStatus, [Tone, string, LucideIcon]> = {
    running: ['info', 'Running', Loader2],
    completed: ['ok', 'Completed', CheckCircle2],
    failed: ['err', 'Failed', XCircle],
    dead: ['err', 'Dead', MinusCircle],
  };
  const [tone, label, icon] = map[status];
  return (
    <Pill tone={tone} icon={icon} pulse={status === 'running'}>
      {label}
    </Pill>
  );
}

export function IntentStatePill({ state }: { state: IntentState }) {
  const map: Record<IntentState, [Tone, string]> = {
    draft: ['neutral', 'Draft'],
    staged: ['info', 'Staged'],
    pending_approval: ['warn', 'Pending approval'],
    live: ['ok', 'Live'],
    rejected: ['err', 'Rejected'],
    deleted: ['neutral', 'Deleted'],
  };
  const [tone, label] = map[state];
  return <Pill tone={tone}>{label}</Pill>;
}

export function ApprovalStatusPill({ status }: { status: ApprovalStatus }) {
  const map: Record<ApprovalStatus, [Tone, string]> = {
    pending: ['warn', 'Pending'],
    approved: ['ok', 'Approved'],
    rejected: ['err', 'Rejected'],
    withdrawn: ['neutral', 'Withdrawn'],
  };
  const [tone, label] = map[status];
  return <Pill tone={tone}>{label}</Pill>;
}

export function BatchChildPill({ status }: { status: 'succeeded' | 'skipped' | 'failed' | 'running' | 'pending' }) {
  const map: Record<string, [Tone, string, LucideIcon]> = {
    succeeded: ['ok', 'Succeeded', CheckCircle2],
    skipped: ['warn', 'Skipped', MinusCircle],
    failed: ['err', 'Failed', XCircle],
    running: ['info', 'Running', Loader2],
    pending: ['neutral', 'Queued', CircleDashed],
  };
  const [tone, label, icon] = map[status];
  return (
    <Pill tone={tone} icon={icon} pulse={status === 'running'}>
      {label}
    </Pill>
  );
}

/* ── Page scaffolding ── */

export function PageHeader({
  title,
  sub,
  actions,
  context,
}: {
  title: string;
  sub?: ReactNode;
  actions?: ReactNode;
  context?: ReactNode;
}) {
  return (
    <header className="mb-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-ink text-balance">{title}</h1>
        {context}
        {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
      </div>
      {sub && <p className="mt-1.5 max-w-prose text-sm text-ink-2">{sub}</p>}
    </header>
  );
}

export function SectionHeader({ title, meta, actions }: { title: string; meta?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <div data-impeccable-variants="5739ce58" data-impeccable-variant-count="4" style={{ display: "contents" }}>
        {/* impeccable-variants-start 5739ce58 */}
        {/* Original */}
        <div data-impeccable-variant="original">
          <h2 className="text-md font-semibold text-ink">{title}</h2>
        </div>
        {/* Variants: insert below this line */}
        <style data-impeccable-css="5739ce58">{`
          @scope ([data-impeccable-variant="1"]) {
            :scope > h2 { font-weight:800; letter-spacing:-0.015em; font-size:calc(15px + var(--p-scale,0.4) * 6px); color:var(--ink); }
          }
          @scope ([data-impeccable-variant="2"]) {
            :scope > h2 { display:flex; align-items:center; gap:8px; font-weight:750; font-size:16px; letter-spacing:-0.005em; color:var(--ink); }
            :scope > h2 .sh2-mark { width:7px; height:7px; border-radius:2px; background:var(--accent); flex-shrink:0; }
          }
          @scope ([data-impeccable-variant="3"]) {
            :scope > h2 { font-family:var(--font-mono); font-weight:700; font-size:12.5px; letter-spacing:0.06em; text-transform:uppercase; color:var(--accent); }
          }
          @scope ([data-impeccable-variant="4"]) {
            :scope > h2 { display:inline-block; font-weight:750; font-size:16px; letter-spacing:-0.005em; color:var(--ink); padding-bottom:4px; border-bottom:calc(1.5px + var(--p-weight,0.5) * 1.5px) solid var(--accent); }
          }
        `}</style>
        <div data-impeccable-variant="1" data-impeccable-params='[{"id":"scale","kind":"range","min":0,"max":1,"step":0.1,"default":0.4,"label":"Size"}]'>
          <h2>{title}</h2>
        </div>
        <div data-impeccable-variant="2" style={{ display: 'none' }}>
          <h2>
            <span className="sh2-mark" aria-hidden />
            {title}
          </h2>
        </div>
        <div data-impeccable-variant="3" style={{ display: 'none' }}>
          <h2>{title}</h2>
        </div>
        <div data-impeccable-variant="4" style={{ display: 'none' }} data-impeccable-params='[{"id":"weight","kind":"range","min":0,"max":1,"step":0.1,"default":0.5,"label":"Underline weight"}]'>
          <h2>{title}</h2>
        </div>
        {/* impeccable-variants-end 5739ce58 */}
      </div>
      {meta && <span className="font-mono text-xs text-ink-2">{meta}</span>}
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  icon: Icon = FileQuestion,
  title,
  body,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-(--radius-card) border border-dashed border-line px-6 py-12 text-center">
      <Icon size={22} className="text-ink-3" aria-hidden />
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="max-w-sm text-sm text-ink-2">{body}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-surface-3', className)} aria-hidden />;
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2 py-2" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-2">
          <Skeleton className="h-3.5 w-3.5" />
          <Skeleton className="h-3.5 flex-1" />
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-24" />
        </div>
      ))}
    </div>
  );
}

export function ProgressBar({ value, max, className }: { value: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn('h-1.5 overflow-hidden rounded-full bg-ink/12', className)}
    >
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-300 ease-(--ease-out)"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function KeyValue({ items }: { items: Array<[string, ReactNode]> }) {
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1.5 text-sm">
      {items.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-xs font-semibold tracking-wide text-ink-3 uppercase self-center">{k}</dt>
          <dd className="text-ink min-w-0">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('font-mono text-xs text-ink-2', className)}>{children}</span>;
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div role="tablist" className="flex gap-1 border-b border-line">
      {tabs.map(t => (
        <button
          key={t.value}
          role="tab"
          aria-selected={t.value === value}
          onClick={() => onChange(t.value)}
          className={cn(
            'relative px-3 pb-2 pt-1 text-sm font-semibold transition-colors duration-150',
            t.value === value ? 'text-ink' : 'text-ink-2 hover:text-ink',
          )}
        >
          {t.label}
          {typeof t.count === 'number' && (
            <span className="ml-1.5 font-mono text-xs text-ink-3">{t.count}</span>
          )}
          {t.value === value && <span className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-accent" aria-hidden />}
        </button>
      ))}
    </div>
  );
}
