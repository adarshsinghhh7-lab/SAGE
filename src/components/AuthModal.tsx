import React from 'react';
import { 
  X, 
  ShieldCheck, 
  UserCheck, 
  Crown, 
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, activeRole, loginAsDemoRole, signOut } = useAuth();

  if (!isAuthModalOpen) return null;

  const handleSelectRole = async (role: UserRole) => {
    await loginAsDemoRole(role);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
      onClick={closeAuthModal}
    >
      <div 
        className="bg-[#FAF9F6] border-3 border-[#1C1C1C] max-w-lg w-full shadow-[8px_8px_0px_0px_#1C1C1C] my-8 overflow-hidden text-[#1C1C1C]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-[#1C1C1C] text-[#FAF9F6] px-5 py-4 flex items-center justify-between border-b-2 border-[#1C1C1C]">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-mono font-bold text-sm uppercase tracking-wider">
              Firebase Auth & Role Selector
            </span>
          </div>

          <button
            type="button"
            onClick={closeAuthModal}
            className="text-stone-300 hover:text-white p-1 hover:bg-stone-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-serif-editorial text-xl font-bold text-[#1C1C1C] mb-1">
              Select Your Access Level
            </h3>
            <p className="font-serif italic text-xs text-[#1C1C1C]/75">
              Switch roles to test the different permission gates, admin dashboards, and anonymous student submission protocols.
            </p>
          </div>

          <div className="space-y-3">
            {/* Role 1: Student */}
            <div
              onClick={() => handleSelectRole('student')}
              className={`p-4 border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                activeRole === 'student'
                  ? 'bg-stone-100 border-[#1C1C1C] shadow-[3px_3px_0px_0px_#1C1C1C]'
                  : 'bg-white border-[#1C1C1C]/30 hover:border-[#1C1C1C] hover:bg-stone-50'
              }`}
            >
              <div className="w-9 h-9 bg-emerald-100 border border-emerald-800 text-emerald-900 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs font-bold uppercase text-[#1C1C1C]">
                    Student (Default Anonymous)
                  </div>
                  {activeRole === 'student' && (
                    <span className="text-[10px] font-mono font-bold uppercase bg-emerald-800 text-white px-2 py-0.5">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs font-serif text-[#1C1C1C]/70 mt-1">
                  100% anonymous submission, public ledger browsing, and community upvoting. Zero identity tracked.
                </p>
              </div>
            </div>

            {/* Role 2: Department Admin */}
            <div
              onClick={() => handleSelectRole('admin')}
              className={`p-4 border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                activeRole === 'admin'
                  ? 'bg-amber-50 border-amber-900 shadow-[3px_3px_0px_0px_#78350f]'
                  : 'bg-white border-[#1C1C1C]/30 hover:border-[#1C1C1C] hover:bg-stone-50'
              }`}
            >
              <div className="w-9 h-9 bg-amber-100 border border-amber-800 text-amber-900 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs font-bold uppercase text-[#1C1C1C]">
                    Department Admin / Warden
                  </div>
                  {activeRole === 'admin' && (
                    <span className="text-[10px] font-mono font-bold uppercase bg-amber-700 text-white px-2 py-0.5">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs font-serif text-[#1C1C1C]/70 mt-1">
                  Access to the Admin Dashboard, grievance status transitions (Under Review / Resolved), and resolution notes.
                </p>
              </div>
            </div>

            {/* Role 3: Head Admin (Proctor / Chief) */}
            <div
              onClick={() => handleSelectRole('head_admin')}
              className={`p-4 border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                activeRole === 'head_admin'
                  ? 'bg-red-50 border-red-900 shadow-[3px_3px_0px_0px_#991b1b]'
                  : 'bg-white border-[#1C1C1C]/30 hover:border-[#1C1C1C] hover:bg-stone-50'
              }`}
            >
              <div className="w-9 h-9 bg-red-100 border border-red-800 text-red-900 flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs font-bold uppercase text-[#1C1C1C]">
                    Head Admin (Chief Proctor)
                  </div>
                  {activeRole === 'head_admin' && (
                    <span className="text-[10px] font-mono font-bold uppercase bg-red-700 text-white px-2 py-0.5">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs font-serif text-[#1C1C1C]/70 mt-1">
                  Full superuser access: manage custom claims, view audit logs, expunge verified duplicates, and oversee campus-wide analytics.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#1C1C1C]/15 flex items-center justify-between">
            <button
              type="button"
              onClick={signOut}
              className="text-xs font-mono text-[#1C1C1C]/60 hover:text-red-700 underline cursor-pointer"
            >
              Reset Session
            </button>

            <button
              type="button"
              onClick={closeAuthModal}
              className="px-5 py-2 text-xs font-mono font-bold uppercase tracking-wider bg-[#1C1C1C] text-white hover:bg-red-700 border-2 border-[#1C1C1C] cursor-pointer shadow-[2px_2px_0px_0px_#1C1C1C]"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
