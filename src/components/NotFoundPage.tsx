import React from 'react';
import { ShieldAlert, Home, LayoutList } from 'lucide-react';
import { PageView } from '../types';

interface NotFoundPageProps {
  onNavigate: (view: PageView) => void;
  /** Optional message override (e.g. for invalid hash routes) */
  message?: string;
}

/**
 * Simple 404 page rendered when the user navigates to an unknown route
 * or a hash path that doesn't match any known view.
 */
export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  onNavigate,
  message = 'The page you are looking for does not exist in the S.A.G.E. ledger.',
}) => {
  return (
    <div className="max-w-3xl mx-auto py-16 sm:py-24 px-4 text-slate-900">
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 sm:p-12 shadow-lg text-center">
        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-6 bg-slate-900 text-white flex items-center justify-center rounded-lg border border-slate-200">
          <span className="text-3xl font-mono font-bold">404</span>
        </div>

        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest bg-slate-900 text-white px-2.5 py-1 mb-4">
          <ShieldAlert className="w-3 h-3" />
          Route Not Found
        </span>

        <h1 className="font-sans text-3xl sm:text-4xl font-bold tracking-tight mb-3">
          404 — Deposition Not Located
        </h1>

        <p className="font-sans text-sm sm:text-base text-slate-900/80 max-w-xl mx-auto mb-8">
          {message}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="w-full sm:w-auto px-6 py-3 bg-slate-900 text-white text-xs font-mono font-bold uppercase tracking-wider border border-slate-200 rounded-lg hover:bg-indigo-600 transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Return Home</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('feed')}
            className="w-full sm:w-auto px-6 py-3 bg-white text-slate-900 text-xs font-mono font-bold uppercase tracking-wider border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2"
          >
            <LayoutList className="w-4 h-4" />
            <span>Browse Public Ledger</span>
          </button>
        </div>
      </div>
    </div>
  );
};