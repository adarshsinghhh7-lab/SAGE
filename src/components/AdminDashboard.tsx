import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  Search,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowBigUp,
  MapPin,
  Lock,
  Layers,
  PieChart as PieIcon,
  BarChart3,
  FileSpreadsheet,
  RotateCcw,
  Crown,
  Zap,
  Send
} from 'lucide-react';
import { Complaint, ComplaintStatus, EscalationSettingsDoc } from '../types';
import { ApiService } from '../services/api';
import { getCategoryBadgeStyle, getStatusBadgeStyle, getAiFlaggedBadgeStyle, getHighPriorityBadgeStyle, formatCategoryLabel, formatStatusLabel, formatTimeAgo } from '../utils/formatters';
import { AdminComplaintModal } from './AdminComplaintModal';
import { useAuth } from '../context/AuthContext';

interface AdminDashboardProps {
  complaints: Complaint[];
  onUpdateComplaint: (id: string, newStatus: ComplaintStatus, resolutionNotes: string) => void;
  onOpenImage?: (imageUrl: string, title: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'infrastructure': '#6B7D6B',
  'mess': '#A68A4B',
  'harassment': '#8B6B6B',
  'wifi': '#6B7D8B',
  'hygiene': '#6B8B6B',
  'other': '#7B7B7B',
};

const ALL_CATEGORIES: string[] = [
  'infrastructure',
  'mess',
  'harassment',
  'wifi',
  'hygiene',
  'other'
];

/** Compact human-friendly renderer for ISO timestamps in the escalation report. */
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

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  complaints,
  onUpdateComplaint,
  onOpenImage,
}) => {
  const { activeRole, openAuthModal } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'upvotes-desc' | 'urgency-desc' | 'id-asc'>('date-desc');
  
  // Selected complaint for modal editing
  const [modalComplaint, setModalComplaint] = useState<Complaint | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Auto-escalation control state
  const [escalationSettings, setEscalationSettings] = useState<EscalationSettingsDoc | null>(null);
  const [thresholdInput, setThresholdInput] = useState<string>('20');
  const [escalationSaving, setEscalationSaving] = useState<boolean>(false);
  const [escalationRunning, setEscalationRunning] = useState<boolean>(false);
  const [escalationStatus, setEscalationStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load live escalation settings whenever the active role changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const settings = await ApiService.getEscalationSettings(activeRole);
      if (cancelled || !settings) return;
      setEscalationSettings(settings);
      setThresholdInput(String(settings.threshold));
    })();
    return () => {
      cancelled = true;
    };
  }, [activeRole]);

  // For resolved complaints missing a stored `resolvedAt`, derive the
  // resolution timestamp from the immutable `statusUpdates` ledger so the
  // average resolution time below is always computed from real Firestore
  // records — never from fabricated/padded values.
  const [resolutionLedgerTs, setResolutionLedgerTs] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const missing = complaints
        .filter((c) => (c.status || '').toLowerCase() === 'resolved' && !c.resolvedAt)
        .slice(0, 10);
      if (missing.length === 0) return;

      const found: Record<string, string> = {};
      await Promise.all(
        missing.map(async (c) => {
          const id = c.complaintId || c.id || '';
          try {
            const updates = await ApiService.getStatusUpdates(id);
            const resolutionUpdate = [...updates]
              .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
              .find((u) => (u.newStatus || '').toLowerCase() === 'resolved');
            if (resolutionUpdate) found[id] = resolutionUpdate.timestamp;
          } catch {
            // ignore individual failures
          }
        })
      );
      if (!cancelled) setResolutionLedgerTs((prev) => ({ ...prev, ...found }));
    })();
    return () => {
      cancelled = true;
    };
  }, [complaints]);

  // 1. Unique Hostels / Locations
  const uniqueLocations = useMemo(() => {
    const locations = new Set<string>();
    complaints.forEach((c) => {
      const locStr = c.hostelOrLocation || c.location || '';
      const loc = locStr.split('(')[0].split('-')[0].trim();
      if (loc) locations.add(loc);
    });
    return Array.from(locations).sort();
  }, [complaints]);

  // 2. Analytics: Category breakdown (Pie Chart data)
  const categoryChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    ALL_CATEGORIES.forEach((cat) => {
      counts[cat] = 0;
    });

    complaints.forEach((c) => {
      const catKey = (c.category || 'other').toLowerCase().replace('/', '_');
      counts[catKey] = (counts[catKey] || 0) + 1;
    });

    return ALL_CATEGORIES.map((cat) => ({
      name: formatCategoryLabel(cat),
      value: counts[cat] || 0,
      color: CATEGORY_COLORS[cat] || '#7B7B7B',
    })).filter((item) => item.value > 0);
  }, [complaints]);

  // 3. Analytics: Hostel breakdown (Bar Chart data)
  const hostelChartData = useMemo(() => {
    const counts: Record<string, number> = {};

    complaints.forEach((c) => {
      let hostelKey = 'Campus General';
      const loc = (c.hostelOrLocation || c.location || '').toLowerCase();

      if (loc.includes('hostel block a') || loc.includes('block a')) {
        hostelKey = 'Block A';
      } else if (loc.includes('hostel block b') || loc.includes('block b')) {
        hostelKey = 'Block B';
      } else if (loc.includes('hostel block c') || loc.includes('block c')) {
        hostelKey = 'Block C';
      } else if (loc.includes('girls hostel 1') || loc.includes('gh1')) {
        hostelKey = 'Girls H-1';
      } else if (loc.includes('girls hostel 2') || loc.includes('gh2')) {
        hostelKey = 'Girls H-2';
      } else if (loc.includes('dining') || loc.includes('mess')) {
        hostelKey = 'Mess Hall';
      } else if (loc.includes('library')) {
        hostelKey = 'Library';
      } else if (loc.includes('academic') || loc.includes('complex')) {
        hostelKey = 'Academic';
      } else if (loc.includes('gate') || loc.includes('pathway')) {
        hostelKey = 'Gate / Grounds';
      } else {
        const raw = c.hostelOrLocation || c.location || 'General';
        hostelKey = raw.split('(')[0].split('-')[0].trim().slice(0, 14);
      }

      counts[hostelKey] = (counts[hostelKey] || 0) + 1;
    });

    return Object.keys(counts).map((key) => ({
      hostel: key,
      complaints: counts[key],
    })).sort((a, b) => b.complaints - a.complaints);
  }, [complaints]);

  // 4. Analytics: Average Resolution Time calculation (real data only)
  const resolutionStats = useMemo(() => {
    const resolvedItems = complaints.filter((c) => (c.status || '').toLowerCase() === 'resolved');

    let totalHours = 0;
    let resolvedCount = 0;

    resolvedItems.forEach((c) => {
      const id = c.complaintId || c.id || '';
      const resolvedAt = c.resolvedAt || resolutionLedgerTs[id];
      const createdAt = c.createdAt;

      if (resolvedAt && createdAt) {
        const diffMs = new Date(resolvedAt).getTime() - new Date(createdAt).getTime();
        if (Number.isFinite(diffMs) && diffMs > 0) {
          totalHours += diffMs / (1000 * 60 * 60);
          resolvedCount++;
        }
      }
      // Complaints without a measured resolution timestamp are excluded from
      // the average rather than padded with fabricated values.
    });

    const avgHours =
      resolvedCount > 0 ? (totalHours / resolvedCount).toFixed(1) : null;
    const resolutionRate = complaints.length > 0
      ? Math.round((resolvedItems.length / complaints.length) * 100)
      : 0;

    return {
      totalResolved: resolvedItems.length,
      avgHours,
      resolutionRate,
    };
  }, [complaints, resolutionLedgerTs]);

  // 5. Total Counts by Status
  const statusStats = useMemo(() => {
    const total = complaints.length;
    const submitted = complaints.filter((c) => (c.status || '').toLowerCase() === 'submitted').length;
    const underReview = complaints.filter((c) => (c.status || '').toLowerCase() === 'under_review').length;
    const resolved = complaints.filter((c) => (c.status || '').toLowerCase() === 'resolved').length;
    // AI-Flagged: urgency_score > 0.7 (ML microservice assessment)
    const aiFlagged = complaints.filter((c) => c.urgencyScore > 0.7 && (c.status || '').toLowerCase() !== 'resolved').length;
    // High Priority: upvote-based auto-escalation flag
    const highPriority = complaints.filter((c) => c.highPriority && (c.status || '').toLowerCase() !== 'resolved').length;

    return { total, submitted, underReview, resolved, aiFlagged, highPriority };
  }, [complaints]);

  // 6. Filter & Search Table Records
  const filteredComplaints = useMemo(() => {
    return complaints
      .filter((complaint) => {
        const compId = complaint.complaintId || complaint.id || '';
        const loc = complaint.hostelOrLocation || complaint.location || '';
        const cat = complaint.category || '';
        const st = complaint.status || '';

        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesId = compId.toLowerCase().includes(q);
          const matchesDesc = complaint.description.toLowerCase().includes(q);
          const matchesLoc = loc.toLowerCase().includes(q);
          const matchesCat = cat.toLowerCase().includes(q);
          const matchesNotes = complaint.resolutionNotes?.toLowerCase().includes(q);

          if (!matchesId && !matchesDesc && !matchesLoc && !matchesCat && !matchesNotes) {
            return false;
          }
        }

        // Category filter
        if (selectedCategory !== 'All') {
          const filterCat = selectedCategory.toLowerCase().replace('/', '_');
          const compCat = cat.toLowerCase().replace('/', '_');
          if (!compCat.includes(filterCat) && !filterCat.includes(compCat)) {
            return false;
          }
        }

        // Status filter
        if (selectedStatus !== 'All') {
          const filterSt = selectedStatus.toLowerCase().replace(' ', '_');
          const compSt = st.toLowerCase().replace(' ', '_');
          if (filterSt === 'urgent') {
            if (complaint.urgencyScore < 0.75 || compSt === 'resolved') return false;
          } else if (compSt !== filterSt) {
            return false;
          }
        }

        // Location filter
        if (selectedLocation !== 'All' && !loc.toLowerCase().includes(selectedLocation.toLowerCase())) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const idA = a.complaintId || a.id || '';
        const idB = b.complaintId || b.id || '';
        const votesA = a.upvoteCount !== undefined ? a.upvoteCount : (a.upvotes || 0);
        const votesB = b.upvoteCount !== undefined ? b.upvoteCount : (b.upvotes || 0);

        if (sortBy === 'date-desc') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'date-asc') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === 'upvotes-desc') {
          return votesB - votesA;
        }
        if (sortBy === 'urgency-desc') {
          return (b.urgencyScore || 0) - (a.urgencyScore || 0);
        }
        if (sortBy === 'id-asc') {
          return idA.localeCompare(idB);
        }
        return 0;
      });
  }, [complaints, searchQuery, selectedCategory, selectedStatus, selectedLocation, sortBy]);

  // Row click handler
  const handleRowClick = (complaint: Complaint) => {
    setModalComplaint(complaint);
    setIsModalOpen(true);
  };

  const handleSaveModal = (id: string, newStatus: ComplaintStatus, resolutionNotes: string) => {
    onUpdateComplaint(id, newStatus, resolutionNotes);
    if (modalComplaint && (modalComplaint.complaintId === id || modalComplaint.id === id)) {
      setModalComplaint({
        ...modalComplaint,
        status: newStatus,
        resolutionNotes,
      });
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedStatus('All');
    setSelectedLocation('All');
    setSortBy('date-desc');
  };

  // --- Auto-Escalation Control Handlers ---
  const handleSaveThreshold = async () => {
    const parsed = Math.round(Number(thresholdInput));
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 500) {
      setEscalationStatus({ type: 'error', text: 'Threshold must be a whole number between 1 and 500 upvotes.' });
      return;
    }
    setEscalationSaving(true);
    setEscalationStatus(null);
    try {
      const updated = await ApiService.setEscalationThreshold(parsed, activeRole);
      setEscalationSettings(updated);
      setThresholdInput(String(updated.threshold));
      setEscalationStatus({ type: 'success', text: `Live escalation threshold updated to ${updated.threshold} upvotes.` });
    } catch (err: any) {
      setEscalationStatus({ type: 'error', text: err?.message || 'Failed to update escalation threshold.' });
    } finally {
      setEscalationSaving(false);
    }
  };

  const handleRunSweepNow = async () => {
    setEscalationRunning(true);
    setEscalationStatus(null);
    try {
      const report = await ApiService.runEscalationSweep(activeRole);
      const freshSettings = await ApiService.getEscalationSettings(activeRole);
      if (freshSettings) {
        setEscalationSettings(freshSettings);
        setThresholdInput(String(freshSettings.threshold));
      }
      setEscalationStatus({
        type: 'success',
        text: `Sweep complete: ${report.escalated.length} complaint(s) escalated, ${report.emailsSent} email(s) sent, ${report.emailsFailed} failed.`,
      });
    } catch (err: any) {
      setEscalationStatus({ type: 'error', text: err?.message || 'Manual escalation sweep failed.' });
    } finally {
      setEscalationRunning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 sm:py-10 px-4 sm:px-6 lg:px-8 text-[#151820]">
      {/* Header / Admin Banner */}
      <div className="mb-8 border-b border-[#DDD4BD] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest bg-[#B59340] text-[#151820] px-2 py-0.5">
              ADMINISTRATIVE CONTROL DESK
            </span>
            <span className="text-[10px] font-mono text-[#151820]/70 uppercase tracking-wider flex items-center gap-1">
              <Lock className="w-3 h-3 text-[#B59340]" />
              Direct Disposition & statusUpdates Registry
            </span>
          </div>
          <h1 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-bold text-[#151820] tracking-tight">
            Grievance Operations & Analytics
          </h1>
          <p className="font-sans text-sm sm:text-base text-[#151820]/80 mt-1 max-w-3xl">
            Live management hub for university administrative officers and warden councils. Update escalation pipelines and inspect real-time campus telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block font-mono text-xs text-[#151820]/70">
            <div>Current Role: <strong className="uppercase text-[#B59340]">{activeRole.replace('_', ' ')}</strong></div>
            <div className="text-[10px] text-[#5B7D5B] font-bold">100% Cryptographic Anonymity Enforced</div>
          </div>
          <button
            type="button"
            onClick={openAuthModal}
            className="px-3 py-1.5 text-xs font-mono font-bold uppercase bg-[#EBE3D0] hover:bg-[#DDD4BD] border border-[#DDD4BD] rounded-lg cursor-pointer shadow-sm"
          >
            Switch Role
          </button>
        </div>
      </div>

      {/* Role Notice Banner — Admin-only console (students are gated upstream) */}
      {activeRole === 'head_admin' && (
        <div className="mb-6 bg-[#B59340]/10 border border-[#2A2F3E] p-4 shadow-md flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 text-[#B59340] shrink-0" />
            <div className="text-xs font-mono text-[#151820]/80">
              <strong>Head Admin Superuser Active:</strong> Full access enabled (Identity Decryption Triggers, Immutable revealLogs, and Role Claims).
            </div>
          </div>
          <button
            type="button"
            onClick={openAuthModal}
            className="px-3 py-1 bg-[#B59340] text-[#151820] font-mono text-xs font-bold uppercase hover:bg-[#B59340] cursor-pointer"
          >
            Manage Claims
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ANALYTICS SECTION */}
      {/* ========================================================================= */}
      <section className="mb-10">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#B59340]" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#151820]">
              Operational Telemetry & Insights
            </h2>
          </div>
          <span className="text-[10px] font-mono text-[#151820]/60 uppercase">
            Updated In Real-Time
          </span>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Card 1: Total Complaints */}
          <div className="bg-[#EBE3D0] border border-[#DDD4BD] rounded-lg p-5 shadow-md">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#151820]/60 mb-1">
              Total Complaints
            </div>
            <div className="text-3xl sm:text-4xl font-mono font-bold text-[#151820] mb-2">
              {statusStats.total}
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono border-t border-[#2A2F3E]/15 pt-2 text-[#151820]/75">
              <span>Submitted: <strong>{statusStats.submitted}</strong></span>
              <span>Active: <strong>{statusStats.underReview}</strong></span>
            </div>
          </div>

          {/* Card 2: Average Resolution Time */}
          <div className="bg-[#EBE3D0] border border-[#DDD4BD] rounded-lg p-5 shadow-md">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#151820]/60 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#B59340]" />
              Avg Resolution Time
            </div>
            <div className="text-3xl sm:text-4xl font-mono font-bold text-[#151820] mb-2 flex items-baseline gap-1.5">
              <span>{resolutionStats.avgHours ?? '—'}</span>
              {resolutionStats.avgHours && (
                <span className="text-sm font-sans font-bold text-[#151820]/60">hours</span>
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono border-t border-[#2A2F3E]/15 pt-2 text-[#5B7D5B]">
              <span>Resolved: <strong>{resolutionStats.totalResolved}</strong></span>
              <span>Rate: <strong>{resolutionStats.resolutionRate}%</strong></span>
            </div>
          </div>

          {/* Card 3: Complaints Resolved */}
          <div className="bg-[#EBE3D0] border border-[#DDD4BD] rounded-lg p-5 shadow-md">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#151820]/60 mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#5B7D5B]" />
              Complaints Resolved
            </div>
            <div className="text-3xl sm:text-4xl font-mono font-bold text-[#5B7D5B] mb-2">
              {statusStats.resolved}
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono border-t border-[#2A2F3E]/15 pt-2 text-[#151820]/75">
              <span>Remedied: <strong>{resolutionStats.resolutionRate}%</strong></span>
              <span className="text-[#5B7D5B] font-bold">Verified</span>
            </div>
          </div>

          {/* Card 4: Urgent Priority — AI-Flagged + Upvote High Priority */}
          <div className="bg-[#A6352C]/10 border border-[#A6352C]/40 rounded-lg p-5 shadow-md">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#A6352C] mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-[#A6352C]" />
              Urgent Priority
            </div>
            <div className="text-3xl sm:text-4xl font-mono font-bold text-[#A6352C] mb-2 flex items-baseline gap-2">
              <span>{statusStats.aiFlagged + statusStats.highPriority}</span>
              {(statusStats.aiFlagged + statusStats.highPriority) > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#A6352C] animate-pulse" />
              )}
            </div>
            <div className="flex flex-col gap-1 text-[11px] font-mono border-t border-[#A6352C]/40 pt-2 text-[#A6352C]">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#5B6B8D]" />
                  AI-Flagged Urgent
                </span>
                <span className="font-bold">{statusStats.aiFlagged}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#A6352C]" />
                  Upvote High Priority
                </span>
                <span className="font-bold">{statusStats.highPriority}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chart 1: Complaints by Category (Pie Chart) */}
          <div className="lg:col-span-5 bg-[#EBE3D0] border border-[#DDD4BD] rounded-lg p-5 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1 border-b border-[#2A2F3E]/15 pb-2">
                <div className="flex items-center gap-1.5">
                  <PieIcon className="w-4 h-4 text-[#B59340]" />
                  <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#151820]">
                    Complaints by Category
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-[#151820]/60 uppercase">
                  Distribution
                </span>
              </div>
              <p className="text-xs font-sans text-[#151820]/75 mb-3">
                Volume breakdown across academic, residential, and facility departments.
              </p>
            </div>

            <div className="h-64 sm:h-72 w-full flex items-center justify-center">
              {categoryChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color} 
                          stroke="#FFFFFF" 
                          strokeWidth={1}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => [`${String(val)} complaints`, 'Total']}
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                      }}
                    />
                    <Legend
                      wrapperStyle={{
                        fontFamily: 'monospace',
                        fontSize: '10px',
                        paddingTop: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs font-mono text-[#151820]/60 text-center">
                  No categorical data available.
                </div>
              )}
            </div>
          </div>

          {/* Chart 2: Complaints by Hostel / Campus Location (Bar Chart) */}
          <div className="lg:col-span-7 bg-[#EBE3D0] border border-[#DDD4BD] rounded-lg p-5 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1 border-b border-[#2A2F3E]/15 pb-2">
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-[#B59340]" />
                  <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#151820]">
                    Complaints by Hostel & Location
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-[#151820]/60 uppercase">
                  Hotspot Analysis
                </span>
              </div>
              <p className="text-xs font-sans text-[#151820]/75 mb-3">
                Concentration of unresolved and active complaints by campus residential block.
              </p>
            </div>

            <div className="h-64 sm:h-72 w-full">
              {hostelChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={hostelChartData}
                    margin={{ top: 10, right: 10, left: -15, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis
                      dataKey="hostel"
                      stroke="#94A3B8"
                      fontSize={10}
                      fontFamily="monospace"
                      angle={-20}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis
                      stroke="#94A3B8"
                      fontSize={10}
                      fontFamily="monospace"
                      allowDecimals={false}
                    />
                    <Tooltip
                      formatter={(val) => [`${String(val)} complaints`, 'Total']}
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                      }}
                    />
                    <Bar 
                      dataKey="complaints" 
                      fill="#4F46E5" 
                      stroke="#4F46E5" 
                      strokeWidth={0}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs font-mono text-[#151820]/60 text-center flex items-center justify-center h-full">
                  No location hotspot data available.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
{/* ========================================================================= */}
      {/* AUTO-ESCALATION CONTROL */}
      {/* ========================================================================= */}
      {activeRole !== 'student' && (
        <section className="mb-10">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#B59340]" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#151820]">
                Automatic Escalation Control
              </h2>
            </div>
            <span className="text-[10px] font-mono text-[#151820]/60 uppercase">
              Hourly Sweep · system-auto-escalation
            </span>
          </div>

          <div className="bg-[#EBE3D0] border border-[#DDD4BD] rounded-lg p-5 sm:p-6 shadow-md">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
{/* Threshold Control */}
              <div className="lg:col-span-1">
                <label htmlFor="escalation-threshold" className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#151820]/70 mb-1.5">
                  Escalation Threshold (upvotes)
                </label>
                <div className="flex items-stretch gap-2">
                  <input
                    id="escalation-threshold"
                    type="number"
                    min={1}
                    max={500}
                    value={thresholdInput}
                    onChange={(e) => setThresholdInput(e.target.value)}
                    className="w-full bg-[#EBE3D0] border border-[#DDD4BD] rounded-lg px-3 py-2 text-sm font-mono font-bold text-[#151820] focus:outline-none focus:bg-[#EBE3D0]"
                  />
                  <button
                    type="button"
                    onClick={handleSaveThreshold}
                    disabled={escalationSaving}
                    className="px-3 py-2 bg-[#0B0C0F] text-[#EBE3D0] text-[11px] font-mono font-bold uppercase border border-[#DDD4BD] rounded-lg hover:bg-[#1D2130] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                  >
                    {escalationSaving ? 'Saving…' : 'Save'}
                  </button>
                </div>
                <p className="text-[10px] font-mono text-[#151820]/60 mt-2 leading-relaxed">
                  Complaints reaching this community-upvote count are auto-escalated to{' '}
                  <strong>under_review</strong>, flagged <strong>high priority</strong>, and notified to
                  the responsible department. Default:{' '}
                  <strong>{escalationSettings?.defaultThreshold ?? 20}</strong>.
                </p>
</div>
{/* Manual Sweep Trigger */}
              <div className="lg:col-span-1">
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#151820]/70 mb-1.5">
                  Manual Sweep Trigger
                </label>
                <button
                  type="button"
                  onClick={handleRunSweepNow}
                  disabled={escalationRunning}
                  className="w-full px-3 py-2 bg-[#B59340] text-[#151820] text-[11px] font-mono font-bold uppercase border border-[#2A2F3E] hover:bg-[#B59340] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  {escalationRunning ? 'Sweeping…' : 'Run Sweep Now'}
                </button>
                <p className="text-[10px] font-mono text-[#151820]/60 mt-2 leading-relaxed">
                  Runs the same auto-escalation pipeline as the hourly scheduler, immediately and with
                  the currently configured threshold.
                </p>
              </div>
{/* Last Run Summary */}
              <div className="lg:col-span-1">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#151820]/70 mb-1.5">
                  Last Sweep Report
                </div>
                {escalationSettings?.lastRun ? (
                  <div className="border border-[#2A2F3E]/20 bg-[#EBE3D0] p-3 font-mono text-[11px] space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#151820]/60">Ran At</span>
                      <strong>{formatTimestamp(escalationSettings.lastRun.ranAt)}</strong>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#151820]/60">Trigger</span>
                      <strong className="uppercase">{escalationSettings.lastRun.trigger}</strong>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#151820]/60">Threshold</span>
                      <strong>{escalationSettings.lastRun.threshold}</strong>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#151820]/60">Escalated</span>
                      <strong>{escalationSettings.lastRun.escalated.length}</strong>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#151820]/60">Emails</span>
                      <strong>
                        {escalationSettings.lastRun.emailsSent} sent /{' '}
                        {escalationSettings.lastRun.emailsFailed} failed
                      </strong>
                    </div>
                    {escalationSettings.lastRun.escalated.length > 0 && (
                      <div className="pt-1 border-t border-[#2A2F3E]/15 text-[10px] text-[#151820]/70 break-words">
                        {escalationSettings.lastRun.escalated
                          .map((entry) => `${entry.complaintId} → ${entry.newStatus}`)
                          .join(' · ')}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border border-dashed border-[#2A2F3E]/30 bg-[#EBE3D0] p-3 text-[11px] font-mono text-[#151820]/50">
                    No sweep has been run yet.
                  </div>
                )}
                {escalationSettings?.lastRunAt && (
                  <div className="text-[10px] font-mono text-[#151820]/50 mt-1.5">
                    Last automated sweep: {formatTimestamp(escalationSettings.lastRunAt)}
                  </div>
                )}
              </div>
              </div>
{/* Status / Feedback Message */}
            {escalationStatus && (
              <div
                className={`mt-4 px-3 py-2 border text-xs font-mono font-bold ${
                  escalationStatus.type === 'success'
                    ? 'bg-[#5B7D5B]/10 border-[#5B7D5B] text-[#5B7D5B]'
                    : 'bg-[#B59340]/10 border-[#2A2F3E] text-[#B59340]'
                }`}
              >
                {escalationStatus.type === 'success' ? '✓ ' : '✕ '}
                {escalationStatus.text}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* MASTER LEDGER TABLE */}
      {/* ========================================================================= */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#B59340]" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#151820]">
              Master Grievance Deposition Register
            </h2>
          </div>
          <div className="text-xs font-mono text-[#151820]/70">
            Showing <strong>{filteredComplaints.length}</strong> of <strong>{complaints.length}</strong> records
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-[#EBE3D0] border border-[#DDD4BD] rounded-lg p-4 sm:p-5 mb-4 shadow-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <label htmlFor="admin-search-input" className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#151820]/70 mb-1">
                Search Master Ledger
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-[#151820]/50 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  id="admin-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by ID, issue, or notes..."
                  className="w-full bg-[#EBE3D0] border border-[#DDD4BD] rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-[#151820] placeholder:text-[#151820]/40 focus:outline-none focus:bg-[#EBE3D0]"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label htmlFor="admin-filter-cat" className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#151820]/70 mb-1">
                Category
              </label>
              <select
                id="admin-filter-cat"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-[#EBE3D0] border border-[#DDD4BD] rounded-lg p-2 text-xs font-mono text-[#151820] focus:outline-none cursor-pointer"
              >
                <option value="All">All Categories</option>
                {ALL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {formatCategoryLabel(cat)}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="admin-filter-status" className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#151820]/70 mb-1">
                Status
              </label>
              <select
                id="admin-filter-status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-[#EBE3D0] border border-[#DDD4BD] rounded-lg p-2 text-xs font-mono text-[#151820] focus:outline-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="submitted">Submitted (Pending)</option>
                <option value="under_review">Under Review</option>
                <option value="resolved">Resolved</option>
                <option value="urgent">High Priority (Urgent)</option>
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <label htmlFor="admin-filter-loc" className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#151820]/70 mb-1">
                Hostel / Area
              </label>
              <select
                id="admin-filter-loc"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full bg-[#EBE3D0] border border-[#DDD4BD] rounded-lg p-2 text-xs font-mono text-[#151820] focus:outline-none cursor-pointer truncate"
              >
                <option value="All">All Hostels & Zones</option>
                {uniqueLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sort Controls & Reset Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-3.5 pt-3 border-t border-[#2A2F3E]/15 text-xs font-mono">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-bold text-[#151820]/60 flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3" />
                Sort Order:
              </span>
              <div className="inline-flex gap-1">
                <button
                  type="button"
                  onClick={() => setSortBy('date-desc')}
                  className={`px-2.5 py-1 text-[11px] uppercase font-bold border transition-colors cursor-pointer ${
                    sortBy === 'date-desc'
                      ? 'bg-[#0B0C0F] text-[#EBE3D0] border-[#DDD4BD]'
                      : 'bg-[#EBE3D0] text-[#151820] border-[#2A2F3E]/30 hover:bg-[#EBE3D0]'
                  }`}
                >
                  Newest
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('upvotes-desc')}
                  className={`px-2.5 py-1 text-[11px] uppercase font-bold border transition-colors cursor-pointer ${
                    sortBy === 'upvotes-desc'
                      ? 'bg-[#0B0C0F] text-[#EBE3D0] border-[#DDD4BD]'
                      : 'bg-[#EBE3D0] text-[#151820] border-[#2A2F3E]/30 hover:bg-[#EBE3D0]'
                  }`}
                >
                  Most Upvotes
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('urgency-desc')}
                  className={`px-2.5 py-1 text-[11px] uppercase font-bold border transition-colors cursor-pointer ${
                    sortBy === 'urgency-desc'
                      ? 'bg-[#5B6B8D] text-[#EBE3D0] border-[#5B6B8D]'
                      : 'bg-[#EBE3D0] text-[#151820] border-[#2A2F3E]/30 hover:bg-[#EBE3D0]'
                  }`}
                >
                  AI Urgency
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('id-asc')}
                  className={`px-2.5 py-1 text-[11px] uppercase font-bold border transition-colors cursor-pointer ${
                    sortBy === 'id-asc'
                      ? 'bg-[#0B0C0F] text-[#EBE3D0] border-[#DDD4BD]'
                      : 'bg-[#EBE3D0] text-[#151820] border-[#2A2F3E]/30 hover:bg-[#EBE3D0]'
                  }`}
                >
                  ID Ascending
                </button>
              </div>
            </div>

            {(searchQuery || selectedCategory !== 'All' || selectedStatus !== 'All' || selectedLocation !== 'All') && (
              <button
                type="button"
                onClick={resetFilters}
                className="font-bold text-[#B59340] hover:underline cursor-pointer flex items-center gap-1 text-xs"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filter Parameters</span>
              </button>
            )}
          </div>
        </div>

        {/* Master Table */}
        <div className="bg-[#EBE3D0] border border-[#DDD4BD] rounded-lg shadow-lg overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="bg-[#0B0C0F] text-[#EBE3D0] border-b border-[#DDD4BD]">
                <th className="py-3 px-4 uppercase font-bold tracking-wider text-[11px] whitespace-nowrap">
                  Complaint ID
                </th>
                <th className="py-3 px-4 uppercase font-bold tracking-wider text-[11px] whitespace-nowrap">
                  Category
                </th>
                <th className="py-3 px-4 uppercase font-bold tracking-wider text-[11px] whitespace-nowrap">
                  Status
                </th>
                <th className="py-3 px-4 uppercase font-bold tracking-wider text-[11px] whitespace-nowrap text-center">
                  Upvotes
                </th>
                <th className="py-3 px-4 uppercase font-bold tracking-wider text-[11px] whitespace-nowrap">
                  Date Submitted
                </th>
                <th className="py-3 px-4 uppercase font-bold tracking-wider text-[11px] whitespace-nowrap">
                  Location
                </th>
                <th className="py-3 px-4 uppercase font-bold tracking-wider text-[11px] text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDD4BD] bg-[#EBE3D0]">
              {filteredComplaints.length > 0 ? (
                filteredComplaints.map((complaint) => {
                  const compId = complaint.complaintId || complaint.id || '';
                  const location = complaint.hostelOrLocation || complaint.location || '';
                  const upvoteCount = complaint.upvoteCount !== undefined ? complaint.upvoteCount : (complaint.upvotes || 0);
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
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr
                      key={compId}
                      id={`admin-table-row-${compId}`}
                      onClick={() => handleRowClick(complaint)}
                      className="hover:bg-[#EBE3D0] transition-colors cursor-pointer group"
                    >
                      {/* Column 1: Complaint ID */}
                      <td className="py-3.5 px-4 font-bold whitespace-nowrap">
                        <span className="bg-[#0B0C0F] text-[#EBE3D0] px-2 py-0.5 group-hover:bg-[#B59340] transition-colors">
                          {compId}
                        </span>
                      </td>

                      {/* Column 2: Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase px-2 py-0.5 border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${catStyle.indicator}`} />
                          {formatCategoryLabel(complaint.category)}
                        </span>
                      </td>

                      {/* Column 3: Status + Priority Badges */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Always show the normal status badge */}
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold uppercase border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                            <span>{formatStatusLabel(complaint.status)}</span>
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

                      {/* Column 4: Upvotes */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap font-bold">
                        <span className="inline-flex items-center gap-1 text-[#151820] group-hover:text-[#5B7D5B]">
                          <ArrowBigUp className="w-3.5 h-3.5 text-[#5B7D5B]" />
                          {upvoteCount}
                        </span>
                      </td>

                      {/* Column 5: Date Submitted */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[#151820]/80">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#151820]">{formattedDate}</span>
                          <span className="text-[10px] text-[#151820]/50">{formatTimeAgo(complaint.createdAt)}</span>
                        </div>
                      </td>

                      {/* Column 6: Location */}
                      <td className="py-3.5 px-4 text-[#151820] max-w-[220px] truncate" title={location}>
                        <div className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-[#B59340] shrink-0" />
                          <span className="truncate">{location}</span>
                        </div>
                      </td>

                      {/* Action Column */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(complaint);
                          }}
                          className="px-2.5 py-1 bg-[#EBE3D0] hover:bg-[#0B0C0F] hover:text-[#EBE3D0] border border-[#DDD4BD] transition-colors text-[10px] uppercase font-bold cursor-pointer"
                        >
                          Review & Update
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center text-[#151820]/60 bg-[#EBE3D0]">
                    <div className="max-w-sm mx-auto">
                      <p className="font-sans text-sm mb-2">No complaints match the selected filter parameters.</p>
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="px-3 py-1 bg-[#0B0C0F] text-[#EBE3D0] text-xs uppercase font-mono font-bold border border-[#DDD4BD]"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Admin Complaint Detail & Status Update Modal */}
      <AdminComplaintModal
        complaint={modalComplaint}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        onOpenImage={onOpenImage}
      />
    </div>
  );
};
