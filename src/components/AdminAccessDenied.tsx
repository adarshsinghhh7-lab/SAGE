import React from 'react';
import { ShieldAlert, Lock, UserCheck, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Admin-only access gate rendered by the app router whenever a non-admin tries
 * to open the Administrative Dashboard. The dashboard is strictly restricted to
 * `admin` / `head_admin` roles — enforced here in the UI routing and again in
 * Firestore security rules for any data mutation.
 *
 * This screen intentionally displays ZERO student identity information and
 * exposes NO identity-reveal / decryption action of any kind.
 */
export const AdminAccessDenied: React.FC = () => {
  const { activeRole, openAuthModal } = useAuth();

  return (
    <div className="max-w-3xl mx-auto py-16 sm:py-24 px-4 text-[#1C1C1C]">
      <div className="bg-[#FAF9F6] border-2 border-[#1C1C1C] p-8 sm:p-10 shadow-[6px_6px_0px_0px_#1C1C1C] text-center">
        <div className="w-14 h-14 mx-auto mb-5 bg-red-700 text-white flex items-center justify-center">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div className="inline-flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest bg-[#1C1C1C] text-[#FAF9F6] px-2.5 py-1 mb-4">
          <Lock className="w-3 h-3" />
          Administrative Access Control
        </div>

        <h1 className="font-serif-editorial text-3xl sm:text-4xl font-black tracking-tight mb-3">
          Administrative Portal Requires an Admin Role
        </h1>

        <p className="font-serif italic text-sm sm:text-base text-[#1C1C1C]/80 max-w-xl mx-auto mb-6">
          The Grievance Operations &amp; Analytics Dashboard is restricted to
          Department Admins and the Head Admin. Status dispositions, resolution
          notes, escalation sweep controls, and operational analytics are
          admin-only functions — enforced by the application router and by
          Firestore security rules.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-6 text-xs font-mono">
          <span className="inline-flex items-center gap-1.5 border-2 border-[#1C1C1C] px-3 py-1.5">
            <UserCheck className="w-3.5 h-3.5 text-amber-700" />
            Current Role: <strong className="uppercase">{activeRole.replace('_', ' ')}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5 border-2 border-[#1C1C1C] px-3 py-1.5">
            <Crown className="w-3.5 h-3.5 text-red-700" />
            Required: <strong className="uppercase">admin / head_admin</strong>
          </span>
        </div>

        <button
          type="button"
          onClick={openAuthModal}
          className="px-6 py-3 bg-[#1C1C1C] text-[#FAF9F6] text-xs font-mono font-bold uppercase border-2 border-[#1C1C1C] hover:bg-red-700 transition-colors cursor-pointer shadow-[3px_3px_0px_0px_#1C1C1C]"
        >
          Switch to Admin / Head Admin
        </button>
      </div>
    </div>
  );
};