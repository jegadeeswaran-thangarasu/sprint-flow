import apiClient from '@/api/client';
import {
  IBoardData,
  IBulkUpdateItem,
  IActivityLog,
  IFullIssue,
  IIssue,
  IUser,
  IssuePriority,
  IssueStatus,
  IssueType,
  TApiResponse,
} from '@/types';

export interface TCreateIssueData {
  title: string;
  description?: string;
  type?: IssueType;
  status?: IssueStatus;
  priority?: IssuePriority;
  storyPoints?: number | null;
  sprint?: string | null;
  epic?: string | null;
  parent?: string | null;
  assignee?: string | null;
  labels?: string[];
  dueDate?: string | null;
}

export interface TUpdateIssueData {
  title?: string;
  description?: string;
  type?: IssueType;
  status?: IssueStatus;
  priority?: IssuePriority;
  assignee?: string | null;
  storyPoints?: number | null;
  labels?: string[];
  dueDate?: string | null;
  sprint?: string | null;
  epic?: string | null;
  parent?: string | null;
  order?: number;
}

export interface TProjectIssueFilters {
  status?: IssueStatus;
  sprint?: string;
  assignee?: string;
  priority?: IssuePriority;
  type?: IssueType;
  label?: string;
  search?: string;
}

const BACKLOG_TYPE_ORDER: IssueType[] = ['story', 'task', 'bug', 'epic', 'subtask'];

export const createIssue = async (
  orgSlug: string,
  projectId: string,
  data: TCreateIssueData,
): Promise<IIssue> => {
  const { data: res } = await apiClient.post<TApiResponse<IIssue>>(
    `/organisations/${orgSlug}/projects/${projectId}/issues`,
    data,
  );
  return res.data;
};

export const getProjectIssues = async (
  orgSlug: string,
  projectId: string,
  filters?: TProjectIssueFilters,
): Promise<IIssue[]> => {
  const { data } = await apiClient.get<TApiResponse<IIssue[]>>(
    `/organisations/${orgSlug}/projects/${projectId}/issues`,
    { params: filters },
  );
  return data.data;
};

export const getBacklogIssues = async (
  orgSlug: string,
  projectId: string,
): Promise<IIssue[]> => {
  const { data } = await apiClient.get<TApiResponse<Record<IssueType, IIssue[]>>>(
    `/organisations/${orgSlug}/projects/${projectId}/issues/backlog`,
  );
  const grouped = data.data;
  const out: IIssue[] = [];
  for (const t of BACKLOG_TYPE_ORDER) {
    out.push(...(grouped[t] ?? []));
  }
  return out;
};

export const getIssueById = async (
  orgSlug: string,
  projectId: string,
  issueId: string,
): Promise<IIssue> => {
  const { data } = await apiClient.get<TApiResponse<IIssue>>(
    `/organisations/${orgSlug}/projects/${projectId}/issues/${issueId}`,
  );
  return data.data;
};

export const getFullIssueDetail = async (
  orgSlug: string,
  projectId: string,
  issueId: string,
): Promise<IFullIssue> => {
  const { data } = await apiClient.get<TApiResponse<IFullIssue>>(
    `/organisations/${orgSlug}/projects/${projectId}/issues/${issueId}/full`,
  );
  return data.data;
};

export const getIssueActivity = async (
  orgSlug: string,
  projectId: string,
  issueId: string,
): Promise<IActivityLog[]> => {
  const { data } = await apiClient.get<TApiResponse<IActivityLog[]>>(
    `/organisations/${orgSlug}/projects/${projectId}/issues/${issueId}/activity`,
  );
  return data.data;
};

export const updateIssue = async (
  orgSlug: string,
  projectId: string,
  issueId: string,
  data: TUpdateIssueData,
): Promise<IIssue> => {
  const { data: res } = await apiClient.patch<TApiResponse<IIssue>>(
    `/organisations/${orgSlug}/projects/${projectId}/issues/${issueId}`,
    data,
  );
  return res.data;
};

export const updateIssueStatus = async (
  orgSlug: string,
  projectId: string,
  issueId: string,
  status: IssueStatus,
  order: number,
): Promise<IIssue> => {
  const { data } = await apiClient.patch<TApiResponse<IIssue>>(
    `/organisations/${orgSlug}/projects/${projectId}/issues/${issueId}/status`,
    { status, order },
  );
  return data.data;
};

export const deleteIssue = async (
  orgSlug: string,
  projectId: string,
  issueId: string,
): Promise<void> => {
  await apiClient.delete(`/organisations/${orgSlug}/projects/${projectId}/issues/${issueId}`);
};

export const getBoardIssues = async (
  orgSlug: string,
  projectId: string,
  sprintId: string,
): Promise<IBoardData> => {
  const { data } = await apiClient.get<TApiResponse<IBoardData>>(
    `/organisations/${orgSlug}/projects/${projectId}/issues/board/${sprintId}`,
  );
  return data.data;
};

export const bulkUpdateIssueOrder = async (
  orgSlug: string,
  projectId: string,
  updates: IBulkUpdateItem[],
): Promise<void> => {
  await apiClient.post(
    `/organisations/${orgSlug}/projects/${projectId}/issues/board/reorder`,
    { updates },
  );
};

export const addIssueWatcher = async (
  orgSlug: string,
  projectId: string,
  issueId: string,
): Promise<IUser[]> => {
  const { data } = await apiClient.post<TApiResponse<IUser[]>>(
    `/organisations/${orgSlug}/projects/${projectId}/issues/${issueId}/watch`,
  );
  return data.data;
};

export const removeIssueWatcher = async (
  orgSlug: string,
  projectId: string,
  issueId: string,
): Promise<IUser[]> => {
  const { data } = await apiClient.delete<TApiResponse<IUser[]>>(
    `/organisations/${orgSlug}/projects/${projectId}/issues/${issueId}/watch`,
  );
  return data.data;
};
