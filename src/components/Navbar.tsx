import React from 'react';
import {
  PlusCircle,
  LayoutList,
  BarChart3,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { paperSpring, instantFade } from '../motion/tokens';
import { PageView } from '../types';
import { useAuth } from '../context/AuthContext';
import { SageLogo } from './SageLogo';

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
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={prefersReduced ? instantFade : paperSpring}
      className="sticky top-0 z-30"
    >
      {/* Slim protocol strip */}
      <div className="text-canvas/60 text-[9.5px] font-mono uppercase tracking-[0.2em] py-1.5 px-4 text-center bg-moss-deep overflow-hidden">
        <span>Campus Integrity &amp; Anonymous Escalation · Protected by the S.A.G.E. Protocol</span>
      </div>

      <div className="bg-surface/85 backdrop-blur-xl border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col lg:flex-row items-center justify-between gap-3">
          <div
            className="flex items-center gap-3 cursor-pointer group shrink-0"
            onClick={() => onNavigate('landing')}
            title="Return to S.A.G.E. Overview"
          >
            <SageLogo size={40} className="transition-transform duration-300 group-hover:scale-105 drop-shadow-md" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[1.4rem] leading-none font-semibold tracking-tight text-ink" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                  S.A.G.E.
                </span>
                <span className="text-[9px] font-mono uppercase text-bronze-deep px-1.5 py-0.5 border border-bronze/40 rounded-full hidden sm:inline-flex tracking-[0.14em]">
                  Official
                </span>
              </div>
              <p className="text-[9.5px] font-mono tracking-[0.14em] text-ink-faint uppercase mt-1">
                Anonymous Grievance &amp; Escalation
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-1 overflow-x-auto max-w-full scrollbar-none -mx-1 px-1 pb-1 sm:pb-0">
            <NavButton id="nav-landing-btn" active={currentView === 'landing'} onClick={() => onNavigate('landing')}>
              <Info className="w-3.5 h-3.5" /><span>How It Works</span>
            </NavButton>
            <NavButton id="nav-submit-btn" active={currentView === 'submit' || currentView === 'confirmation'} onClick={() => onNavigate('submit')}>
              <PlusCircle className="w-3.5 h-3.5" /><span>Lodge Grievance</span>
            </NavButton>
            <NavButton id="nav-feed-btn" active={currentView === 'feed' || currentView === 'detail'} onClick={() => onNavigate('feed')}>
              <LayoutList className="w-3.5 h-3.5" /><span>Public Ledger</span>
              <span className="ml-0.5 rounded-full bg-accent text-white px-1.5 py-0.5 text-[9px] font-bold">{totalComplaintsCount}</span>
            </NavButton>
            <NavButton id="nav-admin-btn" active={currentView === 'admin'} onClick={() => onNavigate('admin')}>
              <BarChart3 className="w-3.5 h-3.5" /><span>Admin</span>
            </NavButton>
            <button
              id="nav-role-switcher-btn"
              type="button"
              onClick={openAuthModal}
              className="px-3 py-2 rounded-xl border border-line-strong bg-surface text-ink-soft hover:border-accent hover:text-accent-deep hover:-translate-y-px shadow-soft transition-all flex items-center gap-1.5 cursor-pointer font-mono text-[10px] font-bold uppercase tracking-[0.1em]"
              title="Switch Firebase Auth Role"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-bronze" />
              <span className="hidden md:inline">Role:</span>
              <span className="font-extrabold">{activeRole.replace('_', ' ')}</span>
            </button>
          </nav>
        </div>
      </div>
    </motion.header>
  );
};

const NavButton: React.FC<{ id: string; active: boolean; onClick: () => void; children: React.ReactNode }> = ({ id, active, onClick, children }) => (
  <button
    id={id}
    type="button"
    onClick={onClick}
    className={`relative px-3.5 py-2 rounded-xl font-mono text-[10px] font-bold uppercase tracking-[0.1em] transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
      active ? 'text-accent-deep' : 'text-ink-soft hover:text-ink'
    }`}
  >
    {active && (
      <motion.span
        layoutId="nav-active-pill"
        className="absolute inset-0 rounded-xl bg-accent-soft border border-accent/30"
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      />
    )}
    <span className="relative z-10 flex items-center gap-1.5">{children}</span>
  </button>
);