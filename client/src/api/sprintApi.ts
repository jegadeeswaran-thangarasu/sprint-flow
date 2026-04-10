import apiClient from '@/api/client';
import { ISprint, IIssue, ICompleteSprintResult, TApiResponse } from '@/types';

export interface TCreateSprintData {
  name?: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
}

export interface TUpdateSprintData {
  name?: string;
  goal?: string;
  startDate?: string | null;
  endDate?: string | null;
}

const base = (orgSlug: string, projectId: string) =>
  `/organisations/${orgSlug}/projects/${projectId}/sprints`;

export const createSprint = async (
  orgSlug: string,
  projectId: string,
  data: TCreateSprintData,
): Promise<ISprint> => {
  const { data: res } = await apiClient.post<TApiResponse<ISprint>>(base(orgSlug, projectId), data);
  return res.data;
};

export const getProjectSprints = async (
  orgSlug: string,
  projectId: string,
): Promise<ISprint[]> => {
  const { data } = await apiClient.get<TApiResponse<ISprint[]>>(base(orgSlug, projectId));
  return data.data;
};

export const getSprintById = async (
  orgSlug: string,
  projectId: string,
  sprintId: string,
): Promise<ISprint> => {
  const { data } = await apiClient.get<TApiResponse<ISprint>>(
    `${base(orgSlug, projectId)}/${sprintId}`,
  );
  return data.data;
};

export const updateSprint = async (
  orgSlug: string,
  projectId: string,
  sprintId: string,
  data: TUpdateSprintData,
): Promise<ISprint> => {
  const { data: res } = await apiClient.patch<TApiResponse<ISprint>>(
    `${base(orgSlug, projectId)}/${sprintId}`,
    data,
  );
  return res.data;
};

export const startSprint = async (
  orgSlug: string,
  projectId: string,
  sprintId: string,
): Promise<ISprint> => {
  const { data } = await apiClient.post<TApiResponse<ISprint>>(
    `${base(orgSlug, projectId)}/${sprintId}/start`,
  );
  return data.data;
};

export const completeSprint = async (
  orgSlug: string,
  projectId: string,
  sprintId: string,
  moveToSprintId?: string,
): Promise<ICompleteSprintResult> => {
  const { data } = await apiClient.post<TApiResponse<ICompleteSprintResult>>(
    `${base(orgSlug, projectId)}/${sprintId}/complete`,
    moveToSprintId ? { moveToSprintId } : {},
  );
  return data.data;
};

export const deleteSprint = async (
  orgSlug: string,
  projectId: string,
  sprintId: string,
): Promise<void> => {
  await apiClient.delete(`${base(orgSlug, projectId)}/${sprintId}`);
};

export const moveIssuesToSprint = async (
  orgSlug: string,
  projectId: string,
  sprintId: string,
  issueIds: string[],
): Promise<{ count: number }> => {
  const { data } = await apiClient.post<TApiResponse<{ updatedCount: number }>>(
    `${base(orgSlug, projectId)}/${sprintId}/issues`,
    { issueIds },
  );
  return { count: data.data.updatedCount };
};

export const removeIssuesFromSprint = async (
  orgSlug: string,
  projectId: string,
  sprintId: string,
  issueIds: string[],
): Promise<{ count: number }> => {
  const { data } = await apiClient.delete<TApiResponse<{ updatedCount: number }>>(
    `${base(orgSlug, projectId)}/${sprintId}/issues`,
    { data: { issueIds } },
  );
  return { count: data.data.updatedCount };
};

export const getSprintIssues = async (
  orgSlug: string,
  projectId: string,
  sprintId: string,
): Promise<IIssue[]> => {
  const { data } = await apiClient.get<TApiResponse<IIssue[]>>(
    `${base(orgSlug, projectId)}/${sprintId}/issues`,
  );
  return data.data;
};
