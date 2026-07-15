import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../state/store';
import { cn } from '../lib/cn';

/* The original login, restored per client request: OCBC gradient backdrop,
   decorative orbs, red wordmark block, glass card, staggered entrance. */

const EASE = [0.22, 1, 0.36, 1] as const;

export default function Login() {
  const { login } = useStore();
  const navigate = useNavigate();
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-slate-50" />
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[#E3000F]/5" />

      {/* Decorative orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-[#E3000F]/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-slate-200/60 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo + branding */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-3 mb-5">
            <div
              className="h-14 flex items-center justify-center px-3 rounded-lg"
              style={{ background: '#E3000F' }}
              aria-label="OCBC"
            >
              <span className="font-black text-white text-2xl tracking-[0.18em]">OCBC</span>
            </div>
            <div className="border-l-2 border-slate-300 pl-4 text-left">
              <div className="font-bold text-lg text-slate-900 leading-tight">GDO Chatbot</div>
              <div className="font-bold text-md text-slate-900 leading-tight mt-0.5">Backoffice</div>
            </div>
          </div>
          <p className="text-base text-slate-600 leading-relaxed font-medium">
            Sign in to manage the OCBC chatbot knowledge platform.
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
          className="relative"
        >
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent z-10" />

          <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/80 shadow-[0_8px_40px_rgba(0,0,0,0.12)] p-10">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3, ease: EASE }}
                className="flex flex-col gap-1.5"
              >
                <label htmlFor="username" className="text-sm font-bold text-slate-700">Username</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder="Enter username"
                  className={cn(
                    'w-full border border-slate-200/60 rounded-xl px-4 py-3 text-sm text-slate-900',
                    'focus:outline-none focus:ring-2 focus:ring-[#E3000F]/30 focus:border-[#E3000F]/40',
                    'bg-white/80 transition-all placeholder:text-slate-400',
                  )}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4, ease: EASE }}
                className="flex flex-col gap-1.5"
              >
                <label htmlFor="password" className="text-sm font-bold text-slate-700">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Enter password"
                    className={cn(
                      'w-full border border-slate-200/60 rounded-xl px-4 py-3 pr-10 text-sm text-slate-900',
                      'focus:outline-none focus:ring-2 focus:ring-[#E3000F]/30 focus:border-[#E3000F]/40',
                      'bg-white/80 transition-all placeholder:text-slate-400',
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5, ease: EASE }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={pending}
                className="w-full bg-[#E3000F] text-white font-bold py-3 rounded-xl text-sm hover:bg-red-700 hover:shadow-lg hover:shadow-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-100 mt-1"
              >
                {pending ? 'Signing in…' : 'Sign In'}
              </motion.button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-500">
              Prototype sign-in — any credentials work
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
