import React from 'react';
import { 
  PlusCircle, 
  LayoutList, 
  BarChart3, 
  Info,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { PageView } from '../types';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentView: PageView;
  onNavigate: (view: PageView) => void;
  totalComplaintsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  totalComplaintsCount,
}) => {
  const { activeRole, openAuthModal } = useAuth();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="border-b border-indigo-100/50 sticky top-0 z-30 glass-card-strong shadow-sm"
    >
      {/* Top micro-bar */}
      <div className="text-white text-[10px] font-mono uppercase tracking-widest py-1.5 px-4 text-center" style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)' }}>
        <span className="opacity-95">CAMPUS INTEGRITY & ANONYMOUS ESCALATION LEDGER · PROTECTED BY S.A.G.E. PROTOCOL</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand / Masthead Title */}
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => onNavigate('landing')}
          title="Return to S.A.G.E. Overview"
        >
          <div className="w-10 h-10 text-white font-sans font-bold text-xl flex items-center justify-center rounded-xl group-hover:scale-105 transition-transform shadow-md" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-sans text-2xl font-bold tracking-tight gradient-text">
                S.A.G.E.
              </span>
              <span className="text-[10px] font-mono uppercase bg-indigo-100 text-indigo-700 px-1.5 py-0.5 border border-indigo-200 rounded-md">
                OFFICIAL
              </span>
            </div>
            <p className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">
              Student Anonymous Grievance & Escalation
            </p>
          </div>
        </div>

        {/* View Switcher Controls */}
        <nav className="flex items-center gap-2 sm:gap-2.5 flex-wrap justify-center">
          <button
            id="nav-landing-btn"
            type="button"
            onClick={() => onNavigate('landing')}
            className={`px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all rounded-xl cursor-pointer flex items-center gap-1.5 ${
              currentView === 'landing'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-200'
                : 'bg-white/60 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200/50'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>How It Works</span>
          </button>

          <button
            id="nav-submit-btn"
            type="button"
            onClick={() => onNavigate('submit')}
            className={`px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all rounded-xl cursor-pointer flex items-center gap-1.5 ${
              currentView === 'submit' || currentView === 'confirmation'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-200'
                : 'bg-white/60 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200/50'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Lodge Grievance</span>
          </button>

          <button
            id="nav-feed-btn"
            type="button"
            onClick={() => onNavigate('feed')}
            className={`px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all rounded-xl cursor-pointer flex items-center gap-1.5 ${
              currentView === 'feed' || currentView === 'detail'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-200'
                : 'bg-white/60 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200/50'
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span>Public Ledger</span>
            <span className="ml-0.5 text-[10px] bg-white/25 text-white px-1.5 py-0.2 rounded-lg font-mono">
              {totalComplaintsCount}
            </span>
          </button>

          <button
            id="nav-admin-btn"
            type="button"
            onClick={() => onNavigate('admin')}
            className={`px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all rounded-xl cursor-pointer flex items-center gap-1.5 ${
              currentView === 'admin'
                ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-md shadow-violet-200'
                : 'bg-white/60 text-slate-600 hover:text-violet-600 hover:bg-violet-50 border border-slate-200/50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Admin Dashboard</span>
          </button>

          <button
            id="nav-role-switcher-btn"
            type="button"
            onClick={openAuthModal}
            className="px-2.5 py-2 text-[11px] font-mono font-bold uppercase border border-emerald-200 rounded-xl bg-emerald-50/80 hover:bg-emerald-100 text-emerald-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Switch Firebase Auth Role Claim (Student / Admin / Head Admin)"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Role:</span>
            <span className="font-bold">{activeRole.replace('_', ' ')}</span>
          </button>
        </nav>
      </div>
    </motion.header>
  );
};
