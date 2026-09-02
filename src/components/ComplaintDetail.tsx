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
  Crown,
  Key
} from 'lucide-react';
import { Complaint, ComplaintStatus } from '../types';
import { getCategoryBadgeStyle, getStatusBadgeStyle, formatCategoryLabel, formatStatusLabel, formatTimeAgo } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { ApiService } from '../services/api';

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

  // Head Admin Identity Reveal state
  const [revealReason, setRevealReason] = useState<string>('');
  const [isRevealing, setIsRevealing] = useState<boolean>(false);
  const [revealResult, setRevealResult] = useState<{
    decryptedIdentity: string;
    logId: string;
    timestamp: string;
  } | null>(null);
  const [revealError, setRevealError] = useState<string>('');

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

  const handleTriggerReveal = async () => {
    if (!revealReason || revealReason.trim().length < 10) {
      setRevealError('Please provide a legal justification of at least 10 characters.');
      return;
    }

    setIsRevealing(true);
    setRevealError('');

    try {
      const result = await ApiService.triggerIdentityReveal(compId, revealReason.trim(), activeRole);
      setRevealResult(result);
    } catch (err: any) {
      setRevealError(err?.message || 'Failed to execute reveal protocol.');
    } finally {
      setIsRevealing(false);
    }
  };

  // Format exact date
  const formattedExactDate = new Date(complaint.createdAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6 text-[#1C1C1C]">
      {/* Navigation Breadcrumb */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <button
          id="back-to-feed-btn"
          type="button"
          onClick={onBackToFeed}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-[#1C1C1C] border-2 border-[#1C1C1C] bg-white hover:bg-stone-200 transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#1C1C1C]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Public Ledger</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyIdToClipboard}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-bold uppercase border-2 border-[#1C1C1C] bg-[#FAF9F6] hover:bg-stone-100 cursor-pointer shadow-[2px_2px_0px_0px_#1C1C1C]"
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
      <div className="bg-[#FAF9F6] border-2 border-[#1C1C1C] p-6 sm:p-10 shadow-[6px_6px_0px_0px_#1C1C1C]">
        {/* Header Metadata */}
        <div className="mb-6 border-b-2 border-[#1C1C1C] pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono font-black text-sm bg-[#1C1C1C] text-[#FAF9F6] px-3 py-1 tracking-wider shadow-[2px_2px_0px_0px_rgba(220,38,38,1)]">
                {compId}
              </span>

              <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase px-2.5 py-1 border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                <span className={`w-2 h-2 rounded-full ${catStyle.indicator}`} />
                <span>{formatCategoryLabel(complaint.category)}</span>
              </span>

              {isHighPriority && (
                <span className="inline-flex items-center gap-1 text-xs font-mono font-bold uppercase px-2.5 py-1 bg-red-100 text-red-950 border-2 border-red-600 shadow-[1px_1px_0px_0px_#991b1b]">
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
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono font-bold uppercase border-2 cursor-pointer ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                title="Click to update status"
              >
                <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
                <span>Status: {formatStatusLabel(complaint.status)}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60 ml-0.5" />
              </button>

              {showStatusMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-[#FAF9F6] border-2 border-[#1C1C1C] shadow-[3px_3px_0px_0px_#1C1C1C] z-30 py-1 text-xs font-mono">
                  <div className="px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-[#1C1C1C]/60 border-b border-[#1C1C1C]/20">
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
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-stone-200 cursor-pointer ${
                        complaint.status.toLowerCase().replace(' ', '_') === st ? 'font-bold bg-stone-200/80 text-red-700' : 'text-[#1C1C1C]'
                      }`}
                    >
                      <span>{formatStatusLabel(st)}</span>
                      {complaint.status.toLowerCase().replace(' ', '_') === st && <CheckCircle2 className="w-3.5 h-3.5 text-red-700" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <h1 className="font-serif-editorial text-2xl sm:text-3xl font-bold text-[#1C1C1C] tracking-tight">
            Campus Grievance Deposition
          </h1>

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-mono text-[#1C1C1C]/70 mt-3 pt-3 border-t border-[#1C1C1C]/15">
            <div className="flex items-center gap-1.5 font-bold text-[#1C1C1C]">
              <MapPin className="w-3.5 h-3.5 text-red-700 shrink-0" />
              <span>{location}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#1C1C1C]/60 shrink-0" />
              <span>Deposited: {formattedExactDate} ({formatTimeAgo(complaint.createdAt)})</span>
            </div>

            <div className="flex items-center gap-1.5 ml-auto text-emerald-800 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero-Knowledge Decoupled</span>
            </div>
          </div>
        </div>

        {/* Cryptographic Submitter Reference Box */}
        <div className="mb-6 bg-stone-100/90 border border-[#1C1C1C]/30 p-3.5 text-xs font-mono">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 font-bold text-[#1C1C1C]">
              <Lock className="w-3.5 h-3.5 text-red-700" />
              <span>Encrypted Submitter Reference (AES-256)</span>
            </div>
            <span className="text-[10px] bg-stone-200 text-stone-700 px-1.5 py-0.2 border border-stone-400">
              IMMUTABLE
            </span>
          </div>
          <p className="text-[11px] text-[#1C1C1C]/60 truncate font-mono bg-white p-1.5 border border-[#1C1C1C]/20">
            {complaint.encryptedUserRef || 'AES_256_ENCRYPTED_TOKEN_ACTIVE'}
          </p>
          <p className="text-[10px] text-[#1C1C1C]/50 mt-1 italic">
            Identity is encrypted at point of deposition. Students cannot read plain identities; decryption requires dual-authorized Head Admin audit logging.
          </p>
        </div>

        {/* Grievance Statement */}
        <div className="mb-8">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1C1C1C]/60 mb-2">
            Detailed Statement of Grievance
          </h2>
          <div className="bg-white border-2 border-[#1C1C1C] p-6 shadow-[3px_3px_0px_0px_#1C1C1C]">
            <p className="font-serif text-base sm:text-lg text-[#1C1C1C] leading-relaxed whitespace-pre-line">
              {complaint.description}
            </p>
          </div>
        </div>

        {/* Official Administrative Resolution Notes */}
        {complaint.resolutionNotes && (
          <div className="mb-8 bg-emerald-50/60 border-2 border-emerald-800/40 p-5 shadow-[2px_2px_0px_0px_#1C1C1C]">
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
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1C1C1C]/60 mb-2">
              Attached Photographic Evidence
            </h2>
            <div 
              onClick={() => onOpenImage(complaint.photoUrl!, `${compId} - ${complaint.category}`)}
              className="group relative bg-[#1C1C1C] border-2 border-[#1C1C1C] p-3 cursor-pointer overflow-hidden max-w-lg shadow-[3px_3px_0px_0px_#1C1C1C]"
            >
              <img
                src={complaint.photoUrl}
                alt="Complaint Evidence"
                className="max-h-72 w-full object-contain mx-auto group-hover:opacity-90 transition-opacity"
                referrerPolicy="no-referrer"
              />
              <div className="mt-2 text-center text-xs font-mono text-[#FAF9F6] flex items-center justify-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-red-400" />
                <span>Click to inspect high-resolution evidence</span>
                <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
              </div>
            </div>
          </div>
        )}

        {/* Head Admin Exclusive Reveal Tool */}
        {activeRole === 'head_admin' && (
          <div className="mb-8 bg-red-50 border-2 border-red-800 p-5 shadow-[3px_3px_0px_0px_#991b1b]">
            <div className="flex items-center gap-2 mb-2 text-red-950">
              <Crown className="w-4 h-4 text-red-700" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider">
                Head Admin Emergency Reveal Protocol (revealLogs Collection)
              </h2>
            </div>
            <p className="text-xs font-serif text-red-900/80 mb-3">
              Only Head Admin can trigger identity decryption. Every reveal operation is permanently and immutably logged into the Firestore <code className="font-mono bg-red-100 px-1">revealLogs</code> collection.
            </p>

            {!revealResult ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={revealReason}
                  onChange={(e) => setRevealReason(e.target.value)}
                  placeholder="Enter official investigation / legal justification reason (min 10 chars)..."
                  className="w-full bg-white border-2 border-red-800 p-2.5 text-xs font-mono text-[#1C1C1C] placeholder:text-stone-400 focus:outline-none"
                />
                {revealError && (
                  <p className="text-xs font-mono text-red-700 font-bold">{revealError}</p>
                )}
                <button
                  type="button"
                  disabled={isRevealing}
                  onClick={handleTriggerReveal}
                  className="px-4 py-2 bg-red-700 text-white font-mono text-xs font-bold uppercase hover:bg-red-800 cursor-pointer disabled:bg-stone-400 flex items-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{isRevealing ? 'Decrypting & Logging...' : 'Decrypt Submitter Reference'}</span>
                </button>
              </div>
            ) : (
              <div className="bg-white border-2 border-red-800 p-4 text-xs font-mono space-y-2">
                <div className="text-emerald-800 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Decryption Successful · Immutable Audit Record Created: {revealResult.logId}</span>
                </div>
                <div className="bg-stone-100 p-2 border border-stone-300">
                  <span className="text-stone-500">Decrypted Reference:</span>{' '}
                  <strong className="text-red-700 font-bold">{revealResult.decryptedIdentity}</strong>
                </div>
                <p className="text-[10px] text-stone-500">
                  Timestamp: {revealResult.timestamp} · Stored in <span className="font-bold">revealLogs</span> (update/delete forbidden).
                </p>
              </div>
            )}
          </div>
        )}

        {/* Upvote & Action Bar */}
        <div className="pt-6 border-t-2 border-[#1C1C1C] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              id={`detail-upvote-btn-${compId}`}
              type="button"
              disabled={complaint.hasUpvoted}
              onClick={handleUpvote}
              className={`w-full sm:w-auto px-6 py-3 text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#1C1C1C] transition-all cursor-pointer flex items-center justify-center gap-2.5 ${
                complaint.hasUpvoted
                  ? 'bg-emerald-800 text-white border-emerald-900 opacity-95 cursor-default'
                  : 'bg-[#1C1C1C] text-[#FAF9F6] hover:bg-stone-800 shadow-[3px_3px_0px_0px_#1C1C1C]'
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
              className="w-full sm:w-auto px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#1C1C1C] bg-white hover:bg-stone-100 transition-colors text-center cursor-pointer shadow-[2px_2px_0px_0px_#1C1C1C]"
            >
              Back to Ledger
            </button>

            <button
              type="button"
              onClick={onGoToSubmit}
              className="w-full sm:w-auto px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#1C1C1C] bg-white hover:bg-stone-100 transition-colors text-center cursor-pointer shadow-[2px_2px_0px_0px_#1C1C1C]"
            >
              Lodge Another
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
