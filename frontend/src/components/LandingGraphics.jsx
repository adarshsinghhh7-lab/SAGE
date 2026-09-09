import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CheckCircle2, FileText, Vote } from 'lucide-react';
import { paperSpring, instantFade } from '../motion/tokens';
import { SageLogo } from './SageLogo';
/* ========================================================================== */
/* Shared animated dashed connector — horizontal arrow on desktop, vertical on */
/* mobile. Dashes are animated with framer-motion; a small bronze "packet" dot */
/* travels along the line via SMIL. Both effects drop under reduced motion.    */
/* ========================================================================== */
const FlowConnector = React.memo(() => {
    const prefersReduced = useReducedMotion();
    const dashAnim = prefersReduced
        ? undefined
        : { strokeDashoffset: [-26, 0] };
    const dashTransition = prefersReduced
        ? undefined
        : { duration: 1.3, ease: 'linear', repeat: Infinity };
    return (<div className="contents">
      {/* Mobile: vertical connector */}
      <svg viewBox="0 0 40 60" className="block md:hidden w-6 h-10 mx-auto my-1" aria-hidden="true">
        <motion.path d="M20 6 V36" stroke="#8E7043" strokeWidth={2} strokeLinecap="round" fill="none" strokeDasharray={prefersReduced ? undefined : '5 8'} initial={{ strokeDashoffset: 0 }} animate={dashAnim} transition={dashTransition}/>
        <motion.path d="M20 44 l7 -8 m-7 8 l-7 -8" stroke="#8E7043" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" initial={{ opacity: 0, scale: 0.6 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={prefersReduced ? instantFade : paperSpring}/>
        {!prefersReduced && (<circle r="2.4" fill="#AD8B5B">
            <animateMotion dur="1.5s" repeatCount="indefinite" path="M20 8 V36"/>
          </circle>)}
      </svg>

      {/* Desktop: horizontal connector */}
      <svg viewBox="0 0 80 40" className="hidden md:block w-full h-10 self-center" aria-hidden="true">
        <motion.path d="M6 20 H56" stroke="#8E7043" strokeWidth={2} strokeLinecap="round" fill="none" strokeDasharray={prefersReduced ? undefined : '5 8'} initial={{ strokeDashoffset: 0 }} animate={dashAnim} transition={dashTransition}/>
        <motion.path d="M62 20 l9 6 m-9 -6 l9 -6" stroke="#8E7043" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" initial={{ opacity: 0, scale: 0.6 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={prefersReduced ? instantFade : paperSpring}/>
        {!prefersReduced && (<circle r="2.4" fill="#AD8B5B">
            <animateMotion dur="1.3s" repeatCount="indefinite" path="M8 20 H56"/>
          </circle>)}
      </svg>
    </div>);
});
FlowConnector.displayName = 'FlowConnector';
/* ========================================================================== */
/* Emblems — small hand-drawn SVG tiles in the S.A.G.E. brand palette.         */
/* ========================================================================== */
/* Student / report — a message bubble with typed lines and a sender figure. */
const StudentEmblem = ({ className = '' }) => (<svg viewBox="0 0 64 64" className={`w-14 h-14 shrink-0 ${className}`} aria-hidden="true">
    <rect x="4" y="4" width="56" height="56" rx="17" fill="#F6E6E0"/>
    <rect x="4" y="4" width="56" height="56" rx="17" stroke="#BC6C56" strokeOpacity="0.45" strokeWidth="1.3" fill="none"/>
    {/* typed complaint lines */}
    <path d="M13 21 h13 M13 27 h19 M13 33 h9" stroke="#9B5340" strokeWidth="2.4" strokeLinecap="round"/>
    {/* anonymous sender silhouette */}
    <circle cx="45" cy="24" r="7.5" fill="#BC6C56"/>
    <path d="M36.5 39.5 a9.5 9.5 0 0 1 17 0 Z" fill="#BC6C56"/>
  </svg>);
/* Anonymizer — shield with a keyhole lock over the brand green. */
const ShieldEmblem = ({ className = '' }) => (<svg viewBox="0 0 64 64" className={`w-14 h-14 shrink-0 ${className}`} aria-hidden="true">
    <rect x="4" y="4" width="56" height="56" rx="17" fill="#E6ECE6"/>
    <rect x="4" y="4" width="56" height="56" rx="17" stroke="#5F7A66" strokeOpacity="0.5" strokeWidth="1.3" fill="none"/>
    <path d="M32 8 l19 6.5 V28 c0 12.5 -8 21 -19 25 C21 49 13 40.5 13 28 V14.5 Z" fill="#5F7A66"/>
    <path d="M32 8 l19 6.5 V28 c0 12.5 -8 21 -19 25 V8 Z" fill="#4A5F50"/>
    <rect x="26.6" y="26" width="10.8" height="9.6" rx="2.4" fill="#F6F3EB"/>
    <path d="M29.4 26 v-2.6 a2.6 2.6 0 0 1 5.2 0 V26" stroke="#F6F3EB" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <circle cx="32" cy="30.8" r="1.7" fill="#4A5F50"/>
  </svg>);
const PipelineNode = ({ emblem, badge, title, caption, chips, accentBar, delay = 0, }) => {
    const prefersReduced = useReducedMotion();
    return (<motion.div initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={prefersReduced ? instantFade : { ...paperSpring, delay }} whileHover={prefersReduced ? undefined : { y: -4 }} className={`flat-paper relative p-5 pt-4 overflow-hidden border-t-[3px] ${accentBar}`}>
      {/* faint oversized emblem watermark */}
      <div className="absolute -right-4 -bottom-8 w-28 h-28 opacity-[0.07] rotate-12 pointer-events-none select-none">
        {emblem}
      </div>
      <span className="absolute top-4 right-5 font-mono text-[10px] font-bold tracking-widest uppercase text-ink-faint">
        {badge}
      </span>
      <div className="relative">
        <div className="mb-3">{emblem}</div>
        <h3 className="text-base font-semibold text-ink mb-1.5">{title}</h3>
        <p className="text-xs leading-relaxed text-ink-soft">{caption}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {chips.map((chip) => (<span key={chip} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-soft border border-line font-mono text-[10px] font-bold tracking-wide text-ink-soft">
              {chip}
            </span>))}
        </div>
      </div>
    </motion.div>);
};
export const AnonymityPipeline = () => (<div className="mb-12">
    <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_64px_minmax(0,1fr)_64px_minmax(0,1fr)] items-stretch gap-y-2">
      <PipelineNode emblem={<StudentEmblem />} badge="Input" title="Anonymous Report Drafted" caption="The student writes what the problem is, where it is, and which category it belongs to — no sign-in, no account, no student email required." chips={['WHAT?', 'WHERE?', 'CATEGORY']} accentBar="border-t-clay" delay={0}/>
      <FlowConnector />
      <PipelineNode emblem={<ShieldEmblem />} badge="Anonymizer" title="Identity Stripped Instantly" caption="A dedicated sealing layer discards the IP address, device fingerprint, and browser metadata before anything ever reaches the ledger." chips={['NO IP', 'NO DEVICE ID', 'NO METADATA']} accentBar="border-t-accent" delay={0.12}/>
      <FlowConnector />
      <PipelineNode emblem={<SageLogo size={56}/>} badge="Ledger" title="Sealed Public Record" caption="Only the description, location, category, and optional photo are committed to the ledger with an irreversible SAGE reference code." chips={['SAGE-2847', 'PUBLIC', 'IMMUTABLE']} accentBar="border-t-bronze" delay={0.24}/>
    </div>
  </div>);
const LifecycleStation = ({ step, title, caption, bullets, icon, iconWrap, chip, delay = 0, }) => {
    const prefersReduced = useReducedMotion();
    return (<motion.div initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={prefersReduced ? instantFade : { ...paperSpring, delay }} whileHover={prefersReduced ? undefined : { y: -4 }} className="flat-paper relative p-5 pt-4 overflow-hidden flex flex-col">
      {/* ghost station number */}
      <span className="absolute -right-1 -top-7 font-display text-[92px] leading-none font-semibold text-ink/[0.05] select-none pointer-events-none" aria-hidden="true">
        {step}
      </span>
      <span className="font-mono text-[10px] font-bold tracking-widest uppercase text-ink-faint mb-3">
        Step {step}
      </span>
      <div className={`mb-4 w-14 h-14 rounded-2xl flex items-center justify-center shadow-soft ${iconWrap}`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-ink mb-1.5">{title}</h3>
      <p className="text-xs leading-relaxed text-ink-soft mb-4">{caption}</p>
      <ul className="space-y-1.5 mb-5">
        {bullets.map((b) => (<li key={b} className="flex items-start gap-2 text-[11px] leading-snug text-ink-soft">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-accent-deep mt-px"/>
            <span>{b}</span>
          </li>))}
      </ul>
      <div className="mt-auto pt-3 border-t border-line flex items-center gap-2 font-mono text-[10px] font-bold tracking-wide text-ink-soft">
        <span className="s-badge-dot bg-accent inline-block"/>
        <span>{chip}</span>
      </div>
    </motion.div>);
};
export const LifecycleFlow = () => (<div>
    <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_64px_minmax(0,1fr)_64px_minmax(0,1fr)] items-stretch gap-y-2">
      <LifecycleStation step="01" title="Submit Anonymously" caption="File your grievance in under a minute — no login, no account, and no identity ever recorded." bullets={['Pick a category & location', 'Describe the issue in your own words', 'Optionally attach photo evidence']} icon={<FileText className="w-7 h-7"/>} iconWrap="bg-accent-soft text-accent-deep" chip="LIVE ON LEDGER IN ~60 SEC" delay={0}/>
      <FlowConnector />
      <LifecycleStation step="02" title="Community Upvotes" caption="Your report joins the public ledger where affected residents validate the impact with a single upvote." bullets={['Visible to the whole campus', 'Upvotes boost triage priority', 'Similar reports merge alerts']} icon={<Vote className="w-7 h-7"/>} iconWrap="bg-clay-soft text-clay-deep" chip="CONSENSUS → HIGHER PRIORITY" delay={0.12}/>
      <FlowConnector />
      <LifecycleStation step="03" title="Action & Public Notes" caption="Wardens and departments investigate, fix the issue, and log visible proof of the dispatched work order." bullets={['Status: Under Review → Resolved', 'Public resolution notes & timestamps', 'The entire campus sees the outcome']} icon={<CheckCircle2 className="w-7 h-7"/>} iconWrap="bg-bronze-soft text-bronze-deep" chip="AUDIT TRAIL STAYS FOREVER" delay={0.24}/>
    </div>
  </div>);
