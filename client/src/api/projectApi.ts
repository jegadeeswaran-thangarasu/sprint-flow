import apiClient from '@/api/client';
import { IProject, TApiResponse } from '@/types';

export interface TCreateProjectData {
  name: string;
  key?: string;
  description?: string;
  icon?: string;
  color?: string;
}

export const createProject = async (
  orgSlug: string,
  data: TCreateProjectData,
): Promise<IProject> => {
  const { data: res } = await apiClient.post<TApiResponse<IProject>>(
    `/organisations/${orgSlug}/projects`,
    data,
  );
  return res.data;
};

export const getOrgProjects = async (orgSlug: string): Promise<IProject[]> => {
  const { data } = await apiClient.get<TApiResponse<IProject[]>>(
    `/organisations/${orgSlug}/projects`,
  );
  return data.data;
};

export const getProjectById = async (orgSlug: string, projectId: string): Promise<IProject> => {
  const { data } = await apiClient.get<TApiResponse<IProject>>(
    `/organisations/${orgSlug}/projects/${projectId}`,
  );
  return data.data;
};

export const updateProject = async (
  orgSlug: string,
  projectId: string,
  data: Partial<TCreateProjectData & { lead: string }>,
): Promise<IProject> => {
  const { data: res } = await apiClient.patch<TApiResponse<IProject>>(
    `/organisations/${orgSlug}/projects/${projectId}`,
    data,
  );
  return res.data;
};

export const archiveProject = async (orgSlug: string, projectId: string): Promise<void> => {
  await apiClient.patch(`/organisations/${orgSlug}/projects/${projectId}/archive`);
};
