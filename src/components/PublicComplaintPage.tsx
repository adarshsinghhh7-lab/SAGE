import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Image as ImageIcon,
  ExternalLink,
  Link2,
  Loader2,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { Complaint, StatusUpdateDoc } from '../types';
import {
  getCategoryBadgeStyle,
  formatCategoryLabel,
  formatTimeAgo,
} from '../utils/formatters';
import { ApiService, normalizeComplaintData } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusTimeline } from './StatusTimeline';
import { ComplaintIdStamp, StatusStamp, IdentitySealedBar } from './CaseFileComponents';

interface PublicComplaintPageProps {
  complaintId: string;
  onExit: () => void;
  onOpenImage?: (imageUrl: string, title: string) => void;
}

export const PublicComplaintPage: React.FC<PublicComplaintPageProps> = ({
  complaintId,
  onExit,
  onOpenImage,
}) => {
  const { activeRole, user } = useAuth();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdateDoc[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [toast, setToast] = useState<string | null>(null);

  const shareUrl = `${window.location.origin}${window.location.pathname}#/complaint/${encodeURIComponent(complaintId)}`;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setNotFound(false);
      try {
        const [comp, updates] = await Promise.all([
          ApiService.getComplaintById(complaintId, 'student'),
          ApiService.getStatusUpdates(complaintId).catch(() => [] as StatusUpdateDoc[]),
        ]);
        if (cancelled) return;
        if (!comp) { setNotFound(true); setComplaint(null); setStatusUpdates([]); }
        else { setComplaint(normalizeComplaintData(comp)); setStatusUpdates(updates); }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [complaintId]);

  const compId = complaintId;
  const location = complaint?.hostelOrLocation || complaint?.location || 'Campus General';
  const urgencyScore = complaint?.urgencyScore !== undefined ? complaint.urgencyScore : 0;
  const isResolved = complaint && complaint.status.toLowerCase().replace(' ', '_') === 'resolved';

  const handleUpvote = async () => {
    if (!complaint || complaint.hasUpvoted) return;
    setComplaint((prev) =>
      prev
        ? { ...prev, hasUpvoted: true, upvoteCount: (prev.upvoteCount ?? prev.upvotes ?? 0) + 1, upvotes: (prev.upvoteCount ?? prev.upvotes ?? 0) + 1 }
        : prev
    );
    try {
      const result = await ApiService.upvoteComplaint(compId, user?.uid, activeRole);
      setComplaint(normalizeComplaintData(result.complaint, true));
      setToast(result.alreadyUpvoted ? 'This grievance was already endorsed by you.' : 'Grievance endorsed. Vote recorded anonymously.');
    } catch {
      setComplaint((prev) =>
        prev
          ? { ...prev, hasUpvoted: false, upvoteCount: Math.max(0, (prev.upvoteCount ?? prev.upvotes ?? 0) - 1), upvotes: Math.max(0, (prev.upvoteCount ?? prev.upvotes ?? 0) - 1) }
          : prev
      );
      setToast('Endorsement failed. Please try again.');
    } finally {
      setTimeout(() => setToast(null), 3000);
    }
  };


  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyState('copied');
      setToast('Public tracking link copied to clipboard');
    } catch {
      setCopyState('error');
      setToast('Could not copy link automatically');
    }
    setTimeout(() => setCopyState('idle'), 2500);
    setTimeout(() => setToast(null), 3000);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="inline-flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#B08D3E] animate-spin" />
          <p className="text-xs font-mono uppercase tracking-wider text-[#5B6472]">Retrieving deposition from ledger…</p>
        </div>
      </div>
    );
  }

  if (notFound || !complaint) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="bg-[#1E2230] border border-[#2A2F3E] p-10 max-w-md mx-auto paper-grain">
          <div className="w-12 h-12 bg-[#0B0C0F] border border-[#2A2F3E] flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-[#B08D3E]" />
          </div>
          <h2 className="text-2xl font-bold text-[#E8DFC8] mb-2">Deposition Not Found</h2>
          <p className="text-xs font-mono text-[#5B6472] mb-2">Tracking ID: <span className="font-bold text-[#B08D3E]">{compId}</span></p>
          <p className="text-xs font-mono text-[#5B6472] mb-6">The requested complaint record could not be retrieved from the ledger.</p>
          <button type="button" onClick={onExit} className="px-4 py-2 bg-[#B08D3E] text-[#14171F] text-xs font-mono font-bold uppercase border border-[#B08D3E] cursor-pointer">Return to Public Ledger</button>
        </div>
      </div>
    );
  }

  const catStyle = getCategoryBadgeStyle(complaint.category);
  const normStatus = (complaint.status || '').toLowerCase().replace(' ', '_');
  const isHighPriority = (urgencyScore >= 0.75 || complaint.urgency === 'Urgent') && normStatus !== 'resolved';
  const statusColor = isResolved ? '#5B7D5B' : normStatus === 'under_review' ? '#B08D3E' : '#5B6472';
  const formattedExactDate = new Date(complaint.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-[#0B0C0F] text-[#E8DFC8] text-xs font-mono font-bold uppercase tracking-wider border border-[#2A2F3E]">{toast}</div>
      )}

      {/* Navigation */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-[#E8DFC8] border border-[#2A2F3E] bg-[#1E2230] hover:border-[#5B6472] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Public Ledger</span>
        </button>
        <ComplaintIdStamp id={compId} />
      </div>

      {/* Main Detail Container — case file card */}
      <div className="bg-[#E8DFC8] border border-[#D9CEB5] p-6 sm:p-10 paper-grain">
        {/* Identity sealed motif — recurring anonymity marker */}
        <IdentitySealedBar className="mb-6" />

        {/* Header Metadata */}
        <div className="mb-6 border-b border-[#D9CEB5] pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase px-2.5 py-1 border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                {formatCategoryLabel(complaint.category)}
              </span>
              {isHighPriority && (
                <span className="inline-flex items-center gap-1 text-xs font-mono font-bold uppercase px-2.5 py-1 bg-[#A6352C]/10 text-[#A6352C] border border-[#A6352C]/60">HIGH PRIORITY</span>
              )}
              <StatusStamp status={complaint.status} color={statusColor} />
            </div>
            <span className="font-mono text-[10px] text-[#5B6472] hidden sm:inline">Deposition #{compId}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-[#14171F] tracking-tight">Campus Grievance Deposition</h1>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-mono text-[#5B6472] mt-3 pt-3 border-t border-[#D9CEB5]">
            <div className="flex items-center gap-1.5 font-bold text-[#14171F]">
              <MapPin className="w-3.5 h-3.5 text-[#B08D3E] shrink-0" /><span>{location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 shrink-0" /><span>Deposited: {formattedExactDate} ({formatTimeAgo(complaint.createdAt)})</span>
            </div>
            <div className="flex items-center gap-1.5 ml-auto text-[#B08D3E] font-bold">
              <Lock className="w-4 h-4" /><span>Zero-Knowledge Decoupled</span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-8">
          <StatusTimeline currentStatus={complaint.status} submittedAt={complaint.createdAt} statusUpdates={statusUpdates} resolvedAt={complaint.resolvedAt} />
        </div>

        {/* Grievance Statement */}
        <div className="mb-8">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#5B6472] mb-2">Detailed Statement of Grievance</h2>
          <div className="bg-white/60 border border-[#D9CEB5] p-6">
            <p className="text-base sm:text-lg text-[#14171F] leading-relaxed whitespace-pre-line" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>{complaint.description}</p>
          </div>
        </div>

        {/* Resolution Notes */}
        {isResolved && complaint.resolutionNotes && (
          <div className="mb-8">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#5B6472] mb-2">Official Resolution</h2>
            <div className="border border-[#5B7D5B]/40 bg-[#5B7D5B]/5 p-4">
              <p className="font-mono text-xs text-[#14171F]/80 leading-relaxed bg-white/60 border border-[#5B7D5B]/30 p-4 whitespace-pre-line">{complaint.resolutionNotes}</p>
            </div>
          </div>
        )}

        {/* Evidence Photo */}
        {complaint.photoUrl && (
          <div className="mb-8">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#5B6472] mb-2">Attached Photographic Evidence</h2>
            <div onClick={() => onOpenImage?.(complaint.photoUrl!, `${compId} - ${formatCategoryLabel(complaint.category)}`)} className="group bg-[#0B0C0F] border border-[#2A2F3E] p-3 cursor-pointer overflow-hidden max-w-lg">
              <img src={complaint.photoUrl} alt="Complaint Evidence" className="max-h-72 w-full object-contain mx-auto group-hover:opacity-90 transition-opacity" referrerPolicy="no-referrer" />
              <div className="mt-2 text-center text-xs font-mono text-[#E8DFC8] flex items-center justify-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#B08D3E]" /><span>Click to inspect high-resolution evidence</span><ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
              </div>
            </div>
          </div>
        )}

        {/* Upvote & Action Bar */}
        <div className="pt-6 border-t border-[#D9CEB5] flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            id={`public-upvote-btn-${compId}`}
            type="button"
            disabled={complaint.hasUpvoted}
            onClick={handleUpvote}
            className={`px-6 py-3 text-xs font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer flex items-center justify-center gap-2.5 ${complaint.hasUpvoted ? 'bg-[#5B7D5B] text-[#E8DFC8] border-[#5B7D5B]' : 'bg-[#14171F] text-[#E8DFC8] hover:bg-[#0B0C0F] border-[#14171F]'}`}
          >
            {complaint.hasUpvoted ? <span>{complaint.upvoteCount} — Endorsed</span> : <span>Endorse Grievance ({complaint.upvoteCount || 0})</span>}
          </button>
          <button
            type="button"
            onClick={copyShareLink}
            className={`px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider border transition-colors text-center cursor-pointer ${copyState === 'copied' ? 'bg-[#5B7D5B] text-[#E8DFC8] border-[#5B7D5B]' : 'bg-transparent text-[#5B6472] border-[#D9CEB5] hover:border-[#5B6472]'}`}
          >
            <Link2 className="w-3.5 h-3.5 inline-block mr-1" />{copyState === 'copied' ? 'Link Copied' : 'Share Public Link'}
          </button>
        </div>
      </div>
    </div>
  );
};
