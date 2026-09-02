import { Router } from 'express';
import { ComplaintController } from '../controllers/complaintController';
import { requireAdmin, requireHeadAdmin } from '../middleware/authMiddleware';

const router = Router();

// Public Anonymous Routes
router.get('/', ComplaintController.list);
router.get('/:id', ComplaintController.getById);
router.post('/', ComplaintController.create);
router.post('/:id/upvote', ComplaintController.upvote);
router.post('/reset', ComplaintController.reset);

// Protected Admin Routes (creates entry in statusUpdates)
router.patch('/:id/status', requireAdmin, ComplaintController.updateStatus);

// Protected Head Admin Routes (creates entry in immutable revealLogs & allows deletion)
router.post('/:id/reveal', requireHeadAdmin, ComplaintController.revealIdentity);
router.delete('/:id', requireHeadAdmin, ComplaintController.delete);

export default router;
