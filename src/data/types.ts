export type Role = 'owner' | 'contributor' | 'checker';

export interface User {
  id: string;
  name: string;
  initials: string;
  role: Role;
}

export interface Project {
  id: string;
  name: string;
  sharepointUrl: string;
  createdBy: string;
  createdAt: string;
}

export interface Topic {
  id: string;
  projectId: string;
  name: string;
  folderName: string;
  sharepointUrl: string;
  addedBy: string;
  addedAt: string;
  lastSyncedAt: string | null;
}

/** A subfolder discovered under the project's SharePoint root (Add-topics modal). */
export interface DiscoveredFolder {
  projectId: string;
  folderName: string;
  sharepointUrl: string;
  fileCount: number;
}

export type IndexStatus = 'indexed' | 'not_indexed' | 'indexing' | 'stale';

export interface Source {
  id: string;
  topicId: string;
  kind: 'sharepoint' | 'url';
  name: string;
  path: string;
  modifiedAt: string;
  modifiedBy: string;
  sizeKb: number | null;
  indexStatus: IndexStatus;
  lastIndexedAt: string | null;
  /** SharePoint RBAC mirror: contributors cannot use inaccessible sources. */
  accessible: boolean;
  isSpreadsheet: boolean;
}

export type RunStatus = 'running' | 'completed' | 'failed' | 'dead';
export type RunType = 'single' | 'batch';

export interface RunParams {
  maxIntents: number;
  tonality: string;
  contentRequirements?: string;
  intentQuestion?: string;
  batchFile?: string;
}

export interface RunProgress {
  total: number;
  done: number;
  succeeded: number;
  skipped: number;
  failed: number;
  intentsDrafted: number;
}

export interface Run {
  id: string;
  topicId: string;
  type: RunType;
  status: RunStatus;
  startedBy: string;
  startedAt: string;
  finishedAt: string | null;
  durationSec: number | null;
  params: RunParams;
  sourceIds: string[];
  progress: RunProgress;
  /** batch only: one child per spreadsheet row */
  children: BatchChild[];
}

export interface BatchChild {
  id: string;
  row: number;
  intentQuestion: string;
  status: 'succeeded' | 'skipped' | 'failed' | 'running' | 'pending';
  intentIds: string[];
  durationSec: number | null;
  note?: string;
}

export type IntentState =
  | 'draft'
  | 'staged'
  | 'pending_approval'
  | 'live'
  | 'rejected'
  | 'deleted';

export interface Intent {
  id: string;
  topicId: string;
  question: string;
  response: string;
  utterances: string[];
  sourceIds: string[];
  state: IntentState;
  origin: { kind: 'run'; runId: string } | { kind: 'manual' };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  reviewNote?: string;
  isRevision?: boolean;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';

export interface ApprovalRequest {
  id: string;
  topicId: string;
  intentIds: string[];
  submittedBy: string;
  submittedAt: string;
  status: ApprovalStatus;
  decidedBy: string | null;
  decidedAt: string | null;
  note?: string;
}
