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
    <div className="bg-surface border border-line rounded-2xl p-6 sm:p-7 shadow-soft paper-grain">
      <div className="s-eyebrow mb-5">
        <Clock className="w-3.5 h-3.5" />
        <span>Disposition Timeline</span>
      </div>

      <div className="relative">
        <div className="absolute top-10 left-11 w-0.5 bg-line sm:hidden" style={{ height: 'calc(100% - 2.5rem)' }} />
        <div className="absolute top-5 left-6 right-6 hidden sm:block h-0.5 bg-line rounded-full" />
        <motion.div
          className="absolute top-5 left-6 hidden sm:block h-0.5 bg-bronze rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: `${progressFraction * 100}%` }}
          transition={prefersReduced ? instantFade : paperSpring}
          style={{ maxWidth: 'calc(100% - 3rem)' }}
        />

        <ol className="relative flex flex-col sm:flex-row sm:justify-between gap-6 sm:gap-0">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx <= currentIndex || (currentIndex === -1 && idx === 0);
            const isCurrent = idx === currentIndex;
            const resolved = resolveStageTimestamp(stage.key, submittedAt, resolvedAt, statusUpdates);
            const timestamp = resolved.timestamp;

            const dotClass = isCurrent
              ? 'bg-bronze border-bronze text-surface shadow-lift'
              : isCompleted
              ? 'bg-accent border-accent text-surface'
              : 'bg-surface border-line-strong text-ink-faint';
            const labelClass = isCurrent
              ? 'text-bronze-deep'
              : isCompleted
              ? 'text-accent-deep'
              : 'text-ink-faint';

            return (
              <motion.li
                key={stage.key}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={prefersReduced ? instantFade : { ...paperSpring, delay: idx * 0.08 }}
                className="relative z-10 flex-1 flex flex-col sm:items-center sm:text-center px-1"
              >
                <div className={`relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center mb-3 shadow-soft ${dotClass}`}>
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
                <span className="hidden sm:block text-[10px] text-ink-faint mb-1">{stage.description}</span>
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${timestamp ? (isCurrent ? 'bg-bronze-soft text-bronze-deep font-bold' : 'text-ink-soft') : 'text-ink-faint/60 italic'}`}>
                  {timestamp ? formatExactTimestamp(timestamp) : 'Pending'}
                </span>
                <span className="text-[9px] font-mono text-ink-faint/60 mt-0.5">{timestamp ? formatTimeAgo(timestamp) : '—'}</span>
              </motion.li>
            );
          })}
        </ol>
      </div>

      <div className="mt-6 pt-4 border-t border-line flex items-start gap-1.5 text-[10px] font-mono text-ink-faint">
        <Clock className="w-3 h-3 shrink-0 mt-0.5" />
        <span>
          Timestamps reflect immutable transitions recorded in the <span className="font-bold text-ink-soft">statusUpdates</span> collection.
        </span>
      </div>
    </div>
  );
};
