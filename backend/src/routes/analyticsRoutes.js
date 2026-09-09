import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController.js';

const router = Router();

router.get('/', AnalyticsController.getAnalytics);

export default router;
