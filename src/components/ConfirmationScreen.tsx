import React, { useState } from 'react';
import {
  Copy,
  Check,
  ArrowRight,
  PlusCircle,
  ShieldCheck,
  MapPin,
  Tag,
  Clock,
  Eye,
  Lock,
  FileCheck,
  Link2
} from 'lucide-react';
import { Complaint } from '../types';
import { getCategoryBadgeStyle, getStatusBadgeStyle, formatCategoryLabel, formatStatusLabel, formatTimeAgo } from '../utils/formatters';

interface ConfirmationScreenProps {
  complaint: Complaint;
  onGoToFeed: () => void;
  onSubmitAnother: () => void;
}

export const ConfirmationScreen: React.FC<ConfirmationScreenProps> = ({
  complaint,
  onGoToFeed,
  onSubmitAnother,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const compId = complaint.complaintId || complaint.id || 'SAGE-0000';
  const location = complaint.hostelOrLocation || complaint.location || 'Campus General';

  const copyIdToClipboard = () => {
    navigator.clipboard.writeText(compId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const copyPublicLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#/complaint/${encodeURIComponent(compId)}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  };

  const catStyle = getCategoryBadgeStyle(complaint.category);
  const statusStyle = getStatusBadgeStyle(complaint.status);

  return (
    <div className="max-w-2xl mx-auto py-10 sm:py-14 px-4 sm:px-6 text-[#1C1C1C]">
      <div className="bg-[#FAF9F6] border-2 border-[#1C1C1C] p-6 sm:p-10 text-center shadow-[6px_6px_0px_0px_#1C1C1C] relative">
        {/* Success Marker */}
        <div className="w-14 h-14 bg-[#1C1C1C] text-[#FAF9F6] border-2 border-[#1C1C1C] flex items-center justify-center mx-auto mb-4">
          <FileCheck className="w-7 h-7" />
        </div>

        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#1C1C1C]/60 bg-stone-200/80 px-2.5 py-0.5 border border-[#1C1C1C]/30 inline-block mb-2">
          DEPOSITION RECORDED (complaints COLLECTION)
        </span>
        <h1 className="font-serif-editorial text-3xl sm:text-4xl font-bold text-[#1C1C1C] mb-2">
          Grievance Lodged Successfully
        </h1>

        {/* Required Anonymity Statement */}
        <div className="bg-stone-100 border-2 border-[#1C1C1C] p-4 my-6 text-left flex items-start gap-3 shadow-[2px_2px_0px_0px_#1C1C1C]">
          <ShieldCheck className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
          <p className="font-serif text-sm text-[#1C1C1C] leading-relaxed">
            Your identity is not visible to anyone during normal review. You can track this complaint using your ID.
          </p>
        </div>

        {/* Complaint Tracking ID Ticket */}
        <div className="bg-white border-2 border-[#1C1C1C] p-6 mb-7 text-left shadow-[3px_3px_0px_0px_#1C1C1C]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#1C1C1C]/60 block mb-1">
                Official Tracking ID
              </span>
              <div className="flex items-center gap-3">
                <span id="generated-complaint-id" className="text-3xl sm:text-4xl font-mono font-bold tracking-wider text-red-700">
                  {compId}
                </span>
              </div>
              <p className="text-xs font-serif text-[#1C1C1C]/70 mt-1 italic">
                Retain this reference ID to track administrative responses or escalation status.
              </p>
            </div>

            <button
              id="copy-complaint-id-btn"
              type="button"
              onClick={copyIdToClipboard}
              className={`px-5 py-3 font-mono font-bold text-xs uppercase tracking-wider border-2 border-[#1C1C1C] flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 shadow-[2px_2px_0px_0px_#1C1C1C] ${
                copied
                  ? 'bg-emerald-800 text-white'
                  : 'bg-[#1C1C1C] text-[#FAF9F6] hover:bg-stone-800'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>ID Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy ID</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Deposition Summary Card (Strictly NO student name/email anywhere) */}
        <div className="border-2 border-[#1C1C1C] bg-stone-50 p-5 mb-8 text-left divide-y divide-[#1C1C1C]/20">
          <div className="flex items-center justify-between pb-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#1C1C1C]/60">
              Deposition Details
            </span>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-bold uppercase border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
              {formatStatusLabel(complaint.status)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-xs font-mono">
            <div className="flex items-center gap-2 text-[#1C1C1C]">
              <Tag className="w-3.5 h-3.5 text-[#1C1C1C]/60 shrink-0" />
              <span>Category:</span>
              <span className={`font-bold px-1.5 py-0.2 border text-[10px] uppercase ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                {formatCategoryLabel(complaint.category)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[#1C1C1C]">
              <MapPin className="w-3.5 h-3.5 text-[#1C1C1C]/60 shrink-0" />
              <span>Location:</span>
              <span className="font-bold truncate">{location}</span>
            </div>

            <div className="flex items-center gap-2 text-[#1C1C1C]">
              <Clock className="w-3.5 h-3.5 text-[#1C1C1C]/60 shrink-0" />
              <span>Deposited:</span>
              <span>{formatTimeAgo(complaint.createdAt)}</span>
            </div>

            <div className="flex items-center gap-2 text-[#1C1C1C]">
              <Lock className="w-3.5 h-3.5 text-red-700 shrink-0" />
              <span>Identity:</span>
              <span className="font-bold text-red-700">AES-256 Encrypted</span>
            </div>
          </div>

          <div className="pt-3 mt-3">
            <p className="font-serif text-sm text-[#1C1C1C]/90 leading-relaxed italic bg-white p-3 border border-[#1C1C1C]/20">
              "{complaint.description}"
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <button
            id="copy-public-link-btn"
            type="button"
            onClick={copyPublicLink}
            className={`w-full sm:w-auto px-6 py-3.5 font-mono font-bold text-xs uppercase tracking-wider border-2 border-[#1C1C1C] transition-all flex items-center justify-center gap-2 cursor-pointer ${
              linkCopied
                ? 'bg-emerald-800 text-white border-emerald-900 shadow-none'
                : 'bg-[#1C1C1C] hover:bg-stone-800 text-[#FAF9F6] shadow-[3px_3px_0px_0px_#1C1C1C]'
            }`}
          >
            {linkCopied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Public Link Copied</span>
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4" />
                <span>Copy Public Tracking Link</span>
              </>
            )}
          </button>

          <button
            id="view-in-feed-btn"
            type="button"
            onClick={onGoToFeed}
            className="w-full sm:w-auto px-6 py-3.5 bg-[#1C1C1C] hover:bg-stone-800 text-[#FAF9F6] font-mono font-bold text-xs uppercase tracking-wider border-2 border-[#1C1C1C] transition-all shadow-[3px_3px_0px_0px_#1C1C1C] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>View in Public Ledger</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            id="submit-another-btn"
            type="button"
            onClick={onSubmitAnother}
            className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-stone-100 text-[#1C1C1C] font-mono font-bold text-xs uppercase tracking-wider border-2 border-[#1C1C1C] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-[2px_2px_0px_0px_#1C1C1C]"
          >
            <PlusCircle className="w-4 h-4 text-red-700" />
            <span>Lodge Another Grievance</span>
          </button>
        </div>
      </div>
    </div>
  );
};
