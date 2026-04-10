import { Request, Response, NextFunction } from 'express';
import {
  createProject as createProjectService,
  getOrgProjects as getOrgProjectsService,
  getProjectById as getProjectByIdService,
  updateProject as updateProjectService,
  archiveProject as archiveProjectService,
  addProjectMember as addProjectMemberService,
  removeProjectMember as removeProjectMemberService,
} from '../services/projectService';
import { TApiResponse, TJwtPayload } from '../types';
import { IProjectDocument, ProjectRole } from '../models/Project';
import { IOrgMemberDocument } from '../models/OrgMember';

// ─── Controllers ─────────────────────────────────────────────────────────────

export const createProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const orgMember = req.orgMember as IOrgMemberDocument;
    const orgId = orgMember.organisation.toString();

    const { name, key, description, icon, color } = req.body as {
      name: string;
      key?: string;
      description?: string;
      icon?: string;
      color?: string;
    };

    const project = await createProjectService(orgId, userId, {
      name,
      key,
      description,
      icon,
      color,
    });

    const body: TApiResponse<IProjectDocument> = {
      success: true,
      data: project,
      message: 'Project created successfully',
    };

    res.status(201).json(body);
  } catch (error) {
    next(error);
  }
};

export const getOrgProjects = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const orgMember = req.orgMember as IOrgMemberDocument;
    const orgId = orgMember.organisation.toString();

    const projects = await getOrgProjectsService(orgId, userId);

    const body: TApiResponse<IProjectDocument[]> = {
      success: true,
      data: projects,
      message: 'Projects retrieved successfully',
    };

    res.status(200).json(body);
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const { projectId } = req.params;

    const project = await getProjectByIdService(projectId, userId);

    const body: TApiResponse<IProjectDocument> = {
      success: true,
      data: project,
      message: 'Project retrieved successfully',
    };

    res.status(200).json(body);
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const { projectId } = req.params;
    const updates = req.body as {
      name?: string;
      description?: string;
      icon?: string;
      color?: string;
      lead?: string;
    };

    const project = await updateProjectService(projectId, userId, updates);

    const body: TApiResponse<IProjectDocument> = {
      success: true,
      data: project,
      message: 'Project updated successfully',
    };

    res.status(200).json(body);
  } catch (error) {
    next(error);
  }
};

export const archiveProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const { projectId } = req.params;

    await archiveProjectService(projectId, userId);

    const body: TApiResponse<null> = {
      success: true,
      data: null,
      message: 'Project archived successfully',
    };

    res.status(200).json(body);
  } catch (error) {
    next(error);
  }
};

export const addProjectMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const { projectId } = req.params;
    const { userId: targetUserId, role } = req.body as {
      userId: string;
      role: ProjectRole;
    };

    const project = await addProjectMemberService(projectId, userId, targetUserId, role ?? 'member');

    const body: TApiResponse<IProjectDocument> = {
      success: true,
      data: project,
      message: 'Member added to project successfully',
    };

    res.status(200).json(body);
  } catch (error) {
    next(error);
  }
};

export const removeProjectMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    const { projectId, userId: targetUserId } = req.params;

    await removeProjectMemberService(projectId, userId, targetUserId);

    const body: TApiResponse<null> = {
      success: true,
      data: null,
      message: 'Member removed from project successfully',
    };

    res.status(200).json(body);
  } catch (error) {
    next(error);
  }
};
