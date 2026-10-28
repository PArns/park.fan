import { API_ORIGIN } from '@/lib/api/client';
import { analyticsOptedOut, isAnalyticsHost } from '@/lib/analytics/opt-out';
import { locales, type Locale } from '@/i18n/config';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import { PLANNER_SEGMENTS } from '@/lib/planner/segments';
import { PARK_CALENDAR_SEGMENTS } from '@/lib/parks/calendar-segments';
import { PARK_STATS_SEGMENTS } from '@/lib/parks/stats-segments';
import { PARK_KIDS_SEGMENTS } from '@/lib/parks/kids-segments';

/**
 * Our own cookieless statistic on api.park.fan (`POST /v1/analytics/collect`): page views and
 * events, counted per day and never per reader. It carries the custom events Umami used to bill,
 * so a property here costs nothing, and the reads that feed the most-read lists.
 *
 * Adding an event is one call at the call site: `trackSiteEvent('my_event', { kind: 'x' })`. The
 * API takes any event name and any properties of the shapes below, so nothing there changes. The
 * events this site sends today are in {@link SiteEventMap}, and a call with one of those names is
 * checked against its properties; any other name goes through untyped.
 *
 * **What may be sent.** A property is a value chosen in our own code: a name from a list, a
 * number, a flag, the slug of a page. Never free text and never anything that identifies a person:
 * not what somebody typed into a search field or a form, not a name, an address, an e-mail, a
 * token, not a position. The facade drops what does not fit the API's patterns, and it cannot tell
 * a typed query from a slug, so that rule is the caller's. See docs/development/analytics.md.
 */

/** What kind of page a hit was sent from, derived from the path by {@link sitePageTypeOf}. */
export type SitePageType =
  | 'home'
  | 'park'
  | 'park_calendar'
  | 'park_chapter'
  | 'attraction'
  | 'geo'
  | 'guide'
  | 'guide_index'
  | 'news'
  | 'news_index'
  | 'glossary'
  | 'glossary_index'
  | 'search'
  | 'planner'
  | 'favorites'
  | 'not_found'
  | 'other';

/**
 * Which search field a search event came from. The phone and desktop hero are both `hero`;
 * `home_steps` is the copy of the hero field in the homepage's „So funktioniert's" step card, counted
 * apart so it does not inflate the hero.
 */
export type SearchSurface =
  | 'hero'
  | 'header'
  | 'keyboard'
  | 'search_page'
  | 'listing_guides'
  | 'listing_news'
  | 'guides_panel'
  | 'home_steps';

/** What kind of result was opened from a search. */
export type SearchResultKind =
  'park' | 'attraction' | 'show' | 'restaurant' | 'location' | 'glossary' | 'guide' | 'news';

/** A 1-based result position, bucketed so a long list does not spread over fifty values. */
export type SearchPosition = '1' | '2' | '3' | '4-5' | '6-10' | '11+';

/** What was picked from a search surface's list before anything was typed. */
export type SearchBrowseItem = 'nearby_park' | 'in_park_ride' | 'popular_park' | 'news' | 'guide';

type NoProps = Record<string, never>;

/** Properties of an event the facade does not know: any key, a string, a number or a flag. */
export type SiteEventProps = Record<string, string | number | boolean>;

/**
 * The events this site sends and their properties. A call with one of these names is type-checked
 * against its entry; the API takes the property values of any event as they come, so a new event
 * needs no entry here, only the type-checking one gives.
 */
export interface SiteEventMap {
  search_opened: { surface: SearchSurface };
  search_typed: { surface: SearchSurface };
  search_no_results: { surface: SearchSurface };
  search_result_clicked: {
    surface: SearchSurface;
    result: SearchResultKind;
    position: SearchPosition;
  };
  search_browse_clicked: {
    surface: SearchSurface;
    item: SearchBrowseItem;
    position: SearchPosition;
  };
  search_view_all: { surface: SearchSurface };
  favorite_add: { type: 'park' | 'attraction' | 'show' | 'restaurant' };
  favorite_remove: { type: 'park' | 'attraction' | 'show' | 'restaurant' };
  nearby_permission: { result: 'granted' | 'denied' };
  nearby_parks_loaded: { type: 'nearby_parks' | 'in_park'; source: 'gps' | 'ip' };
  language_switched: { from: Locale; to: Locale };
  theme_toggled: { theme: 'light' | 'dark' | 'system' };
  tab_changed: { tab: 'attractions' | 'map' | 'shows' | 'restaurants' | 'weather' };
  location_banner_clicked: NoProps;
  blog_toast_opened: NoProps;
  glossary_term_viewed: { term: string };
  glossary_category_filtered: { category: string };
  glossary_searched: NoProps;
  preferred_source_clicked: NoProps;
  ride_alert_set: { source: 'card' | 'central' };
  ride_alert_removed: NoProps;
  show_follow_add: { source: 'card' | 'panel' };
  show_follow_remove: NoProps;
  planner_opened: {
    source:
      | 'tab'
      | 'header'
      | 'park-header'
      | 'calendar-day'
      | 'wizard'
      | 'plan-list'
      | 'shared-link'
      | 'home-hero'
      | 'kids-page';
  };
  plan_day_started: NoProps;
  plan_optimized: NoProps;
  planner_closed_empty: NoProps;
  attraction_filter_used: {
    filter:
      | 'open'
      | 'off_season'
      | 'wet'
      | 'fast_pass'
      | 'single_rider'
      | 'covered'
      | 'height'
      | 'sort_wait';
  };
  covered_ride_opened: NoProps;
  compass_viewed: NoProps;
  compass_heading_on: NoProps;
  compass_ride_pinned: NoProps;
  compass_ride_opened: { from: 'bar' | 'list' };
  compass_pill_clicked: NoProps;
  outbound_link_clicked: { target: 'park_website' | 'tickets' | 'maps' | 'other' };
  pwa_installed: NoProps;
  /** A post, park or ride that was read: five seconds in front. A post is named by its key. */
  page_read: { kind: 'article' | 'news'; key: string } | { kind: 'park' | 'attraction' };
  /** How far down a guide or news post the reader got, once per depth. */
  article_read: { depth: 25 | 50 | 75 | 100 };
  calendar_day_opened: NoProps;
  calendar_month_changed: { direction: 'previous' | 'next' | 'current' };
  push_permission: { result: 'granted' | 'denied' | 'dismissed' };
  error_shown: { boundary: 'page' | 'maintenance' | 'global' };
  /** A share button pressed: the planner's link, or a network or the copy button of a share row. */
  share_clicked: { target: 'trip_plan' | 'whatsapp' | 'facebook' | 'x' | 'link' };
}

/** The name of an event the API accepts. */
export type SiteEventName = keyof SiteEventMap;

/** The pills of the park page's filter panel, plus the rider-height slider. Closed on purpose. */
export type AttractionFilterName = SiteEventMap['attraction_filter_used']['filter'];

type Viewport = 'mobile' | 'tablet' | 'desktop';

interface HitBase {
  locale: Locale;
  path: string;
  /** Any string the API's pattern admits; the facade sends {@link SitePageType}. */
  pageType: string;
  viewport: Viewport;
}

type CollectHit =
  | (HitBase & { t: 'pageview'; referrer?: string; campaign?: string })
  | (HitBase & {
      t: 'event';
      name: string;
      props?: SiteEventProps;
      entity?: string;
    });

const COLLECT_URL = `${API_ORIGIN}/v1/analytics/collect`;
const MAX_HITS_PER_REQUEST = 20;
const FLUSH_DELAY_MS = 1000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const REFERRER_PATTERN = /^[a-z0-9][a-z0-9.-]{0,99}$/;
const EVENT_NAME_PATTERN = /^[a-z][a-z0-9_]{1,47}$/;
const PROP_KEY_PATTERN = /^[a-z][a-z0-9_]{0,31}$/;
/** A text value: a letter or digit first, then letters, digits and a few separators, 120 at most. */
const PROP_VALUE_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} ._:/+#-]{0,119}$/u;
const MAX_PROPS = 8;
/** What the API accepts as a path; a hit outside it is dropped there, so it is not sent at all. */
const PATH_PATTERN = new RegExp(`^/(${locales.join('|')})(/[a-z0-9][a-z0-9._~-]{0,99}){0,8}$`);

/** Every locale's spelling of a segment: a page is served on its own locale's, and on none else. */
const spellings = (segments: Record<Locale, string>) => new Set(Object.values(segments));
const CALENDAR_SEGMENTS = spellings(PARK_CALENDAR_SEGMENTS);
const PARK_CHAPTER_SEGMENTS = new Set([
  ...spellings(PARK_STATS_SEGMENTS),
  ...spellings(PARK_KIDS_SEGMENTS),
]);
const GLOSSARY_SEGMENT_SET = spellings(GLOSSARY_SEGMENTS);
const PLANNER_SEGMENT_SET = spellings(PLANNER_SEGMENTS);
/** The blog's own listing paths: `/blog/page/2`, `/blog/category/…`, `/blog/tag/…`, `/blog/authors/…`. */
const BLOG_LISTING_SEGMENTS = new Set(['page', 'category', 'tag', 'authors']);

const queue: CollectHit[] = [];
let flushTimer: ReturnType<typeof setTimeout> | undefined;
let referrerSent = false;
let unloadHooked = false;
/** The path the not-found page has declared itself for, until the next navigation. */
let notFoundPath: string | undefined;

/**
 * The page type of a locale-prefixed path such as `/de/parks/europe/germany/bruehl/phantasialand`.
 * A park is five segments under `/parks`; one more is a ride unless it names a park sub-page, and
 * those, like the glossary and the planner, are written in the reader's language
 * (`/de/parks/…/phantasialand/wartezeiten-kalender`, `/de/tagesplaner`).
 */
export function sitePageTypeOf(pathname: string): SitePageType {
  const [, ...segments] = pathname.toLowerCase().split('/').filter(Boolean);
  const [first, second] = segments;
  if (!first) return 'home';
  if (first === 'parks') {
    if (segments.length < 5) return 'geo';
    if (segments.length === 5) return 'park';
    if (CALENDAR_SEGMENTS.has(segments[5])) return 'park_calendar';
    if (PARK_CHAPTER_SEGMENTS.has(segments[5])) return 'park_chapter';
    return segments.length === 6 ? 'attraction' : 'other';
  }
  if (first === 'blog') {
    return second && !BLOG_LISTING_SEGMENTS.has(second) ? 'guide' : 'guide_index';
  }
  if (first === 'news') return second && second !== 'page' ? 'news' : 'news_index';
  if (GLOSSARY_SEGMENT_SET.has(first)) return second ? 'glossary' : 'glossary_index';
  if (first === 'search') return 'search';
  if (PLANNER_SEGMENT_SET.has(first)) return 'planner';
  if (first === 'favorites') return 'favorites';
  return 'other';
}

/** The bucket of a 1-based result position. */
export function searchPosition(position: number): SearchPosition {
  if (position <= 1) return '1';
  if (position === 2) return '2';
  if (position === 3) return '3';
  if (position <= 5) return '4-5';
  if (position <= 10) return '6-10';
  return '11+';
}

/**
 * The team testing on its own phones (`?sim=` moves the reader, `?state=` patches the park) is not
 * a visitor, so none of it is counted. Read from the URL, because `isSimulationEnabled()` in the
 * browser only ever says yes under `next dev`.
 */
function isSimulatedVisit(): boolean {
  const params = new URLSearchParams(location.search);
  return params.has('sim') || params.has('state');
}

/**
 * Whether this tab may send anything: production hosts only, not from automation or a simulated
 * visit, not under Do Not Track, Global Privacy Control or the privacy page's opt-out. For a caller
 * that would otherwise start work (a timer, a listener) whose result nothing would send.
 */
export function canCountSite(): boolean {
  if (typeof window === 'undefined') return false;
  if (!isAnalyticsHost(location.hostname)) return false;
  return !navigator.webdriver && !analyticsOptedOut() && !isSimulatedVisit();
}

function currentBase(): HitBase | null {
  const path = location.pathname.toLowerCase().replace(/\/+$/, '');
  if (!PATH_PATTERN.test(path)) return null;
  const locale = path.split('/')[1] as Locale;
  const width = window.innerWidth;
  return {
    locale,
    path,
    pageType: notFoundPath === path ? 'not_found' : sitePageTypeOf(path),
    viewport: width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop',
  };
}

/** A query value as the API's referrer pattern wants it: lower case, trimmed, no spaces or underscores. */
function utmValue(name: string): string | undefined {
  const raw = new URLSearchParams(location.search).get(name)?.toLowerCase().trim();
  const value = raw?.replace(/[\s_]+/g, '-');
  return value && REFERRER_PATTERN.test(value) ? value : undefined;
}

/**
 * Where this page load came from: `utm_source` when the link carried one, else the referrer's host
 * when it is another site, and the link's `utm_campaign`. Read once per load; later pageviews of
 * the tab are internal.
 */
function pageLoadOrigin(): { referrer?: string; campaign?: string } {
  if (referrerSent) return {};
  referrerSent = true;
  const campaign = utmValue('utm_campaign');
  const source = utmValue('utm_source');
  if (source) return { referrer: source, ...(campaign && { campaign }) };
  try {
    const host = new URL(document.referrer).hostname.toLowerCase().replace(/^www\./, '');
    const external = host && host !== location.hostname.replace(/^www\./, '');
    return {
      ...(external && REFERRER_PATTERN.test(host) && { referrer: host }),
      ...(campaign && { campaign }),
    };
  } catch {
    return campaign ? { campaign } : {};
  }
}

function send(hits: CollectHit[], viaBeacon: boolean) {
  const body = JSON.stringify({ v: 1, hits });
  if (viaBeacon && typeof navigator.sendBeacon === 'function') {
    navigator.sendBeacon(COLLECT_URL, new Blob([body], { type: 'text/plain;charset=UTF-8' }));
    return;
  }
  fetch(COLLECT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body,
    keepalive: true,
  }).catch(() => {});
}

/**
 * Sends what is queued now instead of in a second. The page does it on its own when it is hidden;
 * this is for a caller that cannot wait for that, such as a test.
 */
export function flushSiteAnalytics(): void {
  flush();
}

function flush(viaBeacon = false) {
  clearTimeout(flushTimer);
  flushTimer = undefined;
  while (queue.length > 0) send(queue.splice(0, MAX_HITS_PER_REQUEST), viaBeacon);
}

function enqueue(hit: CollectHit, at = queue.length) {
  queue.splice(at, 0, hit);
  if (!unloadHooked) {
    unloadHooked = true;
    // A hit queued just before the tab goes away would otherwise be lost with the timer.
    addEventListener('pagehide', () => flush(true));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush(true);
    });
  }
  if (queue.length >= MAX_HITS_PER_REQUEST) flush();
  else if (flushTimer === undefined) flushTimer = setTimeout(() => flush(), FLUSH_DELAY_MS);
}

/**
 * Where a pageview of `path` goes in the queue: ahead of the events that page queued while it
 * mounted. Its effects run before the layout's beacon, and the API attaches an event to a visit
 * only once the visit's first pageview has opened it, so a landing page's own events (the search
 * page's opening, a glossary term) would otherwise count without a channel or a referrer.
 */
function pageviewSlot(path: string): number {
  let at = queue.length;
  while (at > 0 && queue[at - 1].t === 'event' && queue[at - 1].path === path) at--;
  return at;
}

/** Counts a view of the page now in the address bar. Call once per navigation. */
export function trackSitePageview(): void {
  try {
    if (!canCountSite()) return;
    const base = currentBase();
    if (!base) return;
    enqueue({ t: 'pageview', ...base, ...pageLoadOrigin() }, pageviewSlot(base.path));
  } catch {
    // A statistic never breaks the page.
  }
}

/**
 * Declares the page in the address bar a "not found" page, which only that page knows: its
 * pageview becomes `not_found`, whether it was queued already or comes after. A 404 renders inside
 * the layout, so the beacon cannot tell it from any other page.
 */
export function markPageNotFound(): void {
  try {
    const path = location.pathname.toLowerCase().replace(/\/+$/, '');
    notFoundPath = path;
    for (const hit of queue) {
      if (hit.t === 'pageview' && hit.path === path) hit.pageType = 'not_found';
    }
  } catch {
    // A statistic never breaks the page.
  }
}

/** The properties the API would keep: at most eight, keys and text values in its patterns. */
function cleanProps(props: unknown): SiteEventProps | undefined {
  if (!props || typeof props !== 'object') return undefined;
  const clean: SiteEventProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (Object.keys(clean).length >= MAX_PROPS) break;
    if (!PROP_KEY_PATTERN.test(key)) continue;
    if (typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))) {
      clean[key] = value;
    } else if (typeof value === 'string' && PROP_VALUE_PATTERN.test(value)) {
      clean[key] = value;
    }
  }
  return Object.keys(clean).length > 0 ? clean : undefined;
}

/** The arguments after the name: the properties, typed for an event this site sends, and the entity. */
type TrackArguments<Name extends string> = Name extends SiteEventName
  ? SiteEventMap[Name] extends NoProps
    ? [props?: SiteEventMap[Name], entity?: string | null]
    : [props: SiteEventMap[Name], entity?: string | null]
  : [props?: SiteEventProps, entity?: string | null];

/**
 * Counts one event on the current page. A name in {@link SiteEventMap} is checked against its
 * properties; any other name (lower case, digits and underscores, two to 48 characters) goes
 * through with any properties of {@link SiteEventProps}. `entity` is the UUID of the park, ride,
 * show or restaurant the event is about. A name, property or entity that does not fit the API's
 * patterns is left out, and nothing here throws. Never pass free text or anything that identifies
 * a person.
 */
export function trackSiteEvent<Name extends string>(
  name: Name,
  ...[props, entity]: TrackArguments<Name>
): void {
  try {
    if (!canCountSite() || !EVENT_NAME_PATTERN.test(name)) return;
    const base = currentBase();
    if (!base) return;
    const id = entity?.toLowerCase();
    const clean = cleanProps(props);
    enqueue({
      t: 'event',
      ...base,
      name,
      ...(clean && { props: clean }),
      ...(id && UUID_PATTERN.test(id) && { entity: id }),
    });
  } catch {
    // A statistic never breaks the page.
  }
}
