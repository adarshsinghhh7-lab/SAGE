import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { requireHeadAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/me', AuthController.getMe);
router.post('/switch-role', AuthController.switchRole);
router.post('/set-role', requireHeadAdmin, AuthController.setRole);

export default router;
