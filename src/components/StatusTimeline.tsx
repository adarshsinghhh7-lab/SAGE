import React from 'react';
import { Check, CircleDot, Clock, FileText, Search, CheckCircle2 } from 'lucide-react';
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

/**
 * Utility: normalize a status value to the internal slug used across the app
 * (e.g. 'Under Review' -> 'under_review').
 */
function normalizeStatus(status: string): string {
  return (status || '').toLowerCase().replace(/[\s_]+/g, '_');
}

/**
 * Resolve the exact timestamp for a given stage from the immutable
 * `statusUpdates` ledger. The most recent transition *into* that stage wins,
 * with sensible fallbacks (submitted -> complaint.createdAt, resolved ->
 * complaint.resolvedAt).
 */
function resolveStageTimestamp(
  stage: 'submitted' | 'under_review' | 'resolved',
  submittedAt: string,
  resolvedAt: string | undefined,
  statusUpdates: StatusUpdateDoc[]
): { timestamp: string; fromLedger: boolean } {
  // Submitted always derives from the deposition timestamp.
  if (stage === 'submitted') {
    return { timestamp: submittedAt, fromLedger: false };
  }

  // Find the latest statusUpdate whose *newStatus* equals this stage.
  const matching = statusUpdates
    .filter((u) => normalizeStatus(u.newStatus) === stage)
    .sort(
      (a, b) =>
        new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
    );

  if (matching.length > 0 && matching[0].timestamp) {
    return { timestamp: matching[0].timestamp, fromLedger: true };
  }

  // Fallbacks for under_review & resolved when the ledger is empty.
  if (stage === 'resolved' && resolvedAt) {
    return { timestamp: resolvedAt, fromLedger: false };
  }

  return { timestamp: '', fromLedger: false };
}

function formatExactTimestamp(iso: string): string {
  if (!iso) return 'Pending';
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Pending';
  }
}

const STAGES: StageMeta[] = [
  {
    key: 'submitted',
    label: 'Submitted',
    description: 'Deposition recorded in the ledger',
    icon: <FileText className="w-4 h-4" />,
  },
  {
    key: 'under_review',
    label: 'Under Review',
    description: 'Admin assigned & scrutinising',
    icon: <Search className="w-4 h-4" />,
  },
  {
    key: 'resolved',
    label: 'Resolved',
    description: 'Disposition & remedy concluded',
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
];

export const StatusTimeline: React.FC<StatusTimelineProps> = ({
  currentStatus,
  submittedAt,
  statusUpdates = [],
  resolvedAt,
}) => {
  const currentStage = normalizeStatus(currentStatus);
  const currentIndex = STAGES.findIndex((s) => s.key === currentStage);

  return (
    <div className="bg-[#FAF9F6] border-2 border-[#1C1C1C] p-5 sm:p-6 shadow-[3px_3px_0px_0px_#1C1C1C]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#1C1C1C]/20">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-red-700" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1C1C1C]">
            Status Timeline
          </h2>
        </div>
        <span className="text-[10px] font-mono font-bold uppercase text-[#1C1C1C]/50">
          Submitted → Under Review → Resolved
        </span>
      </div>

      {/* Timeline Nodes */}
      <div className="relative">
        {/* Connecting rule (drawn behind the nodes) */}
        <div
          className="absolute left-[15px] right-[15px] top-5 bottom-5 border-t-2 border-dashed border-[#1C1C1C]/25 sm:left-1/2 sm:right-auto sm:w-0 sm:h-full sm:border-t-0 sm:border-l-2 sm:top-[15px] sm:bottom-[15px] sm:translate-x-[-50%]"
          aria-hidden="true"
        />

        <ol className="relative flex flex-col sm:flex-row gap-6 sm:gap-0">
          {STAGES.map((stage, idx) => {
            const isCompleted = currentIndex > idx;
            const isCurrent = currentIndex === idx;
            const isPending = currentIndex < idx;

            const { timestamp, fromLedger } = resolveStageTimestamp(
              stage.key,
              submittedAt,
              resolvedAt,
              statusUpdates
            );

            let dotClass = 'bg-stone-300 border-stone-400 text-stone-500';
            let icon = <CircleDot className="w-5 h-5" />;
            if (isCompleted) {
              dotClass = 'bg-emerald-600 border-emerald-800 text-white';
              icon = <Check className="w-5 h-5 stroke-[3]" />;
            } else if (isCurrent) {
              dotClass = 'bg-[#1C1C1C] border-[#1C1C1C] text-[#FAF9F6] ring-4 ring-[#1C1C1C]/20';
              icon = <CircleDot className="w-5 h-5" />;
            }

            const labelClass = isCurrent
              ? 'text-[#1C1C1C]'
              : isCompleted
                ? 'text-emerald-900'
                : 'text-[#1C1C1C]/45';

            return (
              <li
                key={stage.key}
                className={`relative flex-1 sm:px-2 flex flex-col items-start sm:items-center text-left sm:text-center ${
                  isPending ? 'opacity-80' : ''
                }`}
              >
                {/* Dot */}
                <div
                  className={`relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center mb-3 ${dotClass} ${
                    isCurrent ? 'shadow-[3px_3px_0px_0px_rgba(28,28,28,0.35)]' : ''
                  }`}
                >
                  {icon}
                </div>

                {/* Label */}
                <span
                  className={`text-xs font-mono font-bold uppercase tracking-wider mb-1 ${labelClass}`}
                >
                  {stage.label}
                </span>
                <span className="hidden sm:block text-[10px] font-sans text-[#1C1C1C]/50 mb-1">
                  {stage.description}
                </span>

                {/* Timestamp */}
                <span
                  className={`text-[11px] font-mono ${
                    timestamp ? (isCurrent ? 'text-red-700 font-bold' : 'text-[#1C1C1C]/70') : 'text-[#1C1C1C]/35 italic'
                  }`}
                  title={fromLedger ? 'Timestamp from statusUpdates ledger' : undefined}
                >
                  {timestamp ? formatExactTimestamp(timestamp) : 'Pending'}
                </span>
                <span className="text-[9px] font-mono text-[#1C1C1C]/40 mt-0.5">
                  {timestamp ? formatTimeAgo(timestamp) : '—'}
                </span>

                {/* Small status chip on current stage */}
                {isCurrent && (
                  <span className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono font-bold uppercase bg-[#1C1C1C] text-[#FAF9F6]">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    Current Stage
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Ledger footnote */}
      <div className="mt-5 pt-3 border-t border-[#1C1C1C]/20 flex items-start gap-1.5 text-[10px] font-mono text-[#1C1C1C]/50">
        <Clock className="w-3 h-3 text-red-700 shrink-0 mt-0.5" />
        <span>
          Timestamps reflect immutable transitions recorded in the{' '}
          <span className="font-bold text-[#1C1C1C]/70">statusUpdates</span> collection.
        </span>
      </div>
    </div>
  );
};

