import { useEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useStore } from '../../state/store';
import { IconButton } from './controls';

const EASE = [0.22, 0.61, 0.36, 1] as const;

/* ── Modal on native <dialog> — white 22px card, warm blurred backdrop ── */

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={e => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        'm-auto w-full rounded-(--radius-card) border border-line bg-bg p-0 text-ink shadow-(--shadow-pop)',
        'backdrop:bg-ink/45 backdrop:backdrop-blur-[3px]',
        wide ? 'max-w-2xl' : 'max-w-md',
      )}
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <h2 className="text-md font-semibold">{title}</h2>
        <IconButton label="Close" onClick={onClose}>
          <X size={15} />
        </IconButton>
      </div>
      <div className="max-h-[65vh] overflow-y-auto px-5 py-4">{children}</div>
      {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
    </dialog>
  );
}

/* ── Drawer (right side) — white card, soft-pop shadow, warm backdrop ── */

export function Drawer({
  open,
  onClose,
  title,
  meta,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-(--z-overlay) bg-ink/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            className="fixed inset-y-0 right-0 z-(--z-modal) flex w-full max-w-xl flex-col border-l border-line bg-bg shadow-(--shadow-pop)"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: EASE }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
              <div className="min-w-0">
                <h2 className="text-md font-semibold text-balance">{title}</h2>
                {meta && <div className="mt-1">{meta}</div>}
              </div>
              <IconButton label="Close" onClick={onClose}>
                <X size={15} />
              </IconButton>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
            {footer && <div className="flex justify-end gap-2 border-t border-line px-6 py-3">{footer}</div>}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Toast host — dark warm pills rising from the bottom (render once) ── */

export function ToastHost() {
  const { toasts, dismissToast } = useStore();
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-6 z-(--z-toast) flex flex-col items-center gap-2 px-4"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.34, ease: EASE }}
            className="pointer-events-auto flex max-w-md items-center gap-2.5 rounded-full bg-ink px-4 py-2.5 text-canvas shadow-(--shadow-pop)"
          >
            {t.kind === 'ok' && <CheckCircle2 size={16} className="shrink-0 text-live" aria-hidden />}
            {t.kind === 'err' && <XCircle size={16} className="shrink-0 text-err" aria-hidden />}
            {t.kind === 'info' && <Info size={16} className="shrink-0 text-info" aria-hidden />}
            <p className="text-sm font-semibold">{t.message}</p>
            <IconButton
              label="Dismiss"
              onClick={() => dismissToast(t.id)}
              className="-mr-1.5 h-6 w-6 text-canvas/70 hover:bg-canvas/15 hover:text-canvas"
            >
              <X size={12} />
            </IconButton>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
