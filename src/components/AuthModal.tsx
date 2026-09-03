import React from 'react';
import { 
  X, 
  ShieldCheck, 
  UserCheck, 
  Crown, 
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, activeRole, loginAsDemoRole, signOut } = useAuth();

  if (!isAuthModalOpen) return null;

  const handleSelectRole = async (role: UserRole) => {
    await loginAsDemoRole(role);
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto"
        onClick={closeAuthModal}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="bg-slate-50 border border-slate-200 rounded-xl max-w-lg w-full shadow-xl my-8 overflow-hidden text-slate-900"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-mono font-bold text-sm uppercase tracking-wider">
              Firebase Auth & Role Selector
            </span>
          </div>

          <button
            type="button"
            onClick={closeAuthModal}
            className="text-slate-300 hover:text-white p-1 hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-sans text-xl font-bold text-slate-900 mb-1">
              Select Your Access Level
            </h3>
            <p className="font-sans text-xs text-slate-900/75">
              Switch roles to test the different permission gates, admin dashboards, and anonymous student submission protocols.
            </p>
          </div>

          <div className="space-y-3">
            {/* Role 1: Student */}
            <div
              onClick={() => handleSelectRole('student')}
              className={`p-4 border transition-all cursor-pointer flex items-start gap-3.5 ${
                activeRole === 'student'
                  ? 'bg-slate-100 border-slate-300 shadow-md'
                  : 'bg-white border-slate-900/30 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="w-9 h-9 bg-emerald-100 border border-emerald-800 text-emerald-900 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs font-bold uppercase text-slate-900">
                    Student (Default Anonymous)
                  </div>
                  {activeRole === 'student' && (
                    <span className="text-[10px] font-mono font-bold uppercase bg-emerald-800 text-white px-2 py-0.5">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs font-sans text-slate-900/70 mt-1">
                  100% anonymous submission, public ledger browsing, and community upvoting. Zero identity tracked.
                </p>
              </div>
            </div>

            {/* Role 2: Department Admin */}
            <div
              onClick={() => handleSelectRole('admin')}
              className={`p-4 border transition-all cursor-pointer flex items-start gap-3.5 ${
                activeRole === 'admin'
                  ? 'bg-amber-50 border-amber-900 shadow-md'
                  : 'bg-white border-slate-900/30 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="w-9 h-9 bg-amber-100 border border-amber-800 text-amber-900 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs font-bold uppercase text-slate-900">
                    Department Admin / Warden
                  </div>
                  {activeRole === 'admin' && (
                    <span className="text-[10px] font-mono font-bold uppercase bg-amber-700 text-white px-2 py-0.5">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs font-sans text-slate-900/70 mt-1">
                  Access to the Admin Dashboard, grievance status transitions (Under Review / Resolved), and resolution notes.
                </p>
              </div>
            </div>

            {/* Role 3: Head Admin (Proctor / Chief) */}
            <div
              onClick={() => handleSelectRole('head_admin')}
              className={`p-4 border transition-all cursor-pointer flex items-start gap-3.5 ${
                activeRole === 'head_admin'
                  ? 'bg-indigo-50 border-indigo-200 shadow-md'
                  : 'bg-white border-slate-900/30 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="w-9 h-9 bg-indigo-100 border border-indigo-200 text-indigo-800 flex items-center justify-center shrink-0 rounded-lg">
                <Crown className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs font-bold uppercase text-slate-900">
                    Head Admin (Chief Proctor)
                  </div>
                  {activeRole === 'head_admin' && (
                    <span className="text-[10px] font-mono font-bold uppercase bg-indigo-600 text-white px-2 py-0.5">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs font-sans text-slate-900/70 mt-1">
                  Full superuser access: manage custom claims, view audit logs, expunge verified duplicates, and oversee campus-wide analytics.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-900/15 flex items-center justify-between">
            <button
              type="button"
              onClick={signOut}
              className="text-xs font-mono text-slate-900/60 hover:text-indigo-600 underline cursor-pointer"
            >
              Reset Session
            </button>

            <button
              type="button"
              onClick={closeAuthModal}
              className="px-5 py-2 text-xs font-mono font-bold uppercase tracking-wider bg-slate-900 text-white hover:bg-indigo-600 border border-slate-200 rounded-lg cursor-pointer shadow-sm"
            >
              Done
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
    </AnimatePresence>
  );
};
