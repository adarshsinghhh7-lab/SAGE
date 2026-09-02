import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  MapPin, 
  Lock, 
  Image as ImageIcon, 
  FileText, 
  ArrowBigUp, 
  Save, 
  Calendar, 
  Layers 
} from 'lucide-react';
import { Complaint, ComplaintStatus } from '../types';
import { getCategoryBadgeStyle, getStatusBadgeStyle, formatCategoryLabel, formatStatusLabel, formatTimeAgo } from '../utils/formatters';

interface AdminComplaintModalProps {
  complaint: Complaint | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, newStatus: ComplaintStatus, resolutionNotes: string) => void;
  onOpenImage?: (imageUrl: string, title: string) => void;
}

export const AdminComplaintModal: React.FC<AdminComplaintModalProps> = ({
  complaint,
  isOpen,
  onClose,
  onSave,
  onOpenImage,
}) => {
  if (!isOpen || !complaint) return null;

  const compId = complaint.complaintId || complaint.id || 'SAGE-0000';
  const location = complaint.hostelOrLocation || complaint.location || 'Campus General';
  const upvoteCount = complaint.upvoteCount !== undefined ? complaint.upvoteCount : (complaint.upvotes || 0);
  const urgencyScore = complaint.urgencyScore !== undefined ? complaint.urgencyScore : 0;

  const [status, setStatus] = useState<ComplaintStatus>(
    (complaint.status || 'submitted').toLowerCase().replace(' ', '_') as ComplaintStatus
  );
  const [resolutionNotes, setResolutionNotes] = useState<string>(complaint.resolutionNotes || '');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Sync state when complaint changes
  useEffect(() => {
    setStatus((complaint.status || 'submitted').toLowerCase().replace(' ', '_') as ComplaintStatus);
    setResolutionNotes(complaint.resolutionNotes || '');
    setSaveSuccess(false);
  }, [complaint]);

  const catStyle = getCategoryBadgeStyle(complaint.category);
  const statusStyle = getStatusBadgeStyle(status, urgencyScore >= 0.75 ? 'Urgent' : complaint.urgency);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(compId, status, resolutionNotes.trim());
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  const formattedExactDate = new Date(complaint.createdAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-[#FAF9F6] border-3 border-[#1C1C1C] max-w-2xl w-full shadow-[8px_8px_0px_0px_#1C1C1C] my-8 overflow-hidden text-[#1C1C1C]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="bg-[#1C1C1C] text-[#FAF9F6] px-5 py-4 flex items-center justify-between border-b-2 border-[#1C1C1C]">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-sm tracking-wider bg-red-700 text-white px-2.5 py-0.5">
              ADMIN ESCALATION DESK
            </span>
            <span className="font-mono text-xs opacity-75 hidden sm:inline">
              Complaint Record Management
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-stone-300 hover:text-white p-1 hover:bg-stone-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Identity & Status Tag Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b-2 border-[#1C1C1C]/15">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono font-bold text-lg bg-[#1C1C1C] text-[#FAF9F6] px-3 py-1 tracking-wider select-all">
                {compId}
              </span>

              <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase px-2.5 py-1 border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${catStyle.indicator}`} />
                {formatCategoryLabel(complaint.category)}
              </span>

              {(urgencyScore >= 0.75 || complaint.urgency === 'Urgent') && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold uppercase px-2 py-0.5 bg-red-100 text-red-950 border border-red-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                  Urgent Priority
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-[#1C1C1C]/70">
              <ArrowBigUp className="w-4 h-4 text-emerald-800" />
              <span className="font-bold">{upvoteCount} Student Endorsements</span>
            </div>
          </div>

          {/* Anonymity Banner */}
          <div className="bg-stone-100 border border-[#1C1C1C]/30 p-3 flex items-center gap-2.5 text-xs font-mono text-[#1C1C1C]/80">
            <Lock className="w-4 h-4 text-red-700 shrink-0" />
            <span>
              <strong>Cryptographically Anonymous:</strong> Submitter identity is AES-256 encrypted. Status updates commit immutably to <code className="font-mono bg-stone-200 px-1">statusUpdates</code>.
            </span>
          </div>

          {/* Location and Date Submitted */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white border-2 border-[#1C1C1C] p-4 shadow-[2px_2px_0px_0px_#1C1C1C]">
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1C1C1C]/60 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-red-700" />
                Hostel / Incident Location
              </div>
              <p className="font-mono text-xs font-bold text-[#1C1C1C]">
                {location}
              </p>
            </div>

            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1C1C1C]/60 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#1C1C1C]" />
                Date & Time Submitted
              </div>
              <p className="font-mono text-xs text-[#1C1C1C]">
                {formattedExactDate} ({formatTimeAgo(complaint.createdAt)})
              </p>
            </div>
          </div>

          {/* Deposition Description */}
          <div>
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#1C1C1C] mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-red-700" />
              Statement of Grievance
            </label>
            <div className="bg-white border-2 border-[#1C1C1C] p-4 text-sm font-serif leading-relaxed text-[#1C1C1C] max-h-48 overflow-y-auto whitespace-pre-line shadow-[2px_2px_0px_0px_#1C1C1C]">
              {complaint.description}
            </div>
          </div>

          {/* Attached Evidence Photo */}
          {complaint.photoUrl && (
            <div>
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#1C1C1C] mb-1.5 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-red-700" />
                Attached Photographic Evidence
              </label>
              <div 
                onClick={() => onOpenImage && onOpenImage(complaint.photoUrl!, `${compId} - ${complaint.category}`)}
                className="bg-[#1C1C1C] p-2.5 border-2 border-[#1C1C1C] cursor-pointer max-w-sm group shadow-[2px_2px_0px_0px_#1C1C1C]"
              >
                <img
                  src={complaint.photoUrl}
                  alt="Incident Photo"
                  className="max-h-40 w-full object-contain mx-auto group-hover:opacity-90 transition-opacity"
                  referrerPolicy="no-referrer"
                />
                <div className="text-center text-[10px] font-mono text-[#FAF9F6] mt-1.5 flex items-center justify-center gap-1">
                  <span>Click to view full-resolution evidence</span>
                </div>
              </div>
            </div>
          )}

          {/* Administrative Action Box */}
          <div className="bg-stone-50 border-2 border-[#1C1C1C] p-5 space-y-4 shadow-[3px_3px_0px_0px_#1C1C1C]">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#1C1C1C] flex items-center gap-2 border-b border-[#1C1C1C]/20 pb-2">
              <Layers className="w-4 h-4 text-red-700" />
              Administrative Disposition & Resolution Controls
            </div>

            {/* Status Update Dropdown */}
            <div>
              <label htmlFor="admin-status-select" className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#1C1C1C] mb-1">
                Grievance Status <span className="text-red-700">*</span>
              </label>
              <div className="flex items-center gap-3">
                <select
                  id="admin-status-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ComplaintStatus)}
                  className={`w-full sm:w-64 bg-white border-2 border-[#1C1C1C] p-2.5 text-xs font-mono font-bold focus:outline-none cursor-pointer ${statusStyle.bg} ${statusStyle.text}`}
                >
                  <option value="submitted">Submitted (Pending Review)</option>
                  <option value="under_review">Under Review (Assigned / Investigating)</option>
                  <option value="resolved">Resolved (Remedy Completed)</option>
                </select>

                <span className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-bold uppercase border-2 ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                  <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
                  {formatStatusLabel(status)}
                </span>
              </div>
            </div>

            {/* Optional Resolution Notes Field */}
            <div>
              <label htmlFor="admin-resolution-notes" className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#1C1C1C] mb-1">
                Administrative Resolution Notes (Appended to statusUpdates)
              </label>
              <textarea
                id="admin-resolution-notes"
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Log dispatched departments (e.g. Electrical, Mess Warden, Proctor), work order IDs, contractor notes, or resolution confirmation details..."
                className="w-full bg-white border-2 border-[#1C1C1C] p-3 text-xs font-mono text-[#1C1C1C] placeholder:text-[#1C1C1C]/40 focus:outline-none focus:bg-stone-50"
              />
              <p className="text-[10px] font-mono text-[#1C1C1C]/60 mt-1">
                Resolution notes will be committed to the Firestore statusUpdates collection.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#1C1C1C] bg-white hover:bg-stone-200 transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#1C1C1C]"
            >
              Cancel
            </button>

            <button
              id="admin-save-complaint-btn"
              type="submit"
              className="px-6 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#1C1C1C] bg-[#1C1C1C] text-[#FAF9F6] hover:bg-red-700 transition-all flex items-center gap-2 cursor-pointer shadow-[3px_3px_0px_0px_#1C1C1C] hover:translate-x-[-1px] hover:translate-y-[-1px]"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                  <span>Ledger Updated!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Disposition</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
