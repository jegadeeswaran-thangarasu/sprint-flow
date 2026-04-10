import apiClient from '@/api/client';
import {
  IBurndownData,
  IIssueBreakdown,
  ISprintReport,
  IVelocityData,
  TApiResponse,
} from '@/types';

const base = (orgSlug: string, projectId: string) =>
  `/organisations/${orgSlug}/projects/${projectId}/reports`;

export const getBurndown = async (
  orgSlug: string,
  projectId: string,
  sprintId: string,
): Promise<IBurndownData> => {
  const { data } = await apiClient.get<TApiResponse<IBurndownData>>(
    `${base(orgSlug, projectId)}/burndown/${sprintId}`,
  );
  return data.data;
};

export const getVelocity = async (
  orgSlug: string,
  projectId: string,
  limit?: number,
): Promise<IVelocityData> => {
  const { data } = await apiClient.get<TApiResponse<IVelocityData>>(`${base(orgSlug, projectId)}/velocity`, {
    params: limit !== undefined ? { limit } : undefined,
  });
  return data.data;
};

export const getIssueBreakdown = async (
  orgSlug: string,
  projectId: string,
  sprintId?: string,
): Promise<IIssueBreakdown> => {
  const { data } = await apiClient.get<TApiResponse<IIssueBreakdown>>(
    `${base(orgSlug, projectId)}/breakdown`,
    { params: sprintId ? { sprintId } : undefined },
  );
  return data.data;
};

export const getSprintReport = async (
  orgSlug: string,
  projectId: string,
  sprintId: string,
): Promise<ISprintReport> => {
  const { data } = await apiClient.get<TApiResponse<ISprintReport>>(
    `${base(orgSlug, projectId)}/sprint/${sprintId}`,
  );
  return data.data;
};
