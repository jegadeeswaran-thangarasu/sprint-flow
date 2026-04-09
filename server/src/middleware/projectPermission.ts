import { RequestHandler } from 'express';
import Project from '../models/Project';
import ApiError from '../utils/ApiError';
import { IOrgMemberDocument } from '../models/OrgMember';

export const requireProjectAccess: RequestHandler = async (req, _res, next): Promise<void> => {
  try {
    const { projectId } = req.params;
    const orgMember = req.orgMember as IOrgMemberDocument;

    const project = await Project.findById(projectId);

    if (!project) {
      next(new ApiError(404, 'Project not found'));
      return;
    }

    if (!project.organisation.equals(orgMember.organisation)) {
      next(new ApiError(403, 'You do not have access to this project'));
      return;
    }

    req.project = project;
    next();
  } catch (error) {
    next(error);
  }
};
