import React, { useState, useEffect } from 'react';
import { X, Key, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ApiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

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

    try {
      const result = await ApiService.triggerIdentityReveal(
        complaintId,
        trimmed,
        activeRole,
        user?.uid
      );
      setRevealResult(result);
      onRevealed?.();
    } catch (err: any) {
      setRevealError(err?.message || 'Failed to execute reveal protocol. Please try again.');
    } finally {
      setIsRevealing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reveal-modal-title"
    >
      <div className="w-full max-w-md bg-white border border-red-200 rounded-lg shadow-2xl overflow-hidden">
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
          {!revealResult ? (
            <>
              {/* Warning */}
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

              {/* Reason input */}
              <label htmlFor="reveal-reason" className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 mb-1">
                Official Justification (min 10 characters)
              </label>
              <textarea
                id="reveal-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isRevealing}
                rows={3}
                placeholder="Enter the official investigation / legal justification for decryption..."
                className="w-full bg-white border border-slate-300 p-2.5 text-xs font-sans text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-400 rounded-lg disabled:bg-slate-100"
              />
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
          ) : (
            <>
              {/* Success / Revealed identity — local state only, not persisted */}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};
