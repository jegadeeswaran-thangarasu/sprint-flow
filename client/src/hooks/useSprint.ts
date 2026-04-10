import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createSprint,
  getProjectSprints,
  getSprintIssues,
  startSprint,
  completeSprint,
  updateSprint,
  deleteSprint,
  moveIssuesToSprint,
  removeIssuesFromSprint,
  TCreateSprintData,
  TUpdateSprintData,
} from '@/api/sprintApi';
import useSprintStore from '@/store/sprintStore';
import { QUERY_KEYS } from '@/utils/constants';
import { ICompleteSprintResult } from '@/types';

export const useProjectSprints = (orgSlug: string, projectId: string) => {
  const setSprints = useSprintStore((s) => s.setSprints);

  return useQuery({
    queryKey: QUERY_KEYS.SPRINTS(projectId),
    queryFn: async () => {
      const list = await getProjectSprints(orgSlug, projectId);
      setSprints(list);
      return list;
    },
    enabled: Boolean(orgSlug) && Boolean(projectId),
  });
};

export const useSprintIssues = (orgSlug: string, projectId: string, sprintId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.SPRINT_ISSUES(sprintId),
    queryFn: () => getSprintIssues(orgSlug, projectId, sprintId),
    enabled: Boolean(orgSlug) && Boolean(projectId) && Boolean(sprintId),
  });
};

export const useCreateSprint = (orgSlug: string, projectId: string) => {
  const addSprint = useSprintStore((s) => s.addSprint);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TCreateSprintData) => createSprint(orgSlug, projectId, data),
    onSuccess: (sprint) => {
      addSprint(sprint);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SPRINTS(projectId) });
    },
  });
};

export const useStartSprint = (orgSlug: string, projectId: string) => {
  const updateSprintInStore = useSprintStore((s) => s.updateSprint);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sprintId: string) => startSprint(orgSlug, projectId, sprintId),
    onSuccess: (sprint, sprintId) => {
      updateSprintInStore(sprint);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SPRINTS(projectId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SPRINT_ISSUES(sprintId) });
    },
  });
};

export const useCompleteSprint = (orgSlug: string, projectId: string) => {
  const updateSprintInStore = useSprintStore((s) => s.updateSprint);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sprintId,
      moveToSprintId,
    }: {
      sprintId: string;
      moveToSprintId?: string;
    }) => completeSprint(orgSlug, projectId, sprintId, moveToSprintId),
    onSuccess: (result: ICompleteSprintResult, { sprintId, moveToSprintId }) => {
      updateSprintInStore(result.sprint);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SPRINTS(projectId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BACKLOG_ISSUES(projectId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SPRINT_ISSUES(sprintId) });
      if (moveToSprintId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SPRINT_ISSUES(moveToSprintId) });
      }
    },
  });
};

export const useUpdateSprint = (orgSlug: string, projectId: string) => {
  const updateSprintInStore = useSprintStore((s) => s.updateSprint);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sprintId, data }: { sprintId: string; data: TUpdateSprintData }) =>
      updateSprint(orgSlug, projectId, sprintId, data),
    onSuccess: (sprint) => {
      updateSprintInStore(sprint);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SPRINTS(projectId) });
    },
  });
};

export const useDeleteSprint = (orgSlug: string, projectId: string) => {
  const removeSprint = useSprintStore((s) => s.removeSprint);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sprintId: string) => deleteSprint(orgSlug, projectId, sprintId),
    onSuccess: (_void, sprintId) => {
      removeSprint(sprintId);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SPRINTS(projectId) });
    },
  });
};

export const useMoveIssuesToSprint = (orgSlug: string, projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sprintId, issueIds }: { sprintId: string; issueIds: string[] }) =>
      moveIssuesToSprint(orgSlug, projectId, sprintId, issueIds),
    onSuccess: (_data, { sprintId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BACKLOG_ISSUES(projectId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SPRINTS(projectId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SPRINT_ISSUES(sprintId) });
    },
  });
};

export const useRemoveIssuesFromSprint = (orgSlug: string, projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sprintId, issueIds }: { sprintId: string; issueIds: string[] }) =>
      removeIssuesFromSprint(orgSlug, projectId, sprintId, issueIds),
    onSuccess: (_data, { sprintId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BACKLOG_ISSUES(projectId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SPRINTS(projectId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SPRINT_ISSUES(sprintId) });
    },
  });
};
