import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import authenticate from '../middleware/authenticate';
import { requireOrgRole } from '../middleware/orgPermission';
import {
  createOrganisation,
  getUserOrganisations,
  getOrganisationBySlug,
  updateOrganisation,
  deleteOrganisation,
  inviteMember,
  acceptInvite,
  getOrgMembers,
  updateMemberRole,
  removeMember,
  transferOwnership,
} from '../controllers/organisationController';

const router = Router();

const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, data: errors.array(), message: 'Validation failed' });
    return;
  }
  next();
};

const VALID_INVITE_ROLES = ['admin', 'member'];

// POST /api/v1/organisations
router.post(
  '/',
  authenticate,
  [body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')],
  validate,
  createOrganisation
);

// GET /api/v1/organisations/mine
router.get('/mine', authenticate, getUserOrganisations);

// POST /api/v1/organisations/invite/accept
router.post(
  '/invite/accept',
  authenticate,
  [body('token').notEmpty().withMessage('Invite token is required')],
  validate,
  acceptInvite
);

// GET /api/v1/organisations/:orgSlug
router.get('/:orgSlug', authenticate, getOrganisationBySlug);

// PATCH /api/v1/organisations/:orgSlug
router.patch(
  '/:orgSlug',
  authenticate,
  requireOrgRole(['owner', 'admin']),
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
  ],
  validate,
  updateOrganisation
);

// DELETE /api/v1/organisations/:orgSlug
router.delete('/:orgSlug', authenticate, requireOrgRole(['owner']), deleteOrganisation);

// GET /api/v1/organisations/:orgSlug/members
router.get('/:orgSlug/members', authenticate, getOrgMembers);

// POST /api/v1/organisations/:orgSlug/members/invite
router.post(
  '/:orgSlug/members/invite',
  authenticate,
  requireOrgRole(['owner', 'admin']),
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('role')
      .isIn(VALID_INVITE_ROLES)
      .withMessage(`Role must be one of: ${VALID_INVITE_ROLES.join(', ')}`),
  ],
  validate,
  inviteMember
);

// POST /api/v1/organisations/:orgSlug/members/transfer-ownership
router.post(
  '/:orgSlug/members/transfer-ownership',
  authenticate,
  requireOrgRole(['owner']),
  [body('newOwnerId').notEmpty().withMessage('newOwnerId is required')],
  validate,
  transferOwnership
);

// PATCH /api/v1/organisations/:orgSlug/members/:userId/role
router.patch(
  '/:orgSlug/members/:userId/role',
  authenticate,
  requireOrgRole(['owner', 'admin']),
  [
    body('role')
      .isIn(VALID_INVITE_ROLES)
      .withMessage(`Role must be one of: ${VALID_INVITE_ROLES.join(', ')}`),
  ],
  validate,
  updateMemberRole
);

// DELETE /api/v1/organisations/:orgSlug/members/:userId
router.delete(
  '/:orgSlug/members/:userId',
  authenticate,
  requireOrgRole(['owner', 'admin']),
  removeMember
);

export default router;
