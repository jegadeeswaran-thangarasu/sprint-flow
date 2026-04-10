import { Router, Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import authenticate from '../middleware/authenticate';
import { requireOrgRole } from '../middleware/orgPermission';
import { requireProjectAccess } from '../middleware/projectPermission';
import {
  createSprint,
  getProjectSprints,
  getSprintById,
  updateSprint,
  startSprint,
  completeSprint,
  deleteSprint,
  moveIssuesToSprint,
  removeIssuesFromSprint,
  getSprintIssues,
} from '../controllers/sprintController';

const router = Router({ mergeParams: true });

const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, data: errors.array(), message: 'Validation failed' });
    return;
  }
  next();
};

const sprintAccess = [authenticate, requireOrgRole(['owner', 'admin', 'member']), requireProjectAccess];

router.post(
  '/',
  ...sprintAccess,
  [
    body('name').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Name must be between 1 and 200 characters'),
    body('goal').optional().isString(),
    body('startDate').optional().isISO8601().withMessage('startDate must be a valid ISO 8601 date'),
    body('endDate').optional().isISO8601().withMessage('endDate must be a valid ISO 8601 date'),
  ],
  validate,
  createSprint
);

router.get('/', ...sprintAccess, getProjectSprints);

router.get(
  '/:sprintId',
  ...sprintAccess,
  [param('sprintId').isMongoId()],
  validate,
  getSprintById
);

router.patch(
  '/:sprintId',
  ...sprintAccess,
  [
    param('sprintId').isMongoId(),
    body('name').optional().trim().isLength({ min: 1, max: 200 }),
    body('goal').optional().isString(),
    body('startDate').optional({ nullable: true }).isISO8601(),
    body('endDate').optional({ nullable: true }).isISO8601(),
  ],
  validate,
  updateSprint
);

router.post(
  '/:sprintId/start',
  ...sprintAccess,
  [param('sprintId').isMongoId()],
  validate,
  startSprint
);

router.post(
  '/:sprintId/complete',
  ...sprintAccess,
  [
    param('sprintId').isMongoId(),
    body('moveToSprintId').optional().isMongoId().withMessage('moveToSprintId must be a valid MongoDB ObjectId'),
  ],
  validate,
  completeSprint
);

router.delete(
  '/:sprintId',
  ...sprintAccess,
  [param('sprintId').isMongoId()],
  validate,
  deleteSprint
);

router.post(
  '/:sprintId/issues',
  ...sprintAccess,
  [
    param('sprintId').isMongoId(),
    body('issueIds').isArray({ min: 1 }).withMessage('issueIds must be a non-empty array'),
    body('issueIds.*').isMongoId().withMessage('Each issueId must be a valid MongoDB ObjectId'),
  ],
  validate,
  moveIssuesToSprint
);

router.delete(
  '/:sprintId/issues',
  ...sprintAccess,
  [
    param('sprintId').isMongoId(),
    body('issueIds').isArray({ min: 1 }).withMessage('issueIds must be a non-empty array'),
    body('issueIds.*').isMongoId().withMessage('Each issueId must be a valid MongoDB ObjectId'),
  ],
  validate,
  removeIssuesFromSprint
);

router.get(
  '/:sprintId/issues',
  ...sprintAccess,
  [param('sprintId').isMongoId()],
  validate,
  getSprintIssues
);

export default router;
