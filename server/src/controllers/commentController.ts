import { Request, Response, NextFunction } from 'express';
import {
  createComment as createCommentService,
  getIssueComments as getIssueCommentsService,
  updateComment as updateCommentService,
  deleteComment as deleteCommentService,
  addReaction as addReactionService,
} from '../services/commentService';
import { TApiResponse, TJwtPayload, IComment, IReaction } from '../types';
import { IOrgMemberDocument } from '../models/OrgMember';

export const createComment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const orgMember = req.orgMember as IOrgMemberDocument;
    const { issueId, projectId } = req.params;
    const orgId = orgMember.organisation.toString();

    const body = req.body as { content: string; parentId?: string | null };
    const content = body.content;
    const parentId =
      body.parentId === undefined || body.parentId === null || body.parentId === ''
        ? undefined
        : body.parentId;

    const comment = await createCommentService(issueId, userId, orgId, projectId, content, parentId);

    const response: TApiResponse<IComment> = {
      success: true,
      data: comment,
      message: 'Comment created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const getIssueComments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const orgMember = req.orgMember as IOrgMemberDocument;
    const { issueId, projectId } = req.params;
    const orgId = orgMember.organisation.toString();

    const comments = await getIssueCommentsService(issueId, projectId, orgId, userId);

    const response: TApiResponse<Array<IComment & { replies: IComment[] }>> = {
      success: true,
      data: comments,
      message: 'Comments retrieved successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateComment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const orgMember = req.orgMember as IOrgMemberDocument;
    const { issueId, projectId, commentId } = req.params;
    const orgId = orgMember.organisation.toString();

    const body = req.body as { content: string };
    const comment = await updateCommentService(
      commentId,
      userId,
      orgId,
      projectId,
      issueId,
      body.content
    );

    const response: TApiResponse<IComment> = {
      success: true,
      data: comment,
      message: 'Comment updated successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const orgMember = req.orgMember as IOrgMemberDocument;
    const { issueId, projectId, commentId } = req.params;
    const orgId = orgMember.organisation.toString();

    await deleteCommentService(
      commentId,
      userId,
      orgMember.role,
      orgId,
      projectId,
      issueId
    );

    const response: TApiResponse<null> = {
      success: true,
      data: null,
      message: 'Comment deleted successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const addReaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const orgMember = req.orgMember as IOrgMemberDocument;
    const { issueId, projectId, commentId } = req.params;
    const orgId = orgMember.organisation.toString();

    const body = req.body as { emoji: string };
    const reactions = await addReactionService(
      commentId,
      userId,
      orgId,
      projectId,
      issueId,
      body.emoji
    );

    const response: TApiResponse<IReaction[]> = {
      success: true,
      data: reactions,
      message: 'Reactions updated successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
