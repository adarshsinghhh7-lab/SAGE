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
      <div className="bg-[#1E2230] border border-[#2A2F3E] p-8 sm:p-12 text-center paper-grain">
        <div className="w-16 h-16 mx-auto mb-6 bg-[#0B0C0F] text-[#E8DFC8] flex items-center justify-center border border-[#2A2F3E]">
          <span className="text-3xl font-mono font-bold">404</span>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest bg-[#0B0C0F] text-[#E8DFC8] px-2.5 py-1 mb-4 border border-[#2A2F3E]">
          <ShieldAlert className="w-3 h-3" /> Route Not Found
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#E8DFC8] mb-3">404 — Deposition Not Located</h1>
        <p className="text-sm sm:text-base text-[#E8DFC8]/70 max-w-xl mx-auto mb-8">{message}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button type="button" onClick={() => onNavigate('landing')} className="w-full sm:w-auto px-6 py-3 bg-[#B08D3E] text-[#14171F] text-xs font-mono font-bold uppercase tracking-wider border border-[#B08D3E] cursor-pointer flex items-center justify-center gap-2">
            <Home className="w-4 h-4" /><span>Return Home</span>
          </button>
          <button type="button" onClick={() => onNavigate('feed')} className="w-full sm:w-auto px-6 py-3 bg-transparent text-[#E8DFC8] text-xs font-mono font-bold uppercase tracking-wider border border-[#2A2F3E] hover:border-[#5B6472] transition-colors cursor-pointer flex items-center justify-center gap-2">
            <LayoutList className="w-4 h-4" /><span>Browse Public Ledger</span>
          </button>
        </div>
      </div>
    </div>
  );
};
