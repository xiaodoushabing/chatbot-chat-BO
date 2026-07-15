import { motion, useReducedMotion } from 'motion/react';
import { cn } from '../../lib/cn';

/* ── The Guided Canvas progress rail ──
   Four nodes: Select sources → Configure → Generate → Review. Done nodes fill
   accent and draw a check; the current node scales up with an accent halo; the
   connectors animate (scaleX) as the flow advances. Reduced motion: no scale /
   draw — states snap, connectors still show fill instantly. */

const EASE = [0.22, 0.61, 0.36, 1] as const;
const STEPS = ['Select sources', 'Configure', 'Generate', 'Review'] as const;

function DrawnCheck({ reduce }: { reduce: boolean }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <motion.path
        d="M20 6L9 17l-5-5"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: reduce ? 0 : 0.35, ease: EASE }}
      />
    </svg>
  );
}

export default function WizardRail({ current }: { current: number }) {
  const reduce = !!useReducedMotion();
  return (
    <ol className="mb-8 flex items-center px-1" aria-label={`Step ${current + 1} of ${STEPS.length}`}>
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const last = i === STEPS.length - 1;
        return (
          <li key={label} className={cn('flex items-center', !last && 'flex-1')}>
            <div className="flex shrink-0 items-center gap-3">
              <motion.span
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'relative grid h-9 w-9 place-items-center rounded-full border-2 text-sm font-bold tabular-nums',
                  'transition-colors duration-300 ease-(--ease-out)',
                  done
                    ? 'border-accent bg-accent text-on-accent'
                    : active
                      ? 'border-accent bg-bg text-accent'
                      : 'border-line bg-bg text-ink-3',
                )}
                animate={
                  reduce
                    ? undefined
                    : {
                        scale: active ? 1.08 : 1,
                        boxShadow: active
                          ? '0 0 0 5px var(--accent-wash)'
                          : '0 0 0 0px rgba(0,0,0,0)',
                      }
                }
                transition={{ duration: 0.3, ease: EASE }}
              >
                {done ? <DrawnCheck reduce={reduce} /> : <span>{i + 1}</span>}
              </motion.span>
              <span
                className={cn(
                  'hidden text-sm font-semibold whitespace-nowrap transition-colors duration-300 sm:block',
                  active ? 'text-accent' : done ? 'text-ink-2' : 'text-ink-3',
                )}
              >
                {label}
              </span>
            </div>
            {!last && (
              <div className="mx-3 h-0.5 flex-1 overflow-hidden rounded-full bg-line">
                <motion.div
                  className="h-full origin-left rounded-full bg-accent"
                  initial={false}
                  animate={{ scaleX: done ? 1 : 0 }}
                  transition={{ duration: reduce ? 0 : 0.5, ease: EASE }}
                />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
