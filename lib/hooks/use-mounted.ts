import { useState, useEffect } from 'react';

/** Returns true after the first client-side render — prevents hydration mismatches. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);
  return mounted;
}

/** Returns the browser IANA timezone string, or null during SSR / before hydration. */
export function useBrowserTimezone(): string | null {
  const [tz, setTz] = useState<string | null>(null);
  useEffect(() => {
    const id = setTimeout(() => setTz(Intl.DateTimeFormat().resolvedOptions().timeZone), 0);
    return () => clearTimeout(id);
  }, []);
  return tz;
}

/**
 * Returns the current time as a Date, optionally updating on an interval.
 * Returns null until after first client-side render to prevent hydration mismatches.
 * Pass null for intervalMs to disable auto-updating (one-shot mount value).
 */
export function useBrowserNow(intervalMs: number | null = 60_000): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const init = setTimeout(() => setNow(new Date()), 0);
    const tick = intervalMs != null ? setInterval(() => setNow(new Date()), intervalMs) : null;
    return () => {
      clearTimeout(init);
      if (tick != null) clearInterval(tick);
    };
  }, [intervalMs]);
  return now;
}
