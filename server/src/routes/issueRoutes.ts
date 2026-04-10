import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import authenticate from '../middleware/authenticate';
import { requireOrgRole } from '../middleware/orgPermission';
import { requireProjectAccess } from '../middleware/projectPermission';
import {
  createIssue,
  getProjectIssues,
  getIssueById,
  getFullIssueDetail,
  getIssueActivity,
  updateIssue,
  updateIssueStatus,
  deleteIssue,
  addWatcher,
  removeWatcher,
  getBacklogIssues,
  getBoardIssues,
  bulkUpdateIssueOrder,
} from '../controllers/issueController';

const router = Router({ mergeParams: true });

const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, data: errors.array(), message: 'Validation failed' });
    return;
  }
  next();
};

const STATUS_VALUES = ['backlog', 'todo', 'inprogress', 'review', 'done'] as const;
const PRIORITY_VALUES = ['urgent', 'high', 'medium', 'low'] as const;
const TYPE_VALUES = ['story', 'task', 'bug', 'epic', 'subtask'] as const;

const issueAccess = [authenticate, requireOrgRole(['owner', 'admin', 'member']), requireProjectAccess];

router.get('/backlog', ...issueAccess, getBacklogIssues);

router.get(
  '/board/:sprintId',
  ...issueAccess,
  [param('sprintId').isMongoId()],
  validate,
  getBoardIssues
);

router.post(
  '/board/reorder',
  ...issueAccess,
  [
    body('updates').isArray({ min: 1 }).withMessage('updates must be a non-empty array'),
    body('updates.*.issueId').isMongoId(),
    body('updates.*.status').isIn(STATUS_VALUES),
    body('updates.*.order').isInt({ min: 0 }),
  ],
  validate,
  bulkUpdateIssueOrder
);

router.post(
  '/',
  ...issueAccess,
  [
    body('title')
      .trim()
      .isLength({ min: 2, max: 500 })
      .withMessage('Title must be between 2 and 500 characters'),
    body('type').optional().isIn(TYPE_VALUES),
    body('priority').optional().isIn(PRIORITY_VALUES),
    body('storyPoints').optional().isFloat({ min: 0, max: 100 }),
  ],
  validate,
  createIssue
);

router.get(
  '/',
  ...issueAccess,
  [
    query('status').optional().isIn(STATUS_VALUES),
    query('priority').optional().isIn(PRIORITY_VALUES),
    query('type').optional().isIn(TYPE_VALUES),
  ],
  validate,
  getProjectIssues
);

router.get(
  '/:issueId/full',
  ...issueAccess,
  [param('issueId').isMongoId()],
  validate,
  getFullIssueDetail
);

router.get(
  '/:issueId/activity',
  ...issueAccess,
  [param('issueId').isMongoId()],
  validate,
  getIssueActivity
);

router.get('/:issueId', ...issueAccess, [param('issueId').isMongoId()], validate, getIssueById);

router.patch(
  '/:issueId/status',
  ...issueAccess,
  [
    param('issueId').isMongoId(),
    body('status').isIn(STATUS_VALUES),
    body('order').isInt({ min: 0 }),
  ],
  validate,
  updateIssueStatus
);

router.patch(
  '/:issueId',
  ...issueAccess,
  [
    param('issueId').isMongoId(),
    body('title').optional().trim().isLength({ min: 2, max: 500 }),
    body('type').optional().isIn(TYPE_VALUES),
    body('status').optional().isIn(STATUS_VALUES),
    body('priority').optional().isIn(PRIORITY_VALUES),
    body('storyPoints')
      .optional({ nullable: true })
      .custom((value) => {
        if (value === null || value === undefined) return true;
        const n = Number(value);
        return Number.isFinite(n) && n >= 0 && n <= 100;
      }),
  ],
  validate,
  updateIssue
);

router.delete('/:issueId', ...issueAccess, [param('issueId').isMongoId()], validate, deleteIssue);

router.post('/:issueId/watch', ...issueAccess, [param('issueId').isMongoId()], validate, addWatcher);

router.delete('/:issueId/watch', ...issueAccess, [param('issueId').isMongoId()], validate, removeWatcher);

export default router;
