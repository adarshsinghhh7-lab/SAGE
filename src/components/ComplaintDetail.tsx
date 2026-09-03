import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ArrowBigUp, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Check, 
  Copy, 
  Image as ImageIcon, 
  ExternalLink, 
  Lock, 
  ChevronDown, 
  CheckCircle2, 
} from 'lucide-react';
import { motion } from 'motion/react';
import { Complaint, ComplaintStatus } from '../types';
import { getCategoryBadgeStyle, getStatusBadgeStyle, formatCategoryLabel, formatStatusLabel, formatTimeAgo } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { RevealIdentityModal } from './RevealIdentityModal';

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
  onStatusChange,
  onGoToSubmit,
}) => {
  const { activeRole } = useAuth();
  const [copied, setCopied] = useState<boolean>(false);
  const [showStatusMenu, setShowStatusMenu] = useState<boolean>(false);

  // Head Admin Identity Reveal modal state
  const [isRevealModalOpen, setIsRevealModalOpen] = useState<boolean>(false);

  const compId = complaint.complaintId || complaint.id || 'SAGE-0000';
  const location = complaint.hostelOrLocation || complaint.location || 'Campus General';
  const upvoteCount = complaint.upvoteCount !== undefined ? complaint.upvoteCount : (complaint.upvotes || 0);
  const urgencyScore = complaint.urgencyScore !== undefined ? complaint.urgencyScore : 0;

  const catStyle = getCategoryBadgeStyle(complaint.category);
  const statusStyle = getStatusBadgeStyle(complaint.status, urgencyScore >= 0.75 ? 'Urgent' : complaint.urgency);

  const isHighPriority = (urgencyScore >= 0.75 || complaint.urgency === 'Urgent') && complaint.status.toLowerCase() !== 'resolved';

  const copyIdToClipboard = () => {
    navigator.clipboard.writeText(compId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleUpvote = () => {
    if (!complaint.hasUpvoted) {
      onUpvote(compId);
    }
  };

  const handleOpenRevealModal = () => setIsRevealModalOpen(true);
  const handleCloseRevealModal = () => setIsRevealModalOpen(false);

  // Format exact date
  const formattedExactDate = new Date(complaint.createdAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6 text-slate-900"
    >
      {/* Navigation Breadcrumb */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <button
          id="back-to-feed-btn"
          type="button"
          onClick={onBackToFeed}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-900 border border-slate-200 rounded-lg bg-white hover:bg-slate-200 transition-colors cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Public Ledger</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyIdToClipboard}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-bold uppercase border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer shadow-sm"
            title="Copy Complaint ID"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                <span className="text-emerald-800">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{compId}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Deposition Detail Container */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 sm:p-10 shadow-lg">
        {/* Header Metadata */}
        <div className="mb-6 border-b border-slate-200 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono font-bold text-sm bg-slate-900 text-white px-3 py-1 tracking-wider shadow-md">
                {compId}
              </span>

              <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase px-2.5 py-1 border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                <span className={`w-2 h-2 rounded-full ${catStyle.indicator}`} />
                <span>{formatCategoryLabel(complaint.category)}</span>
              </span>

              {isHighPriority && (
                <span className="inline-flex items-center gap-1 text-xs font-mono font-bold uppercase px-2.5 py-1 bg-red-100 text-red-950 border border-red-600 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                  <span>High Priority</span>
                </span>
              )}
            </div>

            {/* Current Status Badge + Interactive Demonstration Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono font-bold uppercase border cursor-pointer ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                title="Click to update status"
              >
                <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
                <span>Status: {formatStatusLabel(complaint.status)}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60 ml-0.5" />
              </button>

              {showStatusMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-slate-50 border border-slate-200 rounded-lg shadow-md z-30 py-1 text-xs font-mono">
                  <div className="px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-900/60 border-b border-slate-900/20">
                    Update Ledger Status
                  </div>
                  {(['submitted', 'under_review', 'resolved'] as ComplaintStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        onStatusChange(compId, st);
                        setShowStatusMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-200 cursor-pointer ${
                        complaint.status.toLowerCase().replace(' ', '_') === st ? 'font-bold bg-slate-200/80 text-indigo-600' : 'text-slate-900'
                      }`}
                    >
                      <span>{formatStatusLabel(st)}</span>
                      {complaint.status.toLowerCase().replace(' ', '_') === st && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <h1 className="font-sans text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Campus Grievance Deposition
          </h1>

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-mono text-slate-900/70 mt-3 pt-3 border-t border-slate-900/15">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>{location}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-900/60 shrink-0" />
              <span>Deposited: {formattedExactDate} ({formatTimeAgo(complaint.createdAt)})</span>
            </div>

            <div className="flex items-center gap-1.5 ml-auto text-emerald-800 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero-Knowledge Decoupled</span>
            </div>
          </div>
        </div>

        {/* Cryptographic Submitter Reference Box */}
        <div className="mb-6 bg-slate-100/90 border border-slate-900/30 p-3.5 text-xs font-mono">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Lock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Encrypted Submitter Reference (AES-256)</span>
            </div>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 border border-slate-400">
              IMMUTABLE
            </span>
          </div>
          <p className="text-[11px] text-slate-900/60 truncate font-mono bg-white p-1.5 border border-slate-900/20">
            {complaint.encryptedUserRef || 'AES_256_ENCRYPTED_TOKEN_ACTIVE'}
          </p>
          <p className="text-[10px] text-slate-900/50 mt-1 italic">
            Identity is encrypted at point of deposition. Students cannot read plain identities; decryption requires dual-authorized Head Admin audit logging.
          </p>
        </div>

        {/* Grievance Statement */}
        <div className="mb-8">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900/60 mb-2">
            Detailed Statement of Grievance
          </h2>
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-md">
            <p className="font-sans text-base sm:text-lg text-slate-900 leading-relaxed whitespace-pre-line">
              {complaint.description}
            </p>
          </div>
        </div>

        {/* Official Administrative Resolution Notes */}
        {complaint.resolutionNotes && (
          <div className="mb-8 bg-emerald-50/60 border border-emerald-800/40 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-800" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-950">
                Official Administrative Disposition & Remarks (statusUpdates Ledger)
              </h2>
            </div>
            <p className="font-mono text-xs sm:text-sm text-emerald-950 leading-relaxed bg-white border border-emerald-800/30 p-4 whitespace-pre-line">
              {complaint.resolutionNotes}
            </p>
          </div>
        )}

        {/* Evidence Photo Section */}
        {complaint.photoUrl && (
          <div className="mb-8">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900/60 mb-2">
              Attached Photographic Evidence
            </h2>
            <div 
              onClick={() => onOpenImage(complaint.photoUrl!, `${compId} - ${complaint.category}`)}
              className="group relative bg-slate-900 border border-slate-200 rounded-lg p-3 cursor-pointer overflow-hidden max-w-lg shadow-md"
            >
              <img
                src={complaint.photoUrl}
                alt="Complaint Evidence"
                className="max-h-72 w-full object-contain mx-auto group-hover:opacity-90 transition-opacity"
                referrerPolicy="no-referrer"
              />
              <div className="mt-2 text-center text-xs font-mono text-white flex items-center justify-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Click to inspect high-resolution evidence</span>
                <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
              </div>
            </div>
          </div>
        )}

        {/* Head Admin Exclusive Reveal Tool */}
        {activeRole === 'head_admin' && (
          <div className="mb-8 bg-red-50 border border-red-200 p-5 shadow-md rounded-lg">
            <div className="flex items-center gap-2 mb-2 text-red-950">
              <CheckCircle2 className="w-4 h-4 text-red-600" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider">
                Head Admin Emergency Reveal Protocol (revealLogs Collection)
              </h2>
            </div>
            <p className="text-xs font-sans text-red-900/80 mb-3">
              Only Head Admin can trigger identity decryption. Every reveal operation is permanently and immutably logged into the Firestore <code className="font-mono bg-red-100 px-1 rounded">revealLogs</code> collection.
            </p>
            <button
              type="button"
              onClick={handleOpenRevealModal}
              className="px-4 py-2 bg-red-600 text-white font-mono text-xs font-bold uppercase hover:bg-red-700 cursor-pointer rounded-lg flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Reveal Identity</span>
            </button>
          </div>
        )}

        {/* Head Admin Identity Reveal Modal */}
        <RevealIdentityModal
          complaintId={compId}
          complaintRef={compId}
          isOpen={isRevealModalOpen}
          onClose={handleCloseRevealModal}
        />

        {/* Upvote & Action Bar */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              id={`detail-upvote-btn-${compId}`}
              type="button"
              disabled={complaint.hasUpvoted}
              onClick={handleUpvote}
              className={`w-full sm:w-auto px-6 py-3 text-xs font-mono font-bold uppercase tracking-wider border border-slate-200 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2.5 ${
                complaint.hasUpvoted
                  ? 'bg-emerald-800 text-white border-emerald-900 opacity-95 cursor-default'
                  : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md'
              }`}
            >
              {complaint.hasUpvoted ? (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{upvoteCount} Endorsements (Upvoted)</span>
                </>
              ) : (
                <>
                  <ArrowBigUp className="w-4 h-4 stroke-[2.5]" />
                  <span>Endorse Grievance ({upvoteCount} Upvotes)</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onBackToFeed}
              className="w-full sm:w-auto px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider border border-slate-200 rounded-lg bg-white hover:bg-slate-100 transition-colors text-center cursor-pointer shadow-sm"
            >
              Back to Ledger
            </button>

            <button
              type="button"
              onClick={onGoToSubmit}
              className="w-full sm:w-auto px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider border border-slate-200 rounded-lg bg-white hover:bg-slate-100 transition-colors text-center cursor-pointer shadow-sm"
            >
              Lodge Another
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
