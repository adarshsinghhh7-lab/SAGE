import { auth, db, isFirebaseLive } from '../config/firebaseAdmin.js';

// In-memory guard so bootstrap self-disables even without live Firestore
// (dev/sandbox mode). In production the durable `settings/adminBootstrap`
// Firestore document also gates it, so restarting the process cannot reset it.
let bootstrapLocked = false;

export class AuthController {
  /**
   * GET /api/auth/me
   * Get current user role and session state
   */
  static async getMe(req, res) {
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
  static async setRole(req, res) {
    try {
      const { targetUid, role } = req.body;

      if (!targetUid || !role) {
        res.status(400).json({
          success: false,
          error: 'Both targetUid and role are required.',
        });
        return;
      }

      const validRoles = ['student', 'admin', 'head_admin'];
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
    } catch (error) {
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
  static async switchRole(req, res) {
    const { role } = req.body;
    const validRoles = ['student', 'admin', 'head_admin'];

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

  /**
   * POST /api/auth/bootstrap-admin
   * One-time endpoint to bootstrap the first Head Admin.
   *
   * Works only when NO head_admin has been bootstrapped yet. After the first
   * call, the endpoint permanently refuses further bootstrapping — callers
   * must use the regular POST /api/auth/set-role (head_admin-only) instead.
   *
   * No role middleware is applied; the global `authenticate` middleware ensures
   * req.user exists. In dev mode the x-sage-role header is trusted; in
   * production the Firebase ID token is verified.
   */
  static async bootstrapAdmin(req, res) {
    try {
      // ── 1. Require an authenticated user (reject anonymous visitors) ──
      if (!req.user || req.user.uid === 'anonymous-visitor') {
        res.status(401).json({
          success: false,
          error: 'Authentication Required',
          message: 'You must be signed in to bootstrap the first Head Admin.',
        });
        return;
      }

      const BOOTSTRAP_DOC = 'adminBootstrap';   // document ID inside 'settings' collection
      const SETTINGS_COL = 'settings';

      // ── 2. Check if a head admin has already been bootstrapped ──
      // In-memory lock (works in all modes) + durable Firestore lock (production).
      if (bootstrapLocked) {
        res.status(403).json({
          success: false,
          error: 'Head admin already bootstrapped.',
          message: 'Use POST /api/auth/set-role (requires head_admin) to assign roles going forward.',
        });
        return;
      }
      if (isFirebaseLive && db) {
        const snap = await db.collection(SETTINGS_COL).doc(BOOTSTRAP_DOC).get();
        if (snap.exists && snap.data()?.bootstrapped === true) {
          bootstrapLocked = true;
          res.status(403).json({
            success: false,
            error: 'Head admin already bootstrapped.',
            message: 'Use POST /api/auth/set-role (requires head_admin) to assign roles going forward.',
          });
          return;
        }
      }

      // ── 3. Determine target UID (caller's own UID unless overridden) ──
      const targetUid = req.body?.uid || req.user.uid;

      // ── 4. Set Firebase custom claims (live) or confirm the dev role (sandbox) ──
      if (isFirebaseLive && auth) {
        await auth.setCustomUserClaims(targetUid, { role: 'head_admin' });
        console.log(`[Bootstrap] Custom claim set: user ${targetUid} is now 'head_admin' (first admin bootstrapped)`);
      }

      // ── 5. Persist bootstrap flag so this endpoint can never be used again ──
      bootstrapLocked = true;
      if (isFirebaseLive && db) {
        await db.collection(SETTINGS_COL).doc(BOOTSTRAP_DOC).set({
          bootstrapped: true,
          uid: targetUid,
          timestamp: new Date().toISOString(),
        });
      }

      res.status(200).json({
        success: true,
        message:
          `Head admin bootstrapped for UID '${targetUid}'. ` +
          'Please refresh your auth token (getIdToken(true)) so the backend sees the new role.',
        uid: targetUid,
        role: 'head_admin',
      });
    } catch (error) {
      console.error('[Bootstrap] Failed to bootstrap head admin:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to bootstrap head admin',
        details: error?.message,
      });
    }
  }
}
