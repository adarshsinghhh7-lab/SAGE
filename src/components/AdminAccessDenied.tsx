import React from 'react';
import { ShieldAlert, Lock, UserCheck, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminAccessDenied: React.FC = () => {
  const { activeRole, openAuthModal } = useAuth();

  return (
    <div className="max-w-3xl mx-auto py-16 sm:py-24 px-4">
      <div className="bg-surface border border-line-strong rounded-2xl p-8 sm:p-10 text-center paper-grain shadow-lift">
        <div className="w-14 h-14 mx-auto mb-5 bg-clay-soft text-clay-deep flex items-center justify-center rounded-2xl">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="inline-flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest bg-ink text-surface px-3 py-1.5 mb-4 rounded-full">
          <Lock className="w-3 h-3" /> Administrative Access Control
        </div>
        <h1 className="font-sans text-3xl sm:text-4xl font-semibold tracking-tight text-ink mb-3">Administrative Portal Requires an Admin Role</h1>
        <p className="font-sans text-sm sm:text-base text-ink-soft max-w-xl mx-auto mb-6">
          The Grievance Operations &amp; Analytics Dashboard is restricted to Department Admins and the Head Admin. Status dispositions, resolution notes, escalation sweep controls, and operational analytics are admin-only functions — enforced by the application router and by Firestore security rules.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6 text-xs font-mono">
          <span className="inline-flex items-center gap-1.5 border border-line-strong rounded-lg px-3 py-1.5 text-ink-soft bg-surface-soft/60"><UserCheck className="w-3.5 h-3.5 text-bronze-deep" /> Current Role: <strong className="uppercase text-ink">{activeRole.replace('_', ' ')}</strong></span>
          <span className="inline-flex items-center gap-1.5 border border-line-strong rounded-lg px-3 py-1.5 text-ink-soft bg-surface-soft/60"><Crown className="w-3.5 h-3.5 text-bronze-deep" /> Required: <strong className="uppercase text-ink">admin / head_admin</strong></span>
        </div>
        <button type="button" onClick={openAuthModal} className="px-6 py-3 bg-bronze text-ink text-xs font-mono font-bold uppercase border border-bronze rounded-xl shadow-soft cursor-pointer hover:opacity-90 transition-opacity">Switch to Admin / Head Admin</button>
      </div>
    </div>
  );
};
