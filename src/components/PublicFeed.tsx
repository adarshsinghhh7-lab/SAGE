import React, { useState, useMemo } from 'react';
import { 
  Search, 
  PlusCircle, 
  RotateCcw, 
  Inbox, 
  Lock 
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
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
    <div className="max-w-7xl mx-auto py-8 sm:py-10 px-4 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="mb-8 border-b border-[#2A2F3E] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest bg-[#0B0C0F] text-[#E8DFC8] px-2 py-0.5 border border-[#2A2F3E]">
              Live Public Ledger (Firestore)
            </span>
            <span className="text-[10px] font-mono text-[#9AA3B0] uppercase tracking-wider flex items-center gap-1">
              <Lock className="w-3 h-3 text-[#B08D3E]" />
              Cryptographically Blinded · SHA-256 Voter Registry
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#E8DFC8] tracking-tight">
            Campus Grievance Ledger
          </h1>
          <p className="text-sm sm:text-base text-[#E8DFC8]/70 mt-1 max-w-2xl">
            Community-prioritized grievances across student housing, academic facilities, and campus infrastructure.
          </p>
        </div>

        <button
          id="feed-lodge-grievance-btn"
          type="button"
          onClick={onGoToSubmit}
          className="px-5 py-3 bg-[#B08D3E] hover:bg-[#C09E4F] text-[#14171F] text-xs font-mono font-bold uppercase tracking-wider border border-[#B08D3E] transition-all cursor-pointer flex items-center justify-center gap-2 self-start md:self-auto shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Lodge Grievance</span>
        </button>
      </div>

      {/* Top Status & Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="bg-[#1E2230] border border-[#2A2F3E] p-3.5">
          <div className="text-[10px] font-mono font-bold uppercase text-[#9AA3B0]">Total Depositions</div>
          <div className="text-2xl font-mono font-bold text-[#E8DFC8] mt-0.5">{stats.total}</div>
        </div>
        <div className="bg-[#1E2230] border border-[#B08D3E]/40 p-3.5">
          <div className="text-[10px] font-mono font-bold uppercase text-[#B08D3E]">Under Review</div>
          <div className="text-2xl font-mono font-bold text-[#B08D3E] mt-0.5">{stats.underReview}</div>
        </div>
        <div className="bg-[#1E2230] border border-[#5B7D5B]/40 p-3.5">
          <div className="text-[10px] font-mono font-bold uppercase text-[#5B7D5B]">Resolved</div>
          <div className="text-2xl font-mono font-bold text-[#5B7D5B] mt-0.5">{stats.resolved}</div>
        </div>
        <div className="bg-[#1E2230] border border-[#A6352C]/40 p-3.5">
          <div className="text-[10px] font-mono font-bold uppercase text-[#A6352C]">High Priority</div>
          <div className="text-2xl font-mono font-bold text-[#A6352C] mt-0.5">{stats.highPriority}</div>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-[#1E2230] border border-[#2A2F3E] p-5 sm:p-6 mb-8 paper-grain">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <label htmlFor="feed-search-input" className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#9AA3B0] mb-1">
              Search Grievances
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-[#5B6472] absolute left-3 top-2.5 pointer-events-none" />
              <input
                id="feed-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ID, issue, or keyword..."
                className="w-full bg-[#0B0C0F] border border-[#2A2F3E] pl-9 pr-3 py-2 text-xs font-mono text-[#E8DFC8] placeholder:text-[#5B6472] focus:outline-none focus:border-[#B08D3E]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="feed-cat-select" className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#9AA3B0] mb-1">
              Category
            </label>
            <select
              id="feed-cat-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-[#0B0C0F] border border-[#2A2F3E] p-2 text-xs font-mono text-[#E8DFC8] focus:outline-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((cat) => <option key={cat} value={cat}>{formatCategoryLabel(cat)}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="feed-status-select" className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#9AA3B0] mb-1">
              Status
            </label>
            <select
              id="feed-status-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-[#0B0C0F] border border-[#2A2F3E] p-2 text-xs font-mono text-[#E8DFC8] focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="under_review">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="urgent">High Priority (Urgent)</option>
              <option value="submitted">Submitted</option>
            </select>
          </div>

          <div>
            <label htmlFor="feed-loc-select" className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#9AA3B0] mb-1">
              Hostel / Location
            </label>
            <select
              id="feed-loc-select"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full bg-[#0B0C0F] border border-[#2A2F3E] p-2 text-xs font-mono text-[#E8DFC8] focus:outline-none cursor-pointer truncate"
            >
              <option value="All">All Locations</option>
              {uniqueHostelLocations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#2A2F3E] flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-mono uppercase text-[#9AA3B0] font-bold mr-1">Filter Chips:</span>
          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className={`text-[10px] font-mono uppercase px-2 py-0.5 border transition-all cursor-pointer ${selectedCategory === 'All' ? 'bg-[#B08D3E] text-[#14171F] border-[#B08D3E] font-bold' : 'bg-transparent text-[#E8DFC8]/70 border-[#2A2F3E] hover:border-[#5B6472]'}`}
          >All</button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(selectedCategory === cat ? 'All' : cat)}
              className={`text-[10px] font-mono uppercase px-2 py-0.5 border transition-all cursor-pointer ${selectedCategory === cat ? 'bg-[#B08D3E] text-[#14171F] border-[#B08D3E] font-bold' : 'bg-transparent text-[#E8DFC8]/70 border-[#2A2F3E] hover:border-[#5B6472]'}`}
            >
              {formatCategoryLabel(cat)}
            </button>
          ))}
        </div>

        {/* Sort controls */}
        <div className="mt-4 pt-3 border-t border-[#2A2F3E] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase text-[#9AA3B0] font-bold mr-1">Sort:</span>
            <button
              type="button"
              onClick={() => setSortBy('upvotes')}
              className={`px-3 py-1 text-[10px] uppercase font-bold border transition-colors cursor-pointer ${sortBy === 'upvotes' ? 'bg-[#B08D3E] text-[#14171F] border-[#B08D3E]' : 'bg-transparent text-[#E8DFC8]/70 border-[#2A2F3E]'}`}
            >Most Upvoted</button>
            <button
              type="button"
              onClick={() => setSortBy('newest')}
              className={`px-3 py-1 text-[10px] uppercase font-bold border transition-colors cursor-pointer ${sortBy === 'newest' ? 'bg-[#B08D3E] text-[#14171F] border-[#B08D3E]' : 'bg-transparent text-[#E8DFC8]/70 border-[#2A2F3E]'}`}
            >Most Recent</button>
          </div>

          <div className="flex items-center gap-3">
            {(searchQuery || selectedCategory !== 'All' || selectedLocation !== 'All' || selectedStatus !== 'All') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="font-bold text-[#B08D3E] hover:underline cursor-pointer flex items-center gap-1 text-xs"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
            <span className="text-[#9AA3B0] text-[11px]">
              Showing <strong className="text-[#E8DFC8]">{filteredComplaints.length}</strong> of <strong className="text-[#E8DFC8]">{complaints.length}</strong> complaints
            </span>
          </div>
        </div>
      </div>

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
        <div className="bg-[#1E2230] border border-[#2A2F3E] p-12 text-center max-w-xl mx-auto my-8 paper-grain">
          <div className="w-12 h-12 bg-[#0B0C0F] border border-[#2A2F3E] flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-6 h-6 text-[#B08D3E]" />
          </div>
          <h3 className="text-2xl font-bold text-[#E8DFC8] mb-2">No Matching Grievances Found</h3>
          <p className="text-sm text-[#E8DFC8]/70 mb-6">There are currently no reported issues matching your filter parameters.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button type="button" onClick={handleResetFilters} className="px-4 py-2 bg-[#B08D3E] text-[#14171F] text-xs font-mono font-bold uppercase cursor-pointer">Reset Filters</button>
            <button type="button" onClick={onGoToSubmit} className="px-4 py-2 bg-transparent text-[#E8DFC8] text-xs font-mono font-bold uppercase border border-[#2A2F3E] hover:border-[#5B6472] cursor-pointer">Lodge New Grievance</button>
          </div>
        </div>
      )}
    </div>
  );
};
