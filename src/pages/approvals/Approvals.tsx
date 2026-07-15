import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, ChevronDown, Inbox, ShieldCheck, Undo2, XCircle } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useStore } from '../../state/store';
import type { ApprovalRequest, Intent } from '../../data/types';
import { fmtDateTime, plural } from '../../lib/format';
import { Button, Field, SearchField, Select, Textarea } from '../../components/ui/controls';
import {
  ApprovalStatusPill,
  EmptyState,
  IntentStatePill,
  KeyValue,
  Mono,
  PageHeader,
  Tabs,
} from '../../components/ui/display';
import { TableShell, Td, Th, Tr } from '../../components/ui/table';
import { Drawer } from '../../components/ui/overlay';

const EASE = [0.22, 1, 0.36, 1] as const;

type TabKey = 'inbox' | 'history';
type Decision = 'approved' | 'rejected' | 'withdrawn';

/* ── Expandable intent row inside the drawer ── */

function IntentItem({ intent }: { intent: Intent }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="border-b border-line last:border-b-0">
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent"
      >
        <ChevronDown
          size={13}
          aria-hidden
          className={cn('shrink-0 text-ink-3 transition-transform duration-200', open && 'rotate-180')}
        />
        <span className="min-w-0 flex-1 text-sm font-medium text-ink">{intent.question}</span>
        <IntentStatePill state={intent.state} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-line bg-surface-2 px-3 py-3 pl-8">
              <div>
                <p className="mb-1 text-2xs font-bold tracking-wider text-ink-3 uppercase">Response</p>
                <p className="max-w-prose text-sm leading-relaxed text-ink">{intent.response}</p>
              </div>
              <div>
                <p className="mb-1 text-2xs font-bold tracking-wider text-ink-3 uppercase">Utterances</p>
                <ul className="flex flex-wrap gap-1.5">
                  {intent.utterances.map(u => (
                    <li
                      key={u}
                      className="rounded-full border border-line bg-bg px-2 py-0.5 text-xs text-ink-2"
                    >
                      {u}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-xs text-ink-2">
                Created by {intent.createdBy} · {fmtDateTime(intent.createdAt)} ·{' '}
                {intent.origin.kind === 'run' ? (
                  <>
                    from run <Mono>{intent.origin.runId}</Mono>
                  </>
                ) : (
                  'authored manually'
                )}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

/* ── Detail drawer ── */

function RequestDrawer({
  request,
  onClose,
}: {
  request: ApprovalRequest | null;
  onClose: () => void;
}) {
  const { user, topics, intents, approveRequest, rejectRequest, withdrawRequest } = useStore();
  const [rejecting, setRejecting] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [justDecided, setJustDecided] = useState<Decision | null>(null);

  const topic = topics.find(t => t.id === request?.topicId);
  const reqIntents = useMemo(
    () => (request ? intents.filter(i => request.intentIds.includes(i.id)) : []),
    [request, intents],
  );

  const isOwn = !!request && request.submittedBy === user.name;
  const isPending = request?.status === 'pending';
  const canDecide = isPending && user.role === 'checker' && !isOwn;
  const canWithdraw = isPending && isOwn;

  const close = () => {
    onClose();
    setRejecting(false);
    setRejectNote('');
    setJustDecided(null);
  };

  const decide = (decision: Decision) => {
    if (!request) return;
    if (decision === 'approved') approveRequest(request.id);
    if (decision === 'rejected') rejectRequest(request.id, rejectNote.trim());
    if (decision === 'withdrawn') withdrawRequest(request.id);
    setJustDecided(decision);
    setRejecting(false);
    window.setTimeout(close, 1100);
  };

  const decidedCopy: Record<Decision, { icon: typeof CheckCircle2; cls: string; text: string }> = {
    approved: { icon: CheckCircle2, cls: 'text-ok', text: `Approved — ${plural(reqIntents.length, 'intent')} published to ${topic?.name ?? 'topic'}` },
    rejected: { icon: XCircle, cls: 'text-err', text: 'Rejected — intents returned to the maker with your note' },
    withdrawn: { icon: Undo2, cls: 'text-info', text: 'Withdrawn — intents returned to staging' },
  };

  let footer: React.ReactNode;
  if (!request) {
    footer = undefined;
  } else if (justDecided) {
    const c = decidedCopy[justDecided];
    footer = (
      <motion.p
        key="decided"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: EASE }}
        className="flex w-full items-center gap-2 text-sm font-semibold text-ink"
        role="status"
      >
        <c.icon size={15} className={c.cls} aria-hidden />
        {c.text}
      </motion.p>
    );
  } else if (canDecide && rejecting) {
    footer = (
      <motion.div
        key="reject-form"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: EASE }}
        className="flex w-full flex-col gap-3"
      >
        <Field
          label="Rejection note"
          htmlFor="reject-note"
          hint="Required — the maker sees this note against every intent in the request."
        >
          <Textarea
            id="reject-note"
            value={rejectNote}
            onChange={e => setRejectNote(e.target.value)}
            placeholder="What must the maker fix before resubmitting?"
            autoFocus
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setRejecting(false)}>
            Cancel
          </Button>
          <Button variant="danger" disabled={rejectNote.trim().length === 0} onClick={() => decide('rejected')}>
            Reject request
          </Button>
        </div>
      </motion.div>
    );
  } else if (canDecide) {
    footer = (
      <motion.div
        key="decide"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: EASE }}
        className="flex w-full items-center gap-2"
      >
        <p className="mr-auto flex items-center gap-1.5 text-xs text-ink-2">
          <ShieldCheck size={13} className="shrink-0" aria-hidden />
          Submitted by {request.submittedBy} — you may decide this request.
        </p>
        <Button variant="danger" onClick={() => setRejecting(true)}>
          Reject…
        </Button>
        <Button variant="primary" onClick={() => decide('approved')}>
          Approve
        </Button>
      </motion.div>
    );
  } else if (canWithdraw) {
    footer = (
      <div className="flex w-full items-center gap-2">
        <p className="mr-auto flex items-center gap-1.5 text-xs text-ink-2">
          <ShieldCheck size={13} className="shrink-0" aria-hidden />
          You submitted this request, so another checker must decide it.
        </p>
        <Button onClick={() => decide('withdrawn')}>Withdraw request</Button>
      </div>
    );
  } else if (isPending) {
    footer = (
      <p className="flex w-full items-center gap-1.5 text-xs text-ink-2">
        <ShieldCheck size={13} className="shrink-0" aria-hidden />
        Read-only — under maker–checker segregation only a checker can approve or reject this request.
      </p>
    );
  } else {
    footer = undefined;
  }

  return (
    <Drawer
      open={!!request}
      onClose={close}
      title={
        request ? (
          <>
            <span className="font-mono">{request.id}</span>
            <span className="text-ink-2"> — {topic?.name ?? 'Unknown topic'}</span>
          </>
        ) : (
          ''
        )
      }
      meta={request && <ApprovalStatusPill status={request.status} />}
      footer={footer && <AnimatePresence mode="wait">{footer}</AnimatePresence>}
    >
      {request && (
        <div className="space-y-5">
          <KeyValue
            items={[
              ['Request', <Mono key="id">{request.id}</Mono>],
              ['Topic', topic?.name ?? 'Unknown topic'],
              ['Intents', <Mono key="n">{request.intentIds.length}</Mono>],
              ['Submitted', `${request.submittedBy} · ${fmtDateTime(request.submittedAt)}`],
              ...(request.decidedBy && request.decidedAt
                ? ([['Decided', `${request.decidedBy} · ${fmtDateTime(request.decidedAt)}`]] as Array<
                    [string, React.ReactNode]
                  >)
                : []),
            ]}
          />
          {request.note && (
            <div className="rounded-(--radius-field) border border-line bg-surface-2 px-3 py-2.5">
              <p className="mb-1 text-2xs font-bold tracking-wider text-ink-3 uppercase">
                {request.status === 'rejected' ? 'Rejection note' : 'Request note'}
              </p>
              <p className="max-w-prose text-sm leading-relaxed text-ink">{request.note}</p>
            </div>
          )}
          <section aria-label="Intents in this request">
            <p className="mb-2 text-2xs font-bold tracking-wider text-ink-3 uppercase">
              {plural(request.intentIds.length, 'intent')} in this request
            </p>
            <ul className="rounded-(--radius-ctl) border border-line">
              {reqIntents.map(i => (
                <IntentItem key={i.id} intent={i} />
              ))}
              {reqIntents.length === 0 && (
                <li className="px-3 py-4 text-sm text-ink-2">
                  The intents in this request are no longer available.
                </li>
              )}
            </ul>
          </section>
        </div>
      )}
    </Drawer>
  );
}

/* ── Page ── */

export default function Approvals() {
  const { user, projectId, projects, topics, approvals, intents } = useStore();
  const [tab, setTab] = useState<TabKey>('inbox');
  const [topicFilter, setTopicFilter] = useState('all');
  const [submitterFilter, setSubmitterFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const project = projects.find(p => p.id === projectId);
  const projectTopics = useMemo(() => topics.filter(t => t.projectId === projectId), [topics, projectId]);
  const topicName = (id: string) => projectTopics.find(t => t.id === id)?.name ?? 'Unknown topic';

  const projectRequests = useMemo(() => {
    const ids = new Set(projectTopics.map(t => t.id));
    return approvals.filter(a => ids.has(a.topicId));
  }, [approvals, projectTopics]);

  const inbox = projectRequests.filter(a => a.status === 'pending');
  const history = projectRequests.filter(a => a.status !== 'pending');
  const baseRows = tab === 'inbox' ? inbox : history;

  const submitters = useMemo(
    () => [...new Set(projectRequests.map(a => a.submittedBy))].sort(),
    [projectRequests],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return baseRows
      .filter(a => topicFilter === 'all' || a.topicId === topicFilter)
      .filter(a => submitterFilter === 'all' || a.submittedBy === submitterFilter)
      .filter(a => {
        if (!q) return true;
        const questions = intents
          .filter(i => a.intentIds.includes(i.id))
          .map(i => i.question)
          .join(' ');
        return [a.id, topicName(a.topicId), a.submittedBy, a.note ?? '', questions]
          .join(' ')
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) =>
        tab === 'inbox'
          ? b.submittedAt.localeCompare(a.submittedAt)
          : (b.decidedAt ?? b.submittedAt).localeCompare(a.decidedAt ?? a.submittedAt),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseRows, topicFilter, submitterFilter, query, tab, intents, projectTopics]);

  // Drawer request must still belong to the current project (project switch closes it).
  const selected = projectRequests.find(a => a.id === selectedId) ?? null;

  const isFiltered = query.trim() !== '' || topicFilter !== 'all' || submitterFilter !== 'all';
  const colCount = tab === 'inbox' ? 6 : 8;

  return (
    <>
      <PageHeader
        title="Approvals"
        sub={
          user.role === 'checker'
            ? `Requests submitted for ${project?.name ?? 'this project'}. Decide each request under maker–checker segregation — you cannot approve your own submissions.`
            : `Approval requests for ${project?.name ?? 'this project'}. Checkers decide submissions under maker–checker segregation; you can withdraw your own pending requests.`
        }
      />

      <Tabs<TabKey>
        tabs={[
          { value: 'inbox', label: 'Inbox', count: inbox.length },
          { value: 'history', label: 'History', count: history.length },
        ]}
        value={tab}
        onChange={t => setTab(t)}
      />

      <div className="mt-4 mb-3 flex flex-wrap items-center gap-2">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search requests, submitters or intents"
          className="w-72"
        />
        <Select
          aria-label="Filter by topic"
          value={topicFilter}
          onChange={e => setTopicFilter(e.target.value)}
          className="w-44"
        >
          <option value="all">All topics</option>
          {projectTopics.map(t => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filter by submitter"
          value={submitterFilter}
          onChange={e => setSubmitterFilter(e.target.value)}
          className="w-44"
        >
          <option value="all">All submitters</option>
          {submitters.map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <span className="ml-auto font-mono text-xs text-ink-2">
          {plural(rows.length, 'request')}
        </span>
      </div>

      {baseRows.length === 0 ? (
        tab === 'inbox' ? (
          <EmptyState
            icon={Inbox}
            title="No pending requests"
            body={`When a maker submits staged intents for approval in ${project?.name ?? 'this project'}, the request lands here for a checker to decide. Stage intents in Review, then submit for approval.`}
          />
        ) : (
          <EmptyState
            icon={ShieldCheck}
            title="No decided requests yet"
            body="Approved, rejected and withdrawn requests are kept here with who decided them and when."
          />
        )
      ) : (
        <TableShell>
          <thead>
            <tr>
              <Th>Request</Th>
              <Th>Topic</Th>
              <Th className="text-right">Intents</Th>
              <Th>Submitted by</Th>
              <Th>Submitted at</Th>
              {tab === 'history' && (
                <>
                  <Th>Decided by</Th>
                  <Th>Decided at</Th>
                </>
              )}
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map(a => (
              <Tr key={a.id} onClick={() => setSelectedId(a.id)} selected={a.id === selected?.id}>
                <Td mono className="text-ink">{a.id}</Td>
                <Td>{topicName(a.topicId)}</Td>
                <Td mono className="text-right tabular-nums">{a.intentIds.length}</Td>
                <Td className="text-ink-2">
                  {a.submittedBy}
                  {a.submittedBy === user.name && (
                    <span className="ml-1.5 text-2xs font-bold tracking-wide text-ink-3 uppercase">you</span>
                  )}
                </Td>
                <Td mono>{fmtDateTime(a.submittedAt)}</Td>
                {tab === 'history' && (
                  <>
                    <Td className="text-ink-2">{a.decidedBy ?? '—'}</Td>
                    <Td mono>{a.decidedAt ? fmtDateTime(a.decidedAt) : '—'}</Td>
                  </>
                )}
                <Td>
                  <ApprovalStatusPill status={a.status} />
                </Td>
              </Tr>
            ))}
            {rows.length === 0 && isFiltered && (
              <tr>
                <td colSpan={colCount} className="px-3 py-8 text-center text-sm text-ink-2">
                  No requests match your filters. Clear the search or widen the topic and submitter filters.
                </td>
              </tr>
            )}
          </tbody>
        </TableShell>
      )}

      <RequestDrawer key={selected?.id ?? 'none'} request={selected} onClose={() => setSelectedId(null)} />
    </>
  );
}
