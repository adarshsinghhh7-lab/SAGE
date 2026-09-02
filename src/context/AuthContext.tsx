import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  signInAnonymously as fbSignInAnonymously,
  onAuthStateChanged,
  signOut as fbSignOut,
  User as FirebaseUser,
  getIdTokenResult
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase/config';
import { UserRole } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  role: UserRole;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  loading: boolean;
  activeRole: UserRole;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  switchActiveRole: (newRole: UserRole) => void;
  loginAsDemoRole: (role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_ROLE_KEY = 'sage_active_demo_role';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<UserRole>(() => {
    return (localStorage.getItem(LOCAL_STORAGE_ROLE_KEY) as UserRole) || 'student';
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe = () => {};

    try {
      unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
          try {
            const tokenRes = await getIdTokenResult(currentUser);
            const userToken = await currentUser.getIdToken();
            setToken(userToken);

            // Read role from custom claim or fallback to persisted demo role
            if (tokenRes.claims.role) {
              setRole(tokenRes.claims.role as UserRole);
            }
          } catch {
            // ignore
          }
        } else {
          setToken(null);
        }
        setLoading(false);
      });
    } catch {
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const switchActiveRole = (newRole: UserRole) => {
    setRole(newRole);
    localStorage.setItem(LOCAL_STORAGE_ROLE_KEY, newRole);
  };

  const loginAsDemoRole = async (targetRole: UserRole) => {
    setLoading(true);
    try {
      if (isFirebaseConfigured) {
        await fbSignInAnonymously(auth);
      }
      switchActiveRole(targetRole);
    } catch (err) {
      console.warn('[Auth Sign In Demo]', err);
      switchActiveRole(targetRole);
    } finally {
      setLoading(false);
      setIsAuthModalOpen(false);
    }
  };

  const handleSignOut = async () => {
    try {
      if (isFirebaseConfigured) {
        await fbSignOut(auth);
      }
    } catch {
      // ignore
    }
    setUser(null);
    setToken(null);
    switchActiveRole('student');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user || role !== 'student',
        isAnonymous: !user || user.isAnonymous,
        loading,
        activeRole: role,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        switchActiveRole,
        loginAsDemoRole,
        signOut: handleSignOut,
        token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
