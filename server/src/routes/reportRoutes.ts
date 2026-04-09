import { Router } from 'express';
import authenticate from '../middleware/authenticate';
import { requireOrgRole } from '../middleware/orgPermission';
import { requireProjectAccess } from '../middleware/projectPermission';
import {
  getBurndown,
  getBreakdown,
  getSprintReportHandler,
  getVelocity,
} from '../controllers/reportController';

const router = Router({ mergeParams: true });

const reportAccess = [authenticate, requireOrgRole(['owner', 'admin', 'member']), requireProjectAccess];

router.get('/burndown/:sprintId', ...reportAccess, getBurndown);
router.get('/velocity', ...reportAccess, getVelocity);
router.get('/breakdown', ...reportAccess, getBreakdown);
router.get('/sprint/:sprintId', ...reportAccess, getSprintReportHandler);

export default router;
