import { Request, Response, NextFunction } from 'express';
import { getUserDashboard, globalSearch } from '../services/dashboardService';
import { TApiResponse, TJwtPayload, IDashboardData, ISearchResults } from '../types';
import { IOrgMemberDocument } from '../models/OrgMember';
import ApiError from '../utils/ApiError';

const firstQuery = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
};

export const getDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const orgMember = req.orgMember as IOrgMemberDocument;
    const orgId = orgMember.organisation.toString();

    const data: IDashboardData = await getUserDashboard(userId, orgId);

    const body: TApiResponse<IDashboardData> = {
      success: true,
      data,
      message: 'Dashboard data retrieved successfully',
    };

    res.status(200).json(body);
  } catch (error) {
    next(error);
  }
};

export const search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const q = firstQuery(req.query.q);
    if (!q || q.trim().length < 2) {
      next(new ApiError(400, 'Search query must be at least 2 characters'));
      return;
    }

    const { userId } = req.user as TJwtPayload;
    const orgMember = req.orgMember as IOrgMemberDocument;
    const orgId = orgMember.organisation.toString();

    const data: ISearchResults = await globalSearch(q.trim(), orgId, userId);

    const body: TApiResponse<ISearchResults> = {
      success: true,
      data,
      message: 'Search completed successfully',
    };

    res.status(200).json(body);
  } catch (error) {
    next(error);
  }
};
