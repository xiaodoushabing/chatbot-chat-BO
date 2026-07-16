import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronsUpDown,
  DatabaseZap,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Link2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { useStore } from '../../state/store';
import type { Source, Topic } from '../../data/types';
import { fmtDate, fmtDateTime, plural } from '../../lib/format';
import { Button } from '../../components/ui/controls';
import { Collapsible, EmptyState, IndexStatusPill, PageHeader, Pill, Tabs } from '../../components/ui/display';
import WizardRail from './WizardRail';
import StepSources from './StepSources';
import StepConfigure, { type GenConfig } from './StepConfigure';
import StepGenerate from './StepGenerate';
import StepReview from './StepReview';
import RunRail from './RunRail';

/* ── Manage sources section — source handling (keep the list current + prepare
   docs for the AI). Its own tab, SEPARATE from the Generate wizard. */
function ManageSources({
  topicId,
  topicSources,
  lastSynced,
  isContributor,
}: {
  topicId: string;
  topicSources: Source[];
  lastSynced: string | null;
  isContributor: boolean;
}) {
  const { refreshSources, syncToIndex } = useStore();
  const [checking, setChecking] = useState(false);
  const notReady = topicSources.filter(
    s =>
      (s.indexStatus === 'not_indexed' || s.indexStatus === 'stale') &&
      (!isContributor || s.accessible),
  );
  const readyCount = topicSources.filter(s => s.indexStatus === 'indexed').length;
  const preparing = topicSources.some(s => s.indexStatus === 'indexing');

  const check = async () => {
    setChecking(true);
    await refreshSources(topicId);
    setChecking(false);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <section
        aria-label="Manage sources"
        className="rounded-(--radius-card) border border-line bg-bg p-6 shadow-(--shadow-2) sm:p-7"
      >
        <h2 className="font-display text-lg font-medium tracking-[-0.01em] text-ink">Manage sources</h2>
        <p className="mt-1 max-w-prose text-sm text-ink-2">
          Keep this topic's file list current and prepare documents so the AI can generate from
          them. This is separate from choosing which sources to use in a run.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <Button size="sm" loading={checking} onClick={check}>
            {!checking && <RefreshCw size={13} aria-hidden />}
            Check SharePoint for changes
          </Button>
          <Button
            size="sm"
            variant="primary"
            disabled={notReady.length === 0 || preparing}
            onClick={() => syncToIndex(notReady.map(s => s.id))}
          >
            <DatabaseZap size={13} aria-hidden />
            {preparing
              ? 'Preparing…'
              : notReady.length === 0
                ? 'All sources ready'
                : `Prepare ${plural(notReady.length, 'source')}`}
          </Button>
          <span className="ml-auto font-mono text-xs text-ink-3">
            {lastSynced ? `Last checked ${fmtDateTime(lastSynced)}` : 'Never checked'}
          </span>
        </div>

        {topicSources.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No sources yet"
            body="Drop documents into the topic's SharePoint folder, then check for changes to pull them in."
          />
        ) : (
          <>
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line-soft pt-4">
              <Pill tone="ok">{plural(readyCount, 'source')} ready</Pill>
              {notReady.length > 0 && <Pill tone="warn">{notReady.length} need preparing</Pill>}
            </div>
            <ul className="mt-4 flex flex-col gap-2">
              {topicSources.map(s => {
                const Icon = s.kind === 'url' ? Link2 : s.isSpreadsheet ? FileSpreadsheet : FileText;
                return (
                  <li
                    key={s.id}
                    className="flex items-center gap-3 rounded-(--radius-md) border border-line bg-canvas/40 px-4 py-3"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-(--radius-ctl) bg-surface-2 text-ink-2">
                      <Icon size={16} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{s.name}</span>
                      <span className="block truncate text-xs text-ink-3">
                        {s.kind === 'url'
                          ? 'Public URL'
                          : `SharePoint · ${s.isSpreadsheet ? 'Spreadsheet' : 'Document'}`}{' '}
                        · <span className="font-mono">{fmtDate(s.modifiedAt)}</span>
                      </span>
                    </span>
                    <IndexStatusPill status={s.indexStatus} />
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

/* Directional slide for the step stage. `custom` (the advance direction) is
   forwarded by AnimatePresence to the exiting step so Back exits rightward.
   Reduced motion: a plain crossfade, no horizontal travel. */
const stepVariants = (reduce: boolean) => ({
  enter: (dir: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: dir > 0 ? 46 : -46 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: dir > 0 ? -46 : 46 }),
});

/* ── Topic dropdown (header context) ── */

function TopicSelect({
  topics,
  value,
  onChange,
}: {
  topics: Topic[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);
  const current = topics.find(t => t.id === value);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Topic"
        className="flex h-8 items-center gap-2 rounded-(--radius-field) border border-line bg-bg px-2.5 text-sm font-semibold text-ink transition-colors duration-150 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
      >
        <FolderOpen size={13} className="text-ink-3" aria-hidden />
        {current?.name ?? 'Choose a topic'}
        <ChevronsUpDown size={13} className="text-ink-3" aria-hidden />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label="Topics in this project"
          className="absolute left-0 top-9.5 z-(--z-dropdown) w-72 rounded-(--radius-card) border border-line bg-bg p-1 shadow-(--shadow-pop)"
        >
          {topics.map(t => (
            <button
              key={t.id}
              role="option"
              aria-selected={t.id === value}
              onClick={() => {
                onChange(t.id);
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center gap-2 rounded-(--radius-ctl) px-2.5 py-2 text-left text-sm transition-colors duration-150 hover:bg-surface-2',
                t.id === value ? 'font-semibold text-ink' : 'text-ink-2',
              )}
            >
              <span className="min-w-0 flex-1">
                {t.name}
                <span className="block truncate font-mono text-2xs text-ink-3">/{t.folderName}</span>
              </span>
              {t.id === value && <Check size={14} className="shrink-0 text-accent" aria-hidden />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── The Intent Studio wizard ── */

const INITIAL_CONFIG = (tonality: string): GenConfig => ({
  mode: 'single',
  question: '',
  requirements: '',
  tonality,
  maxIntents: 5,
  batchFileId: '',
  manualQuestion: '',
  manualResponse: '',
  manualUtterances: [''],
});

export default function IntentStudio() {
  const {
    projectId,
    user,
    topics,
    sources,
    runs,
    intents,
    topicId,
    setTopic,
    tonalities,
    startRun,
    createManualIntent,
    stageIntents,
  } = useStore();
  const reduce = !!useReducedMotion();

  const projectTopics = useMemo(
    () => topics.filter(t => t.projectId === projectId),
    [topics, projectId],
  );
  const topic = projectTopics.find(t => t.id === topicId) ?? null;

  // Topic is required context: auto-select the project's first topic when unset.
  useEffect(() => {
    if (!topic && projectTopics.length > 0) setTopic(projectTopics[0].id);
  }, [topic, projectTopics, setTopic]);

  const topicSources = useMemo(
    () => (topic ? sources.filter(s => s.topicId === topic.id) : []),
    [sources, topic],
  );
  const topicRuns = useMemo(
    () => (topic ? runs.filter(r => r.topicId === topic.id) : []),
    [runs, topic],
  );
  const notIndexed = topicSources.filter(s => s.indexStatus === 'not_indexed').length;
  const stale = topicSources.filter(s => s.indexStatus === 'stale').length;

  // Wizard state.
  const [tab, setTab] = useState<'generate' | 'sources'>('generate');
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [config, setConfig] = useState<GenConfig>(() => INITIAL_CONFIG(tonalities[0]));
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [reviewSel, setReviewSel] = useState<Set<string>>(new Set());
  const patch = (p: Partial<GenConfig>) => setConfig(c => ({ ...c, ...p }));

  // On step change, bring the top of the new step into view so it reads from the top.
  const wizardTopRef = useRef<HTMLDivElement>(null);
  const stepScrolled = useRef(false);
  useEffect(() => {
    if (!stepScrolled.current) {
      stepScrolled.current = true;
      return;
    }
    wizardTopRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }, [step, reduce]);

  const topicKey = topic?.id;
  useEffect(() => {
    setStep(0);
    setDirection(1);
    setSelected(new Set());
    setConfig(INITIAL_CONFIG(tonalities[0]));
    setActiveRunId(null);
    setReviewSel(new Set());
  }, [topicKey, tonalities]);

  const activeRun = runs.find(r => r.id === activeRunId && r.topicId === topicKey) ?? null;
  const draftIntents = useMemo(
    () =>
      activeRunId
        ? intents.filter(
            i =>
              i.state === 'draft' &&
              i.origin.kind === 'run' &&
              i.origin.runId === activeRunId,
          )
        : [],
    [intents, activeRunId],
  );
  const sourceName = (id: string) => sources.find(s => s.id === id)?.name ?? id;

  const goto = (next: number, dir: number) => {
    setDirection(dir);
    setStep(next);
  };

  const launchRun = (): boolean => {
    if (!topic) return false;
    if (config.mode === 'single') {
      const id = startRun({
        topicId: topic.id,
        type: 'single',
        params: {
          maxIntents: config.maxIntents,
          tonality: config.tonality,
          intentQuestion: config.question.trim() || undefined,
          contentRequirements: config.requirements.trim() || undefined,
        },
        sourceIds: [...selected],
      });
      setActiveRunId(id);
      setReviewSel(new Set());
      return true;
    }
    if (config.mode === 'batch') {
      const file = topicSources.find(s => s.id === config.batchFileId);
      if (!file) return false;
      const id = startRun({
        topicId: topic.id,
        type: 'batch',
        params: { maxIntents: config.maxIntents, tonality: config.tonality, batchFile: file.name },
        sourceIds: [file.id],
      });
      setActiveRunId(id);
      setReviewSel(new Set());
      return true;
    }
    return false;
  };

  const createManual = () => {
    if (!topic) return;
    createManualIntent({
      topicId: topic.id,
      question: config.manualQuestion.trim(),
      response: config.manualResponse.trim(),
      utterances: config.manualUtterances.map(u => u.trim()).filter(Boolean),
      sourceIds: [...selected],
    });
    patch({ manualQuestion: '', manualResponse: '', manualUtterances: [''] });
  };

  const resetWizard = () => {
    setActiveRunId(null);
    setReviewSel(new Set());
    goto(0, -1);
  };

  const handleStage = (ids: string[]) => {
    if (ids.length === 0) return;
    stageIntents(ids);
    setReviewSel(new Set());
  };

  if (projectTopics.length === 0) {
    return (
      <>
        <PageHeader
          title="Intent Studio"
          sub="Pick a topic, sync its sources, and generate intent–response drafts."
        />
        <EmptyState
          icon={FolderOpen}
          title="This project has no topics yet"
          body="Promote subfolders of the project's SharePoint root to topics in Project Settings, then come back to generate intents."
        />
      </>
    );
  }

  const manualValid =
    config.manualQuestion.trim().length > 0 && config.manualResponse.trim().length > 0;
  const runFinished = !!activeRun && activeRun.status !== 'running';
  const draftedCount = activeRun?.progress.intentsDrafted ?? draftIntents.length;

  return (
    <>
      <PageHeader
        title="Intent Studio"
        sub="Turn your working folder into approved chatbot answers, one guided step at a time."
        context={
          topic && (
            <div className="flex flex-wrap items-center gap-3">
              <TopicSelect topics={projectTopics} value={topic.id} onChange={setTopic} />
              <span className="font-mono text-xs text-ink-2">
                {topic.lastSyncedAt ? `Last synced ${fmtDateTime(topic.lastSyncedAt)}` : 'Never synced'}
              </span>
              {notIndexed > 0 && <Pill tone="warn">{notIndexed} not indexed</Pill>}
              {stale > 0 && <Pill tone="warn">{stale} stale</Pill>}
            </div>
          )
        }
      />

      {topic && (
        <>
          <div className="mx-auto mb-7 max-w-4xl">
            <Tabs
              value={tab}
              onChange={setTab}
              tabs={[
                { value: 'generate', label: 'Generate' },
                {
                  value: 'sources',
                  label: 'Manage sources',
                  count: notIndexed + stale > 0 ? notIndexed + stale : undefined,
                },
              ]}
            />
          </div>

          {tab === 'sources' && (
            <ManageSources
              topicId={topic.id}
              topicSources={topicSources}
              lastSynced={topic.lastSyncedAt}
              isContributor={user.role === 'contributor'}
            />
          )}

          <div
            ref={wizardTopRef}
            className={cn('mx-auto max-w-4xl scroll-mt-6', tab !== 'generate' && 'hidden')}
          >
            <WizardRail current={step} />

          <div className="relative">
            {/* Keyed remount animates each step IN on mount. No exit-gating
                (mode="wait") — a stalled exit must never block the next step. */}
              <motion.div
                key={step}
                custom={direction}
                variants={stepVariants(reduce)}
                initial="enter"
                animate="center"
                transition={{ duration: reduce ? 0.15 : 0.4, ease: EASE }}
              >
                {step === 0 && (
                  <StepSources
                    topicId={topic.id}
                    topicSources={topicSources}
                    selected={selected}
                    setSelected={setSelected}
                  />
                )}
                {step === 1 && (
                  <StepConfigure
                    config={config}
                    patch={patch}
                    topicSources={topicSources}
                    sourceCount={selected.size}
                  />
                )}
                {step === 2 &&
                  (activeRun ? (
                    <StepGenerate run={activeRun} topicSources={topicSources} />
                  ) : (
                    <div className="rounded-(--radius-card) border border-line bg-bg p-8 text-center text-sm text-ink-2 shadow-(--shadow-2)">
                      Preparing run…
                    </div>
                  ))}
                {step === 3 && (
                  <StepReview
                    draftIntents={draftIntents}
                    selected={reviewSel}
                    setSelected={setReviewSel}
                    sourceName={sourceName}
                    onStage={handleStage}
                  />
                )}
              </motion.div>
          </div>

          {/* Wizard footer */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <div>
              {step > 0 && (
                <Button
                  variant="ghost"
                  onClick={() => goto(step - 1, -1)}
                  disabled={step === 2 && !runFinished}
                >
                  <ArrowLeft size={15} aria-hidden />
                  {step === 3 ? 'Back to run' : 'Back'}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {step === 0 && (
                <Button variant="primary" disabled={selected.size === 0} onClick={() => goto(1, 1)}>
                  Configure generation
                  <ArrowRight size={15} aria-hidden />
                </Button>
              )}
              {step === 1 && config.mode === 'manual' && (
                <Button variant="primary" disabled={!manualValid} onClick={createManual}>
                  Create &amp; stage intent
                  <Check size={15} aria-hidden />
                </Button>
              )}
              {step === 1 && config.mode !== 'manual' && (
                <Button
                  variant="primary"
                  disabled={config.mode === 'batch' && !config.batchFileId}
                  onClick={() => {
                    if (launchRun()) goto(2, 1);
                  }}
                >
                  {config.mode === 'batch' ? 'Run batch' : 'Start generation'}
                  <ArrowRight size={15} aria-hidden />
                </Button>
              )}
              {step === 2 && (
                <Button variant="primary" disabled={!runFinished} onClick={() => goto(3, 1)}>
                  Review {draftedCount} intents
                  <ArrowRight size={15} aria-hidden />
                </Button>
              )}
              {step === 3 && (
                <Button variant="primary" onClick={resetWizard}>
                  Start another run
                </Button>
              )}
            </div>
          </div>

          {/* Run output & history stays reachable throughout the flow. */}
          <div className="mt-12 border-t border-line pt-8">
            <Collapsible
              title="Run output & history"
              meta={topicRuns.length > 0 ? `${topicRuns.length} in this topic` : undefined}
            >
              <RunRail topicRuns={topicRuns} activeRun={null} onDismiss={() => {}} />
            </Collapsible>
          </div>
          </div>
        </>
      )}
    </>
  );
}
