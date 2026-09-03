import React, { useState } from 'react';
import {
  ArrowBigUp,
  MapPin,
  Clock,
  Image as ImageIcon,
  Check,
  ArrowRight,
  Link2
} from 'lucide-react';
import { motion } from 'motion/react';
import { Complaint } from '../types';
import { getCategoryBadgeStyle, getStatusBadgeStyle, formatCategoryLabel, formatStatusLabel, formatTimeAgo } from '../utils/formatters';

interface ComplaintCardProps {
  complaint: Complaint;
  onUpvote: (id: string) => void;
  onSelect: (complaint: Complaint) => void;
  onOpenImage?: (imageUrl: string, title: string) => void;
}

export const ComplaintCard: React.FC<ComplaintCardProps> = ({
  complaint,
  onUpvote,
  onSelect,
}) => {
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const compId = complaint.complaintId || complaint.id || 'SAGE-0000';
  const location = complaint.hostelOrLocation || complaint.location || 'Campus General';
  const upvoteCount = complaint.upvoteCount !== undefined ? complaint.upvoteCount : (complaint.upvotes || 0);
  const urgencyScore = complaint.urgencyScore !== undefined ? complaint.urgencyScore : 0;

  const catStyle = getCategoryBadgeStyle(complaint.category);
  const statusStyle = getStatusBadgeStyle(complaint.status, urgencyScore >= 0.75 ? 'Urgent' : complaint.urgency);

  const isHighPriority = (urgencyScore >= 0.75 || complaint.urgency === 'Urgent') && complaint.status.toLowerCase() !== 'resolved';

  // Short description preview (first 140 chars)
  const descriptionPreview = complaint.description.length > 140
    ? `${complaint.description.slice(0, 140).trim()}...`
    : complaint.description;

  const handleUpvoteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent opening detail page when clicking upvote
    if (!complaint.hasUpvoted) {
      onUpvote(compId);
    }
  };

  const handleCardClick = () => {
    onSelect(complaint);
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}#/complaint/${encodeURIComponent(compId)}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <motion.article
      id={`complaint-card-${compId}`}
      onClick={handleCardClick}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, boxShadow: '0 8px 30px -8px rgba(0,0,0,0.15)' }}
      transition={{ duration: 0.25 }}
      className="group glass-card p-5 sm:p-6 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top Header Row: ID, Category Tag, Status Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Complaint ID */}
            <span className="font-mono font-bold text-xs bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-2.5 py-0.5 tracking-wider rounded-lg">
              {compId}
            </span>

            {/* Color-Coded Category Tag */}
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase px-2 py-0.5 border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${catStyle.indicator}`} />
              {formatCategoryLabel(complaint.category)}
            </span>
          </div>

          {/* Color-Coded Status Badge: Yellow = Under Review, Green = Resolved, Red = High Priority */}
          <div className="flex items-center gap-1.5">
            {isHighPriority ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase border bg-red-100 text-red-950 border-red-600 shadow-md">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                <span>High Priority</span>
              </span>
            ) : (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                <span>{formatStatusLabel(complaint.status)}</span>
              </span>
            )}
          </div>
        </div>

        {/* Location & Time Info */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-mono text-slate-900/70 mb-3">
          <div className="flex items-center gap-1 font-bold text-slate-900">
            <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="truncate max-w-[240px]">{location}</span>
          </div>

          <div className="flex items-center gap-1 text-slate-900/50">
            <span>·</span>
            <Clock className="w-3 h-3 shrink-0" />
            <span>{formatTimeAgo(complaint.createdAt)}</span>
          </div>

          {complaint.photoUrl && (
            <div className="flex items-center gap-1 text-slate-900/60 ml-auto sm:ml-0">
              <span>·</span>
              <ImageIcon className="w-3 h-3 text-indigo-600 shrink-0" />
              <span className="text-[10px] uppercase font-bold">Photo Attached</span>
            </div>
          )}
        </div>

        {/* Short Description Preview */}
        <div className="text-sm font-sans text-slate-900 leading-relaxed mb-4">
          <p className="line-clamp-3 group-hover:text-black transition-colors">
            {descriptionPreview}
          </p>
        </div>
      </div>

      {/* Card Footer: Upvote Button & Detail Callout */}
      <div className="pt-3 border-t border-indigo-100/30 flex items-center justify-between gap-3 mt-1">
        {/* Upvote Button: Toggles to "Upvoted" and disables itself once clicked */}
        <button
          id={`upvote-btn-${compId}`}
          type="button"
          disabled={complaint.hasUpvoted}
          onClick={handleUpvoteClick}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider border border-indigo-100/50 rounded-xl transition-all cursor-pointer ${
            complaint.hasUpvoted
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-emerald-500 opacity-95 cursor-default shadow-none shadow-emerald-200'
              : 'bg-white text-slate-900 hover:bg-indigo-50 active:translate-y-[1px] shadow-sm'
          }`}
          title={complaint.hasUpvoted ? 'You have upvoted this grievance' : 'Click to upvote this grievance'}
        >
          {complaint.hasUpvoted ? (
            <>
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{upvoteCount}</span>
              <span className="text-[10px]">Upvoted</span>
            </>
          ) : (
            <>
              <ArrowBigUp className="w-4 h-4 stroke-[2.2]" />
              <span>{upvoteCount}</span>
              <span className="text-[10px]">Upvote</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-2 ml-auto">
          {/* Copy Public Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider border border-indigo-100/50 rounded-xl transition-all cursor-pointer ${
              linkCopied
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-emerald-500 shadow-none'
                : 'bg-white text-slate-900 hover:bg-indigo-50 shadow-sm'
            }`}
            title="Copy public tracking link"
          >
            <Link2 className="w-3 h-3" />
            <span>{linkCopied ? 'Copied' : 'Share'}</span>
          </button>

          {/* Link / Read Detail Hint */}
          <div className="inline-flex items-center gap-1 text-[11px] font-mono font-bold uppercase text-slate-900/70 group-hover:text-indigo-600 transition-colors">
            <span>View Deposition</span>
            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </motion.article>
  );
};
