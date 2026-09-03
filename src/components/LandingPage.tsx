import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  EyeOff,
  PlusCircle,
  LayoutList,
  CheckCircle2,
  FileText,
  Vote,
  ChevronDown,
  Shield,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PageView } from '../types';

interface LandingPageProps {
  onNavigate: (view: PageView) => void;
  totalComplaintsCount: number;
}

interface FAQItem {
  question: string;
  answer: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  totalComplaintsCount,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const faqs: FAQItem[] = [
    {
      question: "Is this really anonymous?",
      answer: "Yes, 100%. S.A.G.E. is designed from the ground up to protect students from academic or personal retaliation. You do not log in, create an account, or provide your student email. We do not store your IP address, device fingerprints, or browser metadata with your grievance. When you submit a complaint, only the description, location, category, and optional photo are committed to the public ledger."
    },
    {
      question: "What happens after I submit a complaint?",
      answer: "Immediately upon submission, you receive an irreversible reference code (e.g., SAGE-2847). Your complaint is published to the Public Ledger where fellow students can view and upvote it. Campus wardens and department administrators are automatically alerted. As authorities investigate and repair the issue, they update the official status (Submitted → Under Review → Resolved) and append public resolution notes detailing work orders and dispatched personnel."
    },
    {
      question: "How does anonymity work, and is there any exception?",
      answer: "Your identity is completely encrypted and hidden by default. In standard campus grievances (such as bad mess food, broken fans, slow internet, hygiene problems, or staff complaints), student identity is never collected or viewable by anyone. A strictly audited reveal protocol exists exclusively as a legal safeguard against verified criminal misuse (such as bomb threats or severe personal extortion). This procedure requires unanimous dual-authorization from both university proctors and legal counsel, and every single query is logged permanently to a public transparency audit record."
    },
    {
      question: "How does upvoting help my issue get resolved faster?",
      answer: "When multiple students in a hostel or academic wing upvote an issue, it signals collective urgency. Campus administrative heads prioritize complaints with higher community endorsements on their triage dashboards, preventing critical hostel-wide problems from being ignored as isolated complaints."
    },
    {
      question: "Can professors or hostel wardens see who complained about them?",
      answer: "No. Wardens, proctors, mess contractors, and professors only see the factual description and location of the problem. They have zero technical access to identifying student information, ensuring you can report legitimate issues without fear of grading bias or hostel harassment."
    }
  ];

  return (
    <div className="bg-slate-50 text-slate-900">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="border-b border-slate-200 py-12 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Subtle background security grid indicator */}
        <div className="absolute top-0 right-0 -z-0 opacity-5 pointer-events-none text-right pr-4 pt-4 font-mono text-[120px] font-bold select-none leading-none">
          SAGE
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Trust Pill */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider mb-6 shadow-md"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Anonymous Campus Grievance & Escalation Protocol</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="font-sans text-4xl sm:text-6xl lg:text-7xl font-bold text-slate-900 tracking-tight leading-[1.08] mb-6"
          >
            Fearless campus accountability.<br className="hidden sm:inline" />
            <span className="italic font-sans font-normal text-indigo-600"> Without fear of retaliation.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="font-sans text-lg sm:text-xl text-slate-900/85 max-w-3xl mx-auto leading-relaxed mb-10"
          >
            S.A.G.E. is a secure, anonymous reporting platform that empowers students to voice hostel, mess, hygiene, and safety concerns. Your identity remains protected, while community upvoting ensures urgent issues get the immediate administrative attention they deserve.
          </motion.p>

          {/* Primary Dual Call-to-Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-12"
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              id="hero-submit-cta"
              type="button"
              onClick={() => onNavigate('submit')}
              className="w-full sm:w-auto px-7 py-4 bg-slate-900 text-white hover:bg-indigo-600 text-sm font-mono font-bold uppercase tracking-wider border border-slate-200 rounded-lg transition-colors flex items-center justify-center gap-2.5 shadow-md cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit a Complaint</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              id="hero-browse-cta"
              type="button"
              onClick={() => onNavigate('feed')}
              className="w-full sm:w-auto px-7 py-4 bg-slate-50 text-slate-900 hover:bg-slate-200 text-sm font-mono font-bold uppercase tracking-wider border border-slate-200 rounded-lg transition-colors flex items-center justify-center gap-2.5 shadow-md cursor-pointer"
            >
              <LayoutList className="w-4 h-4" />
              <span>Browse Complaints</span>
              <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 font-mono font-bold">
                {totalComplaintsCount}
              </span>
            </motion.button>
          </motion.div>

          {/* 3 Quick Confidence Highlights */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.65 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-slate-900/15 text-xs font-mono text-slate-900/80"
          >
            {[
              { icon: <EyeOff className="w-4 h-4 text-emerald-800 shrink-0" />, text: 'No Account or Sign-in Required' },
              { icon: <Lock className="w-4 h-4 text-indigo-600 shrink-0" />, text: 'Cryptographically Decoupled' },
              { icon: <Activity className="w-4 h-4 text-slate-900 shrink-0" />, text: 'Real-Time Status Tracking' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.7 + i * 0.1 }}
                className="flex items-center justify-center gap-2 p-2 bg-slate-100/70 border border-slate-900/20"
              >
                {item.icon}
                <span>{item.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. HOW ANONYMITY WORKS (CALM, TRUSTWORTHY PRIVACY PILLAR) */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-indigo-600 mb-2">
              <Lock className="w-4 h-4" />
              <span>Privacy & Security Architecture</span>
            </div>
            <h2 className="font-sans text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight">
              How Anonymity Works on S.A.G.E.
            </h2>
            <p className="font-sans text-base sm:text-lg text-slate-900/75 mt-3">
              We built S.A.G.E. with a strict “safety-by-design” principle so that no student ever hesitates to report legitimate hazards or harassment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Default Zero-Knowledge */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: 0 }}
              whileHover={{ y: -4 }}
              className="bg-slate-50 border border-slate-200 rounded-lg p-6 shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-sm mb-4 border border-slate-300">
                  01
                </div>
                <h3 className="font-sans text-xl font-bold text-slate-900 mb-2">
                  Encrypted & Hidden by Default
                </h3>
                <p className="text-xs sm:text-sm font-sans text-slate-900/80 leading-relaxed">
                  Your identity is never attached to your grievance record. You do not log in with university credentials, and our servers do not store your IP address or browser fingerprints with your report.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-900/15 flex items-center gap-2 text-xs font-mono font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4" />
                <span>Zero Identity Tracking</span>
              </div>
            </motion.div>

            {/* Card 2: Controlled Safety Safeguard */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: 0.15 }}
              whileHover={{ y: -4 }}
              className="bg-slate-50 border border-slate-200 rounded-lg p-6 shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 bg-indigo-600 text-white flex items-center justify-center font-mono font-bold text-sm mb-4 border border-slate-300">
                  02
                </div>
                <h3 className="font-sans text-xl font-bold text-slate-900 mb-2">
                  Audited Misuse Safeguards
                </h3>
                <p className="text-xs sm:text-sm font-sans text-slate-900/80 leading-relaxed">
                  To prevent abuse, a reveal option exists strictly for verified extreme criminal offenses (e.g. violent threats or extortion). This requires formal dual-authorization from proctorial and legal boards.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-900/15 flex items-center gap-2 text-xs font-mono font-bold text-indigo-600">
                <Shield className="w-4 h-4" />
                <span>Every Query Publicly Audited</span>
              </div>
            </motion.div>

            {/* Card 3: Transparent Escalation */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -4 }}
              className="bg-slate-50 border border-slate-200 rounded-lg p-6 shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-sm mb-4 border border-slate-300">
                  03
                </div>
                <h3 className="font-sans text-xl font-bold text-slate-900 mb-2">
                  Anti-Retaliation Immunity
                </h3>
                <p className="text-xs sm:text-sm font-sans text-slate-900/80 leading-relaxed">
                  Because wardens, maintenance contractors, and faculty cannot access identifying details, you are shielded from academic penalties, hostel harassment, or disciplinary retribution.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-900/15 flex items-center gap-2 text-xs font-mono font-bold text-slate-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-800" />
                <span>Protected Student Expression</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. 3-STEP ESCALATION LIFECYCLE */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-200 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-600 block mb-2">
              Simple 3-Step Lifecycle
            </span>
            <h2 className="font-sans text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight">
              From Grievance to Remediation
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Step 1 */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5">
                  STEP 01
                </span>
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-sans text-lg font-bold text-slate-900 mb-2">
                1. Submit Anonymously
              </h3>
              <p className="text-xs font-sans text-slate-900/80 leading-relaxed">
                Draft your complaint, select the category (Hostel, Mess, Safety, WiFi, Hygiene), specify location, and optionally attach photographic evidence.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5">
                  STEP 02
                </span>
                <Vote className="w-5 h-5 text-emerald-800" />
              </div>
              <h3 className="font-sans text-lg font-bold text-slate-900 mb-2">
                2. Community Upvotes
              </h3>
              <p className="text-xs font-sans text-slate-900/80 leading-relaxed">
                Your report appears on the public ledger. Fellow residents endorse the issue to elevate urgency on administrative dashboards.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5">
                  STEP 03
                </span>
                <CheckCircle2 className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-sans text-lg font-bold text-slate-900 mb-2">
                3. Action & Public Notes
              </h3>
              <p className="text-xs font-sans text-slate-900/80 leading-relaxed">
                Departments review, dispatch technicians, and log official resolution remarks with timestamps visible to the entire campus.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. FREQUENTLY ASKED QUESTIONS (FAQ SECTION) */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-600 block mb-2">
              Clear Answers
            </span>
            <h2 className="font-sans text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="font-sans text-sm sm:text-base text-slate-900/75 mt-2">
              Everything you need to know about your rights, privacy, and how S.A.G.E. protects you.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  className="border border-slate-200 rounded-lg bg-white shadow-md overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-mono font-bold text-xs sm:text-sm text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-indigo-600 font-mono text-sm">Q{idx + 1}.</span>
                      <span>{faq.question}</span>
                    </span>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="shrink-0"
                    >
                      <ChevronDown className="w-4 h-4 text-indigo-600" />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-1 border-t border-slate-900/15 font-sans text-xs sm:text-sm text-slate-900/85 leading-relaxed bg-slate-50/50">
                          <p>{faq.answer}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. BOTTOM CALL TO ACTION BANNER */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-18 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest bg-indigo-600 text-white px-3 py-1">
            PROTECT YOUR CAMPUS COMMUNITY
          </span>
          <h2 className="font-sans text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Have an issue that needs addressing?
          </h2>
          <p className="font-sans text-sm sm:text-base text-white/80 max-w-2xl mx-auto">
            Take 60 seconds to file a secure grievance or check the public ledger to see what issues are currently under active investigation.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              type="button"
              onClick={() => onNavigate('submit')}
              className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 hover:bg-indigo-600 hover:text-white text-xs font-mono font-bold uppercase tracking-wider border border-white/30 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit a Complaint</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('feed')}
              className="w-full sm:w-auto px-8 py-4 bg-transparent text-white hover:bg-slate-800 text-xs font-mono font-bold uppercase tracking-wider border border-white/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LayoutList className="w-4 h-4" />
              <span>Browse Public Ledger</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
