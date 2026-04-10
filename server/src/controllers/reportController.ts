import { Request, Response, NextFunction } from 'express';
import {
  getBurndownData,
  getIssueBreakdown,
  getSprintReport,
  getVelocityData,
} from '../services/reportService';
import {
  IBurndownData,
  IIssueBreakdown,
  ISprintReport,
  IVelocityData,
  TApiResponse,
} from '../types';

const firstQuery = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
};

export const getBurndown = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { projectId, sprintId } = req.params;
    const data: IBurndownData = await getBurndownData(sprintId, projectId);

    const body: TApiResponse<IBurndownData> = {
      success: true,
      data,
      message: 'Burndown data retrieved successfully',
    };

    res.status(200).json(body);
  } catch (error) {
    next(error);
  }
};

export const getVelocity = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { projectId } = req.params;
    const limitRaw = firstQuery(req.query.limit);
    const parsed = limitRaw !== undefined ? Number.parseInt(limitRaw, 10) : 6;
    const limit = Number.isFinite(parsed) && parsed > 0 ? parsed : 6;

    const data: IVelocityData = await getVelocityData(projectId, limit);

    const body: TApiResponse<IVelocityData> = {
      success: true,
      data,
      message: 'Velocity data retrieved successfully',
    };

    res.status(200).json(body);
  } catch (error) {
    next(error);
  }
};

export const getBreakdown = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { projectId } = req.params;
    const sprintId = firstQuery(req.query.sprintId);

    const data: IIssueBreakdown = await getIssueBreakdown(projectId, sprintId);

    const body: TApiResponse<IIssueBreakdown> = {
      success: true,
      data,
      message: 'Issue breakdown retrieved successfully',
    };

    res.status(200).json(body);
  } catch (error) {
    next(error);
  }
};

export const getSprintReportHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { projectId, sprintId } = req.params;
    const data: ISprintReport = await getSprintReport(sprintId, projectId);

    const body: TApiResponse<ISprintReport> = {
      success: true,
      data,
      message: 'Sprint report retrieved successfully',
    };

    res.status(200).json(body);
  } catch (error) {
    next(error);
  }
};
