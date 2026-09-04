import React from 'react';
import { Lock } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { getCategoryTabColor } from '../utils/formatters';
import { stampImpact, instantFade } from '../motion/tokens';

/* ───────────────────────────────────────────────────────
   TallyMark — SVG tally for upvote counts (hand-counted feel)
   Every 5th stroke is diagonal.
   ─────────────────────────────────────────────────────── */
export const TallyMarks: React.FC<{ count: number; className?: string }> = ({ count, className = '' }) => {
  if (count <= 0) return <span className={`font-mono text-[10px] text-[#5B6472] ${className}`}>0</span>;

  // Beyond 20 strokes, switch to a compact numeric display to avoid overflow
  if (count > 20) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${className}`}>
        <span className="font-mono text-[10px] font-bold">{count}</span>
      </span>
    );
  }

  const groups = Math.floor(count / 5);
  const remainder = count % 5;
  const strokes: React.ReactNode[] = [];

  for (let g = 0; g < groups; g++) {
    const x = g * 22;
    strokes.push(
      <g key={`g${g}`}>
        <line x1={x} y1="0" x2={x} y2="14" stroke="currentColor" strokeWidth="1.5" />
        <line x1={x + 4} y1="0" x2={x + 4} y2="14" stroke="currentColor" strokeWidth="1.5" />
        <line x1={x + 8} y1="0" x2={x + 8} y2="14" stroke="currentColor" strokeWidth="1.5" />
        <line x1={x + 12} y1="0" x2={x + 12} y2="14" stroke="currentColor" strokeWidth="1.5" />
        <line x1={x + 16} y1="14" x2={x + 4} y2="0" stroke="currentColor" strokeWidth="1.5" />
      </g>
    );
  }

  if (remainder > 0) {
    const x = groups * 22;
    for (let i = 0; i < remainder; i++) {
      const sx = x + i * 4;
      strokes.push(<line key={`r${i}`} x1={sx} y1="0" x2={sx} y2="14" stroke="currentColor" strokeWidth="1.5" />);
    }
  }

  const totalWidth = groups * 22 + (remainder > 0 ? remainder * 4 : 0);

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <svg
        width={totalWidth}
        height="16"
        viewBox={`0 0 ${totalWidth} 16`}
        fill="none"
        className="text-current"
      >
        {strokes}
      </svg>
      <span className="font-mono text-[10px] text-[#5B6472]">{count}</span>
    </span>
  );
};

/* ───────────────────────────────────────────────────────
   FolderTabCard — complaint card wrapper with category-colored
   folder tab on the left edge
   ─────────────────────────────────────────────────────── */
export const FolderTabCard: React.FC<{
  category: string;
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}> = ({ category, children, className = '', ...props }) => {
  const tabColor = getCategoryTabColor(category);
  return (
    <div
      className={`relative ${className}`}
      style={{ borderLeft: `10px solid ${tabColor}` }}
      {...props}
    >
      {children}
    </div>
  );
};

/* ───────────────────────────────────────────────────────
   ComplaintIdStamp — rotated complaint ID in Plex Mono,
   looks ink-stamped rather than digitally printed.
   Rotation is derived from a hash of the ID for non-uniform feel.
   ─────────────────────────────────────────────────────── */
function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export const ComplaintIdStamp: React.FC<{
  id: string;
  className?: string;
}> = ({ id, className = '' }) => {
  const hash = simpleHash(id);
  const rotation = ((hash % 5) - 2); // -2 to +2 degrees
  return (
    <span
      className={`font-mono text-[10px] font-bold text-[#5B6472] tracking-wider ${className}`}
      style={{ transform: `rotate(${rotation}deg)`, display: 'inline-block' }}
    >
      {id}
    </span>
  );
};

/* ───────────────────────────────────────────────────────
   StatusStamp — rubber-stamp treatment for status labels.
   Uppercase, bordered, slight rotation, grain overlay.
   ─────────────────────────────────────────────────────── */
export const StatusStamp: React.FC<{
  status: string;
  color?: string;
  className?: string;
}> = ({ status, color, className = '' }) => {
  const colorMap: Record<string, string> = {
    submitted: '#5B6472',
    under_review: '#B08D3E',
    resolved: '#5B7D5B',
    urgent: '#A6352C',
    'under review': '#B08D3E',
    pending: '#5B6472',
  };
  const norm = (status || '').toLowerCase().replace(/\s+/g, '_');
  const stampColor = color || colorMap[norm] || '#5B6472';

  return (
    <span
      className={`stamp-grain inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em] border-[1.5px] ${className}`}
      style={{
        color: stampColor,
        borderColor: stampColor,
        transform: 'rotate(-1deg)',
        opacity: 0.9,
        boxShadow: '0 4px 10px rgba(11,12,15,0.18), 0 2px 4px rgba(11,12,15,0.10)',
      }}
    >
      {status}
    </span>
  );
};

/* ───────────────────────────────────────────────────────
   IdentitySealedBar — the recurring visual motif reinforcing
   anonymity. Solid black bar with lock icon, labeled
   "Identity: sealed" in Plex Mono.
   ─────────────────────────────────────────────────────── */
export const IdentitySealedBar: React.FC<{
  className?: string;
}> = ({ className = '' }) => (
  <div className={`identity-sealed-bar ${className}`}>
    <Lock className="w-3 h-3 text-[#E8DFC8]/60" />
    <span>Identity: sealed</span>
  </div>
);

/* ───────────────────────────────────────────────────────
   PriorityStamp — stamp-red "PRIORITY" stamp over card corner.
   Uses stampImpact spring for a physical "thud" strike —
   scale overshoots then settles, rotation swings past
   final angle before correcting. A barely-visible impact
   flash ring sells the moment of contact.
   ─────────────────────────────────────────────────────── */
export const PriorityStamp: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  const prefersReduced = useReducedMotion();
  return (
    <motion.span
      initial={{ scale: 1.6, opacity: 0, rotate: -12 }}
      animate={{ scale: 1, opacity: 1, rotate: -8 }}
      transition={prefersReduced ? instantFade : stampImpact}
      className={`stamp-grain absolute -top-2 -right-2 z-10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] border-[1.5px] border-[#A6352C] text-[#A6352C] bg-[#E8DFC8] ${className}`}
      style={{ boxShadow: '0 4px 10px rgba(11,12,15,0.18), 0 2px 4px rgba(11,12,15,0.10)' }}
    >
      PRIORITY
      {/* Impact flash — brief opacity pulse on a ring, gone within 80ms */}
      <motion.span
        initial={{ opacity: 0.5, scale: 1 }}
        animate={{ opacity: 0, scale: 1.9 }}
        transition={prefersReduced ? instantFade : { duration: 0.08, ease: 'easeOut' }}
        className="absolute inset-0 border border-[#A6352C]/60 pointer-events-none"
        aria-hidden="true"
      />
    </motion.span>
  );
};
