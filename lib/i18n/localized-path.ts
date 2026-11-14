import { isValidLocale } from '@/i18n/config';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import { HOWTO_SEGMENTS } from '@/lib/howto/segments';
import { PLANNER_SEGMENTS } from '@/lib/planner/segments';
import { PARK_CALENDAR_SEGMENTS } from '@/lib/parks/calendar-segments';
import { PARK_KIDS_SEGMENTS } from '@/lib/parks/kids-segments';
import { PARK_STATS_SEGMENTS } from '@/lib/parks/stats-segments';
import { LIVE_TRIP_REGIONS } from '@/lib/trip-regions/registry';

type SegmentFamily = Readonly<Record<string, string>>;

/** A trip region hub's segment per locale: `/kalifornien`, `/california`. */
const TRIP_REGION_FAMILIES: readonly SegmentFamily[] = LIVE_TRIP_REGIONS.map((r) => r.segments);

/**
 * First segments written in the reader's language: `/beste-reisezeit`, `/tagesplaner`, a trip
 * region's hub, …
 */
const TOP_LEVEL_FAMILIES: readonly SegmentFamily[] = [
  BEST_TIME_SEGMENTS,
  PLANNER_SEGMENTS,
  HOWTO_SEGMENTS,
  GLOSSARY_SEGMENTS,
  ...TRIP_REGION_FAMILIES,
];

/** A park's sub-page segment, the seventh of `/parks/<continent>/<country>/<city>/<park>/…`. */
const PARK_SUBPAGE_FAMILIES: readonly SegmentFamily[] = [
  PARK_CALENDAR_SEGMENTS,
  PARK_STATS_SEGMENTS,
  PARK_KIDS_SEGMENTS,
];

/**
 * What `proxy.ts`'s matcher leaves out: the API, the admin, Next's own files and anything with a
 * dot (`/media/…/photo.jpg`). Those have no locale and keep their path.
 */
const NOT_A_PAGE = /^\/(?:api|admin|_next|_vercel)(?:\/|$)|\./;

/** `segment` in `locale`'s spelling when one of `families` has it in any language. */
function respell(segment: string, families: readonly SegmentFamily[], locale: string): string {
  const family = families.find((f) => Object.values(f).includes(segment));
  return family?.[locale] ?? segment;
}

/**
 * A site path with the reader's locale in front, as the site's own links carry it. A path written
 * without one (in a post, by the assistant) also gets that locale's spelling of a localized
 * segment, `/best-time-to-visit` → `/de/beste-reisezeit`, so the link lands without a redirect and
 * on the reader's language rather than on the English page next-intl would pick for a crawler. A
 * path that already names a locale, a file or API path, an anchor and another host stay as they
 * are. Query and hash are kept.
 */
export function localizedPath(path: string, locale: string): string {
  const cut = path.search(/[?#]/);
  const pathname = cut === -1 ? path : path.slice(0, cut);
  const rest = cut === -1 ? '' : path.slice(cut);
  const parts = pathname.split('/');
  const isSitePath = pathname.startsWith('/') && !pathname.startsWith('//');
  if (!isSitePath || isValidLocale(parts[1]) || NOT_A_PAGE.test(pathname)) return path;
  if (pathname === '/') return `/${locale}${rest}`;
  if (isValidLocale(locale)) {
    parts[1] = respell(parts[1], TOP_LEVEL_FAMILIES, locale);
    if (parts[1] === 'parks' && parts.length >= 7) {
      parts[6] = respell(parts[6], PARK_SUBPAGE_FAMILIES, locale);
    }
    // A region's best-time pages, `/<region segment>/<best-time segment>[/<resort>]`.
    if (TRIP_REGION_FAMILIES.some((f) => f[locale] === parts[1]) && parts.length >= 3) {
      parts[2] = respell(parts[2], [BEST_TIME_SEGMENTS], locale);
    }
  }
  return `/${locale}${parts.join('/')}${rest}`;
}
