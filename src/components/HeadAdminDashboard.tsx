import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  ArrowBigUp,
  MapPin,
  Lock,
  Crown,
  Key,
  ScrollText,
  ShieldCheck,
  ShieldAlert,
  Layers,
  RotateCcw,
} from 'lucide-react';
import { Complaint, ComplaintStatus, RevealLogDoc } from '../types';
import { ApiService } from '../services/api';
import {
  getCategoryBadgeStyle,
  getStatusBadgeStyle,
  getAiFlaggedBadgeStyle,
  getHighPriorityBadgeStyle,
  formatCategoryLabel,
  formatStatusLabel,
  formatTimeAgo,
} from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { RevealIdentityModal } from './RevealIdentityModal';
import { AdminComplaintModal } from './AdminComplaintModal';

interface HeadAdminDashboardProps {
  complaints: Complaint[];
  onUpdateComplaint: (id: string, newStatus: ComplaintStatus, resolutionNotes: string) => void;
  onOpenImage?: (imageUrl: string, title: string) => void;
}

const ALL_CATEGORIES: string[] = [
  'infrastructure',
  'mess',
  'harassment',
  'wifi',
  'hygiene',
  'other',
];

/** Compact human-friendly renderer for ISO timestamps. */
const formatTimestamp = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

type HeadAdminTab = 'complaints' | 'reveal-logs';

/**
 * Head Admin Dashboard — accessible ONLY to users with role `head_admin`.
 *
 * Extends the regular Admin Dashboard with one additional capability: a
 * Head-Admin-exclusive "Reveal Identity" action on each complaint detail row
 * (backed by the exact-warning confirmation modal) plus a fully-auditable
 * "Reveal Logs" tab over the immutable `revealLogs` collection.
 *
 * The reveal capability is gated at three independent layers:
 *   1. UI routing/short-circuit here (`activeRole !== 'head_admin'`).
 *   2. The reusable RevealIdentityModal refuses to render for non-head-admin.
 *   3. The backend `requireHeadAdmin` middleware + Firestore `isHeadAdmin()`
 *      security rules reject any non-head-admin access to revealLogs.
 */
export const HeadAdminDashboard: React.FC<HeadAdminDashboardProps> = ({
  complaints,
  onUpdateComplaint,
  onOpenImage,
}) => {
  const { activeRole, openAuthModal } = useAuth();
  const isHeadAdmin = activeRole === 'head_admin';

  // Tab state
  const [activeTab, setActiveTab] = useState<HeadAdminTab>('complaints');

  // Complaints table filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'upvotes-desc' | 'id-asc'>('date-desc');

  // Complaint detail modal + reveal modal
  const [modalComplaint, setModalComplaint] = useState<Complaint | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [revealComplaint, setRevealComplaint] = useState<Complaint | null>(null);
  const [isRevealModalOpen, setIsRevealModalOpen] = useState<boolean>(false);

  // Reveal Logs tab state
  const [revealLogs, setRevealLogs] = useState<RevealLogDoc[]>([]);
  const [logsLoading, setLogsLoading] = useState<boolean>(false);
  const [logsError, setLogsError] = useState<string>('');

  // Load the immutable reveal audit ledger whenever the tab is opened.
  const loadRevealLogs = async () => {
    if (activeRole !== 'head_admin') return;
    setLogsLoading(true);
    setLogsError('');
    try {
      const logs = await ApiService.getRevealLogs(activeRole);
      setRevealLogs(logs);
    } catch (err: any) {
      setLogsError(err?.message || 'Failed to load reveal audit log.');
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'reveal-logs' && activeRole === 'head_admin') {
      loadRevealLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, activeRole]);

  // Apply search / category / status filters and sorting.
  const filteredComplaints = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let list = complaints;

    if (query) {
      list = list.filter((c) => {
        const id = `${c.complaintId || c.id || ''}`.toLowerCase();
        const desc = (c.description || '').toLowerCase();
        const loc = (c.hostelOrLocation || c.location || '').toLowerCase();
        return id.includes(query) || desc.includes(query) || loc.includes(query);
      });
    }
    if (selectedCategory !== 'All') {
      list = list.filter((c) => (c.category || 'other').toLowerCase().replace('/', '_') === selectedCategory.toLowerCase());
    }
    if (selectedStatus !== 'All') {
      list = list.filter((c) => (c.status || '').toLowerCase().replace(' ', '_') === selectedStatus);
    }

    const sorted = [...list];
    switch (sortBy) {
      case 'date-desc':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'date-asc':
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'upvotes-desc':
        sorted.sort((a, b) => ((b.upvoteCount !== undefined ? b.upvoteCount : b.upvotes || 0) - (a.upvoteCount !== undefined ? a.upvoteCount : a.upvotes || 0)));
        break;
      case 'id-asc':
        sorted.sort((a, b) => (a.complaintId || a.id || '').localeCompare(b.complaintId || b.id || ''));
        break;
      default:
        break;
    }
    return sorted;
  }, [complaints, searchQuery, selectedCategory, selectedStatus, sortBy]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedStatus('All');
    setSortBy('date-desc');
  };

  const handleRowClick = (complaint: Complaint) => {
    setModalComplaint(complaint);
    setIsModalOpen(true);
  };

  const handleRevealClick = (complaint: Complaint) => {
    // UI guard: only head_admin may open the reveal flow.
    if (activeRole !== 'head_admin') return;
    setRevealComplaint(complaint);
    setIsRevealModalOpen(true);
  };

  const handleRevealed = () => {
    // Refresh the audit ledger after a new reveal is committed.
    setActiveTab('reveal-logs');
    loadRevealLogs();
  };

  const handleSaveModal = (id: string, newStatus: ComplaintStatus, resolutionNotes: string) => {
    onUpdateComplaint(id, newStatus, resolutionNotes);
  };


  // UI-only access gate. Render this AFTER all hooks so the hook order is
  // consistent across renders regardless of role.
  if (!isHeadAdmin) {
    return (
      <div className="max-w-3xl mx-auto py-16 sm:py-24 px-4 text-slate-900">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 sm:p-10 shadow-lg text-center">
          <div className="w-14 h-14 mx-auto mb-5 bg-indigo-600 text-white flex items-center justify-center">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="inline-flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest bg-slate-900 text-white px-2.5 py-1 mb-4">
            <Lock className="w-3 h-3" /> Head Admin Access Control
          </div>
          <h1 className="font-sans text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Head Admin Panel Requires a Head Admin Role
          </h1>
          <p className="font-sans text-sm sm:text-base text-slate-900/80 max-w-xl mx-auto mb-6">
            The identity reveal protocol and reveal audit ledger are restricted
            to the <strong className="uppercase">head_admin</strong> role and are
            enforced by the application router, the backend middleware, and
            Firestore security rules. A regular admin cannot access these functions.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6 text-xs font-mono">
            <span className="inline-flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-1.5">
              Current Role: <strong className="uppercase">{activeRole.replace('_', ' ')}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-1.5">
              <Crown className="w-3.5 h-3.5 text-indigo-600" /> Required:{' '}
              <strong className="uppercase">head_admin</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={openAuthModal}
            className="px-6 py-3 bg-slate-900 text-white text-xs font-mono font-bold uppercase border border-slate-200 rounded-lg hover:bg-indigo-600 transition-colors cursor-pointer shadow-md"
          >
            Switch to Head Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 sm:py-10 px-4 sm:px-6 text-slate-900">
      {/* Header Banner */}
      <div className="mb-6 bg-slate-900 text-white border border-slate-200 rounded-lg p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-indigo-600 text-white flex items-center justify-center rounded-lg">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight">
                Head Admin Command Panel
              </h1>
              <p className="text-xs font-mono text-slate-300 mt-0.5">
                Immutable reveal audit + full grievance operations (Head Admin only)
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 text-[10px] font-mono font-bold uppercase bg-indigo-600 text-white px-2.5 py-1 rounded">
            <ShieldCheck className="w-3.5 h-3.5" /> Role: Head Admin
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="mb-6 flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('complaints')}
          className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
            activeTab === 'complaints'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          } flex items-center gap-1.5`}
        >
          <Layers className="w-3.5 h-3.5" /> Complaint Triage
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('reveal-logs')}
          className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
            activeTab === 'reveal-logs'
              ? 'border-red-600 text-red-700 bg-red-50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          } flex items-center gap-1.5`}
        >
          <ScrollText className="w-3.5 h-3.5" /> Reveal Logs
          <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.2 rounded-full">
            {revealLogs.length}
          </span>
        </button>
      </div>


      {activeTab === 'complaints' ? (
        <section className="bg-slate-50 border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          {/* Filters Header */}
          <div className="border-b border-slate-200 bg-slate-100 p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search complaint ID, description, or location..."
                  className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-900 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Categories</option>
                  {ALL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{formatCategoryLabel(cat)}</option>
                  ))}
                </select>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-900 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="resolved">Resolved</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-900 focus:outline-none cursor-pointer"
                >
                  <option value="date-desc">Newest</option>
                  <option value="date-asc">Oldest</option>
                  <option value="upvotes-desc">Most Upvotes</option>
                  <option value="id-asc">ID Ascending</option>
                </select>
                {(searchQuery || selectedCategory !== 'All' || selectedStatus !== 'All') && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="px-2.5 py-2 text-xs font-mono font-bold uppercase text-indigo-700 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                )}
              </div>
            </div>
          </div>


          {/* Complaints Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-slate-900 text-white border-b border-slate-200">
                  <th className="py-3 px-4 uppercase font-bold tracking-wider text-[11px] whitespace-nowrap">Complaint ID</th>
                  <th className="py-3 px-4 uppercase font-bold tracking-wider text-[11px] whitespace-nowrap">Category</th>
                  <th className="py-3 px-4 uppercase font-bold tracking-wider text-[11px] whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 uppercase font-bold tracking-wider text-[11px] whitespace-nowrap text-center">Upvotes</th>
                  <th className="py-3 px-4 uppercase font-bold tracking-wider text-[11px] whitespace-nowrap">Date</th>
                  <th className="py-3 px-4 uppercase font-bold tracking-wider text-[11px] whitespace-nowrap">Location</th>
                  <th className="py-3 px-4 uppercase font-bold tracking-wider text-[11px] text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredComplaints.length > 0 ? (
                  filteredComplaints.map((complaint) => {
                    const compId = complaint.complaintId || complaint.id || '';
                    const location = complaint.hostelOrLocation || complaint.location || '';
                    const upvoteCount = complaint.upvoteCount !== undefined ? complaint.upvoteCount : complaint.upvotes || 0;
                    const urgencyScore = complaint.urgencyScore !== undefined ? complaint.urgencyScore : 0;
                    const catStyle = getCategoryBadgeStyle(complaint.category);
                    const statusStyle = getStatusBadgeStyle(complaint.status);
                    const isResolved = (complaint.status || '').toLowerCase() === 'resolved';

                    // AI-Flagged: ML urgency_score > 0.7 (separate from upvotes)
                    const isAiFlagged = urgencyScore > 0.7 && !isResolved;
                    // High Priority: upvote-based auto-escalation flag
                    const isHighPriority = !!complaint.highPriority && !isResolved;

                    const aiBadge = getAiFlaggedBadgeStyle();
                    const hpBadge = getHighPriorityBadgeStyle();

                    const formattedDate = new Date(complaint.createdAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    });

                    return (
                      <tr key={compId} className="hover:bg-slate-100 transition-colors cursor-pointer group">
                        <td className="py-3.5 px-4 font-bold whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleRowClick(complaint)}
                            className="bg-slate-900 text-white px-2 py-0.5 group-hover:bg-indigo-600 transition-colors cursor-pointer"
                          >
                            {compId}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase px-2 py-0.5 border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${catStyle.indicator}`} />
                            {formatCategoryLabel(complaint.category)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Always show the normal status badge */}
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold uppercase border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                              {formatStatusLabel(complaint.status)}
                            </span>

                            {/* AI-Flagged Urgent badge (purple) — urgency_score > 0.7 */}
                            {isAiFlagged && (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase border shadow-sm ${aiBadge.bg} ${aiBadge.text} ${aiBadge.border}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${aiBadge.indicator}`} />
                                AI-Flagged Urgent
                              </span>
                            )}

                            {/* High Priority badge (red) — upvote-based escalation */}
                            {isHighPriority && (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase border shadow-sm ${hpBadge.bg} ${hpBadge.text} ${hpBadge.border}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${hpBadge.indicator}`} />
                                High Priority
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap font-bold">
                          <span className="inline-flex items-center gap-1"><ArrowBigUp className="w-3.5 h-3.5 text-emerald-800" />{upvoteCount}</span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-900/80">
                          <span className="font-bold text-slate-900">{formattedDate}</span>
                          <span className="ml-1 text-[10px] text-slate-900/50">{formatTimeAgo(complaint.createdAt)}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-900 max-w-[200px] truncate" title={location}>
                          <div className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-indigo-600 shrink-0" />
                            <span className="truncate">{location}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleRowClick(complaint)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-900 hover:text-white border border-slate-300 transition-colors text-[10px] uppercase font-bold cursor-pointer"
                            >
                              Review
                            </button>
                            {activeTab === 'complaints' && isHeadAdmin && (
                              <button
                                type="button"
                                onClick={() => handleRevealClick(complaint)}
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white border border-red-700 transition-colors text-[10px] uppercase font-bold cursor-pointer flex items-center gap-1"
                                title="Head Admin only: decrypt & reveal submitter identity"
                              >
                                <Key className="w-3 h-3" /> Reveal Identity
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 px-4 text-center text-slate-900/60 bg-slate-50">
                      <p className="font-sans text-sm">No complaints match the selected filter parameters.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : (

        // ---------------------------------------------------------------
        // Reveal Logs Tab (Head Admin only, immutable audit trail)
        // ---------------------------------------------------------------
        <section className="bg-slate-50 border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-100 p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-red-800">
              <ScrollText className="w-4 h-4" /> Immutable Reveal Audit Ledger (revealLogs)
            </div>
            <button
              type="button"
              onClick={loadRevealLogs}
              disabled={logsLoading}
              className="px-3 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white text-[10px] font-mono font-bold uppercase border border-slate-300 rounded cursor-pointer disabled:opacity-50"
            >
              {logsLoading ? 'Refreshing...' : 'Refresh Ledger'}
            </button>
          </div>

          {logsError && (
            <div className="border-b border-red-200 bg-red-50 p-3 text-xs font-mono text-red-700 font-bold">
              {logsError}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-slate-900 text-white border-b border-slate-200">
                  <th className="py-3 px-4 uppercase font-bold tracking-wider text-[11px] whitespace-nowrap">Complaint ID</th>
                  <th className="py-3 px-4 uppercase font-bold tracking-wider text-[11px] whitespace-nowrap">Revealed By (Admin)</th>
                  <th className="py-3 px-4 uppercase font-bold tracking-wider text-[11px] whitespace-nowrap">Reason</th>
                  <th className="py-3 px-4 uppercase font-bold tracking-wider text-[11px] whitespace-nowrap">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {revealLogs.length > 0 ? (
                  revealLogs.map((log) => (
                    <tr key={log.logId} className="hover:bg-red-50/40 transition-colors">
                      <td className="py-3 px-4 font-bold whitespace-nowrap">
                        <span className="bg-red-600 text-white px-2 py-0.5">{log.complaintId}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-900 font-mono">
                        {log.revealedByAdminId}
                      </td>
                      <td className="py-3 px-4 text-slate-800 max-w-[320px]">
                        <span className="line-clamp-2">{log.reason}</span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-900/80">
                        {formatTimestamp(log.timestamp)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-12 px-4 text-center text-slate-900/60 bg-slate-50">
                      {logsLoading ? (
                        <p className="font-sans text-sm">Loading reveal audit ledger...</p>
                      ) : (
                        <p className="font-sans text-sm">
                          No reveal actions have been performed yet. All future reveals will be permanently
                          recorded here for auditability.
                        </p>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Complaint Detail & Status Update Modal (reuses regular admin modal) */}
      <AdminComplaintModal
        complaint={modalComplaint}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        onOpenImage={onOpenImage}
      />

      {/* Reveal Identity Confirmation Modal (Head Admin only) */}
      {revealComplaint && (
        <RevealIdentityModal
          complaintId={revealComplaint.complaintId || revealComplaint.id || ''}
          complaintRef={revealComplaint.complaintId || revealComplaint.id}
          isOpen={isRevealModalOpen}
          onClose={() => setIsRevealModalOpen(false)}
          onRevealed={handleRevealed}
        />
      )}
    </div>
  );
};

