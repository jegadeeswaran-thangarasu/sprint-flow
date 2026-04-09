import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addReaction,
  createComment,
  deleteComment,
  getIssueComments,
  updateComment,
} from '@/api/commentApi';
import { QUERY_KEYS } from '@/utils/constants';

export const useIssueComments = (
  orgSlug: string,
  projectId: string,
  issueId: string | undefined,
) => {
  return useQuery({
    queryKey: issueId ? QUERY_KEYS.COMMENTS(issueId) : ['comments', 'disabled'],
    queryFn: () => getIssueComments(orgSlug, projectId, issueId as string),
    enabled: Boolean(orgSlug) && Boolean(projectId) && Boolean(issueId),
  });
};

export const useCreateComment = (
  orgSlug: string,
  projectId: string,
  issueId: string | undefined,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ content, parentId }: { content: string; parentId?: string }) =>
      createComment(orgSlug, projectId, issueId as string, content, parentId),
    onSuccess: () => {
      if (issueId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COMMENTS(issueId) });
      }
    },
  });
};

export const useUpdateComment = (
  orgSlug: string,
  projectId: string,
  issueId: string | undefined,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      updateComment(orgSlug, projectId, issueId as string, commentId, content),
    onSuccess: () => {
      if (issueId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COMMENTS(issueId) });
      }
    },
  });
};

export const useDeleteComment = (
  orgSlug: string,
  projectId: string,
  issueId: string | undefined,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) =>
      deleteComment(orgSlug, projectId, issueId as string, commentId),
    onSuccess: () => {
      if (issueId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COMMENTS(issueId) });
      }
    },
  });
};

export const useAddReaction = (
  orgSlug: string,
  projectId: string,
  issueId: string | undefined,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, emoji }: { commentId: string; emoji: string }) =>
      addReaction(orgSlug, projectId, issueId as string, commentId, emoji),
    onSuccess: () => {
      if (issueId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COMMENTS(issueId) });
      }
    },
  });
};
