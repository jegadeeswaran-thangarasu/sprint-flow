import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createIssue,
  deleteIssue,
  getBacklogIssues,
  getIssueById,
  getProjectIssues,
  updateIssue,
  updateIssueStatus as updateIssueStatusApi,
  TCreateIssueData,
  TProjectIssueFilters,
  TUpdateIssueData,
} from '@/api/issueApi';
import useIssueStore from '@/store/issueStore';
import { QUERY_KEYS } from '@/utils/constants';
import { IIssue, IssueStatus } from '@/types';

export const useProjectIssues = (
  orgSlug: string,
  projectId: string,
  filters?: TProjectIssueFilters,
) => {
  const setIssues = useIssueStore((s) => s.setIssues);

  return useQuery({
    queryKey: filters ? [...QUERY_KEYS.ISSUES(projectId), filters] : QUERY_KEYS.ISSUES(projectId),
    queryFn: async () => {
      const list = await getProjectIssues(orgSlug, projectId, filters);
      setIssues(list);
      return list;
    },
    enabled: Boolean(orgSlug) && Boolean(projectId),
  });
};

export const useBacklogIssues = (orgSlug: string, projectId: string) => {
  const setBacklogIssues = useIssueStore((s) => s.setBacklogIssues);

  return useQuery({
    queryKey: QUERY_KEYS.BACKLOG_ISSUES(projectId),
    queryFn: async () => {
      const list = await getBacklogIssues(orgSlug, projectId);
      setBacklogIssues(list);
      return list;
    },
    enabled: Boolean(orgSlug) && Boolean(projectId),
  });
};

export const useIssue = (orgSlug: string, projectId: string, issueId: string | undefined) => {
  const setCurrentIssue = useIssueStore((s) => s.setCurrentIssue);

  return useQuery({
    queryKey: issueId ? QUERY_KEYS.ISSUE(issueId) : ['issues', 'detail', 'disabled'],
    queryFn: async () => {
      const issue = await getIssueById(orgSlug, projectId, issueId as string);
      setCurrentIssue(issue);
      return issue;
    },
    enabled: Boolean(orgSlug) && Boolean(projectId) && Boolean(issueId),
  });
};

export const useCreateIssue = (orgSlug: string, projectId: string) => {
  const addIssue = useIssueStore((s) => s.addIssue);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TCreateIssueData) => createIssue(orgSlug, projectId, data),
    onSuccess: (issue) => {
      addIssue(issue);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ISSUES(projectId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BACKLOG_ISSUES(projectId) });
    },
  });
};

export const useUpdateIssue = (orgSlug: string, projectId: string) => {
  const updateIssueInStore = useIssueStore((s) => s.updateIssue);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      issueId,
      data,
    }: {
      issueId: string;
      data: TUpdateIssueData;
    }) => updateIssue(orgSlug, projectId, issueId, data),
    onSuccess: (issue) => {
      updateIssueInStore(issue);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ISSUES(projectId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BACKLOG_ISSUES(projectId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ISSUE(issue._id) });
    },
  });
};

export const useUpdateIssueStatus = (orgSlug: string, projectId: string) => {
  const updateIssueStatusLocally = useIssueStore((s) => s.updateIssueStatusLocally);
  const updateIssueInStore = useIssueStore((s) => s.updateIssue);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      issueId,
      status,
      order,
    }: {
      issueId: string;
      status: IssueStatus;
      order: number;
    }) => updateIssueStatusApi(orgSlug, projectId, issueId, status, order),
    onMutate: async (variables) => {
      const state = useIssueStore.getState();
      const fromIssues = state.issues.find((i) => i._id === variables.issueId);
      const fromBacklog = state.backlogIssues.find((i) => i._id === variables.issueId);
      const prev = fromIssues ?? fromBacklog;
      const snapshot: IIssue | undefined = prev ? { ...prev } : undefined;

      updateIssueStatusLocally(variables.issueId, variables.status, variables.order);
      return { snapshot };
    },
    onError: (_err, _variables, context) => {
      if (context?.snapshot) {
        updateIssueInStore(context.snapshot);
      }
    },
    onSuccess: (issue) => {
      updateIssueInStore(issue);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ISSUES(projectId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BACKLOG_ISSUES(projectId) });
    },
  });
};

export const useDeleteIssue = (orgSlug: string, projectId: string) => {
  const removeIssue = useIssueStore((s) => s.removeIssue);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (issueId: string) => deleteIssue(orgSlug, projectId, issueId),
    onSuccess: (_void, issueId) => {
      removeIssue(issueId);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ISSUES(projectId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BACKLOG_ISSUES(projectId) });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.ISSUE(issueId) });
    },
  });
};
