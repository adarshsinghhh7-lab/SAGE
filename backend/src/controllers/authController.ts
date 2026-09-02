import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { auth, isFirebaseLive } from '../config/firebaseAdmin';
import { UserRole } from '../types';

export class AuthController {
  /**
   * GET /api/auth/me
   * Get current user role and session state
   */
  static async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      user: req.user,
      isFirebaseLive,
    });
  }

  /**
   * POST /api/auth/set-role
   * Head Admin assigns role to a user UID (using Firebase Admin custom claims)
   */
  static async setRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { targetUid, role } = req.body;

      if (!targetUid || !role) {
        res.status(400).json({
          success: false,
          error: 'Both targetUid and role are required.',
        });
        return;
      }

      const validRoles: UserRole[] = ['student', 'admin', 'head_admin'];
      if (!validRoles.includes(role)) {
        res.status(400).json({
          success: false,
          error: `Invalid role '${role}'. Valid roles: ${validRoles.join(', ')}`,
        });
        return;
      }

      if (isFirebaseLive && auth) {
        // Set custom user claims in Firebase Auth
        await auth.setCustomUserClaims(targetUid, { role });
        console.log(`[Firebase Auth] Custom claim set: user ${targetUid} is now '${role}'`);
      }

      res.status(200).json({
        success: true,
        message: `Role for user '${targetUid}' successfully updated to '${role}'.`,
        targetUid,
        role,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to set custom role claim',
        details: error?.message,
      });
    }
  }

  /**
   * POST /api/auth/switch-role
   * Dev helper to switch current session role for testing UI features
   */
  static async switchRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { role } = req.body;
    const validRoles: UserRole[] = ['student', 'admin', 'head_admin'];

    if (!validRoles.includes(role)) {
      res.status(400).json({
        success: false,
        error: `Invalid role '${role}'. Valid roles: ${validRoles.join(', ')}`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Active session switched to '${role}'.`,
      role,
    });
  }
}
