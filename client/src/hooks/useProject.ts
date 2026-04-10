import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  createProject,
  getOrgProjects,
  getProjectById,
  updateProject,
  archiveProject,
  TCreateProjectData,
} from '@/api/projectApi';
import useProjectStore from '@/store/projectStore';
import { QUERY_KEYS } from '@/utils/constants';

export const useOrgProjects = (orgSlug: string) => {
  const setProjects = useProjectStore((state) => state.setProjects);

  return useQuery({
    queryKey: QUERY_KEYS.PROJECTS(orgSlug),
    queryFn: async () => {
      const projects = await getOrgProjects(orgSlug);
      setProjects(projects);
      return projects;
    },
    enabled: Boolean(orgSlug),
  });
};

export const useProject = (orgSlug: string, projectId: string) => {
  const setCurrentProject = useProjectStore((state) => state.setCurrentProject);

  return useQuery({
    queryKey: QUERY_KEYS.PROJECT(orgSlug, projectId),
    queryFn: async () => {
      const project = await getProjectById(orgSlug, projectId);
      setCurrentProject(project);
      return project;
    },
    enabled: Boolean(orgSlug) && Boolean(projectId),
  });
};

export const useCreateProject = (orgSlug: string) => {
  const addProject = useProjectStore((state) => state.addProject);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: TCreateProjectData) => createProject(orgSlug, data),
    onSuccess: (project) => {
      addProject(project);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROJECTS(orgSlug) });
      navigate(`/org/${orgSlug}/projects/${project._id}/board`);
    },
  });
};

export const useUpdateProject = (orgSlug: string, projectId: string) => {
  const updateProjectInStore = useProjectStore((state) => state.updateProject);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<TCreateProjectData & { lead: string }>) =>
      updateProject(orgSlug, projectId, data),
    onSuccess: (project) => {
      updateProjectInStore(project);
      queryClient.setQueryData(QUERY_KEYS.PROJECT(orgSlug, projectId), project);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROJECTS(orgSlug) });
    },
  });
};

export const useArchiveProject = (orgSlug: string) => {
  const removeProject = useProjectStore((state) => state.removeProject);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => archiveProject(orgSlug, projectId),
    onSuccess: (_data, projectId) => {
      removeProject(projectId);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROJECTS(orgSlug) });
    },
  });
};
