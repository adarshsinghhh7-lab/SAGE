import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  MapPin,
  Lock,
  Image as ImageIcon,
  FileText,
  Save,
  Calendar,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Complaint, ComplaintStatus } from '../types';
import { heavyDrawer, instantFade } from '../motion/tokens';
import { getCategoryBadgeStyle, formatCategoryLabel, formatTimeAgo } from '../utils/formatters';
import { ComplaintIdStamp, StatusStamp } from './CaseFileComponents';

interface AdminComplaintModalProps {
  complaint: Complaint | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, newStatus: ComplaintStatus, resolutionNotes: string) => void;
  onOpenImage?: (imageUrl: string, title: string) => void;
}

export const AdminComplaintModal: React.FC<AdminComplaintModalProps> = ({ complaint, isOpen, onClose, onSave, onOpenImage }) => {
  const prefersReduced = useReducedMotion();
  if (!isOpen || !complaint) return null;

  const compId = complaint.complaintId || complaint.id || 'SAGE-0000';
  const location = complaint.hostelOrLocation || complaint.location || 'Campus General';

  const [status, setStatus] = useState<ComplaintStatus>((complaint.status || 'submitted').toLowerCase().replace(' ', '_') as ComplaintStatus);
  const [resolutionNotes, setResolutionNotes] = useState<string>(complaint.resolutionNotes || '');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    setStatus((complaint.status || 'submitted').toLowerCase().replace(' ', '_') as ComplaintStatus);
    setResolutionNotes(complaint.resolutionNotes || '');
    setSaveSuccess(false);
  }, [complaint]);

  const catStyle = getCategoryBadgeStyle(complaint.category);
  const normStatus = (status || 'submitted').toLowerCase().replace(' ', '_');
  const statusColor = normStatus === 'resolved' ? '#5B7D5B' : normStatus === 'under_review' ? '#B08D3E' : '#5B6472';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(compId, status, resolutionNotes.trim());
    setSaveSuccess(true);
    setTimeout(() => { setSaveSuccess(false); onClose(); }, 800);
  };

  const formattedExactDate = new Date(complaint.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={prefersReduced ? instantFade : { duration: 0.15 }} className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 sm:p-6 overflow-y-auto modal-depth-backdrop" onClick={onClose}>
        <motion.div initial={{ opacity: 0, scale: 0.94, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 10 }} transition={prefersReduced ? instantFade : heavyDrawer} className="bg-[#E8DFC8] border border-[#D9CEB5] max-w-2xl w-full sm:my-8 mx-0 overflow-hidden paper-grain sm:rounded-none max-md:rounded-none max-sm:min-h-dvh max-sm:h-dvh max-sm:overflow-y-auto" style={{ boxShadow: '0 12px 28px rgba(11,12,15,0.28), 0 4px 10px rgba(11,12,15,0.14)' }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
          <div className="bg-[#0B0C0F] text-[#E8DFC8] px-5 py-4 flex items-center justify-between border-b border-[#2A2F3E]">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-[#B08D3E]" />
              <span className="font-mono font-bold text-sm uppercase tracking-wider">Complaint Disposition</span>
            </div>
            <button type="button" onClick={onClose} className="text-[#E8DFC8]/60 hover:text-[#E8DFC8] p-1 cursor-pointer" aria-label="Close modal"><X className="w-5 h-5" /></button>
          </div>

          <div className="p-6">
            {/* Header with ID and category */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <ComplaintIdStamp id={compId} className="text-lg" />
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>{formatCategoryLabel(complaint.category)}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[12px] text-[#5B6472] mb-5">
              <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0" /><span className="font-mono text-[10px]">Location: <span className="font-bold text-[#14171F]">{location}</span></span></div>
              <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 shrink-0" /><span className="font-mono text-[10px]">Filed: <span className="font-bold text-[#14171F]">{formattedExactDate}</span></span></div>
            </div>

            {/* Identity sealed motif + evidence */}
            <div className="flex flex-col sm:flex-row gap-4 mb-5">
              <div className="flex-1 flex items-center gap-2 border border-[#D9CEB5] bg-white/40 p-3">
                <Lock className="w-4 h-4 text-[#B08D3E]" />
                <div className="text-[10px] font-mono text-[#5B6472]"><span className="font-bold text-[#14171F]">Identity: sealed</span><br />AES-256 encrypted · no identity data viewable</div>
              </div>
              {complaint.photoUrl && (
                <button type="button" onClick={() => onOpenImage?.(complaint.photoUrl!, `${compId} evidence`)} className="flex items-center gap-1.5 border border-[#D9CEB5] bg-white/40 p-3 text-[10px] font-mono text-[#5B6472] hover:border-[#5B6472] cursor-pointer">
                  <ImageIcon className="w-4 h-4 text-[#B08D3E]" /> <span>Evidence</span>
                </button>
              )}
            </div>

            <div className="mb-5">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#5B6472] mb-2">Description</h2>
              <div className="bg-white/60 border border-[#D9CEB5] p-4">
                <p className="text-sm text-[#14171F] leading-relaxed whitespace-pre-line" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>{complaint.description}</p>
              </div>
              <p className="mt-2 text-[10px] font-mono text-[#5B6472]">Deposited {formatTimeAgo(complaint.createdAt)} · {complaint.upvoteCount ?? complaint.upvotes ?? 0} endorsements</p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Status Update */}
              <div className="mb-5">
                <label htmlFor="admin-status-select" className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#5B6472] mb-1">Official Status</label>
                <div className="flex items-center gap-3">
                  <select id="admin-status-select" value={status} onChange={(e) => setStatus(e.target.value as ComplaintStatus)} className="w-full sm:w-64 bg-white/70 border border-[#D9CEB5] p-2.5 text-xs font-mono font-bold text-[#14171F] focus:outline-none cursor-pointer">
                    <option value="submitted">Submitted (Pending Review)</option>
                    <option value="under_review">Under Review (Assigned / Investigating)</option>
                    <option value="resolved">Resolved (Remedy Completed)</option>
                  </select>
                  <StatusStamp status={status} color={statusColor} />
                </div>
              </div>

              {/* Resolution Notes */}
              <div className="mb-5">
                <label htmlFor="admin-resolution-notes" className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#5B6472] mb-1">Administrative Resolution Notes (Appended to statusUpdates)</label>
                <textarea id="admin-resolution-notes" rows={3} value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} placeholder="Log dispatched departments, work order IDs, contractor notes, or resolution confirmation details..." className="w-full bg-white/70 border border-[#D9CEB5] p-3 text-xs font-mono text-[#14171F] placeholder:text-[#5B6472]/60 focus:outline-none focus:border-[#B08D3E]" />
                <p className="text-[10px] font-mono text-[#5B6472] mt-1">Resolution notes will be committed to the Firestore statusUpdates collection.</p>
              </div>

              <div className="pt-3 flex items-center justify-between gap-3 border-t border-[#D9CEB5]">
                <button type="button" onClick={onClose} className="px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border border-[#D9CEB5] bg-transparent hover:border-[#5B6472] text-[#5B6472] transition-colors cursor-pointer">Cancel</button>
                <button id="admin-save-complaint-btn" type="submit" className="px-6 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border border-[#0B0C0F] bg-[#0B0C0F] text-[#E8DFC8] hover:bg-[#14171F] transition-all flex items-center gap-2 cursor-pointer">
                  {saveSuccess ? (<><Check className="w-4 h-4 text-[#5B7D5B]" /><span>Ledger Updated!</span></>) : (<><Save className="w-4 h-4" /><span>Save Disposition</span></>)}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
