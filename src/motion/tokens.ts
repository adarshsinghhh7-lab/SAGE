/**
 * Global spring-physics motion tokens for the SAGE app.
 *
 * Every physical interaction (cards, stamps, modals, buttons) should use one
 * of these named configs instead of ad-hoc duration-based easing. This keeps
 * the motion vocabulary cohesive and physically plausible. Springs are tuned
 * toward a soft, premium feel — responsive but never bouncy-for-show.
 */

import type { Transition } from 'motion/react';

/* ─── Spring Tokens ────────────────────────────────────────────────────────── */

/** Soft settling — cards, panels, layout shifts. Gentle, understated. */
export const paperSpring: Transition = {
  type: 'spring',
  stiffness: 220,
  damping: 28,
  mass: 0.9,
};

/** Hover / tap micro-feedback — quick but quiet. */
export const microTap: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 26,
  mass: 0.7,
};

/** Weighty drawer / panel opening — modals, reveal panels, confirmation. */
export const heavyDrawer: Transition = {
  type: 'spring',
  stiffness: 160,
  damping: 26,
  mass: 1.35,
};

/** Soft entry ease used for fades/dips that shouldn't feel mechanical. */
export const softEase: Transition = {
  type: 'tween',
  ease: [0.22, 1, 0.36, 1],
  duration: 0.55,
};

/* ─── Reduced-Motion Fallback ──────────────────────────────────────────────── */

/** Near-instant transition used when the user prefers reduced motion. */
export const instantFade: Transition = { duration: 0.001 };
