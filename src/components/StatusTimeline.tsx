import React from 'react';
import { Check, Clock, FileText, Search, CheckCircle2 } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { paperSpring, instantFade } from '../motion/tokens';
import { ComplaintStatus, StatusUpdateDoc } from '../types';
import { formatTimeAgo } from '../utils/formatters';

interface StatusTimelineProps {
  currentStatus: ComplaintStatus;
  submittedAt: string;
  statusUpdates?: StatusUpdateDoc[];
  resolvedAt?: string;
}

interface StageMeta {
  key: 'submitted' | 'under_review' | 'resolved';
  label: string;
  description: string;
  icon: React.ReactNode;
}

function normalizeStatus(status: string): string {
  return (status || '').toLowerCase().replace(/[\s_]+/g, '_');
}

function resolveStageTimestamp(
  stage: 'submitted' | 'under_review' | 'resolved',
  submittedAt: string,
  resolvedAt: string | undefined,
  statusUpdates: StatusUpdateDoc[]
): { timestamp: string; fromLedger: boolean } {
  if (stage === 'submitted') return { timestamp: submittedAt, fromLedger: false };
  const matching = statusUpdates
    .filter((u) => normalizeStatus(u.newStatus) === stage)
    .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
  if (matching.length > 0 && matching[0].timestamp) return { timestamp: matching[0].timestamp, fromLedger: true };
  if (stage === 'resolved' && resolvedAt) return { timestamp: resolvedAt, fromLedger: false };
  return { timestamp: '', fromLedger: false };
}

function formatExactTimestamp(iso: string): string {
  if (!iso) return 'Pending';
  try {
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Pending';
  }
}

const STAGES: StageMeta[] = [
  { key: 'submitted', label: 'Submitted', description: 'Deposition recorded in the ledger', icon: <FileText className="w-4 h-4" /> },
  { key: 'under_review', label: 'Under Review', description: 'Admin assigned & scrutinising', icon: <Search className="w-4 h-4" /> },
  { key: 'resolved', label: 'Resolved', description: 'Disposition & remedy concluded', icon: <CheckCircle2 className="w-4 h-4" /> },
];

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ currentStatus, submittedAt, statusUpdates = [], resolvedAt }) => {
  const prefersReduced = useReducedMotion();
  const currentStage = normalizeStatus(currentStatus);
  const currentIndex = STAGES.findIndex((s) => s.key === currentStage);
  const progressFraction = currentIndex === -1 ? 0 : currentIndex / (STAGES.length - 1);

  return (
    <div className="bg-[#EBE3D0] border border-[#DDD4BD] p-6 paper-grain" style={{ boxShadow: '0 1px 2px rgba(11,12,15,0.12), 0 1px 1px rgba(11,12,15,0.08)' }}>
      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#68707E] mb-5">
        Disposition Timeline
      </div>

      <div className="relative">
        {/* Vertical connector line for mobile */}
        <div className="absolute top-10 left-11 w-0.5 bg-[#DDD4BD] sm:hidden" style={{ height: 'calc(100% - 2.5rem)' }} />
        {/* Connector line (desaturated) */}
        <div className="absolute top-5 left-6 right-6 hidden sm:block h-0.5 bg-[#DDD4BD]" />
        {/* Filled progress up to current stage */}
        <motion.div
          className="absolute top-5 left-6 hidden sm:block h-0.5 bg-[#B59340]"
          initial={{ width: '0%' }}
          animate={{ width: `${progressFraction * 100}%` }}
          transition={prefersReduced ? instantFade : paperSpring}
          style={{ maxWidth: 'calc(100% - 3rem)' }}
        />

        <ol className="relative flex flex-col sm:flex-row sm:justify-between gap-4 sm:gap-0">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx <= currentIndex || currentIndex === -1 && idx === 0;
            const isCurrent = idx === currentIndex;
            const resolved = resolveStageTimestamp(stage.key, submittedAt, resolvedAt, statusUpdates);
            const timestamp = resolved.timestamp;

            const dotClass = isCurrent
              ? 'bg-[#B59340] border-[#B59340] text-[#151820]'
              : isCompleted
              ? 'bg-[#5B7D5B] border-[#5B7D5B] text-[#EBE3D0]'
              : 'bg-[#EBE3D0] border-[#DDD4BD] text-[#68707E]';
            const labelClass = isCurrent
              ? 'text-[#B59340]'
              : isCompleted
              ? 'text-[#5B7D5B]'
              : 'text-[#68707E]';

            return (
              <motion.li
                key={stage.key}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={prefersReduced ? instantFade : { ...paperSpring, delay: idx * 0.08 }}
                className="relative z-10 flex-1 flex flex-col sm:items-center sm:text-center px-1"
              >
                <div className={`relative z-10 w-10 h-10 rounded-full border flex items-center justify-center mb-3 ${dotClass}`}>
                  {isCompleted && (
                    <motion.span
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={prefersReduced ? instantFade : { ...paperSpring, delay: 0.3 + idx * 0.08 }}
                      className="flex items-center justify-center"
                    >
                      {isCompleted && !isCurrent ? <Check className="w-4 h-4" /> : stage.icon}
                    </motion.span>
                  ) || stage.icon}
                </div>

                <span className={`text-xs font-mono font-bold uppercase tracking-wider mb-1 ${labelClass}`}>{stage.label}</span>
                <span className="hidden sm:block text-[10px] text-[#68707E] mb-1">{stage.description}</span>
                <span className={`text-[11px] font-mono ${timestamp ? (isCurrent ? 'text-[#B59340] font-bold' : 'text-[#68707E]') : 'text-[#68707E]/40 italic'}`}>
                  {timestamp ? formatExactTimestamp(timestamp) : 'Pending'}
                </span>
                <span className="text-[9px] font-mono text-[#68707E]/50 mt-0.5">{timestamp ? formatTimeAgo(timestamp) : '—'}</span>
              </motion.li>
            );
          })}
        </ol>
      </div>

      <div className="mt-5 pt-3 border-t border-[#DDD4BD] flex items-start gap-1.5 text-[10px] font-mono text-[#68707E]">
        <Clock className="w-3 h-3 shrink-0 mt-0.5" />
        <span>
          Timestamps reflect immutable transitions recorded in the <span className="font-bold text-[#151820]/70">statusUpdates</span> collection.
        </span>
      </div>
    </div>
  );
};
