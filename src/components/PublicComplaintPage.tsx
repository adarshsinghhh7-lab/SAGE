import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowBigUp,
  MapPin,
  Clock,
  Check,
  Image as ImageIcon,
  ExternalLink,
  CheckCircle2,
  ShieldCheck,
  Share2,
  Link2,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { Complaint, StatusUpdateDoc } from '../types';
import {
  getCategoryBadgeStyle,
  getStatusBadgeStyle,
  formatCategoryLabel,
  formatStatusLabel,
  formatTimeAgo,
} from '../utils/formatters';
import { ApiService, normalizeComplaintData } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusTimeline } from './StatusTimeline';

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
  const { activeRole } = useAuth();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdateDoc[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [upvoting, setUpvoting] = useState<boolean>(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [toast, setToast] = useState<string | null>(null);

  // Public, shareable deep link: #/complaint/:id
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
        if (!comp) {
          setNotFound(true);
          setComplaint(null);
          setStatusUpdates([]);
        } else {
          setComplaint(normalizeComplaintData(comp));
          setStatusUpdates(updates);
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [complaintId]);

  const compId = complaintId;
  const location = complaint?.hostelOrLocation || complaint?.location || 'Campus General';
  const upvoteCount =
    complaint?.upvoteCount !== undefined ? complaint.upvoteCount : complaint?.upvotes || 0;
  const urgencyScore = complaint?.urgencyScore !== undefined ? complaint.urgencyScore : 0;
  const isResolved = complaint && complaint.status.toLowerCase().replace(' ', '_') === 'resolved';

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

  const handleUpvote = async () => {
    if (!complaint || complaint.hasUpvoted || upvoting) return;
    setUpvoting(true);
    // Optimistic UI update (same pattern as the feed page)
    setComplaint((prev) =>
      prev
        ? {
            ...prev,
            hasUpvoted: true,
            upvoteCount: (prev.upvoteCount ?? prev.upvotes ?? 0) + 1,
            upvotes: (prev.upvoteCount ?? prev.upvotes ?? 0) + 1,
          }
        : prev
    );
    try {
      const result = await ApiService.upvoteComplaint(compId, activeRole);
      setComplaint(normalizeComplaintData(result.complaint, true));
      setToast(
        result.alreadyUpvoted
          ? 'This grievance was already endorsed by you.'
          : 'Grievance endorsed. Vote recorded anonymously.'
      );
    } catch {
      // rollback on failure
      setComplaint((prev) =>
        prev
          ? {
              ...prev,
              hasUpvoted: false,
              upvoteCount: Math.max(0, (prev.upvoteCount ?? prev.upvotes ?? 0) - 1),
              upvotes: Math.max(0, (prev.upvoteCount ?? prev.upvotes ?? 0) - 1),
            }
          : prev
      );
      setToast('Endorsement failed. Please try again.');
    } finally {
      setUpvoting(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center text-slate-900">
        <div className="inline-flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs font-mono uppercase tracking-wider text-slate-900/60">
            Retrieving deposition from ledger…
          </p>
        </div>
      </div>
    );
  }

  if (notFound || !complaint) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center text-slate-900">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-10 shadow-md max-w-md mx-auto">
          <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-indigo-600" />
          </div>
          <h2 className="font-sans text-2xl font-bold mb-2">Deposition Not Found</h2>
          <p className="text-xs font-mono text-slate-900/70 mb-2">
            Tracking ID: <span className="font-bold text-indigo-600">{compId}</span>
          </p>
          <p className="text-xs font-mono text-slate-900/60 mb-6">
            The requested complaint record could not be retrieved from the ledger. Verify the
            tracking ID and try again.
          </p>
          <button
            type="button"
            onClick={onExit}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-mono font-bold uppercase border border-slate-200 rounded-lg cursor-pointer shadow-sm"
          >
            Return to Public Ledger
          </button>
        </div>
      </div>
    );
  }

  const catStyle = getCategoryBadgeStyle(complaint.category);
  const statusStyle = getStatusBadgeStyle(
    complaint.status,
    urgencyScore >= 0.75 ? 'Urgent' : complaint.urgency
  );
  const isHighPriority =
    (urgencyScore >= 0.75 || complaint.urgency === 'Urgent') &&
    complaint.status.toLowerCase().replace(' ', '_') !== 'resolved';

  const formattedExactDate = new Date(complaint.createdAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });


  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6 text-slate-900">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-slate-900 text-white text-xs font-mono font-bold uppercase tracking-wider shadow-md">
          {toast}
        </div>
      )}

      {/* Navigation Breadcrumb */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-900 border border-slate-200 rounded-lg bg-white hover:bg-slate-200 transition-colors cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Public Ledger</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-900/60 hidden sm:inline">
            Shared Public Link
          </span>
          <button
            type="button"
            onClick={copyShareLink}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-bold uppercase border border-slate-200 rounded-lg transition-colors cursor-pointer shadow-sm ${
              copyState === 'copied' ? 'bg-emerald-700 text-white' : 'bg-slate-50 hover:bg-slate-100'
            }`}
            title="Copy public tracking link"
          >
            {copyState === 'copied' ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Link Copied</span>
              </>
            ) : (
              <>
                <Link2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Detail Container */}
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
                {formatCategoryLabel(complaint.category)}
              </span>

              {isHighPriority && (
                <span className="inline-flex items-center gap-1 text-xs font-mono font-bold uppercase px-2.5 py-1 bg-red-100 text-red-950 border border-red-600 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                  High Priority
                </span>
              )}

              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold uppercase border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
                {formatStatusLabel(complaint.status)}
              </span>
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

        {/* Visual Status Timeline */}
        <div className="mb-8">
          <StatusTimeline
            currentStatus={complaint.status}
            submittedAt={complaint.createdAt}
            statusUpdates={statusUpdates}
            resolvedAt={complaint.resolvedAt}
          />
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

        {/* Official Administrative Resolution Notes (only shown when resolved) */}
        {isResolved && complaint.resolutionNotes && (
          <div className="mb-8 bg-emerald-50/60 border border-emerald-800/40 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-800" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-950">
                Resolution Notes
              </h2>
              <span className="ml-auto text-[10px] font-mono font-bold uppercase bg-emerald-700 text-white px-2 py-0.5">
                Resolved
              </span>
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
              onClick={() => onOpenImage?.(complaint.photoUrl!, `${compId} - ${formatCategoryLabel(complaint.category)}`)}
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

        {/* Upvote & Action Bar */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              id={`public-upvote-btn-${compId}`}
              type="button"
              disabled={complaint.hasUpvoted || upvoting}
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
                  <span>{upvoting ? 'Recording…' : `Endorse Grievance (${upvoteCount} Upvotes)`}</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={copyShareLink}
              className="w-full sm:w-auto px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider border border-slate-200 rounded-lg bg-white hover:bg-slate-100 transition-colors text-center cursor-pointer shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5 inline-block mr-1" />
              Share Public Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


