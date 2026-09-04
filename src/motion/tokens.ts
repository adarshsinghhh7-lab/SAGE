/**
 * Global spring-physics motion tokens for the SAGE app.
 *
 * Every physical interaction (cards, stamps, modals, buttons) should use one
 * of these named configs instead of ad-hoc duration-based easing. This keeps
 * the motion vocabulary cohesive and physically plausible.
 */

import type { Transition } from 'motion/react';

/* ─── Spring Tokens ────────────────────────────────────────────────────────── */

/** Light paper settling — cards, panels, layout shifts */
export const paperSpring: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

/** Rubber-stamp strike — fast hit, overshoot/bounce, thud settle */
export const stampImpact: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 15,
  mass: 1.2,
};

/** Weighty drawer / case-file opening — modals, reveal panels */
export const heavyDrawer: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 26,
  mass: 1.5,
};

/** Button press / small interactive tap */
export const microTap: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 25,
};

/* ─── Reduced-Motion Fallback ──────────────────────────────────────────────── */

/** Near-instant transition used when the user prefers reduced motion. */
export const instantFade: Transition = { duration: 0.001 };
