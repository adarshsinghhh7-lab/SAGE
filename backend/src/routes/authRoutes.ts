import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { requireHeadAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/me', AuthController.getMe);
router.post('/switch-role', AuthController.switchRole);
router.post('/set-role', requireHeadAdmin, AuthController.setRole);
// One-time Head Admin bootstrap — intentionally NO role guard, protected by
// the global `authenticate` middleware and self-disabling after first use.
router.post('/bootstrap-admin', AuthController.bootstrapAdmin);

export default router;
