import { API_ORIGIN } from '@/lib/api/client';
import { ForegroundTimer } from '@/lib/analytics/foreground-timer';
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
 * Beside the views and events the facade measures how long each page view was in the foreground
 * (`ForegroundTimer`): it runs while the tab is visible and reports the seconds it added, as an
 * `engagement` hit, when the next page replaces it and whenever the tab goes to the background, so
 * a tab killed on a phone has still reported. A page view reports at most half an hour in all and
 * nothing under a second. No timestamp is sent, and no performance timing of any kind. The window
 * width is not read either: the API derives the device class from the User-Agent.
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
type SitePageType =
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
type SearchPosition = '1' | '2' | '3' | '4-5' | '6-10' | '11+';

/** What was picked from a search surface's list before anything was typed. */
export type SearchBrowseItem = 'nearby_park' | 'in_park_ride' | 'popular_park' | 'news' | 'guide';

/** A step of the planner's wizard, in the order it asks them. */
export type PlannerWizardStep = 'park' | 'date' | 'setup' | 'headliners';

/** What a planner block is: a ride, a show performance or a block the visitor wrote. */
export type PlanItemKind = 'ride' | 'show' | 'block';

/**
 * The control that put a block into a plan. `headliners` is the optimise row's „Alle Headliner",
 * `add_button` the ride page's „Zum Plan" (through the fit assistant too), `block_menu` the free
 * block a column or the panel adds.
 */
export type PlanItemAddSource =
  | 'search'
  | 'add_button'
  | 'drag'
  | 'missing_headliners'
  | 'show_picker'
  | 'block_menu'
  | 'wizard'
  | 'headliners';

/** The control that took a block out: its own ✕, the action bar, the Delete key, the flat list. */
export type PlanItemRemoveSource = 'block' | 'action_bar' | 'keyboard' | 'timeline';

/**
 * What re-planned the day: „Tag optimieren", „Alle Headliner", or an answer from the fit
 * assistant. Rows from before the property have none.
 */
export type PlanOptimizeMode = 'day' | 'headliners' | 'fit';

/** Where the fit assistant opened: the optimise row, the ride page's button, the wizard's last step. */
export type PlannerFitSource = 'optimize' | 'add_button' | 'wizard';

/** A lever of the fit assistant (`FitLeverKind` in `lib/planner/fit.ts`, with underscores). */
export type PlannerFitLever = 'drop_block' | 'shorten_block' | 'drop_all_blocks';

/** Which undo put a day back: the optimise row's or the ride page button's. */
export type PlannerUndoSource = 'optimize' | 'add_button';

/** What a shared plan's link turned out to hold. */
export type SharedPlanResult = 'ready' | 'empty' | 'missing' | 'failed';

type NoProps = Record<string, never>;

/** Properties of an event the facade does not know: any key, a string, a number or a flag. */
type SiteEventProps = Record<string, string | number | boolean>;

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
  /** A park and date got their first block; the park's UUID as entity where a page named it. */
  plan_day_started: NoProps;
  plan_optimized: { mode: PlanOptimizeMode };
  planner_closed_empty: NoProps;
  /** A wizard step on screen, the first time in an opening; the park as entity once picked. */
  planner_wizard_step: { step: PlannerWizardStep };
  /** The wizard's last press, with whether it planned the headliners; the park as entity. */
  planner_wizard_finished: { headliners: boolean };
  /** A block went into a plan; a ride's or show's UUID as entity where a page named it. */
  plan_item_added: { kind: PlanItemKind; source: PlanItemAddSource };
  /** A block came out of a plan, one at a time; the same entity as when it went in. */
  plan_item_removed: { kind: PlanItemKind; source: PlanItemRemoveSource };
  /** The fit assistant opened for a day that does not hold everything; the park as entity. */
  planner_fit_opened: { source: PlannerFitSource };
  /** A lever of the fit assistant switched on (switching it off again is not counted). */
  planner_fit_lever: { lever: PlannerFitLever };
  /** A day put back as it was before the last optimisation or assistant answer; the park as entity. */
  planner_undo: { source: PlannerUndoSource };
  /** A whole day dropped from the plan; the park as entity. */
  planner_day_cleared: NoProps;
  /** A shared plan's link opened and its answer arrived. */
  planner_shared_opened: { outcome: SharedPlanResult };
  /** A shared plan taken over into this browser. */
  planner_shared_adopted: NoProps;
  /** Push for the plan switched on and accepted by the API. */
  planner_push_on: NoProps;
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

interface HitBase {
  locale: Locale;
  path: string;
  /** Any string the API's pattern admits; the facade sends {@link SitePageType}. */
  pageType: string;
}

type CollectHit =
  | (HitBase & { t: 'pageview'; referrer?: string })
  | (HitBase & {
      t: 'event';
      name: string;
      props?: SiteEventProps;
      entity?: string;
    })
  /** Foreground seconds a page view added since its last report; no timestamp goes with it. */
  | (HitBase & { t: 'engagement'; seconds: number });

const COLLECT_URL = `${API_ORIGIN}/v1/analytics/collect`;
const MAX_HITS_PER_REQUEST = 20;
const FLUSH_DELAY_MS = 1000;
/**
 * How long a page load's first flush waits for its pageview. A page's own events can be queued
 * before the layout's beacon has run, and the API attaches an event to a visit only once the
 * visit's first pageview has opened it, so an event that left first would count without a channel.
 */
const FIRST_PAGEVIEW_WAIT_MS = 3000;
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
let holdTimer: ReturnType<typeof setTimeout> | undefined;
/** This load's first pageview is queued, or its wait for it is over: flushing may begin. */
let released = false;
let referrerSent = false;
let unloadHooked = false;
/** The page view now open, whose foreground time is measured, until the next one replaces it. */
let openPage: { base: HitBase; timer: ForegroundTimer } | undefined;
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
 * browser only ever says yes under `next dev`. Decided on the first call of a page load, so a real
 * visitor who later lands on a `?state=` URL is still counted and a test visit that navigates
 * away does not start counting.
 */
const simulatedLoads = new WeakMap<object, boolean>();
function isSimulatedVisit(): boolean {
  let simulated = simulatedLoads.get(window);
  if (simulated === undefined) {
    const params = new URLSearchParams(location.search);
    simulated = params.has('sim') || params.has('state');
    simulatedLoads.set(window, simulated);
  }
  return simulated;
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
  return {
    locale,
    path,
    pageType: notFoundPath === path ? 'not_found' : sitePageTypeOf(path),
  };
}

/**
 * The host of the page that linked here, when it is another site. Read once per load, since later
 * pageviews of the tab are internal. Nothing of the URL's query string is read.
 */
function pageLoadOrigin(): { referrer?: string } {
  if (referrerSent) return {};
  referrerSent = true;
  try {
    const host = new URL(document.referrer).hostname.toLowerCase().replace(/^www\./, '');
    const external = host && host !== location.hostname.replace(/^www\./, '');
    return external && REFERRER_PATTERN.test(host) ? { referrer: host } : {};
  } catch {
    return {};
  }
}

function send(hits: CollectHit[], viaBeacon: boolean) {
  const body = JSON.stringify({ v: 1, hits });
  if (
    viaBeacon &&
    navigator.sendBeacon?.(COLLECT_URL, new Blob([body], { type: 'text/plain;charset=UTF-8' }))
  ) {
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
  clearTimeout(holdTimer);
  flushTimer = undefined;
  holdTimer = undefined;
  while (queue.length > 0) send(queue.splice(0, MAX_HITS_PER_REQUEST), viaBeacon);
}

/**
 * The page goes to the background or away: what it spent in the foreground is reported now, and
 * everything queued leaves with it, by beacon, since a tab can be killed on a phone without another
 * chance. Reported each time it is hidden, so a page that comes back counts from there.
 */
function onPageHidden() {
  openPage?.timer.pause();
  reportEngagement();
  flush(true);
}

/** Queues the foreground seconds the open page view added since its last report, if any. */
function reportEngagement(at = queue.length): boolean {
  if (!openPage || !canCountSite()) return false;
  const seconds = openPage.timer.take();
  if (seconds < 1) return false;
  enqueue({ t: 'engagement', ...openPage.base, seconds }, at);
  return true;
}

function enqueue(hit: CollectHit, at = queue.length) {
  queue.splice(at, 0, hit);
  if (!unloadHooked) {
    unloadHooked = true;
    // A hit queued just before the tab goes away would otherwise be lost with the timer.
    addEventListener('pagehide', onPageHidden);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') onPageHidden();
      else openPage?.timer.resume();
    });
  }
  if (hit.t === 'pageview') released = true;
  if (!released) {
    holdTimer ??= setTimeout(() => {
      released = true;
      flush();
    }, FIRST_PAGEVIEW_WAIT_MS);
    return;
  }
  clearTimeout(holdTimer);
  holdTimer = undefined;
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

/**
 * Counts a view of the page now in the address bar. Call once per navigation. The view before it
 * ends here, so the foreground time it has not reported yet is queued ahead of the new pageview,
 * under the path and page type it was opened with.
 */
export function trackSitePageview(): void {
  try {
    if (!canCountSite()) return;
    const base = currentBase();
    const at = base ? pageviewSlot(base.path) : queue.length;
    const reported = reportEngagement(at);
    openPage = undefined;
    if (!base) return;
    openPage = {
      base,
      timer: new ForegroundTimer(() => performance.now(), document.visibilityState !== 'hidden'),
    };
    enqueue({ t: 'pageview', ...base, ...pageLoadOrigin() }, reported ? at + 1 : at);
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
      if (hit.t !== 'event' && hit.path === path) hit.pageType = 'not_found';
    }
    if (openPage?.base.path === path) openPage.base.pageType = 'not_found';
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
