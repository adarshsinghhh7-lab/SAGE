import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  PlusCircle, 
  RotateCcw, 
  Inbox, 
  Lock 
} from 'lucide-react';
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

  // Extract unique hostels/locations for filtering
  const uniqueHostelLocations = useMemo(() => {
    const locations = new Set<string>();
    complaints.forEach((c) => {
      const locStr = c.hostelOrLocation || c.location || '';
      const loc = locStr.split('-')[0].split('(')[0].trim();
      if (loc) locations.add(loc);
    });
    return Array.from(locations).sort();
  }, [complaints]);

  // Overall counts and statistics
  const stats = useMemo(() => {
    const total = complaints.length;
    const underReview = complaints.filter((c) => (c.status || '').toLowerCase() === 'under_review').length;
    const resolved = complaints.filter((c) => (c.status || '').toLowerCase() === 'resolved').length;
    const highPriority = complaints.filter((c) => (c.urgencyScore >= 0.75 || c.urgency === 'Urgent') && (c.status || '').toLowerCase() !== 'resolved').length;
    return { total, underReview, resolved, highPriority };
  }, [complaints]);

  // Filter and sort complaints
  const filteredComplaints = useMemo(() => {
    return complaints
      .filter((complaint) => {
        const compId = complaint.complaintId || complaint.id || '';
        const loc = complaint.hostelOrLocation || complaint.location || '';
        const cat = complaint.category || '';
        const st = complaint.status || '';

        // Search Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesId = compId.toLowerCase().includes(q);
          const matchesDesc = complaint.description.toLowerCase().includes(q);
          const matchesLoc = loc.toLowerCase().includes(q);
          const matchesCat = cat.toLowerCase().includes(q);
          if (!matchesId && !matchesDesc && !matchesLoc && !matchesCat) {
            return false;
          }
        }

        // Category Filter
        if (selectedCategory !== 'All') {
          const filterCat = selectedCategory.toLowerCase().replace('/', '_');
          const compCat = cat.toLowerCase().replace('/', '_');
          if (!compCat.includes(filterCat) && !filterCat.includes(compCat)) {
            return false;
          }
        }

        // Hostel / Location Filter
        if (selectedLocation !== 'All' && !loc.toLowerCase().includes(selectedLocation.toLowerCase())) {
          return false;
        }

        // Status Filter
        if (selectedStatus !== 'All') {
          const filterSt = selectedStatus.toLowerCase().replace(' ', '_');
          const compSt = st.toLowerCase().replace(' ', '_');
          if (filterSt === 'urgent' || filterSt === 'high_priority') {
            if (complaint.urgencyScore < 0.75 || compSt === 'resolved') return false;
          } else if (compSt !== filterSt) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const votesA = a.upvoteCount !== undefined ? a.upvoteCount : (a.upvotes || 0);
        const votesB = b.upvoteCount !== undefined ? b.upvoteCount : (b.upvotes || 0);

        if (sortBy === 'upvotes') {
          return votesB - votesA;
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
    <div className="max-w-7xl mx-auto py-8 sm:py-10 px-4 sm:px-6 lg:px-8 text-slate-900">
      {/* Header Banner */}
      <div className="mb-8 border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest bg-slate-900 text-white px-2 py-0.5">
              Live Public Ledger (Firestore)
            </span>
            <span className="text-[10px] font-mono text-slate-900/70 uppercase tracking-wider flex items-center gap-1">
              <Lock className="w-3 h-3 text-indigo-600" />
              Cryptographically Blinded · SHA-256 Voter Registry
            </span>
          </div>
          <h1 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
            Campus Grievance Ledger
          </h1>
          <p className="font-sans text-sm sm:text-base text-slate-900/80 mt-1 max-w-2xl">
            Community-prioritized grievances across student housing, academic facilities, and campus infrastructure.
          </p>
        </div>

        <button
          id="feed-lodge-grievance-btn"
          type="button"
          onClick={onGoToSubmit}
          className="px-5 py-3 bg-slate-900 hover:bg-indigo-600 text-white text-xs font-mono font-bold uppercase tracking-wider border border-slate-200 rounded-lg transition-all shadow-md hover:translate-x-[-1px] hover:translate-y-[-1px] cursor-pointer flex items-center justify-center gap-2 self-start md:self-auto shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Lodge Grievance</span>
        </button>
      </div>

      {/* Top Status & Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 shadow-md">
          <div className="text-[10px] font-mono font-bold uppercase text-slate-900/60">Total Depositions</div>
          <div className="text-2xl font-mono font-bold text-slate-900 mt-0.5">{stats.total}</div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 shadow-md">
          <div className="text-[10px] font-mono font-bold uppercase text-amber-900">Under Review</div>
          <div className="text-2xl font-mono font-bold text-amber-800 mt-0.5">{stats.underReview}</div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 shadow-md">
          <div className="text-[10px] font-mono font-bold uppercase text-emerald-900">Resolved</div>
          <div className="text-2xl font-mono font-bold text-emerald-800 mt-0.5">{stats.resolved}</div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 shadow-md">
          <div className="text-[10px] font-mono font-bold uppercase text-indigo-800">High Priority</div>
          <div className="text-2xl font-mono font-bold text-indigo-600 mt-0.5">{stats.highPriority}</div>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 sm:p-6 mb-8 shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Box */}
          <div className="relative">
            <label htmlFor="feed-search-input" className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-900/70 mb-1">
              Search Grievances
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-900/50 absolute left-3 top-2.5 pointer-events-none" />
              <input
                id="feed-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ID, issue, or keyword..."
                className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-slate-900 placeholder:text-slate-900/40 focus:outline-none focus:bg-slate-50"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label htmlFor="feed-cat-select" className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-900/70 mb-1">
              Category
            </label>
            <select
              id="feed-cat-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {formatCategoryLabel(cat)}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="feed-status-select" className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-900/70 mb-1">
              Status
            </label>
            <select
              id="feed-status-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="under_review">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="urgent">High Priority (Urgent)</option>
              <option value="submitted">Submitted</option>
            </select>
          </div>

          {/* Hostel / Location Filter */}
          <div>
            <label htmlFor="feed-loc-select" className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-900/70 mb-1">
              Hostel / Location
            </label>
            <select
              id="feed-loc-select"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-900 focus:outline-none cursor-pointer truncate"
            >
              <option value="All">All Locations</option>
              {uniqueHostelLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Category Chips */}
        <div className="mt-4 pt-3 border-t border-slate-900/15 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-mono uppercase text-slate-900/60 font-bold mr-1">
            Filter Chips:
          </span>
          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className={`text-[10px] font-mono uppercase px-2 py-0.5 border transition-all cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-slate-900 text-white border-slate-300 font-bold'
                : 'bg-slate-100 text-slate-900 border-slate-900/30 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(selectedCategory === cat ? 'All' : cat)}
              className={`text-[10px] font-mono uppercase px-2 py-0.5 border transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white border-slate-300 font-bold'
                  : 'bg-slate-100 text-slate-900 border-slate-900/30 hover:bg-slate-200'
              }`}
            >
              {formatCategoryLabel(cat)}
            </button>
          ))}
        </div>

        {/* Sort Controls & Reset Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-900/15 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-900/60 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3" />
              Sort By:
            </span>
            <div className="inline-flex gap-1.5">
              <button
                type="button"
                onClick={() => setSortBy('upvotes')}
                className={`px-3 py-1 text-xs uppercase font-bold border transition-colors cursor-pointer ${
                  sortBy === 'upvotes'
                    ? 'bg-slate-900 text-white border-slate-300'
                    : 'bg-white text-slate-900 border-slate-900/30 hover:bg-slate-100'
                }`}
              >
                Most Upvoted
              </button>
              <button
                type="button"
                onClick={() => setSortBy('newest')}
                className={`px-3 py-1 text-xs uppercase font-bold border transition-colors cursor-pointer ${
                  sortBy === 'newest'
                    ? 'bg-slate-900 text-white border-slate-300'
                    : 'bg-white text-slate-900 border-slate-900/30 hover:bg-slate-100'
                }`}
              >
                Most Recent
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {(searchQuery || selectedCategory !== 'All' || selectedLocation !== 'All' || selectedStatus !== 'All') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="font-bold text-indigo-600 hover:underline cursor-pointer flex items-center gap-1 text-xs"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}

            <span className="text-slate-900/60 text-[11px]">
              Showing <strong>{filteredComplaints.length}</strong> of <strong>{complaints.length}</strong> complaints
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Complaints Cards */}
      {filteredComplaints.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredComplaints.map((complaint) => (
            <ComplaintCard
              key={complaint.complaintId || complaint.id}
              complaint={complaint}
              onUpvote={onUpvote}
              onSelect={onSelectComplaint}
              onOpenImage={onOpenImage}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-12 text-center shadow-md max-w-xl mx-auto my-8">
          <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-6 h-6 text-slate-900/60" />
          </div>
          <h3 className="font-sans text-2xl font-bold text-slate-900 mb-2">
            No Matching Grievances Found
          </h3>
          <p className="font-sans text-sm text-slate-900/70 mb-6">
            There are currently no reported issues matching your filter parameters. Try resetting your search or adjust the filters.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-mono font-bold uppercase border border-slate-200 rounded-lg cursor-pointer"
            >
              Reset Filters
            </button>
            <button
              type="button"
              onClick={onGoToSubmit}
              className="px-4 py-2 bg-white text-slate-900 text-xs font-mono font-bold uppercase border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              Lodge New Grievance
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
