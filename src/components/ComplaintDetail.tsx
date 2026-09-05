import React, { useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  Clock,
  CheckCircle2,
  Copy,
  Image as ImageIcon,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { paperSpring, instantFade } from '../motion/tokens';
import { Complaint, ComplaintStatus } from '../types';
import {
  getCategoryBadgeStyle,
  formatCategoryLabel,
  formatTimeAgo,
  getCategoryTabColor,
} from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { RevealIdentityModal } from './RevealIdentityModal';
import { ComplaintIdStamp, StatusStamp, IdentitySealedBar } from './CaseFileComponents';
import { StatusTimeline } from './StatusTimeline';

interface ComplaintDetailProps {
  complaint: Complaint;
  onBackToFeed: () => void;
  onUpvote: (id: string) => void;
  onOpenImage: (imageUrl: string, title: string) => void;
  onStatusChange: (id: string, newStatus: ComplaintStatus) => void;
  onGoToSubmit: () => void;
}

export const ComplaintDetail: React.FC<ComplaintDetailProps> = ({
  complaint,
  onBackToFeed,
  onUpvote,
  onOpenImage,
  onGoToSubmit,
}) => {
  const { activeRole } = useAuth();
  const [copied, setCopied] = useState<boolean>(false);
  const [isRevealModalOpen, setIsRevealModalOpen] = useState<boolean>(false);
  const prefersReduced = useReducedMotion();

  const compId = complaint.complaintId || complaint.id || 'SAGE-0000';
  const location = complaint.hostelOrLocation || complaint.location || 'Campus General';

  const catStyle = getCategoryBadgeStyle(complaint.category);
  const catColor = getCategoryTabColor(complaint.category);
  const normStatus = (complaint.status || '').toLowerCase().replace(' ', '_');
  const isHeadAdmin = activeRole === 'head_admin';
  const isResolved = normStatus === 'resolved';

  const statusColor = isResolved ? '#5F7A66' : normStatus === 'under_review' ? '#AD8B5B' : '#7D868F';

  const copyIdToClipboard = () => {
    navigator.clipboard.writeText(compId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const formattedExactDate = new Date(complaint.createdAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={prefersReduced ? instantFade : paperSpring}
      className="max-w-4xl mx-auto py-10 sm:py-14 px-4 sm:px-6"
    >
      {/* Navigation Breadcrumb */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <button
          id="back-to-feed-btn"
          type="button"
          onClick={onBackToFeed}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-line-strong text-ink-soft hover:text-ink hover:border-accent hover:-translate-y-px transition-all cursor-pointer shadow-soft"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="s-mono-micro text-current">Back to Public Ledger</span>
        </button>
        <ComplaintIdStamp id={compId} />
      </div>

      {/* Case file plate */}
      <div
        className="bg-surface border border-line rounded-2xl shadow-soft paper-grain overflow-hidden"
        style={{ borderTop: `5px solid ${catColor}` }}
      >
        {/* Header strip */}
        <div className="px-6 py-5 border-b border-line flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded-md border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
              {formatCategoryLabel(complaint.category)}
            </span>
            <StatusStamp status={complaint.status} color={statusColor} />
            {isResolved && (
              <span className="font-mono text-[10px] text-accent-deep font-bold uppercase tracking-wider">Resolved</span>
            )}
          </div>

          <button
            type="button"
            onClick={copyIdToClipboard}
            className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-ink-faint hover:text-bronze-deep bg-transparent border border-line-strong rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer"
          >
            <Copy className="w-3 h-3" />
            {copied ? 'Copied' : 'Copy ID'}
          </button>
        </div>

        <div className="px-6 py-5 sm:px-8 sm:py-6">
          {/* Identity sealed motif — recurring anonymity marker */}
          <IdentitySealedBar className="mb-5" isSandbox={complaint.isSandbox} />

          <h1 className="text-2xl sm:text-3xl font-semibold text-ink mb-3">Campus Grievance Deposition</h1>
          <p className="text-[15px] text-ink/90 leading-relaxed whitespace-pre-line font-display">
            {complaint.description}
          </p>

          {/* Meta grid */}
          <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 text-ink-faint">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-bronze" />
              <span className="font-mono text-[10px] uppercase tracking-wider">Location: <span className="font-bold text-ink normal-case">{location}</span></span>
            </div>
            <div className="flex items-center gap-2 text-ink-faint">
              <Clock className="w-3.5 h-3.5 shrink-0 text-bronze" />
              <span className="font-mono text-[10px] uppercase tracking-wider">Deposited: <span className="font-bold text-ink normal-case">{formattedExactDate}</span></span>
            </div>
            <div className="flex items-center gap-2 text-ink-faint">
              <span className="font-mono text-[10px] uppercase tracking-wider">Filed: <span className="font-bold text-ink normal-case">{formatTimeAgo(complaint.createdAt)}</span></span>
            </div>
          </div>

          {/* Event evidence photo */}
          {complaint.photoUrl && (
            <div className="mt-7">
              <h2 className="s-mono-micro mb-2">Attached Photographic Evidence</h2>
              <div
                onClick={() => onOpenImage?.(complaint.photoUrl!, `${compId} - ${formatCategoryLabel(complaint.category)}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpenImage?.(complaint.photoUrl!, `${compId} - ${formatCategoryLabel(complaint.category)}`); }}
                className="group bg-moss border border-moss rounded-xl p-3 cursor-pointer overflow-hidden max-w-lg shadow-soft"
              >
                <img src={complaint.photoUrl} alt="Complaint Evidence" className="max-h-72 w-full object-contain mx-auto rounded-lg group-hover:opacity-90 transition-opacity" referrerPolicy="no-referrer" />
                <div className="mt-2.5 text-center text-xs font-mono text-[#EDE7D8] flex items-center justify-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-bronze" />
                  <span>Click to inspect high-resolution evidence</span>
                  <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status timeline */}
        <div className="px-6 pb-7 sm:px-8">
          <StatusTimeline currentStatus={complaint.status} submittedAt={complaint.createdAt} statusUpdates={[]} resolvedAt={complaint.resolvedAt} />
        </div>

        {/* Resolution notes */}
        {isResolved && complaint.resolutionNotes && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={prefersReduced ? instantFade : paperSpring}
            className="px-6 pb-7 sm:px-8"
          >
            <div className="border border-accent/30 bg-accent-soft rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-accent-deep" />
                <h2 className="s-mono-micro text-accent-deep">Resolution Notes</h2>
              </div>
              <p className="font-mono text-xs text-ink-soft leading-relaxed whitespace-pre-line">{complaint.resolutionNotes}</p>
            </div>
          </motion.div>
        )}

        {/* Head Admin Reveal Protocol */}
        {isHeadAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={prefersReduced ? instantFade : paperSpring}
            className="px-6 pb-7 sm:px-8"
          >
            <div className="border border-clay/35 bg-clay-soft rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-4 h-4 text-clay-deep" />
                <h2 className="s-mono-micro text-clay-deep">Head Admin Emergency Reveal Protocol (revealLogs Collection)</h2>
              </div>
              <p className="text-xs text-ink-soft mb-3">Only the Head Admin can trigger identity decryption, on any complaint at any time. A written justification is required, and every reveal is permanently logged to the immutable revealLogs ledger.</p>
              <button
                type="button"
                onClick={() => setIsRevealModalOpen(true)}
                className="s-btn s-btn-danger font-mono text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Reveal Identity</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Upvote & Action Bar */}
        <div className="px-6 py-6 sm:px-8 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-soft/60">
          <button
            id={`detail-upvote-btn-${compId}`}
            type="button"
            disabled={complaint.hasUpvoted}
            onClick={() => !complaint.hasUpvoted && onUpvote(compId)}
            className={`px-6 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer flex items-center justify-center gap-2.5 ${complaint.hasUpvoted ? 'bg-accent text-white border-accent opacity-90' : 'bg-ink text-white border-ink hover:bg-moss-deep hover:border-moss-deep'}`}
          >
            {complaint.hasUpvoted ? (
              <><CheckCircle2 className="w-4 h-4" /><span>{complaint.upvoteCount} Endorsed</span></>
            ) : (
              <><span>Endorse Grievance ({complaint.upvoteCount || 0})</span></>
            )}
          </button>

          <div className="flex items-center gap-2.5">
            <button type="button" onClick={onBackToFeed} className="s-btn s-btn-ghost font-mono text-xs font-bold uppercase tracking-wider cursor-pointer">Back to Ledger</button>
            <button type="button" onClick={onGoToSubmit} className="s-btn s-btn-ghost font-mono text-xs font-bold uppercase tracking-wider cursor-pointer">Lodge Another</button>
          </div>
        </div>
      </div>

      <RevealIdentityModal
        complaintId={compId}
        complaintRef={compId}
        isOpen={isRevealModalOpen}
        onClose={() => setIsRevealModalOpen(false)}
      />
    </motion.div>
  );
};

