import React, { useState } from 'react';
import {
  MapPin,
  Clock,
  ArrowRight,
  Link2
} from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'motion/react';
import { Complaint } from '../types';
import { getCategoryBadgeStyle, getCategoryTabColor, formatCategoryLabel, formatTimeAgo } from '../utils/formatters';
import { TallyMarks, ComplaintIdStamp, PriorityStamp } from './CaseFileComponents';
import { paperSpring, microTap, instantFade } from '../motion/tokens';
import { useCanHover } from '../hooks/useMediaQuery';

/* Warm-tinted shadow values for framer-motion animation (can't interpolate CSS vars) */
const RESTING_SHADOW = '0 1px 2px rgba(11,12,15,0.12), 0 1px 1px rgba(11,12,15,0.08)';
const RAISED_SHADOW = '0 4px 10px rgba(11,12,15,0.18), 0 2px 4px rgba(11,12,15,0.10)';

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
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const prefersReduced = useReducedMotion();
  const canHover = useCanHover();

  // 3D tilt â€” cursor position drives a subtle rotateX/rotateY via spring physics
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rotateX = useSpring(
    useTransform(tiltY, [-0.5, 0.5], [(prefersReduced || !canHover) ? 0 : 4, (prefersReduced || !canHover) ? 0 : -4]),
    { stiffness: 300, damping: 30 },
  );
  const rotateY = useSpring(
    useTransform(tiltX, [-0.5, 0.5], [(prefersReduced || !canHover) ? 0 : -4, (prefersReduced || !canHover) ? 0 : 4]),
    { stiffness: 300, damping: 30 },
  );

  const handleMouseMove = (e: React.MouseEvent) => {
    if (prefersReduced || !canHover) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    tiltX.set(xPct);
    tiltY.set(yPct);
  };

  const handleMouseLeave = () => {
    tiltX.set(0);
    tiltY.set(0);
    setIsHovered(false);
  };
  const compId = complaint.complaintId || complaint.id || 'SAGE-0000';
  const location = complaint.hostelOrLocation || complaint.location || 'Campus General';
  const upvoteCount = complaint.upvoteCount !== undefined ? complaint.upvoteCount : (complaint.upvotes || 0);
  const urgencyScore = complaint.urgencyScore !== undefined ? complaint.urgencyScore : 0;

  const catStyle = getCategoryBadgeStyle(complaint.category);

  const isHighPriority = (urgencyScore >= 0.75 || complaint.urgency === 'Urgent') && complaint.status.toLowerCase() !== 'resolved';

  const normStatus = (complaint.status || '').toLowerCase().replace(' ', '_');
  const isUrgent = complaint.urgency === 'Urgent' && normStatus !== 'resolved';

  const descriptionPreview = complaint.description.length > 140
    ? `${complaint.description.slice(0, 140).trim()}...`
    : complaint.description;

  const handleUpvoteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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
      variants={{
        hidden: { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0, transition: prefersReduced ? instantFade : paperSpring },
        exit: { opacity: 0, transition: prefersReduced ? instantFade : { duration: 0.15 } },
      }}
      whileHover={{ borderColor: '#B08D3E', boxShadow: RAISED_SHADOW, transition: prefersReduced ? instantFade : paperSpring }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ boxShadow: isHovered ? RAISED_SHADOW : RESTING_SHADOW }}
      transition={prefersReduced ? instantFade : paperSpring}
      className="relative bg-[#E8DFC8] border border-[#D9CEB5] p-4 sm:p-5 cursor-pointer group paper-grain stacked-papers"
      style={{
        borderLeftWidth: '10px',
        borderLeftColor: getCategoryTabColor(complaint.category),
        rotateX,
        rotateY,
        transformPerspective: 800,
      }}
    >
      {isHighPriority && <PriorityStamp />}

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
            {formatCategoryLabel(complaint.category)}
          </span>
          {isUrgent && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-[0.1em] border-[1.5px] border-[#A6352C] text-[#A6352C]" style={{ transform: 'rotate(-1deg)' }}>
              URGENT
            </span>
          )}
        </div>
        <ComplaintIdStamp id={compId} />
      </div>

      <p className="text-sm text-[#14171F]/80 leading-relaxed mb-3 line-clamp-3" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
        {descriptionPreview}
      </p>

      <div className="flex items-center gap-3 text-[10px] text-[#5B6472] font-mono mb-3">
        <span className="inline-flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {location}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatTimeAgo(complaint.createdAt)}
        </span>
      </div>

      <div className="pt-3 border-t border-[#D9CEB5] flex items-center justify-between gap-3">
        <motion.button
          id={`upvote-btn-${compId}`}
          type="button"
          disabled={complaint.hasUpvoted}
          whileTap={prefersReduced ? {} : { scale: 0.97, transition: microTap }}
          onClick={handleUpvoteClick}
          className={`inline-flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border ${
            complaint.hasUpvoted
              ? 'bg-[#5B7D5B] text-[#E8DFC8] border-[#5B7D5B]'
              : 'bg-transparent text-[#5B6472] border-[#D9CEB5] hover:border-[#B08D3E] hover:text-[#14171F]'
          }`}
        >
          <TallyMarks count={upvoteCount} />
          <span className="text-[9px]">{complaint.hasUpvoted ? 'Endorsed' : 'Upvote'}</span>
        </motion.button>

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={handleCopyLink}
            className={`inline-flex items-center gap-1 px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer ${
              linkCopied
                ? 'bg-[#5B7D5B] text-[#E8DFC8] border-[#5B7D5B]'
                : 'bg-transparent text-[#5B6472] border-[#D9CEB5] hover:border-[#B08D3E]'
            }`}
            title="Copy public tracking link"
          >
            <Link2 className="w-3 h-3" />
            <span>{linkCopied ? 'Copied' : 'Share'}</span>
          </button>

          <div className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase text-[#5B6472] group-hover:text-[#B08D3E] transition-colors">
            <span>View Deposition</span>
            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </motion.article>
  );
};
