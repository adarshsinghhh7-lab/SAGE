import { Router } from 'express';
import { EscalationSettingsController } from '../controllers/escalationSettingsController';
import { requireAdmin } from '../middleware/authMiddleware';

const router = Router();

// Admin-only escalation settings
router.get('/escalation', requireAdmin, EscalationSettingsController.getSettings);
router.put('/escalation/threshold', requireAdmin, EscalationSettingsController.updateThreshold);
router.post('/escalation/run', requireAdmin, EscalationSettingsController.runSweepNow);

export default router;