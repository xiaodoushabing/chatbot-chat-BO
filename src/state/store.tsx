import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import * as fx from '../data/fixtures';
import type {
  ApprovalRequest,
  BatchChild,
  DiscoveredFolder,
  Intent,
  Role,
  Run,
  RunParams,
  Source,
  Topic,
  User,
} from '../data/types';

/* Prototype store: fixtures cloned into React state; mutations are in-memory
   and reset on reload. Latencies and run progress are simulated. */

interface Toast {
  id: number;
  message: string;
  kind: 'ok' | 'err' | 'info';
}

interface StoreState {
  user: User;
  authed: boolean;
  theme: 'light' | 'dark';
  projectId: string;
  topicByProject: Record<string, string>;
  topics: Topic[];
  sources: Source[];
  runs: Run[];
  intents: Intent[];
  approvals: ApprovalRequest[];
  toasts: Toast[];
  /** topics whose source list has been enumerated at least once this session */
  enumeratedTopics: Record<string, boolean>;
}

export interface StoreApi extends StoreState {
  projects: typeof fx.projects;
  users: typeof fx.users;
  tonalities: string[];
  login: () => void;
  logout: () => void;
  setRole: (role: Role) => void;
  toggleTheme: () => void;
  setProject: (id: string) => void;
  topicId: string | null;
  setTopic: (topicId: string) => void;
  toast: (message: string, kind?: Toast['kind']) => void;
  dismissToast: (id: number) => void;

  testUrl: (url: string) => Promise<{ ok: boolean; siteName?: string; error?: string }>;
  enumerateFolders: (projectId: string) => Promise<DiscoveredFolder[]>;
  addTopics: (projectId: string, folders: DiscoveredFolder[]) => void;
  createTopic: (projectId: string, name: string, url: string) => { ok: boolean; error?: string };
  renameTopic: (id: string, name: string) => void;
  removeTopic: (id: string) => void;

  markEnumerated: (topicId: string) => void;
  refreshSources: (topicId: string) => Promise<void>;
  syncToIndex: (sourceIds: string[]) => void;

  startRun: (opts: {
    topicId: string;
    type: 'single' | 'batch';
    params: RunParams;
    sourceIds: string[];
  }) => string;

  createManualIntent: (intent: Pick<Intent, 'topicId' | 'question' | 'response' | 'utterances' | 'sourceIds'>) => void;
  updateIntent: (id: string, patch: Partial<Pick<Intent, 'question' | 'response' | 'utterances'>>) => void;
  stageIntents: (ids: string[]) => void;
  unstageIntents: (ids: string[]) => void;
  deleteIntent: (id: string) => void;
  restoreIntent: (id: string) => void;

  submitForApproval: (intentIds: string[], note?: string) => void;
  withdrawRequest: (id: string) => void;
  approveRequest: (id: string) => void;
  rejectRequest: (id: string, note: string) => void;
}

const StoreCtx = createContext<StoreApi | null>(null);

let idSeq = 100;
const nextId = (prefix: string) => `${prefix}-${(idSeq++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(() => ({
    user: fx.users[0],
    authed: false,
    theme: (localStorage.getItem('theme') as 'light' | 'dark') ?? 'light',
    projectId: fx.projects[0].id,
    topicByProject: { 'p-cards': 't-travel' },
    topics: structuredClone(fx.topics),
    sources: structuredClone(fx.sources),
    runs: structuredClone(fx.runs),
    intents: structuredClone(fx.intents),
    approvals: structuredClone(fx.approvals),
    toasts: [],
    enumeratedTopics: {},
  }));
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearInterval), []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.theme === 'dark');
    localStorage.setItem('theme', state.theme);
  }, [state.theme]);

  const toast = useCallback((message: string, kind: Toast['kind'] = 'ok') => {
    const id = Date.now() + Math.random();
    setState(s => ({ ...s, toasts: [...s.toasts, { id, message, kind }] }));
    setTimeout(() => setState(s => ({ ...s, toasts: s.toasts.filter(t => t.id !== id) })), 4200);
  }, []);

  const patchIntents = useCallback((ids: string[], patch: Partial<Intent>) => {
    const now = new Date().toISOString();
    setState(s => ({
      ...s,
      intents: s.intents.map(i => (ids.includes(i.id) ? { ...i, ...patch, updatedAt: now } : i)),
    }));
  }, []);

  const startRun = useCallback(
    ({ topicId, type, params, sourceIds }: Parameters<StoreApi['startRun']>[0]) => {
      const runId = nextId('run');
      const total = type === 'batch' ? 12 + Math.floor(Math.random() * 8) : sourceIds.length;
      const children: BatchChild[] =
        type === 'batch'
          ? Array.from({ length: total }, (_, i) => ({
              id: `${runId}-c${i}`,
              row: i + 2,
              intentQuestion: [
                'Card replacement timelines', 'Foreign transaction fees', 'Statement date changes',
                'Rewards expiry policy', 'Minimum payment calculation', 'Contactless limits',
                'Overseas ATM withdrawals', 'Balance transfer promos', 'Annual fee waivers',
                'Instalment early settlement', 'Credit bureau reporting', 'Card PIN reset',
                'Temporary card freeze', 'Recurring payment setup', 'Cashback exclusions',
                'Miles crediting timeline', 'Dispute evidence needed', 'Card upgrade paths',
                'Joint applicant rules', 'Statement in paper form',
              ][i % 20],
              status: 'pending' as const,
              intentIds: [],
              durationSec: null,
            }))
          : [];
      const run: Run = {
        id: runId,
        topicId,
        type,
        status: 'running',
        startedBy: state.user.name,
        startedAt: new Date().toISOString(),
        finishedAt: null,
        durationSec: null,
        params,
        sourceIds,
        progress: { total, done: 0, succeeded: 0, skipped: 0, failed: 0, intentsDrafted: 0 },
        children,
      };
      setState(s => ({ ...s, runs: [run, ...s.runs] }));

      const startedAtMs = Date.now();
      const tickMs = type === 'batch' ? 650 : 900;
      const timer = window.setInterval(() => {
        setState(s => {
          const r = s.runs.find(x => x.id === runId);
          if (!r || r.status !== 'running') return s;
          const p = { ...r.progress };
          p.done += 1;
          const roll = Math.random();
          const outcome = roll < 0.82 ? 'succeeded' : roll < 0.93 ? 'skipped' : 'failed';
          p[outcome] += 1;
          const newIntents: Intent[] = [];
          let childPatch: BatchChild[] = r.children;
          if (outcome === 'succeeded') {
            const n = type === 'batch' ? 1 + Math.floor(Math.random() * 2) : Math.max(1, Math.round(params.maxIntents / Math.max(1, total)));
            p.intentsDrafted += n;
            for (let k = 0; k < n; k++) {
              const child = r.children[p.done - 1];
              const q = type === 'batch' && child ? `${child.intentQuestion}?` : (params.intentQuestion ?? 'Generated intent');
              newIntents.push({
                id: nextId('i'),
                topicId,
                question: n > 1 ? `${q.slice(0, -1)} — variant ${k + 1}?` : q,
                response:
                  'Drafted from the selected sources: the assistant answers with grounded policy details, payout limits and the exact steps the customer should take, citing the source document.',
                utterances: [q, `Tell me about ${q.toLowerCase().replace('?', '')}`],
                sourceIds: sourceIds.slice(0, 2),
                state: 'draft',
                origin: { kind: 'run', runId },
                createdBy: state.user.name,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            }
          }
          if (type === 'batch') {
            childPatch = r.children.map((c, i) =>
              i === p.done - 1
                ? {
                    ...c,
                    status: outcome,
                    intentIds: newIntents.map(x => x.id),
                    durationSec: 30 + Math.round(Math.random() * 40),
                    note: outcome === 'skipped' ? 'Duplicate of an existing live intent' : outcome === 'failed' ? 'No grounded answer found in the selected sources' : undefined,
                  }
                : i === p.done && p.done < p.total
                  ? { ...c, status: 'running' as const }
                  : c,
            );
          }
          const finished = p.done >= p.total;
          const runs = s.runs.map(x =>
            x.id === runId
              ? {
                  ...x,
                  progress: p,
                  children: childPatch,
                  status: finished ? ('completed' as const) : x.status,
                  finishedAt: finished ? new Date().toISOString() : null,
                  durationSec: finished ? Math.round((Date.now() - startedAtMs) / 1000) : null,
                }
              : x,
          );
          if (finished) {
            clearInterval(timer);
          }
          return { ...s, runs, intents: [...newIntents, ...s.intents] };
        });
      }, tickMs);
      timers.current.push(timer);
      return runId;
    },
    [state.user.name],
  );

  const api: StoreApi = useMemo(() => {
    const topicId = state.topicByProject[state.projectId] ?? null;
    return {
      ...state,
      projects: fx.projects,
      users: fx.users,
      tonalities: fx.tonalities,
      topicId,
      login: () => setState(s => ({ ...s, authed: true })),
      logout: () => setState(s => ({ ...s, authed: false })),
      setRole: role =>
        setState(s => ({ ...s, user: fx.users.find(u => u.role === role) ?? s.user })),
      toggleTheme: () => setState(s => ({ ...s, theme: s.theme === 'light' ? 'dark' : 'light' })),
      setProject: id => setState(s => ({ ...s, projectId: id })),
      setTopic: t =>
        setState(s => ({ ...s, topicByProject: { ...s.topicByProject, [s.projectId]: t } })),
      toast,
      dismissToast: id => setState(s => ({ ...s, toasts: s.toasts.filter(t => t.id !== id) })),

      testUrl: async url => {
        await delay(1200);
        if (!url.startsWith('https://') || !url.includes('sharepoint.com')) {
          return { ok: false, error: 'Not a reachable SharePoint URL. Check the address and your access.' };
        }
        return { ok: true, siteName: 'GDO Chatbot — Knowledge Working Folder' };
      },
      enumerateFolders: async projectId => {
        await delay(1100);
        return fx.discoveredFolders.filter(f => f.projectId === projectId);
      },
      addTopics: (projectId, folders) => {
        setState(s => ({
          ...s,
          topics: [
            ...s.topics,
            ...folders
              .filter(f => !s.topics.some(t => t.projectId === projectId && t.sharepointUrl === f.sharepointUrl))
              .map(f => ({
                id: nextId('t'),
                projectId,
                name: f.folderName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                folderName: f.folderName,
                sharepointUrl: f.sharepointUrl,
                addedBy: s.user.name,
                addedAt: new Date().toISOString(),
                lastSyncedAt: null,
              })),
          ],
        }));
        toast(`${folders.length === 1 ? 'Topic' : `${folders.length} topics`} added`);
      },
      createTopic: (projectId, name, url) => {
        const project = fx.projects.find(p => p.id === projectId)!;
        if (!url.startsWith(project.sharepointUrl + '/')) {
          return { ok: false, error: 'Topic URL must be a subfolder of the project root.' };
        }
        setState(s => ({
          ...s,
          topics: [
            ...s.topics,
            {
              id: nextId('t'),
              projectId,
              name,
              folderName: url.split('/').pop() ?? name,
              sharepointUrl: url,
              addedBy: s.user.name,
              addedAt: new Date().toISOString(),
              lastSyncedAt: null,
            },
          ],
        }));
        toast(`Topic “${name}” created`);
        return { ok: true };
      },
      renameTopic: (id, name) => {
        setState(s => ({ ...s, topics: s.topics.map(t => (t.id === id ? { ...t, name } : t)) }));
        toast('Topic renamed');
      },
      removeTopic: id => {
        setState(s => ({ ...s, topics: s.topics.filter(t => t.id !== id) }));
        toast('Topic removed', 'info');
      },

      markEnumerated: tid => setState(s => ({ ...s, enumeratedTopics: { ...s.enumeratedTopics, [tid]: true } })),
      refreshSources: async tid => {
        await delay(1000);
        setState(s => ({
          ...s,
          topics: s.topics.map(t => (t.id === tid ? { ...t, lastSyncedAt: new Date().toISOString() } : t)),
        }));
        toast('Source list refreshed from SharePoint');
      },
      syncToIndex: sourceIds => {
        setState(s => ({
          ...s,
          sources: s.sources.map(src => (sourceIds.includes(src.id) ? { ...src, indexStatus: 'indexing' as const } : src)),
        }));
        sourceIds.forEach((id, i) => {
          const t = window.setTimeout(() => {
            setState(s => ({
              ...s,
              sources: s.sources.map(src =>
                src.id === id ? { ...src, indexStatus: 'indexed' as const, lastIndexedAt: new Date().toISOString() } : src,
              ),
            }));
            if (i === sourceIds.length - 1) toast(`${sourceIds.length === 1 ? 'Source' : `${sourceIds.length} sources`} synced to the index`);
          }, 1500 + i * 900);
          timers.current.push(t);
        });
      },

      startRun,

      createManualIntent: draft => {
        setState(s => ({
          ...s,
          intents: [
            {
              ...draft,
              id: nextId('i'),
              state: 'staged' as const,
              origin: { kind: 'manual' as const },
              createdBy: s.user.name,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            ...s.intents,
          ],
        }));
        toast('Intent created and staged');
      },
      updateIntent: (id, patch) => patchIntents([id], patch),
      stageIntents: ids => {
        patchIntents(ids, { state: 'staged' });
        toast(`${ids.length === 1 ? 'Intent' : `${ids.length} intents`} staged for review`);
      },
      unstageIntents: ids => {
        patchIntents(ids, { state: 'draft' });
        toast('Removed from staging', 'info');
      },
      deleteIntent: id => {
        patchIntents([id], { state: 'deleted' });
        toast('Intent deleted — restorable from the Deleted tab', 'info');
      },
      restoreIntent: id => {
        patchIntents([id], { state: 'live' });
        toast('Intent restored');
      },

      submitForApproval: (intentIds, note) => {
        setState(s => {
          const byTopic = new Map<string, string[]>();
          for (const iid of intentIds) {
            const intent = s.intents.find(x => x.id === iid);
            if (!intent) continue;
            byTopic.set(intent.topicId, [...(byTopic.get(intent.topicId) ?? []), iid]);
          }
          const reqs: ApprovalRequest[] = [...byTopic.entries()].map(([tid, ids]) => ({
            id: nextId('a'),
            topicId: tid,
            intentIds: ids,
            submittedBy: s.user.name,
            submittedAt: new Date().toISOString(),
            status: 'pending' as const,
            decidedBy: null,
            decidedAt: null,
            note,
          }));
          return {
            ...s,
            approvals: [...reqs, ...s.approvals],
            intents: s.intents.map(i =>
              intentIds.includes(i.id) ? { ...i, state: 'pending_approval' as const } : i,
            ),
          };
        });
        toast('Submitted for approval');
      },
      withdrawRequest: id => {
        setState(s => {
          const req = s.approvals.find(a => a.id === id);
          if (!req) return s;
          return {
            ...s,
            approvals: s.approvals.map(a => (a.id === id ? { ...a, status: 'withdrawn' as const } : a)),
            intents: s.intents.map(i =>
              req.intentIds.includes(i.id) ? { ...i, state: 'staged' as const } : i,
            ),
          };
        });
        toast('Request withdrawn — intents returned to staging', 'info');
      },
      approveRequest: id => {
        setState(s => {
          const req = s.approvals.find(a => a.id === id);
          if (!req) return s;
          return {
            ...s,
            approvals: s.approvals.map(a =>
              a.id === id
                ? { ...a, status: 'approved' as const, decidedBy: s.user.name, decidedAt: new Date().toISOString() }
                : a,
            ),
            intents: s.intents.map(i =>
              req.intentIds.includes(i.id) ? { ...i, state: 'live' as const } : i,
            ),
          };
        });
        const req = state.approvals.find(a => a.id === id);
        const topic = state.topics.find(t => t.id === req?.topicId);
        toast(`${req?.intentIds.length ?? ''} intents published to ${topic?.name ?? 'topic'}`);
      },
      rejectRequest: (id, note) => {
        setState(s => {
          const req = s.approvals.find(a => a.id === id);
          if (!req) return s;
          return {
            ...s,
            approvals: s.approvals.map(a =>
              a.id === id
                ? { ...a, status: 'rejected' as const, decidedBy: s.user.name, decidedAt: new Date().toISOString(), note }
                : a,
            ),
            intents: s.intents.map(i =>
              req.intentIds.includes(i.id) ? { ...i, state: 'rejected' as const, reviewNote: note } : i,
            ),
          };
        });
        toast('Request rejected — maker has been notified', 'info');
      },
    };
  }, [state, toast, startRun, patchIntents]);

  return <StoreCtx.Provider value={api}>{children}</StoreCtx.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
