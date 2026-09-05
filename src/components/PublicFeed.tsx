import React, { useState, useMemo } from 'react';
import {
  Search,
  PlusCircle,
  RotateCcw,
  Inbox,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { paperSpring, instantFade } from '../motion/tokens';
import { Complaint } from '../types';
import { ComplaintCard } from './ComplaintCard';
import { formatCategoryLabel } from '../utils/formatters';

interface PublicFeedProps {
  complaints: Complaint[];
  onUpvote: (id: string) => void;
  onSelectComplaint: (complaint: Complaint) => void;
  onOpenImage?: (imageUrl: string, title: string) => void;
  onGoToSubmit: () => void;
  onResetToDefaultSeed?: () => void;
}

const CATEGORIES: string[] = [
  'infrastructure',
  'mess',
  'harassment',
  'wifi',
  'hygiene',
  'other'
];

export const PublicFeed: React.FC<PublicFeedProps> = ({
  complaints,
  onUpvote,
  onSelectComplaint,
  onOpenImage,
  onGoToSubmit,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'upvotes' | 'newest'>('upvotes');
  const prefersReduced = useReducedMotion();

  const uniqueHostelLocations = useMemo(() => {
    const locations = new Set<string>();
    complaints.forEach((c) => {
      const locStr = c.hostelOrLocation || c.location || '';
      const loc = locStr.split('-')[0].split('(')[0].trim();
      if (loc) locations.add(loc);
    });
    return Array.from(locations).sort();
  }, [complaints]);

  const stats = useMemo(() => {
    const total = complaints.length;
    const underReview = complaints.filter((c) => (c.status || '').toLowerCase() === 'under_review').length;
    const resolved = complaints.filter((c) => (c.status || '').toLowerCase() === 'resolved').length;
    const highPriority = complaints.filter((c) => (c.urgencyScore >= 0.75 || c.urgency === 'Urgent') && (c.status || '').toLowerCase() !== 'resolved').length;
    return { total, underReview, resolved, highPriority };
  }, [complaints]);

  const filteredComplaints = useMemo(() => {
    return complaints
      .filter((complaint) => {
        const compId = complaint.complaintId || complaint.id || '';
        const loc = complaint.hostelOrLocation || complaint.location || '';
        const cat = complaint.category || '';
        const st = complaint.status || '';

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesId = compId.toLowerCase().includes(q);
          const matchesDesc = complaint.description.toLowerCase().includes(q);
          const matchesLoc = loc.toLowerCase().includes(q);
          const matchesCat = cat.toLowerCase().includes(q);
          if (!matchesId && !matchesDesc && !matchesLoc && !matchesCat) return false;
        }

        if (selectedCategory !== 'All') {
          const filterCat = selectedCategory.toLowerCase().replace('/', '_');
          const compCat = cat.toLowerCase().replace('/', '_');
          if (!compCat.includes(filterCat) && !filterCat.includes(compCat)) return false;
        }

        if (selectedLocation !== 'All') {
          const locNorm = (complaint.hostelOrLocation || complaint.location || '').toLowerCase();
          if (!locNorm.includes(selectedLocation.toLowerCase())) return false;
        }

        if (selectedStatus !== 'All') {
          const normStatus = st.toLowerCase().replace(' ', '_');
          const isResolved = normStatus === 'resolved';
          const isSubmitted = normStatus === 'submitted';
          if (selectedStatus === 'resolved' && !isResolved) return false;
          if (selectedStatus === 'urgent' && (isResolved || !(complaint.urgencyScore >= 0.75 || complaint.urgency === 'Urgent'))) return false;
          if (selectedStatus === 'under_review' && normStatus !== 'under_review') return false;
          if (selectedStatus === 'submitted' && !isSubmitted) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'upvotes') {
          return ((b.upvoteCount !== undefined ? b.upvoteCount : b.upvotes || 0) - (a.upvoteCount !== undefined ? a.upvoteCount : a.upvotes || 0));
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [complaints, searchQuery, selectedCategory, selectedLocation, selectedStatus, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedLocation('All');
    setSelectedStatus('All');
    setSortBy('upvotes');
  };

  return (
    <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="mb-10 border-b border-line pb-7 flex flex-col md:flex-row md:items-end justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2.5 flex-wrap">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.14em] bg-accent-soft text-accent-deep border border-accent/30">
              Live Public Ledger (Firestore)
            </span>
            <span className="text-[10px] font-mono text-ink-faint uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-bronze" />
              Blinded Voter Registry / SHA-256
            </span>
          </div>
          <h1 className="font-display text-[2rem] sm:text-5xl font-semibold text-ink tracking-tight leading-[1.05]">
            Campus Grievance Ledger
          </h1>
          <p className="text-sm sm:text-base text-ink-soft mt-2 max-w-2xl leading-relaxed">
            Community-prioritized grievances across student housing, academic facilities, and campus infrastructure.
          </p>
        </div>

        <button
          id="feed-lodge-grievance-btn"
          type="button"
          onClick={onGoToSubmit}
          className="s-btn s-btn-primary self-start md:self-auto shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Lodge Grievance</span>
        </button>
      </div>

      {/* Top Status & Summary Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
        <div className="bg-surface border border-line rounded-xl p-4 shadow-soft">
          <div className="s-mono-micro mb-1">Total Depositions</div>
          <div className="text-2xl font-mono font-bold text-ink mt-0.5">{stats.total}</div>
        </div>
        <div className="bg-surface border border-line border-t-[3px] border-t-bronze rounded-xl p-4 shadow-soft">
          <div className="s-mono-micro mb-1 text-bronze-deep">Under Review</div>
          <div className="text-2xl font-mono font-bold text-bronze-deep mt-0.5">{stats.underReview}</div>
        </div>
        <div className="bg-surface border border-line border-t-[3px] border-t-accent rounded-xl p-4 shadow-soft">
          <div className="s-mono-micro mb-1 text-accent-deep">Resolved</div>
          <div className="text-2xl font-mono font-bold text-accent-deep mt-0.5">{stats.resolved}</div>
        </div>
        <div className="bg-surface border border-line border-t-[3px] border-t-clay rounded-xl p-4 shadow-soft">
          <div className="s-mono-micro mb-1 text-clay-deep">High Priority</div>
          <div className="text-2xl font-mono font-bold text-clay-deep mt-0.5">{stats.highPriority}</div>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={prefersReduced ? instantFade : paperSpring}
        className="bg-surface border border-line rounded-2xl p-5 sm:p-6 mb-10 shadow-soft"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="feed-search-input" className="s-label">Search Grievances</label>
            <div className="relative">
              <Search className="w-4 h-4 text-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="feed-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ID, issue, or keyword..."
                className="s-input text-sm"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="feed-cat-select" className="s-label">Category</label>
            <select
              id="feed-cat-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="s-select text-sm cursor-pointer"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((cat) => <option key={cat} value={cat}>{formatCategoryLabel(cat)}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="feed-status-select" className="s-label">Status</label>
            <select
              id="feed-status-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="s-select text-sm cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="under_review">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="urgent">High Priority (Urgent)</option>
              <option value="submitted">Submitted</option>
            </select>
          </div>

          <div>
            <label htmlFor="feed-loc-select" className="s-label">Hostel / Location</label>
            <select
              id="feed-loc-select"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="s-select text-sm cursor-pointer truncate"
            >
              <option value="All">All Locations</option>
              {uniqueHostelLocations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-line flex flex-wrap items-center gap-2">
          <span className="s-mono-micro mr-1">Filter:</span>
          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className={`s-chip ${selectedCategory === 'All' ? 's-chip-active' : ''}`}
          >All</button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(selectedCategory === cat ? 'All' : cat)}
              className={`s-chip ${selectedCategory === cat ? 's-chip-active' : ''}`}
            >
              {formatCategoryLabel(cat)}
            </button>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-line flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="s-mono-micro mr-1">Sort:</span>
            <button
              type="button"
              onClick={() => setSortBy('upvotes')}
              className={`s-chip ${sortBy === 'upvotes' ? 's-chip-active' : ''}`}
            >Most Upvoted</button>
            <button
              type="button"
              onClick={() => setSortBy('newest')}
              className={`s-chip ${sortBy === 'newest' ? 's-chip-active' : ''}`}
            >Most Recent</button>
          </div>

          <div className="flex items-center gap-3">
            {(searchQuery || selectedCategory !== 'All' || selectedLocation !== 'All' || selectedStatus !== 'All') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="font-mono font-bold text-bronze-deep hover:underline cursor-pointer flex items-center gap-1 text-xs uppercase tracking-wide"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
            <span className="text-ink-faint text-[11px]">
              Showing <strong className="text-ink">{filteredComplaints.length}</strong> of <strong className="text-ink">{complaints.length}</strong> complaints
            </span>
          </div>
        </div>
      </motion.div>
      {/* Grid of Complaints Cards */}
      {filteredComplaints.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          animate="visible"
          layout
          variants={{ hidden: {}, visible: { transition: { staggerChildren: prefersReduced ? 0.06 : 0.06, delayChildren: prefersReduced ? 0 : 0.04 } } }}
        >
          <AnimatePresence mode="popLayout">
            {filteredComplaints.map((complaint) => (
              <ComplaintCard
                key={complaint.complaintId || complaint.id}
                complaint={complaint}
                onUpvote={onUpvote}
                onSelect={onSelectComplaint}
                onOpenImage={onOpenImage}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={prefersReduced ? instantFade : paperSpring}
          className="bg-surface border border-line rounded-2xl p-12 text-center max-w-xl mx-auto my-8 shadow-soft paper-grain"
        >
          <div className="w-12 h-12 rounded-2xl bg-accent-soft border border-accent/20 flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-6 h-6 text-accent-deep" />
          </div>
          <h3 className="font-display text-2xl font-semibold text-ink mb-2">No Matching Grievances Found</h3>
          <p className="text-sm text-ink-soft mb-6">There are currently no reported issues matching your filter parameters.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button type="button" onClick={handleResetFilters} className="s-btn s-btn-sm s-btn-primary">Reset Filters</button>
            <button type="button" onClick={onGoToSubmit} className="s-btn s-btn-sm s-btn-secondary">Lodge New Grievance</button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
