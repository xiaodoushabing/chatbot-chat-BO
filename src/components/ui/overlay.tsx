import { useEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useStore } from '../../state/store';
import { IconButton } from './controls';

const EASE = [0.22, 1, 0.36, 1] as const;

/* ── Modal on native <dialog> ── */

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
        'backdrop:bg-ink/40 backdrop:backdrop-blur-[2px]',
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

/* ── Drawer (right side) ── */

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
            className="fixed inset-0 z-(--z-overlay) bg-ink/35"
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
            transition={{ duration: 0.24, ease: EASE }}
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

/* ── Toast host (render once in the shell) ── */

export function ToastHost() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-(--z-toast) flex w-80 flex-col gap-2" aria-live="polite">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="pointer-events-auto flex items-start gap-2.5 rounded-(--radius-card) border border-line bg-bg px-3.5 py-2.5 shadow-(--shadow-soft)"
          >
            {t.kind === 'ok' && <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-ok" aria-hidden />}
            {t.kind === 'err' && <XCircle size={15} className="mt-0.5 shrink-0 text-err" aria-hidden />}
            {t.kind === 'info' && <Info size={15} className="mt-0.5 shrink-0 text-info" aria-hidden />}
            <p className="flex-1 text-sm text-ink">{t.message}</p>
            <IconButton label="Dismiss" onClick={() => dismissToast(t.id)} className="-mr-1.5 -mt-1 h-6 w-6">
              <X size={12} />
            </IconButton>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
