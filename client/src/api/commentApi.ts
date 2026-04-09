import apiClient from '@/api/client';
import { IComment, IReaction, TApiResponse } from '@/types';

const commentsBasePath = (
  orgSlug: string,
  projectId: string,
  issueId: string,
): string =>
  `/organisations/${orgSlug}/projects/${projectId}/issues/${issueId}/comments`;

export const getIssueComments = async (
  orgSlug: string,
  projectId: string,
  issueId: string,
): Promise<IComment[]> => {
  const { data } = await apiClient.get<TApiResponse<IComment[]>>(
    commentsBasePath(orgSlug, projectId, issueId),
  );
  return data.data;
};

export const createComment = async (
  orgSlug: string,
  projectId: string,
  issueId: string,
  content: string,
  parentId?: string,
): Promise<IComment> => {
  const { data: res } = await apiClient.post<TApiResponse<IComment>>(
    commentsBasePath(orgSlug, projectId, issueId),
    { content, parentId },
  );
  return res.data;
};

export const updateComment = async (
  orgSlug: string,
  projectId: string,
  issueId: string,
  commentId: string,
  content: string,
): Promise<IComment> => {
  const { data: res } = await apiClient.patch<TApiResponse<IComment>>(
    `${commentsBasePath(orgSlug, projectId, issueId)}/${commentId}`,
    { content },
  );
  return res.data;
};

export const deleteComment = async (
  orgSlug: string,
  projectId: string,
  issueId: string,
  commentId: string,
): Promise<void> => {
  await apiClient.delete(
    `${commentsBasePath(orgSlug, projectId, issueId)}/${commentId}`,
  );
};

export const addReaction = async (
  orgSlug: string,
  projectId: string,
  issueId: string,
  commentId: string,
  emoji: string,
): Promise<IReaction[]> => {
  const { data } = await apiClient.post<TApiResponse<IReaction[]>>(
    `${commentsBasePath(orgSlug, projectId, issueId)}/${commentId}/reactions`,
    { emoji },
  );
  return data.data;
};
