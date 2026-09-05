import { Router } from 'express';
import { ComplaintController } from '../controllers/complaintController';
import { requireAdmin, requireHeadAdmin } from '../middleware/authMiddleware';

const router = Router();

// Public Anonymous Routes
router.get('/', ComplaintController.list);
// Head-Admin-exclusive immutable reveal audit ledger (must precede /:id).
router.get('/reveal-logs', requireHeadAdmin, ComplaintController.listRevealLogs);
router.get('/:id', ComplaintController.getById);
router.post('/', ComplaintController.create);
router.post('/:id/upvote', ComplaintController.upvote);
router.post('/reset', ComplaintController.reset);

// Protected Admin Routes (creates entry in statusUpdates)
router.patch('/:id/status', requireAdmin, ComplaintController.updateStatus);
// Admin may formally flag a complaint as suspected false/malicious (audited).
// NOTE: this flag is NOT a pre-condition for identity reveal anymore — the
// Head Admin reveal flow is ungated (see services/firestoreService.ts).
router.post('/:id/dispute', requireAdmin, ComplaintController.flagDisputed);

// Protected Head Admin Routes (creates entry in immutable revealLogs & allows deletion)
router.post('/:id/reveal', requireHeadAdmin, ComplaintController.revealIdentity);
router.delete('/:id', requireHeadAdmin, ComplaintController.delete);

export default router;
