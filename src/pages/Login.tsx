import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useStore } from '../state/store';
import { Button, Field, Input } from '../components/ui/controls';

/* Guided Canvas login — warm canvas ground with a soft top-right glow,
   drifting luminous violet/warm orbs, a white softly-elevated glass card,
   and the gradient-violet Sparkles brand mark. Staggered entrance,
   reduced-motion safe. */

const EASE = [0.22, 0.61, 0.36, 1] as const;

export default function Login() {
  const { login } = useStore();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setTimeout(() => {
      login();
      navigate('/');
    }, 700);
  }

  const enter = (delay: number) => ({
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 },
    animate: reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: EASE },
  });

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4">
      {/* Soft top-right glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(900px 560px at 88% -8%, var(--accent-wash) 0%, transparent 62%)',
        }}
        aria-hidden
      />

      {/* Drifting luminous orbs — indigo-violet + warm neutral */}
      <motion.div
        className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-accent/10 blur-3xl"
        animate={reduceMotion ? undefined : { x: [0, 44, 0], y: [0, -32, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden
      />
      <motion.div
        className="pointer-events-none absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-surface-3/80 blur-3xl"
        animate={reduceMotion ? undefined : { x: [0, -38, 0], y: [0, 28, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden
      />

      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Brand */}
        <motion.div {...enter(0.1)} className="mb-10 text-center">
          <div className="mb-5 flex items-center justify-center gap-3.5">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-(--radius-field) text-on-accent shadow-(--shadow-accent)"
              style={{ backgroundImage: 'linear-gradient(145deg, var(--accent), var(--accent-press))' }}
              aria-hidden
            >
              <Sparkles size={24} />
            </span>
            <span className="text-left leading-tight">
              <span className="block font-display text-lg font-semibold tracking-[-0.02em] text-ink">
                Intent Studio
              </span>
              <span className="block text-xs tracking-wide text-ink-3">Knowledge Operations</span>
            </span>
          </div>
          <p className="text-base leading-relaxed text-ink-2">
            Sign in to manage the chatbot knowledge platform.
          </p>
        </motion.div>

        {/* Sign-in card */}
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
          className="rounded-(--radius-card) border border-line-soft bg-bg/80 p-10 shadow-(--shadow-pop) backdrop-blur-xl"
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <motion.div {...enter(0.3)}>
              <Field label="Username" htmlFor="username">
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder="Enter username"
                />
              </Field>
            </motion.div>

            <motion.div {...enter(0.4)}>
              <Field label="Password" htmlFor="password">
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Enter password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-(--radius-ctl) text-ink-3 transition-colors duration-150 ease-(--ease-out) hover:text-ink"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
            </motion.div>

            <motion.div {...enter(0.5)}>
              <Button type="submit" variant="primary" loading={pending} className="mt-1 h-10 w-full">
                {pending ? 'Signing in…' : 'Sign in'}
              </Button>
            </motion.div>
          </form>

          <p className="mt-6 text-center text-2xs text-ink-3">
            Prototype sign-in — any credentials work
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
