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
import { motion } from 'motion/react';
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto py-10 sm:py-14 px-4 sm:px-6 text-slate-900"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="bg-slate-50 border border-indigo-100/50 rounded-xl p-6 sm:p-10 text-center shadow-lg relative"
      >
        {/* Success Marker */}
        <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
          <FileCheck className="w-7 h-7" />
        </div>

        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-0.5 border border-indigo-200/50 inline-block mb-2 rounded-lg">
          DEPOSITION RECORDED (complaints COLLECTION)
        </span>
        <h1 className="font-sans text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
          Grievance Lodged Successfully
        </h1>

        {/* Required Anonymity Statement */}
        <div className="bg-emerald-50/80 border border-emerald-200/50 rounded-xl p-4 my-6 text-left flex items-start gap-3 shadow-sm">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="font-sans text-sm text-slate-900 leading-relaxed">
            Your identity is not visible to anyone during normal review. You can track this complaint using your ID.
          </p>
        </div>

        {/* Complaint Tracking ID Ticket */}
        <div className="bg-white border border-indigo-100/50 rounded-xl p-6 mb-7 text-left shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-900/60 block mb-1">
                Official Tracking ID
              </span>
              <div className="flex items-center gap-3">
                <span id="generated-complaint-id" className="text-3xl sm:text-4xl font-mono font-bold tracking-wider text-indigo-600">
                  {compId}
                </span>
              </div>
              <p className="text-xs font-sans text-slate-900/70 mt-1 italic">
                Retain this reference ID to track administrative responses or escalation status.
              </p>
            </div>

            <button
              id="copy-complaint-id-btn"
              type="button"
              onClick={copyIdToClipboard}
              className={`px-5 py-3 font-mono font-bold text-xs uppercase tracking-wider border border-slate-200 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 shadow-sm ${
                copied
                  ? 'bg-emerald-800 text-white'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
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
        <div className="border border-slate-200 rounded-lg bg-slate-50 p-5 mb-8 text-left divide-y divide-slate-200">
          <div className="flex items-center justify-between pb-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-900/60">
              Deposition Details
            </span>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-bold uppercase border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
              {formatStatusLabel(complaint.status)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-900">
              <Tag className="w-3.5 h-3.5 text-slate-900/60 shrink-0" />
              <span>Category:</span>
              <span className={`font-bold px-1.5 py-0.2 border text-[10px] uppercase ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                {formatCategoryLabel(complaint.category)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-900">
              <MapPin className="w-3.5 h-3.5 text-slate-900/60 shrink-0" />
              <span>Location:</span>
              <span className="font-bold truncate">{location}</span>
            </div>

            <div className="flex items-center gap-2 text-slate-900">
              <Clock className="w-3.5 h-3.5 text-slate-900/60 shrink-0" />
              <span>Deposited:</span>
              <span>{formatTimeAgo(complaint.createdAt)}</span>
            </div>

            <div className="flex items-center gap-2 text-slate-900">
              <Lock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Identity:</span>
              <span className="font-bold text-indigo-600">AES-256 Encrypted</span>
            </div>
          </div>

          <div className="pt-3 mt-3">
            <p className="font-sans text-sm text-slate-900/90 leading-relaxed italic bg-white p-3 border border-slate-900/20">
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
            className={`w-full sm:w-auto px-6 py-3.5 font-mono font-bold text-xs uppercase tracking-wider border border-indigo-100/50 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              linkCopied
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-emerald-500 shadow-none'
                : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90 text-white shadow-md'
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
            className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90 text-white font-mono font-bold text-xs uppercase tracking-wider border border-indigo-100/50 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>View in Public Ledger</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            id="submit-another-btn"
            type="button"
            onClick={onSubmitAnother}
            className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-indigo-50 text-slate-900 font-mono font-bold text-xs uppercase tracking-wider border border-indigo-100/50 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <PlusCircle className="w-4 h-4 text-indigo-600" />
            <span>Lodge Another Grievance</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
