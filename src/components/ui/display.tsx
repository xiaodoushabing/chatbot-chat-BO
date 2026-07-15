import { useState, type ReactNode } from 'react';
import { CheckCircle2, ChevronRight, Circle, CircleDashed, Clock3, FileQuestion, Loader2, MinusCircle, XCircle, type LucideIcon } from 'lucide-react';
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
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold whitespace-nowrap',
        toneClass[tone],
        className,
      )}
    >
      {Icon && <Icon size={12} className={cn(pulse && 'animate-pulse')} aria-hidden />}
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
    <header className="mb-8">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-xl font-bold tracking-tight text-ink text-balance">{title}</h1>
        {context}
        {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
      </div>
      {sub && <p className="mt-2 max-w-2xl text-sm text-ink-2 text-pretty">{sub}</p>}
    </header>
  );
}

/* Section header with the signature accent underline. Pass `plain` to drop the
   underline when the header sits INSIDE a card/container (avoids the boxed-in look). */
export function SectionHeader({
  title,
  meta,
  actions,
  plain,
}: {
  title: string;
  meta?: ReactNode;
  actions?: ReactNode;
  plain?: boolean;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
      <h2
        className={cn(
          'text-md font-semibold tracking-[-0.005em] text-ink',
          !plain && 'border-b-2 border-accent pb-2',
        )}
      >
        {title}
      </h2>
      {meta && <span className="font-mono text-xs text-ink-3">{meta}</span>}
      {actions && <div className="ml-auto flex items-center gap-2 self-center">{actions}</div>}
    </div>
  );
}

/* Collapsible section — for less-critical content that should fold away by default.
   Header stays visible and clickable; body expands/collapses. */
export function Collapsible({
  title,
  meta,
  actions,
  defaultOpen = false,
  children,
  className,
}: {
  title: string;
  meta?: ReactNode;
  actions?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={className}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          aria-expanded={open}
          className="group -ml-1 flex items-center gap-2 rounded-(--radius-ctl) px-1 py-0.5 text-md font-semibold tracking-[-0.005em] text-ink transition-colors hover:text-accent"
        >
          <ChevronRight
            size={17}
            aria-hidden
            className={cn('shrink-0 text-ink-3 transition-transform duration-200 ease-(--ease-out) group-hover:text-accent', open && 'rotate-90')}
          />
          {title}
        </button>
        {meta && <span className="font-mono text-xs text-ink-3">{meta}</span>}
        {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
      </div>
      {open && <div className="mt-4">{children}</div>}
    </section>
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
    <div className="flex flex-col items-center gap-3 rounded-(--radius-card) border border-line/70 bg-surface-2/40 px-6 py-16 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-3 text-ink-3">
        <Icon size={20} aria-hidden />
      </span>
      <p className="text-base font-semibold text-ink">{title}</p>
      <p className="max-w-sm text-sm text-ink-2 text-pretty">{body}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-(--radius-ctl) bg-surface-3', className)} aria-hidden />;
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3 py-3" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
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
      className={cn('h-1.5 overflow-hidden rounded-full bg-ink/10', className)}
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
    <dl className="grid grid-cols-[max-content_1fr] gap-x-8 gap-y-2.5 text-sm">
      {items.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="self-center text-xs font-medium text-ink-3">{k}</dt>
          <dd className="min-w-0 text-ink">{v}</dd>
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
            'relative px-3.5 pb-2.5 pt-1 text-sm font-semibold transition-colors duration-150',
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
