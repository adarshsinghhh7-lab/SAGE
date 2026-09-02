import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { requireHeadAdmin } from '../middleware/authMiddleware';

const router = Router();

router.get('/me', AuthController.getMe);
router.post('/switch-role', AuthController.switchRole);
router.post('/set-role', requireHeadAdmin, AuthController.setRole);

export default router;
