import { Router } from 'express';
import { getDashboardStatsHandler } from './dashboard.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/stats', getDashboardStatsHandler);

export default router;
