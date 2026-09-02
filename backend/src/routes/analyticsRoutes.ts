import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController';

const router = Router();

router.get('/', AnalyticsController.getAnalytics);

export default router;
