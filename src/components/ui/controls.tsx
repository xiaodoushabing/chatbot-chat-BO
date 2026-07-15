import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Loader2, Search, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  size?: 'sm' | 'md';
}

const buttonStyles: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent border-accent hover:bg-accent-press hover:border-accent-press',
  secondary: 'bg-bg text-ink border-line hover:bg-surface-2',
  ghost: 'bg-transparent text-ink-2 border-transparent hover:bg-surface-2 hover:text-ink',
  danger: 'bg-bg text-err border-line hover:bg-err/8 hover:border-err/40',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', loading, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-(--radius-ctl) border font-semibold',
        'transition-colors duration-150 select-none',
        'disabled:opacity-45 disabled:pointer-events-none',
        size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-sm',
        buttonStyles[variant],
        className,
      )}
      {...rest}
    >
      {loading && <Loader2 size={13} className="animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-(--radius-ctl) border border-transparent',
        'text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink',
        'disabled:opacity-45 disabled:pointer-events-none',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});

export interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, hint, error, children, className }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-xs font-semibold text-ink">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-ink-2">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs font-medium text-err">
          {error}
        </p>
      )}
    </div>
  );
}

const fieldBase =
  'w-full rounded-(--radius-field) border border-line bg-bg px-3 text-sm text-ink placeholder:text-ink-3 ' +
  'transition-colors duration-150 hover:border-ink-3/50 focus:border-accent focus:outline-none ' +
  'focus:ring-2 focus:ring-accent/25 disabled:opacity-50 disabled:pointer-events-none';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={cn(fieldBase, 'h-8', className)} {...rest} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return <textarea ref={ref} className={cn(fieldBase, 'min-h-20 py-2 leading-relaxed', className)} {...rest} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <div className="relative">
        <select ref={ref} className={cn(fieldBase, 'h-8 appearance-none pr-8', className)} {...rest}>
          {children}
        </select>
        <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden />
      </div>
    );
  },
);

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, indeterminate, ...rest },
  ref,
) {
  return (
    <input
      type="checkbox"
      ref={el => {
        if (el) el.indeterminate = !!indeterminate;
        if (typeof ref === 'function') ref(el);
        else if (ref) ref.current = el;
      }}
      className={cn('h-3.5 w-3.5 shrink-0 cursor-pointer rounded-[3px] border-line accent-(--accent)', className)}
      {...rest}
    />
  );
});

export function SearchField({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden />
      <input
        type="search"
        role="searchbox"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(fieldBase, 'h-8 pl-8')}
      />
    </div>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div role="tablist" className={cn('flex overflow-hidden rounded-(--radius-field) border border-line', className)}>
      {options.map((o, i) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            'flex-1 px-3 py-1.5 text-xs font-semibold transition-colors duration-150',
            i > 0 && 'border-l border-line',
            o.value === value ? 'bg-accent-wash text-accent' : 'bg-bg text-ink-2 hover:bg-surface-2 hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
