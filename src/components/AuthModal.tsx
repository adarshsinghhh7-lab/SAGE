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
          className="bg-[#EBE3D0] border border-[#DDD4BD] max-w-lg w-full my-8 overflow-hidden paper-grain"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
        <div className="bg-[#0B0C0F] text-[#EBE3D0] px-5 py-4 flex items-center justify-between border-b border-[#2A2F3E]">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#B59340]" />
            <span className="font-mono font-bold text-sm uppercase tracking-wider">Firebase Auth & Role Selector</span>
          </div>
          <button type="button" onClick={closeAuthModal} className="text-[#EBE3D0]/60 hover:text-[#EBE3D0] p-1 hover:bg-[#242A38] transition-colors cursor-pointer" aria-label="Close modal"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-xl font-bold text-[#151820] mb-1">Select Your Access Level</h3>
            <p className="text-xs text-[#68707E]">Switch roles to test the different permission gates, admin dashboards, and anonymous student submission protocols.</p>
          </div>

          <div className="space-y-3">
            {/* Student */}
            <div onClick={() => handleSelectRole('student')} className={`p-4 border transition-all cursor-pointer flex items-start gap-3.5 ${activeRole === 'student' ? 'bg-[#5B7D5B]/10 border-[#5B7D5B]' : 'bg-white/50 border-[#DDD4BD] hover:border-[#68707E]'}`}>
              <div className={`w-9 h-9 border flex items-center justify-center shrink-0 ${activeRole === 'student' ? 'bg-[#5B7D5B] text-[#EBE3D0] border-[#5B7D5B]' : 'bg-[#5B7D5B]/10 border-[#5B7D5B]/40 text-[#5B7D5B]'}`}><GraduationCap className="w-5 h-5" /></div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs font-bold uppercase text-[#151820]">Student</div>
                  {activeRole === 'student' && <span className="text-[10px] font-mono font-bold uppercase bg-[#5B7D5B] text-[#EBE3D0] px-2 py-0.5">Active</span>}
                </div>
                <p className="text-xs text-[#68707E] mt-1">Anonymous grievance submission, public ledger browsing, and upvoting.</p>
              </div>
            </div>

            {/* Admin */}
            <div onClick={() => handleSelectRole('admin')} className={`p-4 border transition-all cursor-pointer flex items-start gap-3.5 ${activeRole === 'admin' ? 'bg-[#B59340]/10 border-[#B59340]' : 'bg-white/50 border-[#DDD4BD] hover:border-[#68707E]'}`}>
              <div className={`w-9 h-9 border flex items-center justify-center shrink-0 ${activeRole === 'admin' ? 'bg-[#B59340] text-[#151820] border-[#B59340]' : 'bg-[#B59340]/10 border-[#B59340]/40 text-[#B59340]'}`}><UserCheck className="w-5 h-5" /></div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs font-bold uppercase text-[#151820]">Department Admin / Warden</div>
                  {activeRole === 'admin' && <span className="text-[10px] font-mono font-bold uppercase bg-[#B59340] text-[#151820] px-2 py-0.5">Active</span>}
                </div>
                <p className="text-xs text-[#68707E] mt-1">Access to the Admin Dashboard, grievance status transitions, and resolution notes.</p>
              </div>
            </div>

            {/* Head Admin */}
            <div onClick={() => handleSelectRole('head_admin')} className={`p-4 border transition-all cursor-pointer flex items-start gap-3.5 ${activeRole === 'head_admin' ? 'bg-[#A6352C]/10 border-[#A6352C]' : 'bg-white/50 border-[#DDD4BD] hover:border-[#68707E]'}`}>
              <div className={`w-9 h-9 border flex items-center justify-center shrink-0 ${activeRole === 'head_admin' ? 'bg-[#A6352C] text-[#EBE3D0] border-[#A6352C]' : 'bg-[#A6352C]/10 border-[#A6352C]/40 text-[#A6352C]'}`}><Crown className="w-5 h-5" /></div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs font-bold uppercase text-[#151820]">Head Admin (Chief Proctor)</div>
                  {activeRole === 'head_admin' && <span className="text-[10px] font-mono font-bold uppercase bg-[#A6352C] text-[#EBE3D0] px-2 py-0.5">Active</span>}
                </div>
                <p className="text-xs text-[#68707E] mt-1">Full superuser access: manage custom claims, view audit logs, expunge duplicates, and oversee analytics.</p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#DDD4BD] flex items-center justify-between">
            <button type="button" onClick={signOut} className="text-xs font-mono text-[#68707E] hover:text-[#A6352C] underline cursor-pointer">Reset Session</button>
            <button type="button" onClick={closeAuthModal} className="px-5 py-2 text-xs font-mono font-bold uppercase tracking-wider bg-[#0B0C0F] text-[#EBE3D0] hover:bg-[#151820] border border-[#2A2F3E] cursor-pointer">Done</button>
          </div>
        </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
