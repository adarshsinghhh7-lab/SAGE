import React from 'react';

interface SageLogoProps {
  /** Diameter of the seal emblem in px. */
  size?: number;
  /** Render the emblem as a full lockup with the S.A.G.E. wordmark + tagline. */
  withWordmark?: boolean;
  /** Extra classes passed to the wrapper (e.g. "justify-center", "drop-shadow-md"). */
  className?: string;
  /** Accessible label for the logo. */
  title?: string;
}

/**
 * S.A.G.E. brand emblem — a campus-seal mark featuring a single sage leaf.
 * Drawn inline in the brand palette so it scales crisply from 16px favicon
 * to large hero sizes without any image assets.
 */
export const SageLogo: React.FC<SageLogoProps> = ({
  size = 40,
  withWordmark = false,
  className = '',
  title = 'S.A.G.E. — Anonymous Grievance & Escalation Ledger',
}) => (
  <span
    className={`inline-flex items-center ${withWordmark ? 'gap-2.5' : ''} ${className}`}
    role="img"
    aria-label={title}
  >
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      {/* Outer bronze ring */}
      <circle cx="32" cy="32" r="30" stroke="#AD8B5B" strokeWidth="2.5" />
      {/* Seal well (moss-deep) */}
      <circle cx="32" cy="32" r="28.5" fill="#212B25" />
      {/* Inner double-ring border */}
      <circle cx="32" cy="32" r="28" stroke="#AD8B5B" strokeWidth="0.9" strokeOpacity="0.9" />
      {/* Sage leaf */}
      <path
        d="M32 19C40 22.5 43 28.5 43 34.5C43 40 38.5 44 32 45C25.5 44 21 40 21 34.5C21 28.5 24 22.5 32 19Z"
        fill="#F6F3EB"
      />
      {/* Central leaf vein */}
      <path d="M32 23L32 42.5" stroke="#4A5F50" strokeWidth="1.7" strokeLinecap="round" />
      {/* Side veins */}
      <g stroke="#5F7A66" strokeWidth="1.1" strokeLinecap="round" fill="none">
        <path d="M32 26.5C29.2 26.5 27.4 25.7 25.6 24.3M32 26.5C34.8 26.5 36.6 25.7 38.4 24.3" />
        <path d="M32 30.5C28.8 30.5 26.9 29.7 25.2 28.6M32 30.5C35.2 30.5 37.1 29.7 38.8 28.6" />
        <path d="M32 34.5C29.4 34.5 27.6 34 25.9 33.1M32 34.5C34.6 34.5 36.4 34 38.1 33.1" />
        <path d="M32 38.5C30 38.5 28.4 38.1 26.9 37.4M32 38.5C34 38.5 35.6 38.1 37.1 37.4" />
        <path d="M32 42C30.6 42 29.6 41.7 28.5 41.1M32 42C33.4 42 34.4 41.7 35.5 41.1" />
      </g>
      {/* Seeded berry accent */}
      <circle cx="32" cy="52" r="1.9" fill="#AD8B5B" />
    </svg>

    {withWordmark && (
      <span className="flex flex-col text-left">
        <span
          className="text-[1.5rem] leading-none font-semibold tracking-tight text-ink"
          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
        >
          S.A.G.E.
        </span>
        <span className="text-[9.5px] font-mono tracking-[0.16em] text-ink-faint uppercase mt-1.5">
          Anonymous Grievance &amp; Escalation Ledger
        </span>
      </span>
    )}
  </span>
);