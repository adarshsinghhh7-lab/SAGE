import { useState, useEffect } from 'react';

/**
 * Hook that tracks a `window.matchMedia` query and returns whether it
 * currently matches.  SSR-safe (defaults to `defaultVal` when `window`
 * is unavailable).
 */
export function useMediaQuery(query: string, defaultVal = false): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return defaultVal;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * Convenience: returns true when the primary pointer is coarse (touch)
 * AND hover is NOT available — i.e. a typical phone/tablet.
 */
export function useIsTouchDevice(): boolean {
  return useMediaQuery('(hover: none) and (pointer: coarse)');
}

/**
 * Returns true when the device supports hover AND has a fine pointer —
 * i.e. desktop with mouse/trackpad.
 */
export function useCanHover(): boolean {
  return useMediaQuery('(hover: hover) and (pointer: fine)');
}
