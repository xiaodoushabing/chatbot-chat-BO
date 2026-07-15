import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  FolderPlus,
  FolderSearch,
  Lock,
  Pencil,
  Plus,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useStore } from '../../state/store';
import type { DiscoveredFolder, Topic } from '../../data/types';
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
  const [addOpen, setAddOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

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
      <PageHeader
        title="Project Settings"
        sub={`Point ${project.name} at a SharePoint working folder and promote its subfolders to topics. Everything downstream — sources, runs, approvals — hangs off this structure.`}
      />

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
        {/* ── SharePoint root ── */}
        <section aria-labelledby="root-heading" className="rounded-(--radius-card) border border-line p-5">
          <SectionHeader title="SharePoint root" meta={<span id="root-heading">created {fmtDateTime(project.createdAt)} by {project.createdBy}</span>} />
          <Field
            label="Root folder URL"
            htmlFor={rootInputId}
            hint={
              rootEditable
                ? 'The working folder whose subfolders become topics.'
                : undefined
            }
          >
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
              Locked while topics exist — all {plural(projectTopics.length, 'topic')} resolve their
              folders under this root, so changing it would orphan them.
            </p>
          )}
          {isOwner && rootUnlocked && projectTopics.length > 0 && (
            <p className="mt-3 text-xs font-medium text-warn">
              Root unlocked for editing. Existing topic folder paths will not move with it.
            </p>
          )}
        </section>

        {/* ── Topics ── */}
        <section aria-labelledby="topics-heading" className="mt-10">
          <SectionHeader
            title="Topics"
            meta={<span id="topics-heading">{plural(projectTopics.length, 'topic')}</span>}
            actions={
              isOwner && (
                <>
                  <Button variant="secondary" onClick={() => setCreateOpen(true)}>
                    <Plus size={13} aria-hidden /> Create manually
                  </Button>
                  <Button variant="primary" onClick={() => setAddOpen(true)}>
                    <FolderPlus size={13} aria-hidden /> Add topics
                  </Button>
                </>
              )
            }
          />
          <p className="mb-3 max-w-prose text-sm text-ink-2">
            Each topic maps to one subfolder of the root. Its documents and URL manifests become the
            source set for generation.
          </p>

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
                  ? 'Add topics discovers the subfolders under your SharePoint root so you can promote them in one step, or create one manually from a folder URL.'
                  : 'A project owner promotes subfolders of the SharePoint root into topics; sources and generation runs are scoped to them.'
              }
              action={
                isOwner && (
                  <Button variant="primary" onClick={() => setAddOpen(true)}>
                    <FolderPlus size={13} aria-hidden /> Add topics
                  </Button>
                )
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
                  <Th>Folder path</Th>
                  <Th className="text-right">Sources</Th>
                  <Th>Added</Th>
                  <Th>Last synced</Th>
                  {isOwner && (
                    <Th className="w-20">
                      <span className="sr-only">Actions</span>
                    </Th>
                  )}
                </tr>
              </thead>
              <tbody>
                {visibleTopics.map(topic => (
                  <Tr key={topic.id}>
                    <Td className="font-medium text-ink">
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
                        topic.name
                      )}
                    </Td>
                    <Td>
                      <span title={topic.sharepointUrl} className="block max-w-xs truncate">
                        <Mono>/{topic.folderName}</Mono>
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
                          label={`Rename ${topic.name}`}
                          disabled={renamingId === topic.id}
                          onClick={() => {
                            setRenamingId(topic.id);
                            setRenameDraft(topic.name);
                          }}
                          className="h-7 w-7"
                        >
                          <Pencil size={13} />
                        </IconButton>
                        <IconButton
                          label={`Remove ${topic.name}`}
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

      {/* ── Confirm: remove topic ── */}
      <Modal
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title="Remove topic?"
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
              Remove topic
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

      {isOwner && (
        <AddTopicsModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          projectTopics={projectTopics}
        />
      )}
      {isOwner && (
        <CreateTopicModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          rootUrl={project.sharepointUrl}
        />
      )}
    </>
  );
}

/* ── Add topics: enumerate subfolders of the root ── */

function AddTopicsModal({
  open,
  onClose,
  projectTopics,
}: {
  open: boolean;
  onClose: () => void;
  projectTopics: Topic[];
}) {
  const store = useStore();
  const { projectId } = store;
  const [folders, setFolders] = useState<DiscoveredFolder[] | null>(null); // session cache
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const requested = useRef(false);
  const { enumerateFolders } = store;

  // Enumerate on first open only; the result is cached in component state.
  useEffect(() => {
    if (!open || requested.current) return;
    requested.current = true;
    setLoading(true);
    void enumerateFolders(projectId).then(res => {
      setFolders(res);
      setLoading(false);
    });
  }, [open, projectId, enumerateFolders]);

  const addedUrls = useMemo(
    () => new Set(projectTopics.map(t => t.sharepointUrl)),
    [projectTopics],
  );
  const selectable = (folders ?? []).filter(f => !addedUrls.has(f.sharepointUrl));
  const allSelected = selectable.length > 0 && selectable.every(f => selected.has(f.sharepointUrl));
  const someSelected = selectable.some(f => selected.has(f.sharepointUrl));

  const toggle = (url: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });

  const submit = () => {
    const chosen = selectable.filter(f => selected.has(f.sharepointUrl));
    if (chosen.length === 0) return;
    store.addTopics(projectId, chosen);
    setSelected(new Set());
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add topics from SharePoint"
      wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={selected.size === 0} onClick={submit}>
            Add {selected.size === 0 ? 'topics' : plural(selected.size, 'topic')}
          </Button>
        </>
      }
    >
      <p className="mb-4 text-sm text-ink-2">
        Subfolders discovered under the project root. Select the ones to promote to topics —
        folders that are already topics are listed for completeness.
      </p>

      {loading || folders === null ? (
        <div className="flex flex-col gap-2 py-1" role="status" aria-label="Enumerating subfolders">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-(--radius-ctl) border border-line px-3 py-2.5">
              <Skeleton className="h-3.5 w-3.5" />
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="ml-auto h-3.5 w-16" />
            </div>
          ))}
          <p className="mt-1 text-xs text-ink-3">Enumerating subfolders of the root…</p>
        </div>
      ) : folders.length === 0 ? (
        <EmptyState
          icon={FolderSearch}
          title="No subfolders found"
          body="The root has no subfolders to promote. Create folders in SharePoint, or add a topic manually from a folder URL."
        />
      ) : (
        <div role="group" aria-label="Discovered folders">
          <label className="mb-1 flex cursor-pointer items-center gap-3 border-b border-line px-3 pb-2 text-2xs font-bold tracking-wider text-ink-3 uppercase">
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
                    {already && <span className="shrink-0 text-xs text-ink-2">Already a topic</span>}
                    <Mono className="w-14 shrink-0 text-right tabular-nums">
                      {plural(f.fileCount, 'file')}
                    </Mono>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Modal>
  );
}

/* ── Create topic manually ── */

function CreateTopicModal({
  open,
  onClose,
  rootUrl,
}: {
  open: boolean;
  onClose: () => void;
  rootUrl: string;
}) {
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
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create topic manually"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!name.trim() || !url.trim()} onClick={submit}>
            Create topic
          </Button>
        </>
      }
    >
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
            autoFocus
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
        {/* Allow Enter to submit */}
        <button type="submit" className="sr-only">
          Create topic
        </button>
      </form>
    </Modal>
  );
}
