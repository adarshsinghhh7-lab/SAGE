import React from 'react';
import { ShieldAlert, Home, LayoutList } from 'lucide-react';
import { PageView } from '../types';

interface NotFoundPageProps {
  onNavigate: (view: PageView) => void;
  message?: string;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  onNavigate,
  message = 'The page you are looking for does not exist in the S.A.G.E. ledger.',
}) => {
  return (
    <div className="max-w-3xl mx-auto py-16 sm:py-24 px-4">
      <div className="bg-surface border border-line-strong p-8 sm:p-12 text-center paper-grain rounded-2xl shadow-lift">
        <div className="w-16 h-16 mx-auto mb-6 bg-ink text-surface flex items-center justify-center rounded-xl border border-line">
          <span className="text-3xl font-mono font-bold">404</span>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest bg-bronze-soft text-bronze-deep px-2.5 py-1 mb-4 rounded-full border border-bronze-deep/20">
          <ShieldAlert className="w-3 h-3" /> Route Not Found
        </span>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink mb-3">404 — Deposition Not Located</h1>
        <p className="text-sm sm:text-base text-ink-soft max-w-xl mx-auto mb-8">{message}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button type="button" onClick={() => onNavigate('landing')} className="w-full sm:w-auto px-6 py-3 bg-bronze text-ink hover:bg-bronze-deep text-xs font-mono font-bold uppercase tracking-wider rounded-xl border border-bronze cursor-pointer flex items-center justify-center gap-2 transition-all shadow-soft">
            <Home className="w-4 h-4" /><span>Return Home</span>
          </button>
          <button type="button" onClick={() => onNavigate('feed')} className="w-full sm:w-auto px-6 py-3 bg-transparent text-ink-soft hover:text-ink text-xs font-mono font-bold uppercase tracking-wider rounded-xl border border-line-strong hover:border-ink-soft transition-colors cursor-pointer flex items-center justify-center gap-2">
            <LayoutList className="w-4 h-4" /><span>Browse Public Ledger</span>
          </button>
        </div>
      </div>
    </div>
  );
};
