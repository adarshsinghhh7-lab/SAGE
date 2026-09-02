import { Request, Response, NextFunction } from 'express';
import { auth, isFirebaseLive } from '../config/firebaseAdmin';
import { UserRole, AuthUser } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

/**
 * Middleware to authenticate requests using Firebase ID Tokens or Dev Headers
 */
export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const devRoleHeader = req.headers['x-sage-role'] as string | undefined;
  const devUidHeader = req.headers['x-sage-uid'] as string | undefined;

  // 1. Check for Firebase Bearer Token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];

    if (isFirebaseLive && auth) {
      try {
        const decodedToken = await auth.verifyIdToken(token);
        const role = (decodedToken.role as UserRole) || (decodedToken.admin ? 'admin' : 'student');

        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          role: role,
          isAnonymous: decodedToken.firebase?.sign_in_provider === 'anonymous',
        };
        return next();
      } catch (err: any) {
        console.warn(`[Auth Middleware] Invalid Firebase token: ${err.message}`);
      }
    } else {
      // In dev mode with mock tokens
      const role: UserRole = devRoleHeader === 'admin' || devRoleHeader === 'head_admin' ? devRoleHeader : 'student';
      req.user = {
        uid: devUidHeader || `user-${token.slice(0, 8)}`,
        email: `${role}@sage-campus.edu`,
        role: role,
      };
      return next();
    }
  }

  // 2. Check for Development Role Override (for easy role testing in UI)
  if (devRoleHeader) {
    const validRole: UserRole =
      devRoleHeader === 'head_admin'
        ? 'head_admin'
        : devRoleHeader === 'admin'
        ? 'admin'
        : 'student';

    req.user = {
      uid: devUidHeader || `dev-${validRole}-user`,
      email: `${validRole}@sage-campus.edu`,
      role: validRole,
    };
    return next();
  }

  // 3. Unauthenticated default: assign anonymous student role
  req.user = {
    uid: 'anonymous-visitor',
    role: 'student',
    isAnonymous: true,
  };

  next();
}

/**
 * Middleware to enforce authentication
 */
export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.uid === 'anonymous-visitor') {
    res.status(401).json({
      error: 'Authentication Required',
      message: 'You must be signed in to perform this administrative action.',
    });
    return;
  }
  next();
}

/**
 * Middleware to enforce Admin / Head Admin role
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: User identity not established.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden: Insufficient Permissions',
        message: `This action requires one of the following roles: [${allowedRoles.join(', ')}]. Current role: '${req.user.role}'.`,
      });
      return;
    }

    next();
  };
}

export const requireAdmin = requireRole(['admin', 'head_admin']);
export const requireHeadAdmin = requireRole(['head_admin']);
