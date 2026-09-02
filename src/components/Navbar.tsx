import React from 'react';
import { 
  PlusCircle, 
  LayoutList, 
  BarChart3, 
  Info,
  ShieldCheck
} from 'lucide-react';
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
    <header className="border-b-2 border-[#1C1C1C] bg-[#FAF9F6] sticky top-0 z-30 shadow-xs">
      {/* Top micro-bar */}
      <div className="bg-[#1C1C1C] text-[#FAF9F6] text-[10px] font-mono uppercase tracking-widest py-1 px-4 text-center">
        <span>CAMPUS INTEGRITY & ANONYMOUS ESCALATION LEDGER · PROTECTED BY S.A.G.E. PROTOCOL</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand / Masthead Title */}
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => onNavigate('landing')}
          title="Return to S.A.G.E. Overview"
        >
          <div className="w-10 h-10 bg-[#1C1C1C] text-[#FAF9F6] font-serif font-black text-xl flex items-center justify-center rounded-none border border-[#1C1C1C] group-hover:bg-red-700 transition-colors">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif-editorial text-2xl font-black tracking-tight text-[#1C1C1C]">
                S.A.G.E.
              </span>
              <span className="text-[10px] font-mono uppercase bg-stone-200/80 text-[#1C1C1C] px-1.5 py-0.5 border border-[#1C1C1C]/30">
                OFFICIAL
              </span>
            </div>
            <p className="text-[10px] font-mono tracking-wider text-[#1C1C1C]/70 uppercase">
              Student Anonymous Grievance & Escalation
            </p>
          </div>
        </div>

        {/* View Switcher Controls */}
        <nav className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
          <button
            id="nav-landing-btn"
            type="button"
            onClick={() => onNavigate('landing')}
            className={`px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all border-2 border-[#1C1C1C] cursor-pointer flex items-center gap-1.5 ${
              currentView === 'landing'
                ? 'bg-[#1C1C1C] text-[#FAF9F6] shadow-[2px_2px_0px_0px_#1C1C1C]'
                : 'bg-[#FAF9F6] text-[#1C1C1C] hover:bg-stone-200/60'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>How It Works</span>
          </button>

          <button
            id="nav-submit-btn"
            type="button"
            onClick={() => onNavigate('submit')}
            className={`px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all border-2 border-[#1C1C1C] cursor-pointer flex items-center gap-1.5 ${
              currentView === 'submit' || currentView === 'confirmation'
                ? 'bg-[#1C1C1C] text-[#FAF9F6] shadow-[2px_2px_0px_0px_#1C1C1C]'
                : 'bg-[#FAF9F6] text-[#1C1C1C] hover:bg-stone-200/60'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Lodge Grievance</span>
          </button>

          <button
            id="nav-feed-btn"
            type="button"
            onClick={() => onNavigate('feed')}
            className={`px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all border-2 border-[#1C1C1C] cursor-pointer flex items-center gap-1.5 ${
              currentView === 'feed' || currentView === 'detail'
                ? 'bg-[#1C1C1C] text-[#FAF9F6] shadow-[2px_2px_0px_0px_#1C1C1C]'
                : 'bg-[#FAF9F6] text-[#1C1C1C] hover:bg-stone-200/60'
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span>Public Ledger</span>
            <span className="ml-0.5 text-[10px] bg-red-700 text-white px-1.5 py-0.2 rounded-none font-mono">
              {totalComplaintsCount}
            </span>
          </button>

          <button
            id="nav-admin-btn"
            type="button"
            onClick={() => onNavigate('admin')}
            className={`px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all border-2 border-[#1C1C1C] cursor-pointer flex items-center gap-1.5 ${
              currentView === 'admin'
                ? 'bg-red-700 text-[#FAF9F6] border-red-800 shadow-[2px_2px_0px_0px_#1C1C1C]'
                : 'bg-white text-[#1C1C1C] hover:bg-red-50 hover:text-red-800 border-[#1C1C1C]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Admin Dashboard</span>
          </button>

          <button
            id="nav-role-switcher-btn"
            type="button"
            onClick={openAuthModal}
            className="px-2.5 py-2 text-[11px] font-mono font-bold uppercase border-2 border-[#1C1C1C] bg-stone-100 hover:bg-stone-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Switch Firebase Auth Role Claim (Student / Admin / Head Admin)"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-800" />
            <span className="hidden md:inline">Role:</span>
            <span className="font-bold text-red-700">{activeRole.replace('_', ' ')}</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
