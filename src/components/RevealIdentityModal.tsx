import React, { useState, useEffect } from 'react';
import { X, Key, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { ApiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { heavyDrawer, instantFade } from '../motion/tokens';

const REVEAL_MIN_DELAY_MS = 550;

interface RevealIdentityModalProps {
  complaintId: string;
  complaintRef?: string;
  isOpen: boolean;
  onClose: () => void;
  onRevealed?: () => void;
}

export const RevealIdentityModal: React.FC<RevealIdentityModalProps> = ({
  complaintId,
  complaintRef,
  isOpen,
  onClose,
  onRevealed,
}) => {
  const { activeRole, user } = useAuth();
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealError, setRevealError] = useState('');
  const [revealResult, setRevealResult] = useState<{
    decryptedIdentity: string;
    logId: string;
    timestamp: string;
  } | null>(null);
  const [didUnmask, setDidUnmask] = useState(false);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setReasonError('');
      setRevealError('');
      setRevealResult(null);
      setIsRevealing(false);
      setDidUnmask(false);
    }
  }, [isOpen, complaintId]);

  if (!isOpen || activeRole !== 'head_admin') return null;

  const handleConfirm = async () => {
    const trimmed = reason.trim();
    if (trimmed.length < 10) {
      setReasonError('Reason must be at least 10 characters.');
      return;
    }

    setIsRevealing(true);
    setReasonError('');
    setRevealError('');

    const startedAt = Date.now();

    try {
      const result = await ApiService.triggerIdentityReveal(
        complaintId,
        trimmed,
        activeRole,
        user?.uid
      );

      const elapsed = Date.now() - startedAt;
      if (elapsed < REVEAL_MIN_DELAY_MS) {
        await new Promise((resolve) => setTimeout(resolve, REVEAL_MIN_DELAY_MS - elapsed));
      }

      setRevealResult(result);
      onRevealed?.();
    } catch (err: any) {
      setRevealError(err?.message || 'Failed to execute reveal protocol. Please try again.');
    } finally {
      setIsRevealing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="reveal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={prefersReduced ? instantFade : { duration: 0.18, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 modal-depth-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reveal-modal-title"
          onClick={onClose}
        >
          <motion.div
            key="reveal-card"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={prefersReduced ? instantFade : { ...heavyDrawer, delay: 0.05 }}
            className="w-full max-w-md bg-[#E8DFC8] border border-[#A6352C]/40 overflow-hidden paper-grain sm:rounded-none max-sm:min-h-dvh max-sm:h-dvh max-sm:overflow-y-auto"
            style={{ boxShadow: '0 12px 28px rgba(11,12,15,0.28), 0 4px 10px rgba(11,12,15,0.14)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#0B0C0F] text-[#E8DFC8] px-5 py-4 flex items-center justify-between border-b border-[#A6352C]/40">
              <div className="flex items-center gap-2.5">
                <Key className="w-5 h-5 text-[#A6352C]" />
                <h2 id="reveal-modal-title" className="font-mono text-sm font-bold uppercase tracking-wider">
                  Reveal Identity
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isRevealing}
                className="text-[#E8DFC8]/70 hover:text-[#E8DFC8] cursor-pointer disabled:opacity-40"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 text-[#14171F]">
              {revealResult ? (
                <>
                  {/* Success — the ONE bold animation: redaction bar wipes away
                      via clip-path, revealing identity over ~550ms with a slow
                      weighty ease. Used nowhere else. */}
                  <div className="bg-[#5B7D5B]/10 border border-[#5B7D5B]/40 p-3 mb-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#5B7D5B] shrink-0" />
                      <p className="text-xs font-mono font-bold text-[#5B7D5B]">
                        Decryption Successful · Immutable Audit Record: {revealResult.logId}
                      </p>
                    </div>
                  </div>

                  <div className="relative bg-[#0B0C0F] border border-[#2A2F3E] p-4 mb-3 overflow-hidden">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-[#E8DFC8]/50 mb-1">
                      Decrypted Submitter Reference
                    </p>
                    <div className="relative">
                      <p className="text-sm font-mono font-bold text-[#E8DFC8] break-words">
                        {revealResult.decryptedIdentity}
                      </p>
                      <motion.div
                        className="absolute inset-0"
                        initial={{ clipPath: 'inset(0% 0% 0% 0%)' }}
                        animate={{ clipPath: didUnmask ? 'inset(0% 0% 0% 100%)' : 'inset(0% 0% 0% 0%)' }}
                        transition={prefersReduced ? instantFade : heavyDrawer}
                        onAnimationComplete={() => setDidUnmask(true)}
                      >
                        <div className="h-full w-full bg-[#A6352C] flex items-center justify-center">
                          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#E8DFC8]/70">██ REDACTED ██</span>
                        </div>
                      </motion.div>
                    </div>
                    <p className="mt-1 text-[10px] font-mono text-[#E8DFC8]/40">
                      Displayed only on this screen. Never stored or cached on the client.
                    </p>
                  </div>

                  <p className="text-[10px] font-mono text-[#5B6472]">
                    Timestamp: {revealResult.timestamp} · Stored in{' '}
                    <span className="font-bold text-[#14171F]">revealLogs</span> (update/delete forbidden).
                  </p>

                  <div className="mt-4 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 bg-[#0B0C0F] text-[#E8DFC8] font-mono text-xs font-bold uppercase hover:bg-[#14171F] cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </>
              ) : isRevealing ? (
                <>
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <motion.div className="relative w-12 h-12" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
                      <span className="absolute inset-0 rounded-full border-2 border-[#D9CEB5]" aria-hidden="true" />
                      <motion.span className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#A6352C]" animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} aria-hidden="true" />
                    </motion.div>
                    <p className="mt-5 text-xs font-mono font-bold uppercase tracking-wider text-[#14171F]">Executing reveal protocol</p>
                    <p className="mt-1 text-[10px] font-mono text-[#5B6472]">Decrypting reference &amp; writing immutable audit record...</p>
                    <div className="mt-5 w-full max-w-[220px] h-1 bg-[#D9CEB5] overflow-hidden">
                      <motion.div className="h-full bg-[#A6352C]" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: REVEAL_MIN_DELAY_MS / 1000, ease: 'easeInOut' }} style={{ transformOrigin: 'left' }} />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-4 flex items-start gap-2 border border-[#A6352C]/40 bg-[#A6352C]/5 p-3">
                    <AlertTriangle className="w-4 h-4 text-[#A6352C] shrink-0 mt-0.5" />
                    <p className="text-xs text-[#14171F]/85 leading-relaxed">
                      You are about to decrypt and expose this submitter's identity. This
                      action is permanently logged and cannot be undone. Please provide a reason before proceeding.
                    </p>
                  </div>

                  <p className="text-[11px] font-mono text-[#5B6472] mb-3">
                    Target Complaint: <strong className="text-[#14171F]">{complaintRef || complaintId}</strong>
                  </p>

                  <label htmlFor="reveal-reason" className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#5B6472] mb-1">
                    Official Justification (min 10 characters) <span className="text-[#A6352C] font-bold">* required</span>
                  </label>
                  <motion.div
                    initial={{ boxShadow: '0 0 0 0px rgba(166,53,44,0)' }}
                    animate={{ boxShadow: ['0 0 0 0px rgba(166,53,44,0)', '0 0 0 5px rgba(166,53,44,0.16)', '0 0 0 0px rgba(166,53,44,0)'] }}
                    transition={{ duration: 2.2, times: [0, 0.5, 1], ease: 'easeInOut', delay: 0.45 }}
                  >
                    <textarea
                      id="reveal-reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      disabled={isRevealing}
                      rows={3}
                      placeholder="Enter the official investigation / legal justification for decryption..."
                      className="w-full bg-white/70 border border-[#D9CEB5] p-2.5 text-xs font-sans text-[#14171F] placeholder:text-[#5B6472]/60 focus:outline-none focus:border-[#A6352C] disabled:bg-[#D9CEB5]/50"
                    />
                  </motion.div>
                  {reasonError && (
                    <p className="mt-1 text-xs font-mono text-[#A6352C] font-bold flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> {reasonError}
                    </p>
                  )}
                  {revealError && (
                    <p className="mt-1 text-xs font-mono text-[#A6352C] font-bold">{revealError}</p>
                  )}

                  <div className="mt-4 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isRevealing}
                      className="px-4 py-2 text-xs font-mono font-bold uppercase border border-[#D9CEB5] bg-transparent hover:border-[#5B6472] text-[#5B6472] transition-colors cursor-pointer disabled:opacity-40"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirm}
                      disabled={isRevealing}
                      className="px-4 py-2 bg-[#A6352C] text-[#E8DFC8] font-mono text-xs font-bold uppercase hover:bg-[#8F2B24] cursor-pointer disabled:bg-[#D9CEB5] flex items-center gap-1.5"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>{isRevealing ? 'Decrypting & Logging...' : 'Confirm Reveal'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
