import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { motion, useReducedMotion } from 'motion/react';
import {
  Check,
  ChevronDown,
  ClipboardCheck,
  FolderCog,
  Inbox,
  LayoutDashboard,
  Library,
  LogOut,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Sun,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { useStore } from '../../state/store';
import type { Role } from '../../data/types';
import { ToastHost } from '../ui/overlay';

/* Grouped primary navigation — BUILD (make intents) then GOVERN (review them). */
const NAV_GROUPS: { label: string; items: { to: string; label: string; icon: typeof LayoutDashboard; end?: boolean }[] }[] = [
  {
    label: 'Build',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/settings', label: 'Project Settings', icon: FolderCog },
      { to: '/studio', label: 'Intent Studio', icon: Sparkles },
    ],
  },
  {
    label: 'Govern',
    items: [
      { to: '/review', label: 'Review', icon: ClipboardCheck },
      { to: '/approvals', label: 'Approvals', icon: Inbox },
      { to: '/library', label: 'Intent Library', icon: Library },
    ],
  },
];

const ROLE_LABEL: Record<Role, string> = {
  owner: 'Owner',
  contributor: 'Contributor',
  checker: 'Checker',
};

/** Two-letter monogram from a project name ("Cards & Payments" → "CP"). */
function monogram(name: string) {
  return name
    .replace(/[^A-Za-z0-9 ]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

function useClickOutside(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);
  return ref;
}

function ProjectSwitcher() {
  const { projects, projectId, setProject, topics } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));
  const current = projects.find(p => p.id === projectId)!;
  const topicCount = topics.filter(t => t.projectId === projectId).length;
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2.5 rounded-(--radius-field) border border-line bg-bg py-1.5 pl-2 pr-3 shadow-(--shadow-soft) transition-[transform,box-shadow] duration-200 ease-(--ease-out) hover:-translate-y-px hover:shadow-(--shadow-2)"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-accent-wash text-2xs font-bold text-accent">
          {monogram(current.name)}
        </span>
        <span className="text-left leading-tight">
          <span className="block text-sm font-semibold text-ink">{current.name}</span>
          <span className="block text-2xs text-ink-3">
            {topicCount} {topicCount === 1 ? 'topic' : 'topics'}
          </span>
        </span>
        <ChevronDown size={15} className="text-ink-3" aria-hidden />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label="Switch project"
          className="absolute left-0 top-[calc(100%+6px)] z-(--z-dropdown) w-72 rounded-(--radius-card) border border-line bg-bg p-1.5 shadow-(--shadow-pop)"
        >
          <p className="px-2 pb-1 pt-1.5 text-2xs font-bold tracking-wider text-ink-3 uppercase">
            Granted projects
          </p>
          {projects.map(p => (
            <button
              key={p.id}
              role="option"
              aria-selected={p.id === projectId}
              onClick={() => {
                setProject(p.id);
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-(--radius-ctl) px-2 py-2 text-left transition-colors hover:bg-surface-2',
                p.id === projectId && 'bg-accent-wash/60',
              )}
            >
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] text-2xs font-bold',
                  p.id === projectId ? 'bg-accent text-on-accent' : 'bg-surface-3 text-ink-2',
                )}
              >
                {monogram(p.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn('block text-sm', p.id === projectId ? 'font-semibold text-ink' : 'text-ink-2')}>
                  {p.name}
                </span>
                <span className="block truncate font-mono text-2xs text-ink-3">{p.sharepointUrl}</span>
              </span>
              {p.id === projectId && <Check size={14} className="shrink-0 text-accent" aria-hidden />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const { user, setRole, logout, toast } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));
  const navigate = useNavigate();
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu — ${user.name}`}
        className="flex h-9 w-9 items-center justify-center rounded-full text-2xs font-bold text-on-accent shadow-(--shadow-soft) transition-transform duration-200 ease-(--ease-out) hover:scale-105"
        style={{ backgroundImage: 'conic-gradient(from 140deg, var(--accent-press), var(--accent), var(--accent-press))' }}
      >
        {user.initials}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-(--z-dropdown) w-60 rounded-(--radius-card) border border-line bg-bg p-1.5 shadow-(--shadow-pop)"
        >
          <div className="border-b border-line px-2 py-2">
            <p className="text-sm font-semibold text-ink">{user.name}</p>
            <p className="text-xs text-ink-2">{ROLE_LABEL[user.role]} · {user.name.toLowerCase().replace(' ', '.')}@bank.example</p>
          </div>
          <p className="px-2 pb-0.5 pt-2 text-2xs font-bold tracking-wider text-ink-3 uppercase">
            Preview as role
          </p>
          {(['owner', 'contributor', 'checker'] as Role[]).map(r => (
            <button
              key={r}
              role="menuitemradio"
              aria-checked={user.role === r}
              onClick={() => {
                setRole(r);
                setOpen(false);
                toast(`Now previewing as ${ROLE_LABEL[r].toLowerCase()}`, 'info');
              }}
              className={cn(
                'flex w-full items-center justify-between rounded-(--radius-ctl) px-2 py-1.5 text-left text-sm transition-colors hover:bg-surface-2',
                user.role === r ? 'font-semibold text-ink' : 'text-ink-2',
              )}
            >
              {ROLE_LABEL[r]}
              {user.role === r && <Check size={14} className="text-accent" aria-hidden />}
            </button>
          ))}
          <div className="mt-1 border-t border-line pt-1">
            <button
              role="menuitem"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="flex w-full items-center gap-2 rounded-(--radius-ctl) px-2 py-1.5 text-left text-sm text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <LogOut size={14} aria-hidden /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Shell() {
  const { user, theme, toggleTheme } = useStore();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const reduce = useReducedMotion();

  return (
    <div
      className="grid h-screen transition-[grid-template-columns] duration-200 ease-(--ease-out)"
      style={{
        gridTemplateColumns: `${collapsed ? 76 : 248}px minmax(0, 1fr)`,
        gridTemplateRows: '70px minmax(0, 1fr)',
        gridTemplateAreas: '"brand top" "nav main"',
      }}
    >
      {/* Brand */}
      <div
        className={cn('flex items-center gap-3 border-b border-r border-nav-line bg-nav px-5', collapsed && 'justify-center px-0')}
        style={{ gridArea: 'brand' }}
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-(--radius-field) text-on-accent shadow-(--shadow-accent)"
          style={{ backgroundImage: 'linear-gradient(145deg, var(--accent), var(--accent-press))' }}
          aria-hidden
        >
          <Sparkles size={19} />
        </span>
        <span className={cn('leading-tight', collapsed && 'sr-only')}>
          <span className="block font-display text-md font-semibold tracking-[-0.02em] text-nav-ink">Intent Studio</span>
          <span className="block text-2xs tracking-wide text-nav-sub">Knowledge Operations</span>
        </span>
      </div>

      {/* Top bar — translucent, blurred */}
      <header
        className="z-(--z-sticky) flex items-center gap-4 border-b border-line bg-canvas/80 px-6 backdrop-blur-md"
        style={{ gridArea: 'top' }}
      >
        <ProjectSwitcher />
        <div className="ml-auto flex items-center gap-2.5">
          <span className="rounded-full bg-accent-wash px-2.5 py-1 text-2xs font-semibold tracking-wide text-accent uppercase">
            {ROLE_LABEL[user.role]}
          </span>
          <button
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
            className="flex h-9 w-9 items-center justify-center rounded-(--radius-field) border border-line bg-bg text-ink-2 shadow-(--shadow-soft) transition-[transform,box-shadow,color] duration-200 ease-(--ease-out) hover:-translate-y-px hover:text-ink hover:shadow-(--shadow-2)"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <UserMenu />
        </div>
      </header>

      {/* Grouped nav */}
      <nav
        aria-label="Primary"
        className={cn('flex flex-col gap-1 overflow-y-auto border-r border-nav-line bg-nav py-4', collapsed ? 'px-3' : 'px-4')}
        style={{ gridArea: 'nav' }}
      >
        {NAV_GROUPS.map(group => (
          <div key={group.label} className="flex flex-col gap-1">
            <p
              className={cn(
                'px-3 pt-3 pb-1 text-2xs font-bold tracking-[0.08em] text-nav-sub uppercase',
                collapsed && 'sr-only',
              )}
            >
              {group.label}
            </p>
            {group.items.map(item => (
              <NavLink key={item.to} to={item.to} end={item.end} title={item.label} className="block">
                {({ isActive }) => (
                  <span
                    className={cn(
                      'group relative flex items-center gap-3 rounded-(--radius-field) px-3 py-2.5 text-sm font-medium',
                      'transition-[transform,background-color,color,box-shadow] duration-200 ease-(--ease-out)',
                      isActive
                        ? 'bg-nav-on font-semibold text-nav-accent'
                        : 'text-nav-ink hover:translate-x-0.5 hover:bg-nav-on/50 hover:text-nav-on-ink',
                      collapsed && 'justify-center px-0',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 origin-center rounded-full bg-nav-accent',
                        'transition-transform duration-300 ease-(--ease-out)',
                        isActive ? 'scale-y-100' : 'scale-y-0',
                      )}
                      aria-hidden
                    />
                    <item.icon
                      size={18}
                      className={cn('shrink-0 transition-transform duration-200 ease-(--ease-out) group-hover:scale-110')}
                      aria-hidden
                    />
                    <span className={cn(collapsed && 'sr-only')}>{item.label}</span>
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
        <button
          onClick={() => setCollapsed(v => !v)}
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          className={cn(
            'mt-auto flex items-center gap-3 rounded-(--radius-field) px-3 py-2.5 text-sm font-medium text-nav-sub transition-colors duration-150 ease-(--ease-out) hover:bg-nav-on hover:text-nav-on-ink',
            collapsed && 'justify-center px-0',
          )}
        >
          {collapsed ? <PanelLeftOpen size={18} aria-hidden /> : <PanelLeftClose size={18} aria-hidden />}
          <span className={cn(collapsed && 'sr-only')}>Collapse</span>
        </button>
      </nav>

      {/* Main */}
      <main className="min-w-0 overflow-y-auto" style={{ gridArea: 'main' }}>
        {reduce ? (
          <div className="mx-auto max-w-[1440px] px-10 py-9">
            <Outlet />
          </div>
        ) : (
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, ease: [0.22, 0.61, 0.36, 1] }}
            className="mx-auto max-w-[1440px] px-10 py-9"
          >
            <Outlet />
          </motion.div>
        )}
      </main>

      <ToastHost />
    </div>
  );
}
