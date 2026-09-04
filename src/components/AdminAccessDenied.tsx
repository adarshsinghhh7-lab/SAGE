import React from 'react';
import { ShieldAlert, Lock, UserCheck, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminAccessDenied: React.FC = () => {
  const { activeRole, openAuthModal } = useAuth();

  return (
    <div className="max-w-3xl mx-auto py-16 sm:py-24 px-4">
      <div className="bg-[#1D2130] border border-[#2A2F3E] p-8 sm:p-10 text-center paper-grain">
        <div className="w-14 h-14 mx-auto mb-5 bg-[#A6352C] text-[#EBE3D0] flex items-center justify-center">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="inline-flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest bg-[#0B0C0F] text-[#EBE3D0] px-2.5 py-1 mb-4 border border-[#2A2F3E]">
          <Lock className="w-3 h-3" /> Administrative Access Control
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#EBE3D0] mb-3">Administrative Portal Requires an Admin Role</h1>
        <p className="text-sm sm:text-base text-[#EBE3D0]/70 max-w-xl mx-auto mb-6">
          The Grievance Operations &amp; Analytics Dashboard is restricted to Department Admins and the Head Admin. Status dispositions, resolution notes, escalation sweep controls, and operational analytics are admin-only functions — enforced by the application router and by Firestore security rules.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6 text-xs font-mono">
          <span className="inline-flex items-center gap-1.5 border border-[#2A2F3E] px-3 py-1.5 text-[#EBE3D0]/80"><UserCheck className="w-3.5 h-3.5 text-[#B59340]" /> Current Role: <strong className="uppercase">{activeRole.replace('_', ' ')}</strong></span>
          <span className="inline-flex items-center gap-1.5 border border-[#2A2F3E] px-3 py-1.5 text-[#EBE3D0]/80"><Crown className="w-3.5 h-3.5 text-[#B59340]" /> Required: <strong className="uppercase">admin / head_admin</strong></span>
        </div>
        <button type="button" onClick={openAuthModal} className="px-6 py-3 bg-[#B59340] text-[#151820] text-xs font-mono font-bold uppercase border border-[#B59340] cursor-pointer">Switch to Admin / Head Admin</button>
      </div>
    </div>
  );
};
