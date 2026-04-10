import { Router } from 'express';
import authenticate from '../middleware/authenticate';
import { requireOrgRole } from '../middleware/orgPermission';
import { getDashboard, search } from '../controllers/dashboardController';

const router = Router({ mergeParams: true });

const orgAccess = [authenticate, requireOrgRole(['owner', 'admin', 'member'])];

router.get('/search', ...orgAccess, search);
router.get('/', ...orgAccess, getDashboard);

export default router;
