import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { FirestoreService } from '../services/firestoreService';
import { runAutoEscalation } from '../services/escalationService';
import { DEFAULT_ESCALATION_THRESHOLD } from '../config/escalationConfig';
import { EscalationRunReport } from '../types';

export class EscalationSettingsController {
  /**
   * GET /api/settings/escalation
   * Read the live escalation threshold + most recent sweep report.
   */
  static async getSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const settings = await FirestoreService.getEscalationSettings();
      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch escalation settings',
        details: error?.message,
      });
    }
  }

  /**
   * PUT /api/settings/escalation/threshold
   * Update the automatic-escalation threshold. Admin-only.
   */
  static async updateThreshold(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const rawThreshold = req.body?.threshold;
      const parsed = Number(rawThreshold);

      if (rawThreshold === undefined || rawThreshold === null || rawThreshold === '') {
        res.status(400).json({
          success: false,
          error: 'A numeric "threshold" is required.',
        });
        return;
      }

      if (!Number.isFinite(parsed) || parsed < 1) {
        res.status(400).json({
          success: false,
          error: `Invalid threshold. Expected a number >= 1 (got ${JSON.stringify(rawThreshold)}).`,
        });
        return;
      }

      const updatedBy = req.user?.uid || req.user?.email || 'system';
      const settings = await FirestoreService.setEscalationThreshold(parsed, updatedBy);

      res.status(200).json({
        success: true,
        message: `Escalation threshold updated to ${settings.threshold} upvotes.`,
        data: settings,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to update escalation threshold',
        details: error?.message,
      });
    }
  }

  /**
   * POST /api/settings/escalation/run
   * Manually trigger an auto-escalation sweep (admin-only) — handy for demos
   * and verifying the hourly job without waiting for the scheduler.
   */
  static async runSweepNow(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const parsedThreshold =
        req.body?.threshold !== undefined && req.body?.threshold !== null && req.body?.threshold !== ''
          ? Number(req.body.threshold)
          : null;

      const report: EscalationRunReport = await runAutoEscalation({
        trigger: 'manual',
        threshold: Number.isFinite(parsedThreshold) ? parsedThreshold : null,
      });

      res.status(200).json({
        success: true,
        message: `Manual escalation sweep complete: ${report.escalated.length} complaint(s) escalated, ${report.emailsSent} email(s) sent.`,
        data: report,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Manual escalation sweep failed',
        details: error?.message,
      });
    }
  }

  /** Export the default so the frontend can display a "reset to default" affordance. */
  static get defaultThreshold(): number {
    return DEFAULT_ESCALATION_THRESHOLD;
  }
}