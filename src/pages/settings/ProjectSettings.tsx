import { useId, useMemo, useState } from 'react';
import {
  CheckCircle2,
  FolderSearch,
  Lock,
  Pencil,
  Plus,
  ScanSearch,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useStore } from '../../state/store';
import type { DiscoveredFolder, Topic } from '../../data/types';
import { discoveredFolders as fixtureFolders } from '../../data/fixtures';
import { fmtDateTime, plural } from '../../lib/format';
import {
  Button,
  Checkbox,
  Field,
  IconButton,
  Input,
  SearchField,
} from '../../components/ui/controls';
import {
  EmptyState,
  Mono,
  PageHeader,
  SectionHeader,
  Skeleton,
} from '../../components/ui/display';
import { Modal } from '../../components/ui/overlay';
import { TableShell, Td, Th, Tr } from '../../components/ui/table';

export default function ProjectSettings() {
  const { projectId } = useStore();
  // Remount on project switch so drafts, test results and caches reset with context.
  return <SettingsBody key={projectId} />;
}

/** Provenance is derived, not stored: a topic whose URL matches a discoverable
    subfolder of the root came from enumeration; anything else was created manually. */
function provenance(topic: Topic): 'SharePoint enumeration' | 'Manual creation' {
  return fixtureFolders.some(
    f => f.projectId === topic.projectId && f.sharepointUrl === topic.sharepointUrl,
  )
    ? 'SharePoint enumeration'
    : 'Manual creation';
}

function SettingsBody() {
  const store = useStore();
  const { user, projectId, topics, sources } = store;
  const project = store.projects.find(p => p.id === projectId)!;
  const isOwner = user.role === 'owner';

  const projectTopics = useMemo(
    () => topics.filter(t => t.projectId === projectId),
    [topics, projectId],
  );
  const sourceCount = (topicId: string) => sources.filter(s => s.topicId === topicId).length;

  /* ── SharePoint root state ── */
  const [rootUrl, setRootUrl] = useState(project.sharepointUrl);
  const [rootUnlocked, setRootUnlocked] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [test, setTest] = useState<
    { status: 'idle' } | { status: 'loading' } | { status: 'ok'; siteName: string } | { status: 'err'; error: string }
  >({ status: 'idle' });

  const rootLockedByTopics = projectTopics.length > 0 && !rootUnlocked;
  const rootEditable = isOwner && !rootLockedByTopics;

  const runTest = async () => {
    setTest({ status: 'loading' });
    const res = await store.testUrl(rootUrl);
    if (res.ok) setTest({ status: 'ok', siteName: res.siteName! });
    else setTest({ status: 'err', error: res.error! });
  };

  /* ── Topics table state ── */
  const [query, setQuery] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [removing, setRemoving] = useState<Topic | null>(null);

  const visibleTopics = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projectTopics;
    return projectTopics.filter(
      t => t.name.toLowerCase().includes(q) || t.folderName.toLowerCase().includes(q),
    );
  }, [projectTopics, query]);

  const commitRename = (topic: Topic) => {
    const name = renameDraft.trim();
    if (name && name !== topic.name) store.renameTopic(topic.id, name);
    setRenamingId(null);
  };

  const rootInputId = useId();

  return (
    <>
      <PageHeader title="Project Settings" />

      {!isOwner && (
        <div
          role="status"
          className="mb-6 flex items-center gap-2.5 rounded-(--radius-ctl) border border-line bg-surface-2 px-3.5 py-2.5"
        >
          <Lock size={14} className="shrink-0 text-ink-3" aria-hidden />
          <p className="text-sm text-ink-2">
            <span className="font-semibold text-ink">Read-only</span> — owner access required. Ask a
            project owner to change the root or manage topics.
          </p>
        </div>
      )}

      <div className="max-w-[1200px]">
        {/* ── SharePoint root ── (header outside the card, consistent with the sections below) */}
        <section aria-labelledby="root-heading">
          <SectionHeader title="SharePoint root" meta={<span id="root-heading">created {fmtDateTime(project.createdAt)} by {project.createdBy}</span>} />
          <div className="rounded-(--radius-card) border border-line bg-bg p-6 shadow-(--shadow-soft)">
            <Field label="Root folder URL" htmlFor={rootInputId}>
              <div className="flex items-start gap-2">
                <Input
                  id={rootInputId}
                  value={rootUrl}
                  readOnly={!rootEditable}
                  aria-readonly={!rootEditable}
                  disabled={!isOwner}
                  onChange={e => {
                    setRootUrl(e.target.value);
                    setTest({ status: 'idle' });
                  }}
                  className="max-w-2xl font-mono text-xs"
                  placeholder="https://…sharepoint.com/sites/…"
                />
                <Button
                  onClick={runTest}
                  loading={test.status === 'loading'}
                  disabled={!rootUrl.trim()}
                  className="shrink-0"
                >
                  {test.status === 'loading' ? 'Testing…' : 'Test URL'}
                </Button>
                {isOwner && rootLockedByTopics && (
                  <Button variant="ghost" className="shrink-0" onClick={() => setUnlockOpen(true)}>
                    <Pencil size={13} aria-hidden /> Edit root
                  </Button>
                )}
              </div>
            </Field>

            {test.status === 'ok' && (
              <p role="status" className="mt-2 flex items-center gap-1.5 text-xs font-medium text-ok">
                <CheckCircle2 size={13} aria-hidden />
                Reachable — resolved site: {test.siteName}
              </p>
            )}
            {test.status === 'err' && (
              <p role="alert" className="mt-2 flex items-center gap-1.5 text-xs font-medium text-err">
                <XCircle size={13} aria-hidden />
                {test.error}
              </p>
            )}

            {isOwner && rootLockedByTopics && (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-2">
                <Lock size={12} className="shrink-0 text-ink-3" aria-hidden />
                Locked — {plural(projectTopics.length, 'topic')} depend on this root.
              </p>
            )}
            {isOwner && rootUnlocked && projectTopics.length > 0 && (
              <p className="mt-3 text-xs font-medium text-warn">
                Unlocked. Existing topic paths won't move with it.
              </p>
            )}
          </div>
        </section>

        {/* ── Add topics (owner only): side-by-side panels ── */}
        {isOwner && (
          <section className="mt-10">
            <SectionHeader title="Add topics" />
            <div className="grid gap-4 lg:grid-cols-2">
              <EnumeratePanel
                projectTopics={projectTopics}
                rootTested={test.status === 'ok'}
              />
              <ManualCreatePanel rootUrl={project.sharepointUrl} />
            </div>
          </section>
        )}

        {/* ── Topics table ── */}
        <section className="mt-10">
          <SectionHeader title="Topics" count={projectTopics.length} />
          {projectTopics.length > 0 && (
            <div className="mb-3 max-w-xs">
              <SearchField value={query} onChange={setQuery} placeholder="Search topics" />
            </div>
          )}

          {projectTopics.length === 0 ? (
            <EmptyState
              icon={FolderSearch}
              title="No topics yet"
              body={
                isOwner
                  ? 'Scan the root above to promote its subfolders in one step, or create a topic manually from a folder URL.'
                  : 'A project owner promotes subfolders of the SharePoint root into topics; sources and generation runs are scoped to them.'
              }
            />
          ) : visibleTopics.length === 0 ? (
            <EmptyState
              title="No topics match"
              body={`No topic name or folder contains “${query.trim()}”. Clear the search to see all ${plural(projectTopics.length, 'topic')}.`}
              action={
                <Button variant="ghost" onClick={() => setQuery('')}>
                  Clear search
                </Button>
              }
            />
          ) : (
            <TableShell>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>SharePoint subfolder</Th>
                  <Th className="text-right">Sources</Th>
                  <Th>Added</Th>
                  <Th>Last synced</Th>
                  {isOwner && (
                    <Th className="w-12">
                      <span className="sr-only">Actions</span>
                    </Th>
                  )}
                </tr>
              </thead>
              <tbody>
                {visibleTopics.map(topic => (
                  <Tr key={topic.id}>
                    <Td>
                      {renamingId === topic.id ? (
                        <div className="flex items-center gap-1.5">
                          <Input
                            autoFocus
                            aria-label={`Rename topic ${topic.name}`}
                            value={renameDraft}
                            onChange={e => setRenameDraft(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') commitRename(topic);
                              if (e.key === 'Escape') setRenamingId(null);
                            }}
                            className="h-7 w-48 text-sm"
                          />
                          <Button size="sm" variant="primary" onClick={() => commitRename(topic)}>
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setRenamingId(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="flex items-center gap-1">
                            <span className="font-medium text-ink">{topic.name}</span>
                            {isOwner && (
                              <IconButton
                                label={`Rename ${topic.name}`}
                                onClick={() => {
                                  setRenamingId(topic.id);
                                  setRenameDraft(topic.name);
                                }}
                                className="h-6 w-6"
                              >
                                <Pencil size={12} />
                              </IconButton>
                            )}
                          </span>
                          <span className="mt-0.5 block text-2xs text-ink-3">
                            {topic.folderName} · {provenance(topic)}
                          </span>
                        </>
                      )}
                    </Td>
                    <Td>
                      <span title={topic.sharepointUrl} className="block max-w-2xs truncate">
                        <Mono>{topic.sharepointUrl}</Mono>
                      </span>
                    </Td>
                    <Td mono className="text-right tabular-nums">
                      {sourceCount(topic.id)}
                    </Td>
                    <Td className="whitespace-nowrap text-ink-2">
                      {topic.addedBy}
                      <Mono className="block">{fmtDateTime(topic.addedAt)}</Mono>
                    </Td>
                    <Td className="whitespace-nowrap">
                      {topic.lastSyncedAt ? (
                        <Mono>{fmtDateTime(topic.lastSyncedAt)}</Mono>
                      ) : (
                        <span className="text-xs text-ink-2">Never synced</span>
                      )}
                    </Td>
                    {isOwner && (
                      <Td className="whitespace-nowrap text-right">
                        <IconButton
                          label={`Delete ${topic.name}`}
                          onClick={() => setRemoving(topic)}
                          className="h-7 w-7 hover:text-err"
                        >
                          <Trash2 size={13} />
                        </IconButton>
                      </Td>
                    )}
                  </Tr>
                ))}
              </tbody>
            </TableShell>
          )}
        </section>
      </div>

      {/* ── Confirm: unlock root editing ── */}
      <Modal
        open={unlockOpen}
        onClose={() => setUnlockOpen(false)}
        title="Edit SharePoint root?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setUnlockOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setRootUnlocked(true);
                setUnlockOpen(false);
              }}
            >
              Unlock editing
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink-2">
          {plural(projectTopics.length, 'topic')} in {project.name} resolve their folders under the
          current root. Pointing the project elsewhere does not move those folders — topics whose
          paths fall outside the new root will stop syncing until they are re-added.
        </p>
        <p className="mt-3 text-sm font-medium text-ink">
          Unlock the root field only if you intend to re-home the whole project.
        </p>
      </Modal>

      {/* ── Confirm: delete topic ── */}
      <Modal
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title="Delete topic?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRemoving(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (removing) store.removeTopic(removing.id);
                setRemoving(null);
              }}
            >
              Delete topic
            </Button>
          </>
        }
      >
        {removing && (
          <>
            <p className="text-sm leading-relaxed text-ink-2">
              <span className="font-semibold text-ink">{removing.name}</span> and its{' '}
              {plural(sourceCount(removing.id), 'source')} will be detached from {project.name}. The
              SharePoint folder itself is untouched, and live intents remain in the library.
            </p>
            <Mono className="mt-3 block truncate">{removing.sharepointUrl}</Mono>
          </>
        )}
      </Modal>
    </>
  );
}

/* ── Left panel: auto-enumerate subfolders of the root ── */

function EnumeratePanel({
  projectTopics,
  rootTested,
}: {
  projectTopics: Topic[];
  rootTested: boolean;
}) {
  const store = useStore();
  const { projectId, enumerateFolders } = store;
  const [folders, setFolders] = useState<DiscoveredFolder[] | null>(null); // session cache
  const [scanning, setScanning] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const scan = async () => {
    setScanning(true);
    const res = await enumerateFolders(projectId);
    setFolders(res);
    setScanning(false);
  };

  const addedUrls = useMemo(
    () => new Set(projectTopics.map(t => t.sharepointUrl)),
    [projectTopics],
  );
  const selectable = (folders ?? []).filter(f => !addedUrls.has(f.sharepointUrl));
  const chosen = selectable.filter(f => selected.has(f.sharepointUrl));
  const allSelected = selectable.length > 0 && selectable.every(f => selected.has(f.sharepointUrl));
  const someSelected = chosen.length > 0;

  const toggle = (url: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });

  const addSelected = () => {
    if (chosen.length === 0) return;
    store.addTopics(projectId, chosen);
    setSelected(new Set());
  };

  return (
    <div className="flex flex-col rounded-(--radius-card) border border-line bg-bg p-5 shadow-(--shadow-soft)">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-ink">Auto-enumerate SharePoint subfolders</h3>
        <Button
          variant="secondary"
          className="shrink-0"
          onClick={scan}
          loading={scanning}
          disabled={!rootTested}
        >
          <ScanSearch size={13} aria-hidden />
          {scanning ? 'Scanning…' : folders === null ? 'Scan root' : 'Rescan'}
        </Button>
      </div>
      {!rootTested && (
        <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-warn" role="status">
          <Lock size={12} className="shrink-0" aria-hidden />
          Run Test URL first to enable scanning.
        </p>
      )}

      {scanning ? (
        <div className="flex flex-col gap-2" role="status" aria-label="Enumerating subfolders">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-(--radius-ctl) border border-line px-3 py-2.5">
              <Skeleton className="h-3.5 w-3.5" />
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="ml-auto h-3.5 w-16" />
            </div>
          ))}
          <p className="mt-1 text-xs text-ink-3">Enumerating subfolders of the root…</p>
        </div>
      ) : folders === null ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-(--radius-card) border border-dashed border-line px-6 py-10 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-wash text-accent">
            <FolderSearch size={18} aria-hidden />
          </span>
          <p className="text-sm font-semibold text-ink">Nothing scanned yet</p>
          <p className="max-w-xs text-xs text-ink-2">Discovered subfolders will appear here.</p>
        </div>
      ) : folders.length === 0 ? (
        <EmptyState
          icon={FolderSearch}
          title="No subfolders found"
          body="The root has no subfolders to promote. Create folders in SharePoint, or add a topic manually."
        />
      ) : (
        <>
          <div role="group" aria-label="Discovered folders">
            <label className="mb-1 flex cursor-pointer items-center gap-3 border-b border-line px-3 pb-2 text-2xs font-semibold tracking-wide text-ink-3 uppercase">
              <Checkbox
                checked={allSelected}
                indeterminate={!allSelected && someSelected}
                disabled={selectable.length === 0}
                onChange={() =>
                  setSelected(allSelected ? new Set() : new Set(selectable.map(f => f.sharepointUrl)))
                }
                aria-label="Select all discovered folders"
              />
              Folder
              <span className="ml-auto">Files</span>
            </label>
            <ul className="flex flex-col">
              {folders.map(f => {
                const already = addedUrls.has(f.sharepointUrl);
                return (
                  <li key={f.sharepointUrl}>
                    <label
                      className={
                        already
                          ? 'flex items-center gap-3 border-b border-line px-3 py-2.5 opacity-55 last:border-b-0'
                          : 'flex cursor-pointer items-center gap-3 border-b border-line px-3 py-2.5 transition-colors duration-150 last:border-b-0 hover:bg-surface-2'
                      }
                    >
                      <Checkbox
                        checked={already || selected.has(f.sharepointUrl)}
                        disabled={already}
                        onChange={() => toggle(f.sharepointUrl)}
                        aria-label={`Select folder ${f.folderName}`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-ink">{f.folderName}</span>
                        <Mono className="block truncate text-2xs">{f.sharepointUrl}</Mono>
                      </span>
                      {already && (
                        <span className="shrink-0 text-xs text-ink-2">Already a topic</span>
                      )}
                      <Mono className="w-14 shrink-0 text-right tabular-nums">
                        {plural(f.fileCount, 'file')}
                      </Mono>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="mt-3 flex items-center justify-end gap-3 border-t border-line pt-3">
            <span className="text-xs text-ink-2">
              {chosen.length === 0
                ? `${plural(selectable.length, 'folder')} available`
                : `${chosen.length} of ${plural(selectable.length, 'folder')} selected`}
            </span>
            <Button variant="primary" disabled={chosen.length === 0} onClick={addSelected}>
              Add {chosen.length === 0 ? 'selected' : plural(chosen.length, 'topic')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Right panel: create topic manually ── */

function ManualCreatePanel({ rootUrl }: { rootUrl: string }) {
  const store = useStore();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const nameId = useId();
  const urlId = useId();

  const submit = () => {
    if (!name.trim() || !url.trim()) return;
    const res = store.createTopic(store.projectId, name.trim(), url.trim());
    if (!res.ok) {
      setUrlError(res.error ?? 'Invalid URL.');
      return;
    }
    setName('');
    setUrl('');
    setUrlError(null);
  };

  return (
    <div className="flex flex-col rounded-(--radius-card) border border-line bg-bg p-5 shadow-(--shadow-soft)">
      <h3 className="mb-4 text-sm font-semibold text-ink">Create topic manually</h3>
      <form
        className="flex flex-col gap-4"
        onSubmit={e => {
          e.preventDefault();
          submit();
        }}
      >
        <Field label="Topic name" htmlFor={nameId} hint="Shown across the workspace; free text.">
          <Input
            id={nameId}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. GIRO & Billing"
          />
        </Field>
        <Field
          label="Folder URL"
          htmlFor={urlId}
          hint={urlError ? undefined : `Must be a subfolder of the project root: ${rootUrl}`}
          error={urlError ?? undefined}
        >
          <Input
            id={urlId}
            value={url}
            onChange={e => {
              setUrl(e.target.value);
              setUrlError(null);
            }}
            placeholder={`${rootUrl}/…`}
            className="font-mono text-xs"
            aria-invalid={urlError !== null}
          />
        </Field>
        <div className="mt-auto flex justify-end">
          <Button type="submit" variant="primary" disabled={!name.trim() || !url.trim()}>
            <Plus size={13} aria-hidden /> Create topic
          </Button>
        </div>
      </form>
    </div>
  );
}
