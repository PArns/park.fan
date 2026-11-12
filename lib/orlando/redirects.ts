import { isValidLocale } from '@/i18n/config';
import { parseParkCalendarMonthSpelling } from '@/lib/parks/calendar-segments';
import { currentOrlandoMonth, isOrlandoMonthInRange, ORLANDO_SEGMENT, orlandoPath } from './paths';
import type { OrlandoMonth } from './types';

/**
 * The Orlando month pages' redirects, decided from the URL alone so `proxy.ts` answers them before
 * anything renders (a redirect thrown from a render carries the layout as its body). Orlando has one
 * zone, so unlike a park calendar every case is settled here:
 *
 * - a month that is a month but outside the twelve the hub serves 308s to the hub;
 * - a padded month (`/2026/09`) 308s to its unpadded URL;
 * - everything else returns `null`: the route serves it or 404s it.
 *
 * @param now Orlando's current month; the proxy passes nothing and gets today's.
 */
export function orlandoRedirect(pathname: string, now?: OrlandoMonth): string | null {
  // '', locale, 'orlando', year, month
  const parts = pathname.split('/');
  if (parts.length !== 5) return null;
  const [, locale, segment] = parts;
  if (segment !== ORLANDO_SEGMENT || !isValidLocale(locale)) return null;
  const spelled = parseParkCalendarMonthSpelling(parts.slice(3));
  if (!spelled) return null;
  const current = now ?? currentOrlandoMonth();
  if (!isOrlandoMonthInRange(spelled.month, current)) return `/${locale}${orlandoPath()}`;
  return spelled.padded ? `/${locale}${orlandoPath(spelled.month)}` : null;
}
