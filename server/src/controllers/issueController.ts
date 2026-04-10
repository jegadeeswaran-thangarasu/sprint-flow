import { Request, Response, NextFunction } from 'express';
import {
  createIssue as createIssueService,
  getProjectIssues as getProjectIssuesService,
  getIssueById as getIssueByIdService,
  getFullIssueDetail as getFullIssueDetailService,
  getIssueActivity as getIssueActivityService,
  updateIssue as updateIssueService,
  updateIssueStatus as updateIssueStatusService,
  deleteIssue as deleteIssueService,
  addWatcher as addWatcherService,
  removeWatcher as removeWatcherService,
  getBacklogIssues as getBacklogIssuesService,
  getBoardIssues as getBoardIssuesService,
  bulkUpdateIssueOrder as bulkUpdateIssueOrderService,
  TCreateIssueData,
  TIssueFilters,
  TUpdateIssueData,
  TBoardData,
} from '../services/issueService';
import { IIssueDocument, IssuePriority, IssueStatus, IssueType } from '../models/Issue';
import { TApiResponse, TJwtPayload, IUser, IBulkUpdateItem, IFullIssue, IActivityLog } from '../types';
import { IOrgMemberDocument } from '../models/OrgMember';

const firstQuery = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
};

export const createIssue = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const orgMember = req.orgMember as IOrgMemberDocument;
    const { projectId } = req.params;
    const orgId = orgMember.organisation.toString();

    const body = req.body as Record<string, unknown>;
    const data: TCreateIssueData = {
      title: body.title as string,
      description: typeof body.description === 'string' ? body.description : undefined,
      type: body.type as IssueType | undefined,
      status: body.status as IssueStatus | undefined,
      priority: body.priority as IssuePriority | undefined,
      storyPoints:
        body.storyPoints === undefined
          ? undefined
          : body.storyPoints === null
            ? null
            : Number(body.storyPoints),
      sprint: typeof body.sprint === 'string' ? body.sprint : body.sprint === null ? null : undefined,
      epic: typeof body.epic === 'string' ? body.epic : body.epic === null ? null : undefined,
      parent: typeof body.parent === 'string' ? body.parent : body.parent === null ? null : undefined,
      assignee:
        typeof body.assignee === 'string' ? body.assignee : body.assignee === null ? null : undefined,
      labels: Array.isArray(body.labels) ? (body.labels as string[]) : undefined,
      dueDate:
        typeof body.dueDate === 'string' ? body.dueDate : body.dueDate === null ? null : undefined,
    };

    const issue = await createIssueService(projectId, orgId, userId, data);

    const response: TApiResponse<IIssueDocument> = {
      success: true,
      data: issue,
      message: 'Issue created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const getProjectIssues = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const orgMember = req.orgMember as IOrgMemberDocument;
    const { projectId } = req.params;
    const orgId = orgMember.organisation.toString();

    const filters: TIssueFilters = {};

    const status = firstQuery(req.query.status);
    if (status) filters.status = status as IssueStatus;

    const sprint = firstQuery(req.query.sprint);
    if (sprint !== undefined) filters.sprint = sprint;

    const assignee = firstQuery(req.query.assignee);
    if (assignee) filters.assignee = assignee;

    const priority = firstQuery(req.query.priority);
    if (priority) filters.priority = priority as IssuePriority;

    const type = firstQuery(req.query.type);
    if (type) filters.type = type as IssueType;

    const label = firstQuery(req.query.label);
    if (label) filters.label = label;

    const search = firstQuery(req.query.search);
    if (search) filters.search = search;

    const issues = await getProjectIssuesService(projectId, orgId, userId, filters);

    const response: TApiResponse<IIssueDocument[]> = {
      success: true,
      data: issues,
      message: 'Issues retrieved successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getIssueById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const orgMember = req.orgMember as IOrgMemberDocument;
    const { issueId } = req.params;
    const orgId = orgMember.organisation.toString();

    const issue = await getIssueByIdService(issueId, orgId, userId);

    const response: TApiResponse<IIssueDocument> = {
      success: true,
      data: issue,
      message: 'Issue retrieved successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getFullIssueDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const orgMember = req.orgMember as IOrgMemberDocument;
    const { issueId } = req.params;
    const orgId = orgMember.organisation.toString();

    const issue = await getFullIssueDetailService(issueId, orgId, userId);

    const response: TApiResponse<IFullIssue> = {
      success: true,
      data: issue,
      message: 'Issue detail retrieved successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getIssueActivity = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const orgMember = req.orgMember as IOrgMemberDocument;
    const { issueId } = req.params;
    const orgId = orgMember.organisation.toString();

    const activity = await getIssueActivityService(issueId, orgId, userId);

    const response: TApiResponse<IActivityLog[]> = {
      success: true,
      data: activity,
      message: 'Issue activity retrieved successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateIssue = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const orgMember = req.orgMember as IOrgMemberDocument;
    const { issueId } = req.params;
    const orgId = orgMember.organisation.toString();

    const body = req.body as Record<string, unknown>;
    const updates: TUpdateIssueData = {};

    if (body.title !== undefined) updates.title = body.title as string;
    if (body.description !== undefined) updates.description = body.description as string;
    if (body.type !== undefined) updates.type = body.type as IssueType;
    if (body.status !== undefined) updates.status = body.status as IssueStatus;
    if (body.priority !== undefined) updates.priority = body.priority as IssuePriority;
    if (body.storyPoints !== undefined) {
      updates.storyPoints =
        body.storyPoints === null ? null : (Number(body.storyPoints) as number | null);
    }
    if (body.labels !== undefined) updates.labels = body.labels as string[];
    if (body.dueDate !== undefined) {
      updates.dueDate =
        body.dueDate === null ? null : typeof body.dueDate === 'string' ? body.dueDate : undefined;
    }
    if (body.assignee !== undefined) {
      updates.assignee =
        body.assignee === null ? null : typeof body.assignee === 'string' ? body.assignee : undefined;
    }
    if (body.sprint !== undefined) {
      updates.sprint =
        body.sprint === null ? null : typeof body.sprint === 'string' ? body.sprint : undefined;
    }
    if (body.epic !== undefined) {
      updates.epic = body.epic === null ? null : typeof body.epic === 'string' ? body.epic : undefined;
    }
    if (body.parent !== undefined) {
      updates.parent =
        body.parent === null ? null : typeof body.parent === 'string' ? body.parent : undefined;
    }
    if (body.order !== undefined) updates.order = Number(body.order);

    const issue = await updateIssueService(issueId, orgId, userId, updates);

    const response: TApiResponse<IIssueDocument> = {
      success: true,
      data: issue,
      message: 'Issue updated successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateIssueStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const orgMember = req.orgMember as IOrgMemberDocument;
    const { issueId } = req.params;
    const orgId = orgMember.organisation.toString();

    const { status, order } = req.body as { status: IssueStatus; order: number };

    const issue = await updateIssueStatusService(issueId, orgId, userId, status, order);

    const response: TApiResponse<IIssueDocument> = {
      success: true,
      data: issue,
      message: 'Issue status updated successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const deleteIssue = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const orgMember = req.orgMember as IOrgMemberDocument;
    const { issueId } = req.params;
    const orgId = orgMember.organisation.toString();

    await deleteIssueService(issueId, orgId, userId);

    const response: TApiResponse<null> = {
      success: true,
      data: null,
      message: 'Issue deleted successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const addWatcher = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const orgMember = req.orgMember as IOrgMemberDocument;
    const { issueId } = req.params;
    const orgId = orgMember.organisation.toString();

    const watchers = await addWatcherService(issueId, orgId, userId);

    const response: TApiResponse<IUser[]> = {
      success: true,
      data: watchers,
      message: 'Watcher added successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const removeWatcher = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const orgMember = req.orgMember as IOrgMemberDocument;
    const { issueId } = req.params;
    const orgId = orgMember.organisation.toString();

    const watchers = await removeWatcherService(issueId, orgId, userId);

    const response: TApiResponse<IUser[]> = {
      success: true,
      data: watchers,
      message: 'Watcher removed successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getBoardIssues = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const orgMember = req.orgMember as IOrgMemberDocument;
    const { projectId, sprintId } = req.params;
    const orgId = orgMember.organisation.toString();

    const data = await getBoardIssuesService(projectId, sprintId, orgId, userId);

    const response: TApiResponse<TBoardData> = {
      success: true,
      data,
      message: 'Board issues retrieved successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const bulkUpdateIssueOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const orgMember = req.orgMember as IOrgMemberDocument;
    const orgId = orgMember.organisation.toString();

    const { updates } = req.body as { updates: IBulkUpdateItem[] };

    await bulkUpdateIssueOrderService(updates, orgId, userId);

    const response: TApiResponse<null> = {
      success: true,
      data: null,
      message: 'Issue order updated successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getBacklogIssues = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const orgMember = req.orgMember as IOrgMemberDocument;
    const { projectId } = req.params;
    const orgId = orgMember.organisation.toString();

    const grouped = await getBacklogIssuesService(projectId, orgId, userId);

    const response: TApiResponse<Record<IssueType, IIssueDocument[]>> = {
      success: true,
      data: grouped,
      message: 'Backlog issues retrieved successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
