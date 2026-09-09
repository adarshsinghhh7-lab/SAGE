import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInAnonymously as fbSignInAnonymously, onAuthStateChanged, signOut as fbSignOut, getIdTokenResult } from '@firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase/config';
const AuthContext = createContext(undefined);
const LOCAL_STORAGE_ROLE_KEY = 'sage_active_demo_role';
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(() => {
        return localStorage.getItem(LOCAL_STORAGE_ROLE_KEY) || 'student';
    });
    const [loading, setLoading] = useState(true);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [token, setToken] = useState(null);
    useEffect(() => {
        let unsubscribe = () => { };
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
                            setRole(tokenRes.claims.role);
                        }
                    }
                    catch {
                        // ignore
                    }
                }
                else {
                    setToken(null);
                }
                setLoading(false);
            });
        }
        catch {
            setLoading(false);
        }
        return () => unsubscribe();
    }, []);
    const switchActiveRole = (newRole) => {
        setRole(newRole);
        localStorage.setItem(LOCAL_STORAGE_ROLE_KEY, newRole);
    };
    const loginAsDemoRole = async (targetRole) => {
        setLoading(true);
        try {
            if (isFirebaseConfigured) {
                await fbSignInAnonymously(auth);
            }
            switchActiveRole(targetRole);
        }
        catch (err) {
            console.warn('[Auth Sign In Demo]', err);
            switchActiveRole(targetRole);
        }
        finally {
            setLoading(false);
            setIsAuthModalOpen(false);
        }
    };
    const handleSignOut = async () => {
        try {
            if (isFirebaseConfigured) {
                await fbSignOut(auth);
            }
        }
        catch {
            // ignore
        }
        setUser(null);
        setToken(null);
        switchActiveRole('student');
    };
    return (<AuthContext.Provider value={{
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
        }}>
      {children}
    </AuthContext.Provider>);
};
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
