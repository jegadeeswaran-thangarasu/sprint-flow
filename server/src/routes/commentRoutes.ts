import { Router, Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import authenticate from '../middleware/authenticate';
import { requireOrgRole } from '../middleware/orgPermission';
import { requireProjectAccess } from '../middleware/projectPermission';
import {
  createComment,
  getIssueComments,
  updateComment,
  deleteComment,
  addReaction,
} from '../controllers/commentController';

const router = Router({ mergeParams: true });

const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, data: errors.array(), message: 'Validation failed' });
    return;
  }
  next();
};

const commentAccess = [authenticate, requireOrgRole(['owner', 'admin', 'member']), requireProjectAccess];

const issueParams = [param('issueId').isMongoId(), param('projectId').isMongoId()];

router.post(
  '/',
  ...commentAccess,
  [
    ...issueParams,
    body('content').trim().isLength({ min: 1, max: 10000 }).withMessage('Content is required'),
    body('parentId').optional({ nullable: true }).isMongoId().withMessage('parentId must be a valid id'),
  ],
  validate,
  createComment
);

router.get('/', ...commentAccess, [...issueParams], validate, getIssueComments);

router.patch(
  '/:commentId',
  ...commentAccess,
  [
    ...issueParams,
    param('commentId').isMongoId(),
    body('content').trim().isLength({ min: 1, max: 10000 }).withMessage('Content is required'),
  ],
  validate,
  updateComment
);

router.delete(
  '/:commentId',
  ...commentAccess,
  [...issueParams, param('commentId').isMongoId()],
  validate,
  deleteComment
);

router.post(
  '/:commentId/reactions',
  ...commentAccess,
  [
    ...issueParams,
    param('commentId').isMongoId(),
    body('emoji').trim().notEmpty().withMessage('emoji is required'),
  ],
  validate,
  addReaction
);

export default router;
