import React from 'react';
import { Lock } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { getCategoryTabColor } from '../utils/formatters';
import { instantFade } from '../motion/tokens';

/* TallyMarks - SVG tally for upvote counts (hand-counted feel). Every 5th stroke is diagonal. */
export const TallyMarks: React.FC<{ count: number; className?: string }> = ({ count, className = '' }) => {
  if (count <= 0) return <span className={`font-mono text-[10px] text-ink-faint ${className}`}>0</span>;

  if (count > 20) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${className}`}>
        <span className="font-mono text-[10px] font-bold text-ink-soft">{count}</span>
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
      <svg width={totalWidth} height="16" viewBox={`0 0 ${totalWidth} 16`} fill="none" className="text-ink-soft">
        {strokes}
      </svg>
      <span className="font-mono text-[10px] text-ink-faint">{count}</span>
    </span>
  );
};

/* FolderTabCard - complaint card wrapper with category-colored folder tab on the left edge */
export const FolderTabCard: React.FC<{
  category: string;
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}> = ({ category, children, className = '', ...props }) => {
  const tabColor = getCategoryTabColor(category);
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ borderLeft: `4px solid ${tabColor}` }}
      {...props}
    >
      {children}
    </div>
  );
};

/* ComplaintIdStamp - rotated complaint ID in Plex Mono. Rotation derived from a hash of the ID. */
function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export const ComplaintIdStamp: React.FC<{ id: string; className?: string }> = ({ id, className = '' }) => {
  const hash = simpleHash(id || '');
  const rotation = ((hash % 5) - 2); // -2 to +2 degrees
  return (
    <span
      className={`font-mono text-[10px] font-bold text-ink-faint tracking-wider ${className}`}
      style={{ transform: `rotate(${rotation}deg)`, display: 'inline-block' }}
    >
      {id}
    </span>
  );
};

/* StatusStamp - soft pill treatment for status labels. */
export const StatusStamp: React.FC<{
  status: string;
  color?: string;
  className?: string;
}> = ({ status, color, className = '' }) => {
  const colorMap: Record<string, string> = {
    submitted: '#7D868F',
    under_review: '#AD8B5B',
    resolved: '#5F7A66',
    urgent: '#BC6C56',
    'under review': '#AD8B5B',
    pending: '#7D868F',
  };
  const norm = (status || '').toLowerCase().replace(/\s+/g, '_');
  const stampColor = color || colorMap[norm] || '#7D868F';

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] border rounded-full ${className}`}
      style={{
        color: stampColor,
        borderColor: `${stampColor}55`,
        background: `${stampColor}14`,
      }}
    >
      {status}
    </span>
  );
};

/* IdentitySealedBar - soft sage pill with lock icon, reinforcing anonymity.
   `isSandbox` marks demo/seed records so users can tell real sealed submissions
   apart from sandbox data. */
export const IdentitySealedBar: React.FC<{
  className?: string;
  isSandbox?: boolean;
}> = ({ className = '', isSandbox = false }) => (
  <div className={`identity-sealed-bar ${className}`}>
    <Lock className="w-3 h-3 text-current" />
    <span>Identity: server-sealed</span>
    {isSandbox && (
      <span className="ml-1.5 text-[9px] font-mono uppercase font-bold tracking-wider bg-clay-soft text-clay-deep border border-clay/40 px-1.5 py-0.5 rounded-full">
        Demo Sandbox Record
      </span>
    )}
  </div>
);

/* PriorityStamp - clay PRIORITY pill over card corner with a light spring settle. */
export const PriorityStamp: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  const prefersReduced = useReducedMotion();
  return (
    <motion.span
      initial={{ scale: 1.5, opacity: 0, rotate: -10 }}
      animate={{ scale: 1, opacity: 1, rotate: -3 }}
      transition={prefersReduced ? instantFade : { type: 'spring', stiffness: 340, damping: 20, mass: 0.6 }}
      className={`absolute -top-2 -right-2 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] border border-clay/50 text-clay-deep bg-clay-soft rounded-full shadow-lift ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-clay animate-pulse-soft" aria-hidden="true" />
      PRIORITY
    </motion.span>
  );
};
