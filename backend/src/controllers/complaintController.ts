import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { FirestoreService } from '../services/firestoreService';
import { MLService } from '../services/mlService';
import { ComplaintCategory, ComplaintStatus } from '../types';
import { encryptAES } from '../utils/crypto';

export class ComplaintController {
  /**
   * GET /api/complaints
   * List all complaints with filters, search, and sorting
   */
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { category, status, location, search, sortBy } = req.query;

      const complaints = await FirestoreService.getComplaints({
        category: category as string,
        status: status as string,
        location: location as string,
        search: search as string,
        sortBy: sortBy as any,
      });

      res.status(200).json({
        success: true,
        count: complaints.length,
        data: complaints.map((c) => ComplaintController.sanitizeComplaint(c)),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch complaints from ledger',
        details: error?.message,
      });
    }
  }

  /**
   * GET /api/complaints/:id
   * Fetch single complaint by ID
   */
  static async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const complaint = await FirestoreService.getComplaintById(id);

      if (!complaint) {
        res.status(404).json({
          success: false,
          error: `Complaint '${id}' not found in ledger.`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: ComplaintController.sanitizeComplaint(complaint),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve complaint',
        details: error?.message,
      });
    }
  }

  /**
   * POST /api/complaints
   * Create an anonymous complaint adhering to the exact 5-collections schema
   */
  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { 
        category, 
        location, 
        hostelOrLocation, 
        description, 
        photoUrl, 
        complaintId,
        id
        // NOTE: `encryptedUserRef` is deliberately NOT accepted from the body.
        // Identity sealing is a server-only responsibility (SAGE_MASTER_KEY).
      } = req.body;

      const effectiveLoc = hostelOrLocation || location;

      // Validation
      if (!category || !effectiveLoc || !description) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: category, hostelOrLocation, and description are required.',
        });
        return;
      }

      const validCategories: ComplaintCategory[] = [
        'infrastructure',
        'mess',
        'harassment',
        'wifi',
        'hygiene',
        'other',
      ];

      const normCategory = String(category).toLowerCase().replace('/', '_') as ComplaintCategory;

      const descTrimmed = String(description).trim();
      if (descTrimmed.length < 20) {
        res.status(400).json({
          success: false,
          error: `Description must contain at least 20 characters (currently ${descTrimmed.length}).`,
        });
        return;
      }

      if (descTrimmed.length > 1000) {
        res.status(400).json({
          success: false,
          error: `Description cannot exceed 1000 characters (currently ${descTrimmed.length}).`,
        });
        return;
      }

      // Strict Anonymity: Reject plain student identity fields
      const forbiddenFields = ['studentName', 'studentEmail', 'studentId', 'rollNumber', 'userId', 'plainIdentity', 'encryptedUserRef'];
      for (const field of forbiddenFields) {
        if (req.body[field]) {
          res.status(400).json({
            success: false,
            error: `Identity field '${field}' is strictly forbidden by the S.A.G.E. Anonymity Protocol.`,
          });
          return;
        }
      }

      // REQUIRED: a verified signed-in account. Filing a complaint is not
      // anonymous-by-default — the backend seals the verified Firebase uid so
      // an accountability path exists for fake/malicious complaints. Firebase
      // anonymous sign-in is therefore rejected.
      if (!req.user?.uid) {
        res.status(401).json({
          success: false,
          error: 'Authentication Required',
          message: 'Filing a complaint requires a verified college account.',
        });
        return;
      }
      if (req.user.isAnonymous === true) {
        res.status(401).json({
          success: false,
          error: 'Verified Account Required',
          message: 'Anonymous sign-in cannot deposit complaints. Sign in with your verified college account so the system can protect you and hold deliberately false complaints accountable.',
        });
        return;
      }

      // 1. Run ML Urgency Classification
      const mlPrediction = await MLService.predictUrgency(descTrimmed);

      // 2. SEAL AT SUBMISSION (server-only): AES-encrypt the verified Firebase
      //    uid with SAGE_MASTER_KEY. This ciphertext is the only identity the
      //    ledger ever stores. It never exists in the browser, is never
      //    generated client-side, and cannot be decrypted by any client code.
      let sealedUserRef = '';
      try {
        sealedUserRef = encryptAES(req.user.uid);
      } catch (sealErr: any) {
        res.status(503).json({
          success: false,
          error: 'Sealing server unavailable — please retry.',
          details: sealErr?.message,
        });
        return;
      }

      // 3. Save to complaints collection
      const newComplaint = await FirestoreService.createComplaint({
        complaintId: complaintId || id,
        category: normCategory,
        hostelOrLocation: String(effectiveLoc).trim(),
        description: descTrimmed,
        photoUrl: photoUrl ? String(photoUrl) : undefined,
        urgencyScore: mlPrediction.urgency_score,
        encryptedUserRef: sealedUserRef,
      });

      res.status(201).json({
        success: true,
        message: 'Grievance successfully deposited. Your identity is sealed server-side and remains invisible to everyone unless a suspicion-of-fraud review is formally opened.',
        mlPrediction,
        data: ComplaintController.sanitizeComplaint(newComplaint),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to create complaint',
        details: error?.message,
      });
    }
  }

  /**
   * POST /api/complaints/:id/upvote
   * Atomic community upvote with SHA-256 voter tracking
   */
  static async upvote(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const voterIdentifier = req.headers['x-sage-voter-id'] as string || req.user?.uid || req.ip;

      const result = await FirestoreService.upvoteComplaint(id, voterIdentifier);

      if (!result) {
        res.status(404).json({
          success: false,
          error: `Complaint '${id}' not found.`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: result.alreadyUpvoted 
          ? 'You have already endorsed this complaint.' 
          : 'Complaint successfully endorsed in upvotes ledger.',
        data: ComplaintController.sanitizeComplaint(result.complaint),
        alreadyUpvoted: result.alreadyUpvoted,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to record endorsement',
        details: error?.message,
      });
    }
  }

  /**
   * PATCH /api/complaints/:id/status
   * Admin status update with automatic entry to statusUpdates collection
   */
  static async updateStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, resolutionNotes } = req.body;

      if (!status) {
        res.status(400).json({
          success: false,
          error: 'Status is required.',
        });
        return;
      }

      const validStatuses: ComplaintStatus[] = ['submitted', 'under_review', 'resolved'];
      const normStatus = String(status).toLowerCase().replace(' ', '_') as ComplaintStatus;

      if (!validStatuses.includes(normStatus)) {
        res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        });
        return;
      }

      const adminId = req.user?.uid || 'admin-officer';

      const updated = await FirestoreService.updateStatus(
        id,
        normStatus,
        resolutionNotes,
        adminId
      );

      if (!updated) {
        res.status(404).json({
          success: false,
          error: `Complaint '${id}' not found.`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: `Ledger record '${id}' updated to status '${normStatus}'.`,
        data: ComplaintController.sanitizeComplaint(updated),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to update complaint status',
        details: error?.message,
      });
    }
  }

  /**
   * POST /api/complaints/:id/dispute
   * An admin formally flags a complaint as "disputed — suspected
   * false/malicious". This writes the `disputed` flag plus an auditable
   * statusUpdates entry with updatedBy. NOTE: this flag is NOT a pre-condition
   * for identity reveal anymore — the Head Admin reveal flow is ungated.
   */
  static async flagDisputed(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason || String(reason).trim().length < 10) {
        res.status(400).json({
          success: false,
          error: 'A written suspicion justification (minimum 10 characters) is required to flag a complaint as disputed.',
        });
        return;
      }

      const adminId = req.user?.uid || 'admin-officer';

      const updated = await FirestoreService.flagComplaintAsDisputed(id, adminId, String(reason).trim());

      if (!updated) {
        res.status(404).json({
          success: false,
          error: `Complaint '${id}' not found.`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: `Complaint '${id}' formally flagged as disputed (suspected false/malicious). This audit flag is reported on the complaint; identity reveal itself is a separate, ungated Head Admin action.`,
        data: ComplaintController.sanitizeComplaint(updated),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to flag complaint as disputed',
        details: error?.message,
      });
    }
  }

  /**
   * POST /api/complaints/:id/reveal
   * Head Admin exclusive identity decryption trigger with immutable revealLogs write.
   *
   * Head Admin may reveal any complaint's identity at any time — there is no
   * "must be disputed first" pre-condition. Non-head_admin roles are still
   * rejected by the `requireHeadAdmin` middleware with HTTP 403.
   */
  static async revealIdentity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason || String(reason).trim().length < 10) {
        res.status(400).json({
          success: false,
          error: 'A detailed legal justification reason (minimum 10 characters) is required for identity reveal.',
        });
        return;
      }

      const headAdminId = req.user?.uid || 'head_admin_superuser';

      const result = await FirestoreService.triggerIdentityReveal(id, headAdminId, String(reason).trim());

      if (!result) {
        res.status(404).json({
          success: false,
          error: `Complaint '${id}' not found.`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Identity reference decrypted and committed to immutable revealLogs audit ledger.',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to execute reveal protocol',
        details: error?.message,
      });
    }
  }

  /**
   * GET /api/complaints/reveal-logs
   * Head Admin exclusive read of the immutable reveal audit ledger.
   */
  static async listRevealLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const logs = await FirestoreService.getRevealLogs();
      res.status(200).json({
        success: true,
        data: logs,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve reveal audit log',
        details: error?.message,
      });
    }
  }

  /**
   * DELETE /api/complaints/:id
   * Head Admin deletion
   */
  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await FirestoreService.deleteComplaint(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: `Complaint '${id}' not found.`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: `Complaint '${id}' permanently expunged by Head Admin.`,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete complaint',
        details: error?.message,
      });
    }
  }

  /**
   * POST /api/complaints/reset
   * Reset to seeded dataset for testing
   */
  static async reset(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await FirestoreService.resetToDefaultSeed();
      res.status(200).json({
        success: true,
        message: 'Demo dataset reset to initial state across all collections.',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to reset dataset',
        details: error?.message,
      });
    }
  }

  /**
   * Sanitize a complaint before it leaves the API.
   *
   * The AES ciphertext of the submitter's identity (`encryptedUserRef`) is
   * STRICTLY server-only — it must never reach the browser. The reveal
   * endpoint is the ONLY route that intentionally returns the decrypted
   * reference, and it does so through its own dedicated response shape, not
   * through this sanitizer. Everything else that serializes a complaint
   * strips the seal so no client code can ever resolve or decrypt it.
   */
  private static sanitizeComplaint<T extends Record<string, any>>(complaint: T): Omit<T, 'encryptedUserRef'> {
    const { encryptedUserRef: _omitted, ...safe } = complaint as T;
    return safe;
  }
}
