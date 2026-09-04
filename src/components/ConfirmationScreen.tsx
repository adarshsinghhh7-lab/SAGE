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
      className="max-w-2xl mx-auto py-10 sm:py-14 px-4 sm:px-6"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={prefersReduced ? instantFade : { ...paperSpring, delay: 0.08 }}
        className="bg-[#E8DFC8] border border-[#D9CEB5] p-6 sm:p-10 text-center paper-grain"
        style={{ boxShadow: '0 1px 2px rgba(11,12,15,0.12), 0 1px 1px rgba(11,12,15,0.08)' }}
      >
        {/* Success Marker */}
        <div className="w-14 h-14 bg-[#5B7D5B] text-[#E8DFC8] flex items-center justify-center mx-auto mb-4">
          <FileCheck className="w-7 h-7" />
        </div>

        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B08D3E] border border-[#B08D3E]/40 px-2.5 py-0.5 inline-block mb-2">
          DEPOSITION RECORDED (complaints COLLECTION)
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#14171F] mb-2">Grievance Lodged Successfully</h1>

        {/* Identity sealed motif */}
        <div className="my-6 flex justify-center"><IdentitySealedBar /></div>

        {/* Complaint Tracking ID Ticket */}
        <div className="bg-white/60 border border-[#D9CEB5] p-6 mb-7 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#5B6472] mb-1">Public Tracking ID</div>
              <div className="flex items-center gap-2">
                <ComplaintIdStamp id={compId} className="text-lg" />
                <button type="button" onClick={copyIdToClipboard} className="inline-flex items-center gap-1 p-1.5 text-[#5B6472] hover:text-[#B08D3E] cursor-pointer border border-[#D9CEB5]" title="Copy tracking ID">
                  {copied ? <Check className="w-3.5 h-3.5 text-[#5B7D5B]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono font-bold uppercase px-2 py-1 border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                {formatCategoryLabel(complaint.category)}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#D9CEB5] grid gap-2.5 text-[12px]">
            <div className="flex items-center gap-2 text-[#14171F]">
              <MapPin className="w-3.5 h-3.5 text-[#5B6472] shrink-0" />
              <span className="font-mono text-[10px]">Location: <span className="font-bold">{location}</span></span>
            </div>
            <div className="flex items-center gap-2 text-[#14171F]">
              <Clock className="w-3.5 h-3.5 text-[#5B6472] shrink-0" />
              <span className="font-mono text-[10px]">Deposited: <span>{formatTimeAgo(complaint.createdAt)}</span></span>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-[#D9CEB5]">
            <p className="text-sm text-[#14171F]/90 leading-relaxed italic bg-white/70 border border-[#D9CEB5] p-3">
              "{complaint.description}"
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <button
            id="copy-public-link-btn"
            type="button"
            onClick={copyPublicLink}
            className={`w-full sm:w-auto px-6 py-3.5 font-mono font-bold text-xs uppercase tracking-wider border transition-all flex items-center justify-center gap-2 cursor-pointer ${linkCopied ? 'bg-[#5B7D5B] text-[#E8DFC8] border-[#5B7D5B]' : 'bg-[#14171F] text-[#E8DFC8] hover:bg-[#0B0C0F] border-[#14171F]'}`}
          >
            {linkCopied ? (<><Check className="w-4 h-4" /><span>Public Link Copied</span></>) : (<><Link2 className="w-4 h-4" /><span>Copy Public Tracking Link</span></>)}
          </button>

          <button
            id="view-in-feed-btn"
            type="button"
            onClick={onGoToFeed}
            className="w-full sm:w-auto px-6 py-3.5 bg-[#14171F] hover:bg-[#0B0C0F] text-[#E8DFC8] font-mono font-bold text-xs uppercase tracking-wider border border-[#14171F] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>View in Public Ledger</span><ArrowRight className="w-4 h-4" />
          </button>

          <button
            id="submit-another-btn"
            type="button"
            onClick={onSubmitAnother}
            className="w-full sm:w-auto px-6 py-3.5 bg-transparent hover:border-[#5B6472] text-[#5B6472] font-mono font-bold text-xs uppercase tracking-wider border border-[#D9CEB5] transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /><span>Lodge Another Grievance</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
