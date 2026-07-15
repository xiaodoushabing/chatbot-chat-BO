import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import {
  Check,
  ChevronsUpDown,
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

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/settings', label: 'Project Settings', icon: FolderCog },
  { to: '/studio', label: 'Intent Studio', icon: Sparkles },
  { to: '/review', label: 'Review', icon: ClipboardCheck },
  { to: '/approvals', label: 'Approvals', icon: Inbox },
  { to: '/library', label: 'Intent Library', icon: Library },
];

const ROLE_LABEL: Record<Role, string> = {
  owner: 'Owner',
  contributor: 'Contributor',
  checker: 'Checker',
};

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
  const { projects, projectId, setProject } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));
  const current = projects.find(p => p.id === projectId)!;
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-10 items-center gap-2 rounded-(--radius-field) px-2.5 transition-colors hover:bg-surface-2"
      >
        <span className="text-base font-medium text-ink-3">Project:</span>
        <span className="border-b-2 border-accent pb-px text-lg font-bold text-ink">{current.name}</span>
        <ChevronsUpDown size={15} className="text-ink-3" aria-hidden />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label="Switch project"
          className="absolute left-0 top-9.5 z-(--z-dropdown) w-64 rounded-(--radius-card) border border-line bg-bg p-1 shadow-(--shadow-pop)"
        >
          <p className="px-2.5 pb-1 pt-1.5 text-2xs font-bold tracking-wider text-ink-3 uppercase">
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
                'flex w-full items-center gap-2 rounded-(--radius-ctl) px-2.5 py-2 text-left text-sm transition-colors hover:bg-surface-2',
                p.id === projectId ? 'font-semibold text-ink' : 'text-ink-2',
              )}
            >
              <span className="min-w-0 flex-1">
                {p.name}
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
        className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-2xs font-bold text-on-accent transition-transform hover:scale-105"
      >
        {user.initials}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-9.5 z-(--z-dropdown) w-60 rounded-(--radius-card) border border-line bg-bg p-1 shadow-(--shadow-pop)"
        >
          <div className="border-b border-line px-2.5 py-2">
            <p className="text-sm font-semibold text-ink">{user.name}</p>
            <p className="text-xs text-ink-2">{ROLE_LABEL[user.role]} · {user.name.toLowerCase().replace(' ', '.')}@bank.example</p>
          </div>
          <p className="px-2.5 pb-0.5 pt-2 text-2xs font-bold tracking-wider text-ink-3 uppercase">
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
                'flex w-full items-center justify-between rounded-(--radius-ctl) px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-surface-2',
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
              className="flex w-full items-center gap-2 rounded-(--radius-ctl) px-2.5 py-1.5 text-left text-sm text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
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
  return (
    <div className="flex h-screen flex-col">
      <div className="h-[3px] shrink-0 bg-accent" aria-hidden />

      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-line bg-bg px-4">
        <span className="flex items-center gap-2 text-sm font-bold tracking-tight text-ink">
          <span className="flex h-6 w-6 items-center justify-center rounded-(--radius-ctl) bg-accent text-on-accent">
            <Sparkles size={13} aria-hidden />
          </span>
          <span className={cn(collapsed && 'sr-only')}>Intent Studio</span>
        </span>
        <ProjectSwitcher />
        <div className="ml-auto flex items-center gap-2.5">
          <span className="rounded-full bg-accent-wash px-2.5 py-1 text-2xs font-bold tracking-wide text-accent uppercase">
            {ROLE_LABEL[user.role]}
          </span>
          <button
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
            className="flex h-8 w-8 items-center justify-center rounded-(--radius-ctl) text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
          </button>
          <UserMenu />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <nav
          aria-label="Primary"
          className={cn(
            'flex shrink-0 flex-col border-r border-line bg-surface-2 py-3 transition-[width] duration-200 ease-(--ease-out)',
            collapsed ? 'w-16 px-2' : 'w-58 px-3',
          )}
        >
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={item.label}
              className={({ isActive }) =>
                cn(
                  'mb-0.5 flex items-center gap-2.5 rounded-(--radius-ctl) px-2.5 py-2 text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-accent-wash font-semibold text-accent'
                    : 'text-ink-2 hover:bg-surface-3 hover:text-ink',
                  collapsed && 'justify-center px-0',
                )
              }
            >
              <item.icon size={16} className="shrink-0" aria-hidden />
              <span className={cn(collapsed && 'sr-only')}>{item.label}</span>
            </NavLink>
          ))}
          <button
            onClick={() => setCollapsed(v => !v)}
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            className={cn(
              'mt-auto flex items-center gap-2.5 rounded-(--radius-ctl) px-2.5 py-2 text-sm font-medium text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink',
              collapsed && 'justify-center px-0',
            )}
          >
            {collapsed ? <PanelLeftOpen size={16} aria-hidden /> : <PanelLeftClose size={16} aria-hidden />}
            <span className={cn(collapsed && 'sr-only')}>Collapse</span>
          </button>
        </nav>
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1440px] px-8 py-7">
            <Outlet />
          </div>
        </main>
      </div>
      <ToastHost />
    </div>
  );
}
