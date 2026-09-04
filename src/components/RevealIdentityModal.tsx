import React, { useState, useEffect } from 'react';
import { X, Key, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ApiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Deliberate, weighty pause applied to the reveal so the loading state is always
// perceptible even if the actual decrypt resolves instantly. This reinforces that
// the action is logged and significant, not a casual click.
const REVEAL_MIN_DELAY_MS = 550;

interface RevealIdentityModalProps {
  complaintId: string;
  complaintRef?: string;
  isOpen: boolean;
  onClose: () => void;
  onRevealed?: () => void;
}

/**
 * Head-Admin-only confirmation modal for the emergency identity reveal protocol.
 *
 * Security guarantees:
 *  - Rendered ONLY when the active role is `head_admin` (enforced by callers and
 *    re-checked in `handleConfirm`).
 *  - Requires a legal justification reason of at least 10 characters.
 *  - The decrypted identity is held ONLY in local component state and is cleared
 *    when the modal is dismissed / component unmounts. It is NEVER persisted to
 *    localStorage or any other store on the frontend.
 *  - Every reveal triggers an immutable write to the `revealLogs` Firestore
 *    collection (backed by Head-Admin-only security rules).
 */
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

  // Reset transient state each time the modal opens for a new complaint.
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setReasonError('');
      setRevealError('');
      setRevealResult(null);
      setIsRevealing(false);
    }
  }, [isOpen, complaintId]);

  // Do not ever let the modal open for a non-head-admin, even if a caller
  // mistakenly renders it. This is the UI layer; Firestore rules + backend
  // reinforce the same restriction at the data layer.
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

      // Deliberate, weighty pause: hold the calm loading state for a minimum
      // duration even when the decrypt resolves instantly.
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
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reveal-modal-title"
          onClick={onClose}
        >
          {/* Deliberate fade + scale entrance. Deliberately NOT a bouncy spring —
              this is the most sensitive action in the app and the motion should
              feel weighty and procedural. The backdrop fades/blurs in slightly
              before the card by a small stagger. */}
          <motion.div
            key="reveal-card"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3, ease: 'easeOut', delay: 0.05 }}
            className="w-full max-w-md bg-white border border-red-200 rounded-lg shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
        {/* Header */}
        <div className="bg-red-600 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Key className="w-5 h-5" />
            <h2 id="reveal-modal-title" className="font-mono text-sm font-bold uppercase tracking-wider">
              Reveal Identity
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isRevealing}
            className="text-white/80 hover:text-white cursor-pointer disabled:opacity-40"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 text-slate-900">
          {revealResult ? (
            <>
              {/* Success / Revealed identity — local state only, not persisted */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <p className="text-xs font-mono font-bold text-emerald-800">
                  Decryption Successful · Immutable Audit Record: {revealResult.logId}
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 p-3 rounded-lg mb-3">
                <p className="text-[10px] font-mono uppercase tracking-wider text-red-900/70 mb-1">
                  Decrypted Submitter Reference
                </p>
                <p className="text-sm font-mono font-bold text-red-900 break-words">
                  {revealResult.decryptedIdentity}
                </p>
                <p className="mt-1 text-[10px] font-mono text-slate-500">
                  Displayed only on this screen. Never stored or cached on the client.
                </p>
              </div>

              <p className="text-[10px] font-mono text-slate-500">
                Timestamp: {revealResult.timestamp} · Stored in{' '}
                <span className="font-bold">revealLogs</span> (update/delete forbidden).
              </p>

              <div className="mt-4 flex items-center justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-900 text-white font-mono text-xs font-bold uppercase hover:bg-slate-800 cursor-pointer rounded-lg"
                >
                  Close
                </button>
              </div>
              </motion.div>
            </>
          ) : isRevealing ? (
            <>
              {/* Deliberate, calm loading state — reinforces that this is a weighty,
                  logged action, not a casual click. Slow linear spinner + a quiet
                  progress bar. No spring/bounce, no celebration. */}
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <motion.div
                  className="relative w-12 h-12"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <span className="absolute inset-0 rounded-full border-2 border-slate-200" aria-hidden="true" />
                  <motion.span
                    className="absolute inset-0 rounded-full border-2 border-transparent border-t-red-600"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    aria-hidden="true"
                  />
                </motion.div>

                <p className="mt-5 text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                  Executing reveal protocol
                </p>
                <p className="mt-1 text-[10px] font-mono text-slate-500">
                  Decrypting reference &amp; writing immutable audit record...
                </p>

                {/* Quiet progress bar spanning the deliberate pause */}
                <div className="mt-5 w-full max-w-[220px] h-1 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-red-600"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: REVEAL_MIN_DELAY_MS / 1000, ease: 'easeInOut' }}
                    style={{ transformOrigin: 'left' }}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Confirmation — Warning, target complaint, and mandatory reason */}
              <div className="mb-4 bg-red-50 border border-red-200 p-3 rounded-lg flex gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs font-sans text-red-950 leading-relaxed">
                  This action will decrypt and display the submitter&apos;s identity.
                  This action is permanently logged and cannot be undone. Please
                  provide a reason before proceeding.
                </p>
              </div>

              <p className="text-[11px] font-mono text-slate-600 mb-3">
                Target Complaint: <strong className="text-slate-900">{complaintRef || complaintId}</strong>
              </p>

              {/* Reason input — mandatory. A one-shot, subtle glow draws attention
                  to this required field once on open (no looping, no celebration). */}
              <label htmlFor="reveal-reason" className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 mb-1">
                Official Justification (min 10 characters){' '}
                <span className="text-red-600 font-bold">* required</span>
              </label>
              <motion.div
                initial={{ boxShadow: '0 0 0 0px rgba(220,38,38,0)' }}
                animate={{
                  boxShadow: [
                    '0 0 0 0px rgba(220,38,38,0)',
                    '0 0 0 5px rgba(220,38,38,0.16)',
                    '0 0 0 0px rgba(220,38,38,0)',
                  ],
                }}
                transition={{ duration: 2.2, times: [0, 0.5, 1], ease: 'easeInOut', delay: 0.45 }}
                className="rounded-lg"
              >
                <textarea
                  id="reveal-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={isRevealing}
                  rows={3}
                  placeholder="Enter the official investigation / legal justification for decryption..."
                  className="w-full bg-white border border-slate-300 p-2.5 text-xs font-sans text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-400 rounded-lg disabled:bg-slate-100"
                />
              </motion.div>
              {reasonError && (
                <p className="mt-1 text-xs font-mono text-red-600 font-bold flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> {reasonError}
                </p>
              )}
              {revealError && (
                <p className="mt-1 text-xs font-mono text-red-600 font-bold">{revealError}</p>
              )}

              {/* Actions */}
              <div className="mt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isRevealing}
                  className="px-4 py-2 text-xs font-mono font-bold uppercase border border-slate-300 rounded-lg bg-white hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isRevealing}
                  className="px-4 py-2 bg-red-600 text-white font-mono text-xs font-bold uppercase hover:bg-red-700 cursor-pointer disabled:bg-slate-400 rounded-lg flex items-center gap-1.5"
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
