import React, { useState } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Copy, 
  Image as ImageIcon, 
  ExternalLink, 
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { paperSpring, instantFade } from '../motion/tokens';
import { Complaint, ComplaintStatus } from '../types';
import { getCategoryBadgeStyle, formatCategoryLabel, formatTimeAgo } from '../utils/formatters';
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
  const normStatus = (complaint.status || '').toLowerCase().replace(' ', '_');
  const isHeadAdmin = activeRole === 'head_admin';
  const isResolved = normStatus === 'resolved';

  const copyIdToClipboard = () => {
    navigator.clipboard.writeText(compId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const formattedExactDate = new Date(complaint.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const statusColor = isResolved ? '#5B7D5B' : normStatus === 'under_review' ? '#B08D3E' : '#5B6472';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={prefersReduced ? instantFade : paperSpring}
      className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6"
    >
      {/* Navigation Breadcrumb */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <button
          id="back-to-feed-btn"
          type="button"
          onClick={onBackToFeed}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-[#E8DFC8] border border-[#2A2F3E] bg-[#1E2230] hover:border-[#5B6472] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Public Ledger</span>
        </button>
        <ComplaintIdStamp id={compId} />
      </div>

      {/* Case File Card */}
      <div className="bg-[#E8DFC8] border border-[#D9CEB5] paper-grain" style={{ borderLeft: `10px solid ${getCategoryColor(complaint.category)}`, boxShadow: '0 1px 2px rgba(11,12,15,0.12), 0 1px 1px rgba(11,12,15,0.08)' }}>
        {/* Header strip */}
        <div className="px-6 py-4 border-b border-[#D9CEB5] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
              {formatCategoryLabel(complaint.category)}
            </span>
            <StatusStamp status={complaint.status} color={statusColor} />
            {isResolved && (
              <span className="font-mono text-[10px] text-[#5B7D5B] font-bold">RESOLVED</span>
            )}
          </div>

          <button
            type="button"
            onClick={copyIdToClipboard}
            className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#5B6472] hover:text-[#B08D3E] bg-transparent border border-[#D9CEB5] px-2 py-1 cursor-pointer"
          >
            <Copy className="w-3 h-3" />
            {copied ? 'Copied' : 'Copy ID'}
          </button>
        </div>

        <div className="px-6 py-5">
          {/* Identity Sealed motif — recurring anonymity marker */}
          <IdentitySealedBar className="mb-5" />

          {/* Title + description */}
          <h1 className="text-3xl font-bold text-[#14171F] mb-3">Campus Grievance Deposition</h1>
          <p className="text-sm text-[#14171F]/85 leading-relaxed whitespace-pre-line" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
            {complaint.description}
          </p>

          {/* Meta grid */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 text-[#5B6472]">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="font-mono text-[10px]">Location: <span className="font-bold text-[#14171F]">{location}</span></span>
            </div>
            <div className="flex items-center gap-2 text-[#5B6472]">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span className="font-mono text-[10px]">Deposited: <span className="font-bold text-[#14171F]">{formattedExactDate}</span></span>
            </div>
            <div className="flex items-center gap-2 text-[#5B6472]">
              <span className="font-mono text-[10px]">Filed: <span className="font-bold text-[#14171F]">{formatTimeAgo(complaint.createdAt)}</span></span>
            </div>
          </div>

          {/* Event evidence photo */}
          {complaint.photoUrl && (
            <div className="mt-6">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#5B6472] mb-2">Attached Photographic Evidence</h2>
              <div
                onClick={() => onOpenImage?.(complaint.photoUrl!, `${compId} - ${formatCategoryLabel(complaint.category)}`)}
                className="group bg-[#0B0C0F] border border-[#2A2F3E] p-3 cursor-pointer overflow-hidden max-w-lg"
              >
                <img src={complaint.photoUrl} alt="Complaint Evidence" className="max-h-72 w-full object-contain mx-auto group-hover:opacity-90 transition-opacity" referrerPolicy="no-referrer" />
                <div className="mt-2 text-center text-xs font-mono text-[#E8DFC8] flex items-center justify-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#B08D3E]" />
                  <span>Click to inspect high-resolution evidence</span>
                  <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status timeline */}
        <div className="px-6 pb-6">
          <StatusTimeline currentStatus={complaint.status} submittedAt={complaint.createdAt} statusUpdates={[]} resolvedAt={complaint.resolvedAt} />
        </div>

        {/* Resolution notes */}
        {isResolved && complaint.resolutionNotes && (
          <div className="px-6 pb-6">
            <div className="border border-[#5B7D5B]/40 bg-[#5B7D5B]/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-[#5B7D5B]" />
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#5B7D5B]">Resolution Notes</h2>
              </div>
              <p className="font-mono text-xs text-[#14171F]/80 leading-relaxed whitespace-pre-line">{complaint.resolutionNotes}</p>
            </div>
          </div>
        )}

        {/* Head Admin Reveal Protocol */}
        {isHeadAdmin && (
          <div className="px-6 pb-6">
            <div className="border border-[#A6352C]/40 bg-[#A6352C]/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-[#A6352C]" />
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#A6352C]">Head Admin Emergency Reveal Protocol (revealLogs Collection)</h2>
              </div>
              <p className="text-xs text-[#A6352C]/90 mb-3">Only Head Admin can trigger identity decryption. Every reveal operation is permanently logged.</p>
              <button
                type="button"
                onClick={() => setIsRevealModalOpen(true)}
                className="px-4 py-2 bg-[#A6352C] text-[#E8DFC8] font-mono text-xs font-bold uppercase cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Reveal Identity</span>
              </button>
            </div>
          </div>
        )}

        {/* Upvote & Action Bar */}
        <div className="px-6 py-5 border-t border-[#D9CEB5] flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            id={`detail-upvote-btn-${compId}`}
            type="button"
            disabled={complaint.hasUpvoted}
            onClick={() => !complaint.hasUpvoted && onUpvote(compId)}
            className={`px-6 py-3 text-xs font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer flex items-center justify-center gap-2.5 ${complaint.hasUpvoted ? 'bg-[#5B7D5B] text-[#E8DFC8] border-[#5B7D5B]' : 'bg-[#14171F] text-[#E8DFC8] hover:bg-[#0B0C0F] border-[#14171F]'}`}
          >
            {complaint.hasUpvoted ? (
              <><span>{complaint.upvoteCount} — Endorsed</span></>
            ) : (
              <><span>Endorse Grievance ({complaint.upvoteCount || 0})</span></>
            )}
          </button>

          <div className="flex items-center gap-2.5">
            <button type="button" onClick={onBackToFeed} className="px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider border border-[#D9CEB5] bg-transparent hover:border-[#5B6472] text-[#5B6472] transition-colors cursor-pointer">Back to Ledger</button>
            <button type="button" onClick={onGoToSubmit} className="px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider border border-[#D9CEB5] bg-transparent hover:border-[#5B6472] text-[#5B6472] transition-colors cursor-pointer">Lodge Another</button>
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

function getCategoryColor(category: string): string {
  const norm = (category || '').toLowerCase().replace('/', '_');
  switch (norm) {
    case 'infrastructure': return '#5B7A8D';
    case 'mess': case 'mess_food': return '#8B7340';
    case 'harassment': return '#8B4050';
    case 'wifi': case 'wifi_internet': return '#5B6B8D';
    case 'hygiene': return '#5B7D5B';
    default: return '#7D7568';
  }
}
