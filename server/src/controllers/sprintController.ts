import { Request, Response, NextFunction } from 'express';
import {
  createSprint as createSprintService,
  getProjectSprints as getProjectSprintsService,
  getSprintById as getSprintByIdService,
  updateSprint as updateSprintService,
  startSprint as startSprintService,
  completeSprint as completeSprintService,
  deleteSprint as deleteSprintService,
  moveIssuesToSprint as moveIssuesToSprintService,
  removeIssuesFromSprint as removeIssuesFromSprintService,
  getSprintIssues as getSprintIssuesService,
  TCreateSprintData,
  TUpdateSprintData,
  ISprintWithCount,
  ICompleteSprintServiceResult,
} from '../services/sprintService';
import { ISprintDocument } from '../models/Sprint';
import { IIssueDocument } from '../models/Issue';
import { TApiResponse, TJwtPayload } from '../types';
import { IOrgMemberDocument } from '../models/OrgMember';

export const createSprint = async (
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
    const data: TCreateSprintData = {
      name: typeof body.name === 'string' ? body.name : undefined,
      goal: typeof body.goal === 'string' ? body.goal : undefined,
      startDate: typeof body.startDate === 'string' ? body.startDate : undefined,
      endDate: typeof body.endDate === 'string' ? body.endDate : undefined,
    };

    const sprint = await createSprintService(projectId, orgId, userId, data);

    const response: TApiResponse<ISprintDocument> = {
      success: true,
      data: sprint,
      message: 'Sprint created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const getProjectSprints = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const { projectId } = req.params;

    const sprints = await getProjectSprintsService(projectId, userId);

    const response: TApiResponse<ISprintWithCount[]> = {
      success: true,
      data: sprints,
      message: 'Sprints retrieved successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getSprintById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const { sprintId } = req.params;

    const sprint = await getSprintByIdService(sprintId, userId);

    const response: TApiResponse<ISprintDocument> = {
      success: true,
      data: sprint,
      message: 'Sprint retrieved successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateSprint = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const { sprintId } = req.params;

    const body = req.body as Record<string, unknown>;
    const updates: TUpdateSprintData = {};

    if (body.name !== undefined) updates.name = body.name as string;
    if (body.goal !== undefined) updates.goal = body.goal as string;
    if (body.startDate !== undefined) {
      updates.startDate = body.startDate === null ? null : (body.startDate as string);
    }
    if (body.endDate !== undefined) {
      updates.endDate = body.endDate === null ? null : (body.endDate as string);
    }

    const sprint = await updateSprintService(sprintId, userId, updates);

    const response: TApiResponse<ISprintDocument> = {
      success: true,
      data: sprint,
      message: 'Sprint updated successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const startSprint = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const { sprintId } = req.params;

    const sprint = await startSprintService(sprintId, userId);

    const response: TApiResponse<ISprintDocument> = {
      success: true,
      data: sprint,
      message: 'Sprint started successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const completeSprint = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const { sprintId } = req.params;

    const body = req.body as Record<string, unknown>;
    const moveToSprintId =
      typeof body.moveToSprintId === 'string' ? body.moveToSprintId : undefined;

    const result = await completeSprintService(sprintId, userId, moveToSprintId);

    const response: TApiResponse<ICompleteSprintServiceResult> = {
      success: true,
      data: result,
      message: 'Sprint completed successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const deleteSprint = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const { sprintId } = req.params;

    await deleteSprintService(sprintId, userId);

    const response: TApiResponse<null> = {
      success: true,
      data: null,
      message: 'Sprint deleted successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const moveIssuesToSprint = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const { sprintId } = req.params;

    const { issueIds } = req.body as { issueIds: string[] };

    const count = await moveIssuesToSprintService(sprintId, issueIds, userId);

    const response: TApiResponse<{ updatedCount: number }> = {
      success: true,
      data: { updatedCount: count },
      message: `${count} issue(s) moved to sprint`,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const removeIssuesFromSprint = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;

    const { issueIds } = req.body as { issueIds: string[] };

    const count = await removeIssuesFromSprintService(issueIds, userId);

    const response: TApiResponse<{ updatedCount: number }> = {
      success: true,
      data: { updatedCount: count },
      message: `${count} issue(s) removed from sprint`,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getSprintIssues = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const { sprintId } = req.params;

    const issues = await getSprintIssuesService(sprintId, userId);

    const response: TApiResponse<IIssueDocument[]> = {
      success: true,
      data: issues,
      message: 'Sprint issues retrieved successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
