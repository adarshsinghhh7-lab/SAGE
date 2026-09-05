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
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { PageView } from '../types';
import { paperSpring, microTap, instantFade } from '../motion/tokens';
import { useCanHover } from '../hooks/useMediaQuery';

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
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const prefersReduced = useReducedMotion();
  const canHover = useCanHover();
  const { scrollY } = useScroll();
  // Disable parallax on touch devices and when reduced-motion is preferred
  const parallaxEnabled = !prefersReduced && canHover;
  const heroY = useTransform(scrollY, [0, 600], [0, parallaxEnabled ? -90 : 0]);

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
      answer: "Immediately upon submission, you receive an irreversible reference code (e.g., SAGE-2847). Your complaint is published to the Public Ledger where fellow students can view and upvote it. Campus wardens and department administrators are automatically alerted. As authorities investigate and repair the issue, they update the official status (Submitted \u2192 Under Review \u2192 Resolved) and append public resolution notes detailing work orders and dispatched personnel."
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
    <div className="text-ink">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-transparent">
        {/* Animated Floating Orbs */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="orb orb-4" />

        <motion.div
          className="max-w-5xl mx-auto text-center relative z-10"
          variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
          initial="hidden"
          animate="visible"
          style={{ y: heroY }}
        >
          {/* Trust Pill */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            transition={prefersReduced ? instantFade : paperSpring}
            className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-wider mb-6 shadow-soft rounded-full bg-surface border border-line backdrop-blur-sm"
          >
            <ShieldCheck className="w-4 h-4 text-accent-deep" />
            <span className="text-ink-soft">Anonymous Campus Grievance &amp; Escalation Protocol</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            transition={prefersReduced ? instantFade : paperSpring}
            style={{ fontSize: "clamp(2rem, 5vw + 1rem, 4.5rem)" }}
            className="font-display font-semibold text-ink tracking-tight leading-[1.08] mb-6"
          >
            Fearless campus accountability.<br className="hidden sm:inline" />
            <span className="italic font-display text-bronze"> Without fear of retaliation.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            transition={prefersReduced ? instantFade : paperSpring}
            className="text-lg sm:text-xl text-ink-soft max-w-3xl mx-auto leading-relaxed mb-12"
          >
            S.A.G.E. is a secure, anonymous reporting platform that empowers students to voice hostel, mess, hygiene, and safety concerns. Your identity remains protected, while community upvoting ensures urgent issues get the immediate administrative attention they deserve.
          </motion.p>

          {/* Primary Dual Call-to-Action Buttons */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            transition={prefersReduced ? instantFade : paperSpring}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-12"
          >
            <motion.button
              whileTap={prefersReduced ? {} : { scale: 0.97, transition: microTap }}
              whileHover={prefersReduced ? {} : { y: -2, transition: paperSpring }}
              id="hero-submit-cta"
              type="button"
              onClick={() => onNavigate('submit')}
              className="s-btn s-btn-primary w-full sm:w-auto px-8 py-4 text-xs font-mono font-bold uppercase tracking-wider rounded-xl shadow-lift"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit a Complaint</span>
            </motion.button>

            <motion.button
              whileTap={prefersReduced ? {} : { scale: 0.97, transition: microTap }}
              whileHover={prefersReduced ? {} : { y: -2, transition: paperSpring }}
              type="button"
              onClick={() => onNavigate('feed')}
              className="s-btn s-btn-secondary w-full sm:w-auto px-8 py-4 text-xs font-mono font-bold uppercase tracking-wider rounded-xl"
            >
              <LayoutList className="w-4 h-4" />
              <span>Browse Public Ledger</span>
            </motion.button>
          </motion.div>

          {/* 3 Quick Confidence Highlights */}
          <motion.div
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-line text-xs font-mono text-ink-soft"
          >
            {[
              { icon: <EyeOff className="w-4 h-4 text-accent-deep shrink-0" />, text: 'No Account or Sign-in Required' },
              { icon: <Lock className="w-4 h-4 text-bronze-deep shrink-0" />, text: 'Cryptographically Decoupled' },
              { icon: <Activity className="w-4 h-4 text-clay-deep shrink-0" />, text: 'Real-Time Status Tracking' },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                transition={prefersReduced ? instantFade : { ...paperSpring, delay: prefersReduced ? 0 : 0.45 + i * 0.08 }}
                whileHover={prefersReduced ? {} : { y: -2 }}
                className="flex items-center justify-center gap-2 p-2.5 bg-surface border border-line rounded-xl shadow-soft"
              >
                {item.icon}
                <span>{item.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>
      {/* ========================================================================= */}
      {/* 2. HOW ANONYMITY WORKS (CALM, TRUSTWORTHY PRIVACY PILLAR) */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-line" style={{ background: 'linear-gradient(180deg, #EFEBE1 0%, #EAE4D3 50%, #E2DBC6 100%)' }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={prefersReduced ? instantFade : paperSpring}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="s-eyebrow justify-center mb-2">
              <Lock className="w-4 h-4" />
              <span>Privacy &amp; Security Architecture</span>
            </span>
            <h2 className="text-3xl sm:text-5xl font-semibold text-ink tracking-tight">
              How Anonymity Works on S.A.G.E.
            </h2>
            <p className="text-base sm:text-lg text-ink-soft mt-3 leading-relaxed">
              We built S.A.G.E. with a strict &ldquo;safety-by-design&rdquo; principle so that no student ever hesitates to report legitimate hazards or harassment.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Default Zero-Knowledge */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={prefersReduced ? instantFade : { ...paperSpring, delay: 0 }}
              whileHover={prefersReduced ? {} : { y: -4 }}
              className="flat-paper p-6 flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 bg-accent text-white flex items-center justify-center font-mono font-bold text-sm mb-4 rounded-xl">
                  01
                </div>
                <h3 className="text-xl font-semibold text-ink mb-2">
                  Encrypted &amp; Hidden by Default
                </h3>
                <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
                  Your identity is never attached to your grievance record. You do not log in with university credentials, and our servers do not store your IP address or browser fingerprints with your report.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-line flex items-center gap-2 text-xs font-mono font-bold text-accent-deep">
                <CheckCircle2 className="w-4 h-4" />
                <span>Zero Identity Tracking</span>
              </div>
            </motion.div>

            {/* Card 2: Controlled Safety Safeguard */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={prefersReduced ? instantFade : { ...paperSpring, delay: 0.15 }}
              whileHover={prefersReduced ? {} : { y: -4 }}
              className="flat-paper p-6 flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 bg-clay text-white flex items-center justify-center font-mono font-bold text-sm mb-4 rounded-xl">
                  02
                </div>
                <h3 className="text-xl font-semibold text-ink mb-2">
                  Audited Misuse Safeguards
                </h3>
                <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
                  To prevent abuse, a reveal option exists strictly for verified extreme criminal offenses (e.g. violent threats or extortion). This requires formal dual-authorization from proctorial and legal boards.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-line flex items-center gap-2 text-xs font-mono font-bold text-clay-deep">
                <Shield className="w-4 h-4" />
                <span>Every Query Publicly Audited</span>
              </div>
            </motion.div>

            {/* Card 3: Transparent Escalation */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={prefersReduced ? instantFade : { ...paperSpring, delay: 0.3 }}
              whileHover={prefersReduced ? {} : { y: -4 }}
              className="flat-paper p-6 flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 bg-bronze text-white flex items-center justify-center font-mono font-bold text-sm mb-4 rounded-xl">
                  03
                </div>
                <h3 className="text-xl font-semibold text-ink mb-2">
                  Anti-Retaliation Immunity
                </h3>
                <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
                  Because wardens, maintenance contractors, and faculty cannot access identifying details, you are shielded from academic penalties, hostel harassment, or disciplinary retribution.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-line flex items-center gap-2 text-xs font-mono font-bold text-accent-deep">
                <CheckCircle2 className="w-4 h-4" />
                <span>Protected Student Expression</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. 3-STEP ESCALATION LIFECYCLE */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-line" style={{ background: 'linear-gradient(180deg, #EFEBE1 0%, #EAE4D3 50%, #E2DBC6 100%)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="s-eyebrow justify-center block mb-2">
              Simple 3-Step Lifecycle
            </span>
            <h2 className="text-3xl sm:text-5xl font-semibold text-ink tracking-tight">
              From Grievance to Remediation
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Step 1 */}
            <div className="flat-paper p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono font-bold text-xs bg-accent text-white px-2.5 py-0.5 rounded-md">
                  STEP 01
                </span>
                <FileText className="w-5 h-5 text-bronze-deep" />
              </div>
              <h3 className="text-lg font-semibold text-ink mb-2">
                1. Submit Anonymously
              </h3>
              <p className="text-xs leading-relaxed text-ink-soft">
                Draft your complaint, select the category (Hostel, Mess, Safety, WiFi, Hygiene), specify location, and optionally attach photographic evidence.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flat-paper p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono font-bold text-xs bg-clay text-white px-2.5 py-0.5 rounded-md">
                  STEP 02
                </span>
                <Vote className="w-5 h-5 text-clay-deep" />
              </div>
              <h3 className="text-lg font-semibold text-ink mb-2">
                2. Community Upvotes
              </h3>
              <p className="text-xs leading-relaxed text-ink-soft">
                Your report appears on the public ledger. Fellow residents endorse the issue to elevate urgency on administrative dashboards.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flat-paper p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono font-bold text-xs bg-bronze text-white px-2.5 py-0.5 rounded-md">
                  STEP 03
                </span>
                <CheckCircle2 className="w-5 h-5 text-accent-deep" />
              </div>
              <h3 className="text-lg font-semibold text-ink mb-2">
                3. Action &amp; Public Notes
              </h3>
              <p className="text-xs leading-relaxed text-ink-soft">
                Departments review, dispatch technicians, and log official resolution remarks with timestamps visible to the entire campus.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* ========================================================================= */}
      {/* 4. FREQUENTLY ASKED QUESTIONS (FAQ SECTION) */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-line bg-surface-soft">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="s-eyebrow justify-center block mb-2">
              Clear Answers
            </span>
            <h2 className="text-3xl sm:text-5xl font-semibold text-ink tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm sm:text-base text-ink-soft mt-2">
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
                  transition={prefersReduced ? instantFade : { ...paperSpring, delay: idx * 0.08 }}
                  className="flat-paper overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-mono font-bold text-xs sm:text-sm text-ink hover:bg-bronze-soft transition-colors cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-bronze-deep font-mono text-sm">Q{idx + 1}.</span>
                      <span>{faq.question}</span>
                    </span>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={prefersReduced ? instantFade : paperSpring}
                      className="shrink-0"
                    >
                      <ChevronDown className="w-4 h-4 text-bronze-deep" />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={prefersReduced ? instantFade : paperSpring}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-1 border-t border-line font-sans text-xs sm:text-sm text-ink-soft leading-relaxed bg-bronze-soft/70">
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
      {/* 5. BOTTOM CALL TO ACTION — DARK MOSS CONTRAST BANNER */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="ink-panel p-10 sm:p-14 text-center space-y-6 shadow-moss">
            <span className="inline-block text-[11px] font-mono font-bold uppercase tracking-widest bg-moss-deep text-[#EDE7D8] px-3 py-1 rounded-full border border-white/10">
              PROTECT YOUR CAMPUS COMMUNITY
            </span>
            <h2 className="text-3xl sm:text-5xl font-semibold text-[#EDE7D8] tracking-tight">
              Have an issue that needs addressing?
            </h2>
            <p className="text-sm sm:text-base text-[#EDE7D8]/80 max-w-2xl mx-auto">
              Take 60 seconds to file a secure grievance or check the public ledger to see what issues are currently under active investigation.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <motion.button
                type="button"
                onClick={() => onNavigate('submit')}
                whileTap={prefersReduced ? {} : { scale: 0.97, transition: microTap }}
                whileHover={prefersReduced ? {} : { y: -2, transition: paperSpring }}
                className="w-full sm:w-auto px-8 py-4 bg-bronze text-[#1E2721] hover:bg-bronze-deep hover:text-[#EDE7D8] text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Submit a Complaint</span>
              </motion.button>

              <motion.button
                type="button"
                onClick={() => onNavigate('feed')}
                whileTap={prefersReduced ? {} : { scale: 0.97, transition: microTap }}
                whileHover={prefersReduced ? {} : { y: -2, transition: paperSpring }}
                className="w-full sm:w-auto px-8 py-4 bg-transparent text-[#EDE7D8] hover:text-white hover:bg-white/5 text-xs font-mono font-bold uppercase tracking-wider border border-white/20 hover:border-white/50 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LayoutList className="w-4 h-4" />
                <span>Browse Public Ledger</span>
              </motion.button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
