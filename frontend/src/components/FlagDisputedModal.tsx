import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { heavyDrawer, instantFade } from '../motion/tokens';

const MIN_JUSTIFICATION_CHARS = 10;

interface FlagDisputedModalProps {
  /** ID of the complaint being flagged (used for display + submission). */
  complaintId: string;
  /** Render-friendly reference shown in the confirm line (defaults to complaintId). */
  complaintRef?: string;
  isOpen: boolean;
  isSubmitting?: boolean;
  submitError?: string | null;
  onClose: () => void;
  /** Called with the trimmed justification only when it passes the 10-char gate. */
  onConfirm: (justification: string) => void;
}

export const FlagDisputedModal: React.FC<FlagDisputedModalProps> = ({
  complaintId,
  complaintRef,
  isOpen,
  isSubmitting = false,
  submitError = null,
  onClose,
  onConfirm,
}) => {
  const prefersReduced = useReducedMotion();
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);

  // Reset the draft + validation state whenever the modal opens for a complaint.
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setTouched(false);
    }
  }, [isOpen, complaintId]);

  // Escape closes without submitting (unless a submission is already in flight).
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const displayRef = complaintRef || complaintId || 'SAGE-0000';
  const trimmedLength = reason.trim().length;
  const meetsMinimum = trimmedLength >= MIN_JUSTIFICATION_CHARS;
  const showMinFeedback = touched && !meetsMinimum;

  const handleConfirm = () => {
    if (!meetsMinimum || isSubmitting) return;
    // Trim is applied here so only the canonical justification reaches the API.
    onConfirm(reason.trim());
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="flag-dispute-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={prefersReduced ? instantFade : { duration: 0.18, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 modal-depth-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="flag-dispute-modal-title"
          onClick={isSubmitting ? undefined : onClose}
        >
          <motion.div
            key="flag-dispute-card"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={prefersReduced ? instantFade : { ...heavyDrawer, delay: 0.05 }}
            className="w-full max-w-md bg-surface border border-clay/40 overflow-hidden paper-grain shadow-lift rounded-2xl max-sm:min-h-dvh max-sm:h-dvh max-sm:overflow-y-auto"
            style={{ boxShadow: '0 12px 28px rgba(11,12,15,0.16), 0 4px 10px rgba(11,12,15,0.08)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-ink text-surface px-5 py-4 flex items-center justify-between border-b border-clay/40 rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-clay" />
                <h2 id="flag-dispute-modal-title" className="font-mono text-sm font-bold uppercase tracking-wider">
                  Flag complaint as disputed
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="text-surface/70 hover:text-surface cursor-pointer disabled:opacity-40"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 text-ink">
              {/* Fair-use protocol explainer */}
              <div className="mb-4 flex items-start gap-2 border border-clay/40 bg-clay-soft rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 text-clay-deep shrink-0 mt-0.5" />
                <p className="text-xs text-ink-soft leading-relaxed">
                  You are formally flagging this complaint as{' '}
                  <strong className="text-clay-deep">suspected false / malicious</strong>. This
                  written justification is audited and recorded on the complaint for accountability.
                  (Identity reveal is a separate, ungated Head Admin action.)
                </p>
              </div>

              {/* Target complaint confirmation */}
              <p className="text-[11px] font-mono text-ink-faint mb-3">
                Target Complaint: <strong className="text-ink">{displayRef}</strong>
              </p>

              {/* Justification textarea + live character counter */}
              <label
                htmlFor="flag-dispute-reason"
                className="block text-[10px] font-mono font-bold uppercase tracking-wider text-ink-soft mb-1"
              >
                Justification <span className="text-clay-deep font-bold">* required</span>
              </label>
              <textarea
                id="flag-dispute-reason"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setTouched(true);
                }}
                disabled={isSubmitting}
                rows={4}
                placeholder="Explain why this deposition is suspected to be false or malicious... (minimum 10 characters)"
                className="w-full bg-surface border border-line-strong rounded-lg p-2.5 text-xs font-sans text-ink placeholder:text-ink-faint focus:outline-none focus:border-clay focus:ring-2 focus:ring-clay/20 disabled:bg-line/40"
                aria-describedby="flag-dispute-counter flag-dispute-feedback"
              />

              <div className="mt-1 flex items-center justify-between gap-3">
                <span
                  id="flag-dispute-feedback"
                  className={showMinFeedback ? 'text-[11px] font-mono text-clay-deep font-bold' : 'text-[11px] font-mono text-ink-faint'}
                >
                  {showMinFeedback
                    ? 'Enter at least 10 characters'
                    : 'A written justification is required before this flag can be committed.'}
                </span>
                <span
                  id="flag-dispute-counter"
                  className={`text-[10px] font-mono font-bold tabular-nums shrink-0 ${
                    meetsMinimum ? 'text-accent-deep' : 'text-ink-faint'
                  }`}
                >
                  {trimmedLength} / {MIN_JUSTIFICATION_CHARS} min
                </span>
              </div>

              {submitError && (
                <p className="mt-2 text-xs font-mono text-clay-deep font-bold">✕ {submitError}</p>
              )}

              {/* Actions */}
              <div className="mt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-mono font-bold uppercase rounded-lg border border-line-strong bg-surface text-ink-soft hover:border-ink-soft transition-colors cursor-pointer disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!meetsMinimum || isSubmitting}
                  className="px-4 py-2 bg-clay text-white rounded-lg font-mono text-xs font-bold uppercase hover:bg-clay-deep cursor-pointer disabled:bg-line disabled:text-ink-faint flex items-center gap-1.5 transition-colors"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Flagging...' : 'Confirm Flag'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};