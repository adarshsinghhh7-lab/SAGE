import React from 'react';
import { 
  PlusCircle, 
  LayoutList, 
  BarChart3, 
  Info,
  ShieldCheck
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { paperSpring, instantFade } from '../motion/tokens';
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
  const prefersReduced = useReducedMotion();

  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={prefersReduced ? instantFade : paperSpring}
      className="border-b border-[#2A2F3E] sticky top-0 z-30 bg-[#1D2130]"
    >
      {/* Top classification bar */}
      <div className="text-[#EBE3D0]/70 text-[10px] font-mono uppercase tracking-widest py-1.5 px-4 text-center bg-[#0B0C0F] border-b border-[#2A2F3E] overflow-hidden">
        <span>CAMPUS INTEGRITY & ANONYMOUS ESCALATION LEDGER · PROTECTED BY S.A.G.E. PROTOCOL</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => onNavigate('landing')}
          title="Return to S.A.G.E. Overview"
        >
          <div className="w-10 h-10 text-[#151820] font-bold text-xl flex items-center justify-center bg-[#B59340] group-hover:scale-105 transition-transform">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tight text-[#EBE3D0]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                S.A.G.E.
              </span>
              <span className="text-[10px] font-mono uppercase text-[#B59340] px-1.5 py-0.5 border border-[#B59340]/40 hidden xs:inline-flex">
                OFFICIAL
              </span>
            </div>
            <p className="text-[10px] font-mono tracking-wider text-[#A0A9B6] uppercase">
              Student Anonymous Grievance & Escalation
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto max-w-full scrollbar-none -mx-1 px-1 pb-1 sm:pb-0 sm:flex-wrap sm:justify-center">
          <NavButton id="nav-landing-btn" active={currentView === 'landing'} onClick={() => onNavigate('landing')}>
            <Info className="w-3.5 h-3.5" /><span>How It Works</span>
          </NavButton>
          <NavButton id="nav-submit-btn" active={currentView === 'submit' || currentView === 'confirmation'} onClick={() => onNavigate('submit')}>
            <PlusCircle className="w-3.5 h-3.5" /><span>Lodge Grievance</span>
          </NavButton>
          <NavButton id="nav-feed-btn" active={currentView === 'feed' || currentView === 'detail'} onClick={() => onNavigate('feed')}>
            <LayoutList className="w-3.5 h-3.5" /><span>Public Ledger</span>
            <span className="ml-0.5 text-[10px] bg-[#2A2F3E] text-[#EBE3D0] px-1.5 py-0.2 font-mono">{totalComplaintsCount}</span>
          </NavButton>
          <NavButton id="nav-admin-btn" active={currentView === 'admin'} onClick={() => onNavigate('admin')}>
            <BarChart3 className="w-3.5 h-3.5" /><span>Admin Dashboard</span>
          </NavButton>
          <button
            id="nav-role-switcher-btn"
            type="button"
            onClick={openAuthModal}
            className="px-2.5 py-2 text-[10px] font-mono font-bold uppercase border border-[#5B7D5B]/40 bg-[#5B7D5B]/10 hover:bg-[#5B7D5B]/20 text-[#5B7D5B] transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Switch Firebase Auth Role"
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

const NavButton: React.FC<{ id: string; active: boolean; onClick: () => void; children: React.ReactNode }> = ({ id, active, onClick, children }) => (
  <button
    id={id}
    type="button"
    onClick={onClick}
    className={`px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
      active
        ? 'bg-[#B59340] text-[#151820]'
        : 'bg-transparent text-[#A0A9B6] hover:text-[#EBE3D0] border border-[#2A2F3E] hover:border-[#A0A9B6]'
    }`}
  >
    {children}
  </button>
);
