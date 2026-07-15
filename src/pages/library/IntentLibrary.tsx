import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArchiveRestore, BookOpenText, FileText, Link2, SearchX, Trash2 } from 'lucide-react';
import { useStore } from '../../state/store';
import { fmtDate, fmtDateTime, plural } from '../../lib/format';
import { Button, Field, Input, SearchField, Select, Textarea } from '../../components/ui/controls';
import {
  EmptyState,
  IntentStatePill,
  KeyValue,
  Mono,
  PageHeader,
  Tabs,
} from '../../components/ui/display';
import { Drawer, Modal } from '../../components/ui/overlay';
import { Pagination, TableShell, Td, Th, Tr } from '../../components/ui/table';
import type { Intent } from '../../data/types';

const PAGE_SIZE = 25;

type LibTab = 'current' | 'deleted';

export default function IntentLibrary() {
  const store = useStore();
  const { projectId, topics, intents, user } = store;
  const navigate = useNavigate();
  const isOwner = user.role === 'owner';

  const project = store.projects.find(p => p.id === projectId);
  const projectTopics = useMemo(
    () => topics.filter(t => t.projectId === projectId),
    [topics, projectId],
  );
  const topicIds = useMemo(() => new Set(projectTopics.map(t => t.id)), [projectTopics]);

  const [tab, setTab] = useState<LibTab>('current');
  const [topicFilter, setTopicFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Debounce full-text search (~200ms) so the filter stays cheap on hundreds of rows.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim().toLowerCase()), 200);
    return () => clearTimeout(t);
  }, [query]);

  // Project switch: reset topic filter and paging; close any open drawer.
  useEffect(() => {
    setTopicFilter('all');
    setPage(0);
    setOpenId(null);
  }, [projectId]);

  useEffect(() => {
    setPage(0);
  }, [tab, topicFilter, debounced]);

  const projectIntents = useMemo(
    () => intents.filter(i => topicIds.has(i.topicId)),
    [intents, topicIds],
  );
  const currentAll = useMemo(() => projectIntents.filter(i => i.state === 'live'), [projectIntents]);
  const deletedAll = useMemo(() => projectIntents.filter(i => i.state === 'deleted'), [projectIntents]);

  const filtered = useMemo(() => {
    const base = tab === 'current' ? currentAll : deletedAll;
    return base
      .filter(i => (topicFilter === 'all' ? true : i.topicId === topicFilter))
      .filter(i =>
        debounced
          ? i.question.toLowerCase().includes(debounced) || i.response.toLowerCase().includes(debounced)
          : true,
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [tab, currentAll, deletedAll, topicFilter, debounced]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const rows = useMemo(
    () => filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE),
    [filtered, safePage],
  );

  const topicName = (id: string) => projectTopics.find(t => t.id === id)?.name ?? '—';
  const openIntent = openId ? projectIntents.find(i => i.id === openId) ?? null : null;
  const confirmIntent = confirmDeleteId ? projectIntents.find(i => i.id === confirmDeleteId) ?? null : null;

  const hasFilters = topicFilter !== 'all' || debounced !== '';

  return (
    <div className="mx-auto max-w-[1440px]">
      <PageHeader
        title="Intent Library"
        sub={`Production repository of approved intents for ${project?.name ?? 'this project'}. Deleted intents remain restorable.`}
      />

      <Tabs<LibTab>
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'current', label: 'Current', count: currentAll.length },
          { value: 'deleted', label: 'Deleted', count: deletedAll.length },
        ]}
      />

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <Field label="Topic" htmlFor="lib-topic" className="w-56">
          <Select id="lib-topic" value={topicFilter} onChange={e => setTopicFilter(e.target.value)}>
            <option value="all">All topics</option>
            {projectTopics.map(t => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search question or response"
          className="w-80 max-w-full"
        />
        <span className="ml-auto pb-2 font-mono text-xs text-ink-2">
          {plural(filtered.length, 'intent')}
        </span>
      </div>

      <div className="mt-3">
        {filtered.length === 0 ? (
          tab === 'current' && currentAll.length === 0 && !hasFilters ? (
            <EmptyState
              icon={BookOpenText}
              title="No live intents yet"
              body="Approved intents land here. Generate drafts in Intent Studio, stage them in Review, and submit for checker approval to publish."
              action={<Button variant="primary" onClick={() => navigate('/studio')}>Open Intent Studio</Button>}
            />
          ) : tab === 'deleted' && deletedAll.length === 0 && !hasFilters ? (
            <EmptyState
              icon={Trash2}
              title="Nothing deleted"
              body="Soft-deleted intents appear here and can be restored to the live library at any time."
            />
          ) : (
            <EmptyState
              icon={SearchX}
              title="No intents match"
              body="Try a different search term or widen the topic filter."
              action={
                <Button
                  onClick={() => {
                    setQuery('');
                    setTopicFilter('all');
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          )
        ) : (
          <>
            <TableShell>
              <thead>
                <tr>
                  <Th className="w-full">Question</Th>
                  <Th>Topic</Th>
                  <Th className="text-right">Utterances</Th>
                  <Th className="text-right">Sources</Th>
                  <Th>Updated</Th>
                  <Th>State</Th>
                  {tab === 'deleted' && isOwner && <Th className="text-right">Actions</Th>}
                </tr>
              </thead>
              <tbody>
                {rows.map(i => (
                  <Tr key={i.id} selected={i.id === openId} onClick={() => setOpenId(i.id)}>
                    <Td className="max-w-0">
                      <span className="block truncate font-medium text-ink" title={i.question}>
                        {i.question}
                      </span>
                    </Td>
                    <Td className="whitespace-nowrap text-ink-2">{topicName(i.topicId)}</Td>
                    <Td mono className="text-right tabular-nums">{i.utterances.length}</Td>
                    <Td mono className="text-right tabular-nums">{i.sourceIds.length}</Td>
                    <Td mono className="whitespace-nowrap">{fmtDate(i.updatedAt)}</Td>
                    <Td>
                      <IntentStatePill state={i.state} />
                    </Td>
                    {tab === 'deleted' && isOwner && (
                      <Td className="text-right">
                        <Button
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            store.restoreIntent(i.id);
                          }}
                        >
                          <ArchiveRestore size={13} aria-hidden />
                          Restore
                        </Button>
                      </Td>
                    )}
                  </Tr>
                ))}
              </tbody>
            </TableShell>
            <Pagination
              page={safePage}
              pageCount={pageCount}
              onPage={setPage}
              total={filtered.length}
              pageSize={PAGE_SIZE}
            />
          </>
        )}
      </div>

      <IntentDrawer
        intent={openIntent}
        onClose={() => setOpenId(null)}
        onRequestDelete={id => setConfirmDeleteId(id)}
      />

      <Modal
        open={confirmIntent !== null}
        onClose={() => setConfirmDeleteId(null)}
        title="Delete intent"
        footer={
          <>
            <Button onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirmDeleteId) store.deleteIntent(confirmDeleteId);
                setConfirmDeleteId(null);
                setOpenId(null);
              }}
            >
              Delete intent
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-2">
          “{confirmIntent?.question}” will be removed from the live library. This is a soft delete — the
          intent moves to the Deleted tab and can be restored later.
        </p>
      </Modal>
    </div>
  );
}

/* ── Detail drawer: read view + owner revision form ── */

function IntentDrawer({
  intent,
  onClose,
  onRequestDelete,
}: {
  intent: Intent | null;
  onClose: () => void;
  onRequestDelete: (id: string) => void;
}) {
  const store = useStore();
  const isOwner = store.user.role === 'owner';
  const [editing, setEditing] = useState(false);
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [utterances, setUtterances] = useState('');

  // Reset edit state whenever a different intent is opened.
  useEffect(() => {
    setEditing(false);
  }, [intent?.id]);

  const beginEdit = () => {
    if (!intent) return;
    setQuestion(intent.question);
    setResponse(intent.response);
    setUtterances(intent.utterances.join('\n'));
    setEditing(true);
  };

  const saveRevision = () => {
    if (!intent) return;
    const utts = utterances
      .split('\n')
      .map(u => u.trim())
      .filter(Boolean);
    store.updateIntent(intent.id, { question: question.trim(), response: response.trim(), utterances: utts });
    store.toast('Revision saved — the updated intent re-enters review before going live', 'info');
    setEditing(false);
  };

  const canSave = question.trim().length > 0 && response.trim().length > 0;
  const intentSources = intent
    ? store.sources.filter(s => intent.sourceIds.includes(s.id))
    : [];
  const runId = intent?.origin.kind === 'run' ? intent.origin.runId : null;

  return (
    <Drawer
      open={intent !== null}
      onClose={onClose}
      title={intent?.question ?? ''}
      meta={intent && <IntentStatePill state={intent.state} />}
      footer={
        intent && isOwner ? (
          editing ? (
            <>
              <Button onClick={() => setEditing(false)}>Cancel</Button>
              <Button variant="primary" disabled={!canSave} onClick={saveRevision}>
                Save revision
              </Button>
            </>
          ) : intent.state === 'deleted' ? (
            <Button
              onClick={() => {
                store.restoreIntent(intent.id);
                onClose();
              }}
            >
              <ArchiveRestore size={13} aria-hidden />
              Restore
            </Button>
          ) : (
            <>
              <Button variant="danger" onClick={() => onRequestDelete(intent.id)}>
                <Trash2 size={13} aria-hidden />
                Delete
              </Button>
              <Button variant="primary" onClick={beginEdit}>
                Edit as revision
              </Button>
            </>
          )
        ) : undefined
      }
    >
      {intent && !editing && (
        <div className="flex flex-col gap-6">
          <section>
            <h3 className="mb-2 text-xs font-semibold tracking-wide text-ink-3 uppercase">Response</h3>
            <p className="max-w-prose text-sm leading-relaxed text-ink">{intent.response}</p>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold tracking-wide text-ink-3 uppercase">
              Utterances <Mono className="normal-case tracking-normal">({intent.utterances.length})</Mono>
            </h3>
            <ul className="flex flex-wrap gap-1.5">
              {intent.utterances.map(u => (
                <li
                  key={u}
                  className="rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-xs text-ink-2"
                >
                  {u}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold tracking-wide text-ink-3 uppercase">
              Sources <Mono className="normal-case tracking-normal">({intentSources.length})</Mono>
            </h3>
            {intentSources.length === 0 ? (
              <p className="text-sm text-ink-2">No source documents recorded for this intent.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {intentSources.map(s => (
                  <li key={s.id} className="flex items-center gap-2 text-sm text-ink">
                    {s.kind === 'url' ? (
                      <Link2 size={13} className="shrink-0 text-ink-3" aria-hidden />
                    ) : (
                      <FileText size={13} className="shrink-0 text-ink-3" aria-hidden />
                    )}
                    <span className="truncate" title={s.path}>
                      {s.name}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold tracking-wide text-ink-3 uppercase">History</h3>
            <KeyValue
              items={[
                ['Created by', intent.createdBy],
                ['Created at', <Mono key="c">{fmtDateTime(intent.createdAt)}</Mono>],
                [
                  'Origin',
                  runId ? (
                    <Link
                      to={`/studio/runs/${runId}`}
                      className="font-mono text-xs text-accent underline-offset-2 hover:underline focus-visible:underline"
                    >
                      {runId}
                    </Link>
                  ) : (
                    'Manual entry'
                  ),
                ],
                ['Updated at', <Mono key="u">{fmtDateTime(intent.updatedAt)}</Mono>],
                ...(intent.reviewNote ? ([['Review note', intent.reviewNote]] as Array<[string, string]>) : []),
              ]}
            />
          </section>
        </div>
      )}

      {intent && editing && (
        <div className="flex flex-col gap-4">
          <p className="rounded-(--radius-field) bg-accent-wash px-3 py-2 text-xs text-accent">
            Saving a revision updates this intent and sends it back through review before the change goes
            live.
          </p>
          <Field label="Question" htmlFor="rev-question">
            <Input id="rev-question" value={question} onChange={e => setQuestion(e.target.value)} />
          </Field>
          <Field label="Response" htmlFor="rev-response">
            <Textarea
              id="rev-response"
              rows={7}
              value={response}
              onChange={e => setResponse(e.target.value)}
            />
          </Field>
          <Field label="Utterances" htmlFor="rev-utterances" hint="One utterance per line.">
            <Textarea
              id="rev-utterances"
              rows={5}
              value={utterances}
              onChange={e => setUtterances(e.target.value)}
            />
          </Field>
        </div>
      )}
    </Drawer>
  );
}
