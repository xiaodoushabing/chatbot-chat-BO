import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { useStore } from '../state/store';
import { Button, Field, Input } from '../components/ui/controls';

const EASE = [0.22, 1, 0.36, 1] as const;

/* The kept backdrop: slow drifting luminous orbs behind a glass card,
   recolored to the Gallery/Deep Harbor identity (cobalt by day, cyan at night). */
function Orbs() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-br from-bg via-bg to-accent-wash" />
      <motion.div
        className="absolute -left-40 top-1/5 h-[420px] w-[420px] rounded-full bg-accent/14 blur-3xl"
        animate={{ x: [0, 46, 0], y: [0, 28, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -right-36 bottom-1/5 h-[380px] w-[380px] rounded-full bg-info/12 blur-3xl"
        animate={{ x: [0, -38, 0], y: [0, -24, 0] }}
        transition={{ duration: 31, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute left-1/2 top-0 h-[300px] w-[520px] -translate-x-1/2 rounded-full bg-ink/6 blur-3xl"
        animate={{ y: [0, 18, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

export default function Login() {
  const { login } = useStore();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [pending, setPending] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setTimeout(() => {
      login();
      navigate('/');
    }, 700);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <Orbs />
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.55, ease: EASE }}
        className="relative z-10 w-full max-w-sm"
      >
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: EASE }}
          className="mb-8 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-(--radius-card) bg-accent text-on-accent shadow-(--shadow-soft)">
              <Sparkles size={20} aria-hidden />
            </span>
            <span className="text-left">
              <span className="block text-lg font-bold leading-tight tracking-tight text-ink">Intent Studio</span>
              <span className="block text-sm font-medium text-ink-2">Chatbot Backoffice</span>
            </span>
          </div>
          <p className="text-sm text-ink-2 text-balance">
            From SharePoint folder to approved chatbot answer, in one governed flow.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.16, ease: EASE }}
          className="rounded-(--radius-card) border border-line/70 bg-bg/70 p-8 shadow-(--shadow-pop) backdrop-blur-xl"
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="Username" htmlFor="username">
              <Input
                id="username"
                autoComplete="username"
                required
                placeholder="j.doe"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </Field>
            <Field label="Password" htmlFor="password">
              <div className="relative">
                <Input
                  id="password"
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="pr-9"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShow(v => !v)}
                  aria-label={show ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3 transition-colors hover:text-ink"
                >
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>
            <Button type="submit" variant="primary" loading={pending} className="mt-1 h-9 w-full text-sm">
              {pending ? 'Signing in' : 'Sign in'}
            </Button>
          </form>
          <p className="mt-5 text-center text-xs text-ink-3">
            Prototype sign-in: any credentials work.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
