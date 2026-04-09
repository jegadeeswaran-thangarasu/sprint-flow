import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import authenticate from '../middleware/authenticate';
import { requireOrgRole } from '../middleware/orgPermission';
import {
  createProject,
  getOrgProjects,
  getProjectById,
  updateProject,
  archiveProject,
  addProjectMember,
  removeProjectMember,
} from '../controllers/projectController';

// mergeParams allows access to :orgSlug from the parent router
const router = Router({ mergeParams: true });

const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, data: errors.array(), message: 'Validation failed' });
    return;
  }
  next();
};

const orgAccess = [authenticate, requireOrgRole(['owner', 'admin', 'member'])];

// POST /api/v1/organisations/:orgSlug/projects
router.post(
  '/',
  ...orgAccess,
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('key')
      .optional()
      .trim()
      .toUpperCase()
      .matches(/^[A-Z]+$/)
      .withMessage('Key must contain uppercase letters only')
      .isLength({ min: 2, max: 6 })
      .withMessage('Key must be between 2 and 6 characters'),
  ],
  validate,
  createProject
);

// GET /api/v1/organisations/:orgSlug/projects
router.get('/', ...orgAccess, getOrgProjects);

// GET /api/v1/organisations/:orgSlug/projects/:projectId
router.get('/:projectId', ...orgAccess, getProjectById);

// PATCH /api/v1/organisations/:orgSlug/projects/:projectId
router.patch('/:projectId', ...orgAccess, updateProject);

// PATCH /api/v1/organisations/:orgSlug/projects/:projectId/archive
router.patch('/:projectId/archive', ...orgAccess, archiveProject);

// POST /api/v1/organisations/:orgSlug/projects/:projectId/members
router.post(
  '/:projectId/members',
  ...orgAccess,
  [
    body('userId').notEmpty().withMessage('userId is required'),
    body('role')
      .optional()
      .isIn(['lead', 'member'])
      .withMessage('Role must be lead or member'),
  ],
  validate,
  addProjectMember
);

// DELETE /api/v1/organisations/:orgSlug/projects/:projectId/members/:userId
router.delete('/:projectId/members/:userId', ...orgAccess, removeProjectMember);

export default router;
