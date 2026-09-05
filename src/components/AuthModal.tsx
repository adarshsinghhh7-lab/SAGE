import React from 'react';
import { X, ShieldCheck, UserCheck, Crown, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { heavyDrawer, instantFade } from '../motion/tokens';
import { UserRole } from '../types';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, activeRole, loginAsDemoRole, signOut } = useAuth();
  const prefersReduced = useReducedMotion();

  if (!isAuthModalOpen) return null;

  const handleSelectRole = async (role: UserRole) => { await loginAsDemoRole(role); };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={prefersReduced ? instantFade : { duration: 0.15 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-xs overflow-y-auto"
        onClick={closeAuthModal}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          transition={prefersReduced ? instantFade : heavyDrawer}
          className="bg-surface border border-line-strong max-w-lg w-full my-8 overflow-hidden paper-grain rounded-2xl shadow-lift"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
        <div className="bg-ink text-surface px-5 py-4 flex items-center justify-between border-b border-line">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-bronze" />
            <span className="font-mono font-bold text-sm uppercase tracking-wider">Firebase Auth &amp; Role Selector</span>
          </div>
          <button type="button" onClick={closeAuthModal} className="text-surface/60 hover:text-surface p-1 hover:bg-white/10 transition-colors cursor-pointer rounded" aria-label="Close modal"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-ink tracking-tight mb-1">Select Your Access Level</h3>
            <p className="text-xs text-ink-soft">Switch roles to test the different permission gates, admin dashboards, and anonymous student submission protocols.</p>
          </div>

          <div className="space-y-3">
            {/* Student */}
            <div onClick={() => handleSelectRole('student')} className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${activeRole === 'student' ? 'bg-accent-soft border-accent shadow-soft' : 'bg-surface-soft/60 border-line hover:border-ink-soft hover:shadow-soft'}`}>
              <div className={`w-9 h-9 border rounded-lg flex items-center justify-center shrink-0 ${activeRole === 'student' ? 'bg-accent text-white border-accent' : 'bg-accent-soft border-accent/40 text-accent-deep'}`}><GraduationCap className="w-5 h-5" /></div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs font-bold uppercase text-ink">Student</div>
                  {activeRole === 'student' && <span className="text-[10px] font-mono font-bold uppercase bg-accent text-white px-2 py-0.5 rounded-full">Active</span>}
                </div>
                <p className="text-xs text-ink-soft mt-1">Anonymous grievance submission, public ledger browsing, and upvoting.</p>
              </div>
            </div>

            {/* Admin */}
            <div onClick={() => handleSelectRole('admin')} className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${activeRole === 'admin' ? 'bg-bronze-soft border-bronze shadow-soft' : 'bg-surface-soft/60 border-line hover:border-ink-soft hover:shadow-soft'}`}>
              <div className={`w-9 h-9 border rounded-lg flex items-center justify-center shrink-0 ${activeRole === 'admin' ? 'bg-bronze text-ink border-bronze' : 'bg-bronze-soft border-bronze/40 text-bronze-deep'}`}><UserCheck className="w-5 h-5" /></div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs font-bold uppercase text-ink">Department Admin / Warden</div>
                  {activeRole === 'admin' && <span className="text-[10px] font-mono font-bold uppercase bg-bronze text-ink px-2 py-0.5 rounded-full">Active</span>}
                </div>
                <p className="text-xs text-ink-soft mt-1">Access to the Admin Dashboard, grievance status transitions, and resolution notes.</p>
              </div>
            </div>

            {/* Head Admin */}
            <div onClick={() => handleSelectRole('head_admin')} className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${activeRole === 'head_admin' ? 'bg-clay-soft border-clay shadow-soft' : 'bg-surface-soft/60 border-line hover:border-ink-soft hover:shadow-soft'}`}>
              <div className={`w-9 h-9 border rounded-lg flex items-center justify-center shrink-0 ${activeRole === 'head_admin' ? 'bg-clay text-white border-clay' : 'bg-clay-soft border-clay/40 text-clay-deep'}`}><Crown className="w-5 h-5" /></div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs font-bold uppercase text-ink">Head Admin (Chief Proctor)</div>
                  {activeRole === 'head_admin' && <span className="text-[10px] font-mono font-bold uppercase bg-clay text-white px-2 py-0.5 rounded-full">Active</span>}
                </div>
                <p className="text-xs text-ink-soft mt-1">Full superuser access: manage custom claims, view audit logs, expunge duplicates, and oversee analytics.</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-line flex items-center justify-between">
            <button type="button" onClick={signOut} className="text-xs font-mono text-ink-soft hover:text-clay-deep underline cursor-pointer transition-colors">Reset Session</button>
            <button type="button" onClick={closeAuthModal} className="px-5 py-2 text-xs font-mono font-bold uppercase tracking-wider bg-ink text-surface hover:bg-moss-deep border border-ink rounded-xl transition-colors cursor-pointer">Done</button>
          </div>
        </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
