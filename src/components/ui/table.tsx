import type { ReactNode, ThHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

/* Guided Canvas table: a white 22px card with a soft shadow. Compose:
   <TableShell><thead><Tr><Th…/></Tr></thead><tbody><Tr…><Td…/></Tr></tbody></TableShell> */

export function TableShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-x-auto rounded-(--radius-card) border border-line bg-bg shadow-(--shadow-soft)', className)}>
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Th({ className, children, ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'sticky top-0 z-(--z-sticky) border-b border-line bg-surface-2 px-4 py-3 text-left',
        'text-2xs font-semibold tracking-wide text-ink-3 uppercase whitespace-nowrap',
        className,
      )}
      {...rest}
    >
      {children}
    </th>
  );
}

export function Tr({
  children,
  selected,
  onClick,
  className,
  disabled,
}: {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <tr
      onClick={disabled ? undefined : onClick}
      aria-selected={selected}
      className={cn(
        'border-b border-line-soft last:border-b-0 transition-colors duration-150 ease-(--ease-out)',
        selected ? 'bg-accent-wash' : onClick && !disabled && 'hover:bg-surface-2',
        onClick && !disabled && 'cursor-pointer',
        disabled && 'opacity-50',
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function Td({ className, children, mono }: { className?: string; children?: ReactNode; mono?: boolean }) {
  return (
    <td className={cn('px-4 py-3.5 align-middle', mono && 'font-mono text-xs text-ink-2', className)}>
      {children}
    </td>
  );
}

export function Pagination({
  page,
  pageCount,
  onPage,
  total,
  pageSize,
}: {
  page: number;
  pageCount: number;
  onPage: (p: number) => void;
  total: number;
  pageSize: number;
}) {
  if (pageCount <= 1) return null;
  const from = page * pageSize + 1;
  const to = Math.min(total, (page + 1) * pageSize);
  return (
    <div className="flex items-center justify-between px-1 py-3">
      <span className="font-mono text-xs text-ink-2">
        {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          disabled={page === 0}
          onClick={() => onPage(page - 1)}
          className="rounded-(--radius-field) border border-line bg-bg px-3 py-1.5 text-xs font-semibold text-ink-2 shadow-(--shadow-soft) transition-colors duration-150 ease-(--ease-out) hover:bg-surface-2 hover:text-ink disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none"
        >
          Previous
        </button>
        <span className="px-2 font-mono text-xs text-ink-2">
          {page + 1} / {pageCount}
        </span>
        <button
          disabled={page >= pageCount - 1}
          onClick={() => onPage(page + 1)}
          className="rounded-(--radius-field) border border-line bg-bg px-3 py-1.5 text-xs font-semibold text-ink-2 shadow-(--shadow-soft) transition-colors duration-150 ease-(--ease-out) hover:bg-surface-2 hover:text-ink disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none"
        >
          Next
        </button>
      </div>
    </div>
  );
}
