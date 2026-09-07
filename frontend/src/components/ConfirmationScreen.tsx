import React, { useState } from 'react';
import {
  Copy,
  Check,
  ArrowRight,
  PlusCircle,
  MapPin,
  Clock,
  FileCheck,
  Link2
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { paperSpring, instantFade } from '../motion/tokens';
import { Complaint } from '../types';
import { getCategoryBadgeStyle, formatCategoryLabel, formatTimeAgo } from '../utils/formatters';
import { ComplaintIdStamp, IdentitySealedBar } from './CaseFileComponents';

interface ConfirmationScreenProps {
  complaint: Complaint;
  onGoToFeed: () => void;
  onSubmitAnother: () => void;
}

export const ConfirmationScreen: React.FC<ConfirmationScreenProps> = ({
  complaint,
  onGoToFeed,
  onSubmitAnother,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const prefersReduced = useReducedMotion();
  const compId = complaint.complaintId || complaint.id || 'SAGE-0000';
  const location = complaint.hostelOrLocation || complaint.location || 'Campus General';

  const copyIdToClipboard = () => {
    navigator.clipboard.writeText(compId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const copyPublicLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#/complaint/${encodeURIComponent(compId)}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  };

  const catStyle = getCategoryBadgeStyle(complaint.category);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={prefersReduced ? instantFade : paperSpring}
      className="max-w-2xl mx-auto py-12 sm:py-16 px-4 sm:px-6"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={prefersReduced ? instantFade : { ...paperSpring, delay: 0.08 }}
        className="bg-surface border border-line-strong p-8 sm:p-12 text-center paper-grain rounded-2xl shadow-lift"
      >
        {/* Success Marker */}
        <div className="w-14 h-14 bg-accent text-white flex items-center justify-center mx-auto mb-5 rounded-full">
          <FileCheck className="w-7 h-7" />
        </div>

        <span className="s-eyebrow inline-block justify-center mb-2">
          SUBMISSION RECORDED &amp; SEALED
        </span>
        <h1 className="text-3xl sm:text-4xl font-semibold text-ink tracking-tight mb-2">Grievance Lodged Successfully</h1>

        {/* Identity sealed motif */}
        <div className="my-6 flex justify-center"><IdentitySealedBar /></div>

        {/* Complaint Tracking ID Ticket */}
        <div className="bg-surface-soft/70 border border-line rounded-xl p-6 mb-8 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="s-mono-micro mb-1 text-ink-faint">Public Tracking ID</div>
              <div className="flex items-center gap-2">
                <ComplaintIdStamp id={compId} className="text-lg" />
                <button type="button" onClick={copyIdToClipboard} className="inline-flex items-center gap-1 p-1.5 text-ink-faint hover:text-bronze-deep cursor-pointer border border-line rounded-lg transition-colors" title="Copy tracking ID">
                  {copied ? <Check className="w-3.5 h-3.5 text-accent-deep" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono font-bold uppercase px-2 py-1 border rounded-md ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                {formatCategoryLabel(complaint.category)}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-line grid gap-2.5 text-[12px]">
            <div className="flex items-center gap-2 text-ink">
              <MapPin className="w-3.5 h-3.5 text-ink-faint shrink-0" />
              <span className="font-mono text-[10px]">Location: <span className="font-bold">{location}</span></span>
            </div>
            <div className="flex items-center gap-2 text-ink">
              <Clock className="w-3.5 h-3.5 text-ink-faint shrink-0" />
              <span className="font-mono text-[10px]">Deposited: <span>{formatTimeAgo(complaint.createdAt)}</span></span>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-line">
            <p className="text-sm text-ink/90 leading-relaxed italic bg-surface/70 border border-line rounded-lg p-3">
              &ldquo;{complaint.description}&rdquo;
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <button
            id="copy-public-link-btn"
            type="button"
            onClick={copyPublicLink}
            className={`w-full sm:w-auto px-6 py-3.5 font-mono font-bold text-xs uppercase tracking-wider rounded-xl border transition-all flex items-center justify-center gap-2 cursor-pointer ${linkCopied ? 'bg-accent-deep text-white border-accent-deep' : 'bg-ink text-surface hover:bg-moss-deep border-ink'}`}
          >
            {linkCopied ? (<><Check className="w-4 h-4" /><span>Public Link Copied</span></>) : (<><Link2 className="w-4 h-4" /><span>Copy Public Tracking Link</span></>)}
          </button>

          <button
            id="view-in-feed-btn"
            type="button"
            onClick={onGoToFeed}
            className="w-full sm:w-auto px-6 py-3.5 bg-ink hover:bg-moss-deep text-surface font-mono font-bold text-xs uppercase tracking-wider rounded-xl border border-ink transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>View in Public Ledger</span><ArrowRight className="w-4 h-4" />
          </button>

          <button
            id="submit-another-btn"
            type="button"
            onClick={onSubmitAnother}
            className="w-full sm:w-auto px-6 py-3.5 bg-transparent hover:border-ink-soft hover:text-ink text-ink-soft font-mono font-bold text-xs uppercase tracking-wider rounded-xl border border-line-strong transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /><span>Lodge Another Grievance</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
