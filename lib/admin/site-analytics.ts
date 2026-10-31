import { locales, localeNames, type Locale } from '@/i18n/config';
import type {
  NavMenuId,
  SearchBrowseItem,
  SearchResultKind,
  SearchSurface,
  SiteEventName,
} from '@/lib/analytics/site-analytics';
import type { LinkBlock } from '@/lib/analytics/internal-link';
import type { SeenSection } from '@/lib/analytics/section-seen';
import type { PlannerOpenedSource } from '@/lib/planner/ui-store';
import type {
  AnalyticsTotals,
  BreakdownDimension,
  BreakdownItem,
  BreakdownResponse,
  CrosstabResponse,
  EventDetailResponse,
  EventEntity,
  PlannerOverview,
  SearchOverview,
  SeriesInterval,
  TrafficOverview,
} from '@/lib/api/admin-site-analytics';
import { formatPeriodLong, germanDay, rangeParams, type TrafficRange } from './traffic-range';

/**
 * The pure half of the traffic dashboards (`app/admin/traffic`): the windows, languages and
 * filters a URL can ask for, the change against the window before, the words for the values the
 * API answers in, and the shapes the tables, the matrices and the crosstab are drawn from. Kept
 * apart from the pages so it can be tested.
 *
 * The API stores whatever the site sent, so no list here is a limit: a value this build has no word
 * for reads as it was sent, and a matrix lists the rows and columns it finds.
 */

/** The language a `locale` query value names, `null` for all of them or for junk. */
export function parseTrafficLocale(raw: string | null | undefined): Locale | null {
  return (locales as readonly string[]).includes(raw ?? '') ? (raw as Locale) : null;
}

/** German first, then the rest: most of the traffic, and the admin's own language. */
export const TRAFFIC_LOCALES: readonly Locale[] = [
  'de',
  ...locales.filter((locale) => locale !== 'de'),
];

// ---------------------------------------------------------------------------------------------
// Filters

/** The dimensions a traffic filter can name, the API's `filter=<dimension>:<value>`. */
const FILTER_DIMENSIONS = [
  'path',
  'page_type',
  'entry',
  'referrer',
  'channel',
  'country',
  'device',
  'browser',
  'os',
  'locale',
  'browser_language',
] as const;

/** One of the {@link FILTER_DIMENSIONS}. */
export type FilterDimension = (typeof FILTER_DIMENSIONS)[number];

/** One filter: a dimension held to a single value. */
export interface TrafficFilter {
  dim: FilterDimension;
  value: string;
}

/** What a dimension is called in a filter chip. */
export const DIMENSION_LABEL: Record<FilterDimension, string> = {
  path: 'Seite',
  page_type: 'Seitenart',
  entry: 'Einstieg',
  referrer: 'Herkunft',
  channel: 'Kanal',
  country: 'Land',
  device: 'Gerät',
  browser: 'Browser',
  os: 'System',
  locale: 'Sprache',
  browser_language: 'Browsersprache',
};

/** Whether a string names a dimension a filter may use. */
export function isFilterDimension(value: string): value is FilterDimension {
  return (FILTER_DIMENSIONS as readonly string[]).includes(value);
}

/** The filter a `dimension:value` string names, split at the first colon; `null` for junk. */
export function parseTrafficFilter(raw: string): TrafficFilter | null {
  const colon = raw.indexOf(':');
  if (colon < 1) return null;
  const dim = raw.slice(0, colon);
  const value = raw.slice(colon + 1);
  return isFilterDimension(dim) && value.length > 0 ? { dim, value } : null;
}

/** The filters of an address, from its repeated `filter` parameters, one per dimension at most. */
export function parseTrafficFilters(values: readonly string[]): TrafficFilter[] {
  const byDim = new Map<FilterDimension, TrafficFilter>();
  for (const raw of values) {
    const filter = parseTrafficFilter(raw);
    if (filter) byDim.set(filter.dim, filter);
  }
  return [...byDim.values()];
}

/** The `dimension:value` strings of a list of filters, the way the address and the API take them. */
export function serializeTrafficFilters(filters: readonly TrafficFilter[]): string[] {
  return filters.map((filter) => `${filter.dim}:${filter.value}`);
}

/**
 * The filters with one more: a dimension is held to one value, so a second value of the same
 * dimension replaces the first (two values of one dimension would match nothing), and the
 * same value again takes it off, which makes a row in a panel a switch.
 */
export function toggleTrafficFilter(
  filters: readonly TrafficFilter[],
  dim: FilterDimension,
  value: string
): TrafficFilter[] {
  const rest = filters.filter((filter) => filter.dim !== dim);
  const held = filters.find((filter) => filter.dim === dim);
  return held?.value === value ? rest : [...rest, { dim, value }];
}

/** The filters without the one on `dim`. */
export function withoutTrafficFilter(
  filters: readonly TrafficFilter[],
  dim: FilterDimension
): TrafficFilter[] {
  return filters.filter((filter) => filter.dim !== dim);
}

/**
 * Which rows a report counts by network (`?datacenter=`): the API leaves the data centres' out
 * unless asked (clouds and hosters by the address's ASN; docs/features/site-analytics.md).
 */
export const DATACENTER_SCOPES = ['exclude', 'include', 'only'] as const;

/** One of {@link DATACENTER_SCOPES}. */
export type DatacenterScope = (typeof DATACENTER_SCOPES)[number];

/** The switch's words for each {@link DatacenterScope}, and what each does when hovered. */
export const DATACENTER_LABEL: Record<DatacenterScope, { label: string; title: string }> = {
  exclude: {
    label: 'ohne RZ',
    title: 'Aufrufe aus Rechenzentren (Clouds und Hoster, nach dem Netz der Adresse) ausblenden',
  },
  include: { label: 'mit RZ', title: 'Aufrufe aus Rechenzentren mitzählen' },
  only: { label: 'nur RZ', title: 'Nur Aufrufe aus Rechenzentren zeigen' },
};

/** The scope an address asks for; the API's default, `exclude`, for anything else. */
export function parseDatacenterScope(raw: string | null | undefined): DatacenterScope {
  return (DATACENTER_SCOPES as readonly string[]).includes(raw ?? '')
    ? (raw as DatacenterScope)
    : 'exclude';
}

/** What the page asks the API with, and what its address holds. */
export interface TrafficQueryState {
  range: TrafficRange;
  /** The step of the series the address asked for; `null` leaves it to the API's default. */
  interval?: SeriesInterval | null;
  locale: Locale | null;
  filters?: readonly TrafficFilter[];
  /** Absent or `exclude` sends nothing: the API's default. */
  datacenter?: DatacenterScope;
}

/**
 * The query string both ends read: `days=30&locale=de&filter=channel:search`. `extra` is
 * appended as given, one parameter per key.
 */
export function trafficQuery(
  state: TrafficQueryState,
  extra: Record<string, string | number> = {}
): string {
  const params = new URLSearchParams(rangeParams(state.range));
  if (state.interval) params.set('interval', state.interval);
  if (state.locale) params.set('locale', state.locale);
  for (const filter of serializeTrafficFilters(state.filters ?? []))
    params.append('filter', filter);
  if (state.datacenter && state.datacenter !== 'exclude') {
    params.set('datacenter', state.datacenter);
  }
  for (const [key, value] of Object.entries(extra)) params.set(key, String(value));
  return params.toString();
}

// ---------------------------------------------------------------------------------------------
// Change, counts and formatting

/** How a figure moved against the window before. */
export interface TrafficDelta {
  /** `new`: there was nothing before, so a percentage would be infinite. */
  direction: 'up' | 'down' | 'flat' | 'new';
  /** Absolute change in percent, rounded; `null` for `new` and for nothing at all. */
  percent: number | null;
}

/** The change from `previous` to `current`: flat under half a percent, `new` out of nothing. */
export function deltaOf(current: number, previous: number): TrafficDelta {
  if (previous === 0) {
    return current === 0
      ? { direction: 'flat', percent: null }
      : { direction: 'new', percent: null };
  }
  const change = ((current - previous) / previous) * 100;
  if (Math.abs(change) < 0.5) return { direction: 'flat', percent: 0 };
  return { direction: change > 0 ? 'up' : 'down', percent: Math.round(Math.abs(change)) };
}

/**
 * The change of a figure that may be missing: `null` when either side is, as visitors are under a
 * filter, so a percentage is never worked out from nothing.
 */
export function figureDelta(current: number | null, previous: number | null): TrafficDelta | null {
  return current === null || previous === null ? null : deltaOf(current, previous);
}

/** The filters that select visits by how they began: only visit figures exist for them. */
const VISIT_FILTER_DIMENSIONS: readonly FilterDimension[] = ['entry', 'referrer', 'channel'];

/** Whether any of the filters is on how a visit began. */
export function hasVisitFilter(filters: readonly TrafficFilter[]): boolean {
  return filters.some((filter) => VISIT_FILTER_DIMENSIONS.includes(filter.dim));
}

/**
 * Why a report cannot be answered under these filters, in German, or `null` when it can. Page
 * views and events carry nothing of the visit they were part of, so a filter on how a visit began
 * leaves only the visit figures; events also carry no browser language. The API answers 400 for
 * both, so the page says it instead of asking.
 */
export function unsupportedReason(
  report: 'pageviews' | 'events',
  filters: readonly TrafficFilter[]
): string | null {
  if (hasVisitFilter(filters)) {
    return report === 'events'
      ? 'Ereignisse gehören zu keinem Besuch. Unter einem Filter nach Einstieg, Herkunft oder Kanal gibt es nur Besuchswerte, also keine Ereignisse. Nimm den Filter heraus, um sie zu sehen.'
      : 'Aufrufe gehören zu keinem Besuch. Unter einem Filter nach Einstieg, Herkunft oder Kanal gibt es nur Besuchswerte, also keine Aufrufe. Nimm den Filter heraus oder zähle Besuche.';
  }
  if (report === 'events' && filters.some((filter) => filter.dim === 'browser_language')) {
    return 'Ereignisse tragen keine Browsersprache. Nimm den Filter nach Browsersprache heraus, um sie zu sehen.';
  }
  return null;
}

/**
 * Why a visitor figure can be missing: the API counts visitors without a filter and under one
 * filter on country, device, browser, operating system or channel, and under any other filter,
 * several included, sends `null`.
 */
export const VISITOR_FILTER_HINT =
  'Besucher gibt es für einen Filter auf Land, Gerät, Browser, Betriebssystem oder Kanal, nicht für mehrere zugleich.';

/**
 * The sentence about visitors under the series' title: why they are missing, why an hourly series
 * has none under a filter or for the hours before today, or what they are. `filters` is what the
 * API echoed, so the sentence follows what was counted, not what was asked.
 */
export function visitorsNote(
  overview: Pick<TrafficOverview, 'totals' | 'series' | 'interval' | 'filters'>
): string {
  if (overview.totals.visitors === null) return VISITOR_FILTER_HINT;
  if (overview.interval === 'hour') {
    if ((overview.filters?.length ?? 0) > 0) {
      return 'Unter einem Filter gibt es Besucher nur für den ganzen Zeitraum, nicht je Stunde.';
    }
    if (overview.series.some((point) => point.visitors === null)) {
      return 'Besucher gibt es stundenweise nur für heute.';
    }
  }
  return 'Besucher sind die Summe der Tageswerte.';
}

/**
 * What a panel says when the API could not read the hourly rows for the whole window
 * (`hourlyFrom`), in German, or `null` when nothing was cut. The hourly rows reach back to that
 * day; older days exist only as daily sums, which carry no filter on a page. Later than the
 * window's first day, the window itself is short; otherwise only the window before it is, and with
 * it the figures it is compared against.
 */
export function hourlyNotice(hourlyFrom: string | null | undefined, from: string): string | null {
  if (!hourlyFrom) return null;
  const day = germanDay(hourlyFrom);
  return hourlyFrom > from
    ? `Diese Auswertung reicht nur bis ${day} zurück; ältere Tage gibt es nur als Tageswerte.`
    : `Der Zeitraum davor ist nur ab ${day} vollständig; ältere Tage fehlen dort, die Vergleichswerte sind zu niedrig.`;
}

/** Whether a window holds any traffic at all, so an empty one can say so instead of drawing zeros. */
export function hasTraffic(totals: AnalyticsTotals): boolean {
  return (totals.pageviews ?? 0) > 0 || (totals.events ?? 0) > 0 || totals.visits > 0;
}

const number = new Intl.NumberFormat('de-DE');
const oneDecimal = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** A count with the German thousands separator. */
export function formatCount(value: number): string {
  return number.format(value);
}

/**
 * A duration in whole seconds: `45 s` under a minute, `1:42 min` under an hour, `1:05 h` beyond.
 * `null` is a duration nobody measured, `–`.
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) return '–';
  const whole = Math.max(0, Math.round(seconds));
  if (whole < 60) return `${whole} s`;
  const pad = (value: number) => String(value).padStart(2, '0');
  if (whole < 3600) return `${Math.floor(whole / 60)}:${pad(whole % 60)} min`;
  return `${Math.floor(whole / 3600)}:${pad(Math.floor((whole % 3600) / 60))} h`;
}

/** A float with one decimal, `2,4`. */
export function formatDecimal(value: number): string {
  return oneDecimal.format(value);
}

/**
 * A 0..1 share as a percentage: `42 %`, `4,2 %` under ten, `< 0,1 %` for a trace, `0 %` for none.
 * A rate that has nothing to divide (no visits, no openings) is no share at all: the caller shows
 * `–` for that, since 0 % is an answer.
 */
export function formatShare(share: number): string {
  if (!Number.isFinite(share)) return '–';
  if (share <= 0) return '0 %';
  const percent = share * 100;
  if (percent < 0.1) return '< 0,1 %';
  return `${percent < 10 ? oneDecimal.format(percent) : number.format(Math.round(percent))} %`;
}

/** The sum of a list of numbers. */
export function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

// ---------------------------------------------------------------------------------------------
// Words for the values

/** The German name of a page type this build knows; see {@link pageTypeLabel} for any other. */
export const PAGE_TYPE_LABEL: Record<string, string> = {
  home: 'Startseite',
  park: 'Park',
  park_calendar: 'Park, Kalender',
  park_chapter: 'Park, Unterseite',
  attraction: 'Fahrgeschäft',
  geo: 'Kontinent, Land, Stadt',
  guide: 'Guide',
  guide_index: 'Guide-Übersicht',
  news: 'News',
  news_index: 'News-Übersicht',
  glossary: 'Glossarbegriff',
  glossary_index: 'Glossar',
  search: 'Suchseite',
  planner: 'Tagesplaner',
  favorites: 'Favoriten',
  not_found: '404, nicht gefunden',
  other: 'Sonstige',
};

/** A page type as it reads in a list; one this build has no word for stays as sent. */
export function pageTypeLabel(value: string): string {
  return PAGE_TYPE_LABEL[value] ?? value;
}

/** The page types this build knows, in the order a matrix lists them. */
const PAGE_TYPES = Object.keys(PAGE_TYPE_LABEL);

/** The device classes the API derives from the User-Agent, in the order a list shows them. */
export const DEVICES = ['mobile', 'tablet', 'desktop'] as const;

/** The German name of a device class. */
export const DEVICE_LABEL: Record<string, string> = {
  mobile: 'Telefon',
  tablet: 'Tablet',
  desktop: 'Computer',
};

/**
 * The German name of every search field the site sends. Typed by the facade's union, so a field
 * added there fails the build here until it has its word.
 */
export const SURFACE_LABEL: Record<SearchSurface, string> = {
  hero: 'Hero (Startseite)',
  header: 'Header',
  keyboard: 'Tastenkürzel (⌘K)',
  search_page: 'Suchseite',
  listing_guides: 'Guide-Liste',
  listing_news: 'News-Liste',
  guides_panel: 'Guides-Menü',
  home_steps: 'Startseite, Schritte',
  park_rides: 'Fahrgeschäfte im Park',
  compare: 'Park-Vergleich',
  glossary: 'Glossar',
  post_end: 'Ende eines Beitrags',
};

/** A search field as it reads in a list; one the site sends later stays as sent. */
export function surfaceLabel(value: string): string {
  return (SURFACE_LABEL as Record<string, string>)[value] ?? value;
}

/** The search fields this build knows, the two the question is about first. */
export const SEARCH_SURFACES = Object.keys(SURFACE_LABEL);

/** What a result opened from a search was. */
export const RESULT_KIND_LABEL: Record<SearchResultKind, string> = {
  park: 'Park',
  attraction: 'Fahrgeschäft',
  show: 'Show',
  restaurant: 'Restaurant',
  location: 'Ort',
  glossary: 'Glossar',
  guide: 'Guide',
  news: 'News',
};

/** A result kind as it reads in a list; one the site sends later stays as sent. */
export function resultKindLabel(value: string): string {
  return (RESULT_KIND_LABEL as Record<string, string>)[value] ?? value;
}

/** The result kinds this build knows, in the order a list shows them. */
const RESULT_KINDS = Object.keys(RESULT_KIND_LABEL);

/** What was picked from the list a search field shows before anything is typed. */
export const BROWSE_ITEM_LABEL: Record<SearchBrowseItem, string> = {
  nearby_park: 'Park in der Nähe',
  in_park_ride: 'Fahrgeschäft im Park',
  popular_park: 'Beliebter Park',
  news: 'News',
  guide: 'Guide',
};

/** A suggestion kind as it reads in a list; one the site sends later stays as sent. */
export function browseItemLabel(value: string): string {
  return (BROWSE_ITEM_LABEL as Record<string, string>)[value] ?? value;
}

/** The suggestion kinds this build knows, in the order a list shows them. */
const BROWSE_ITEMS = Object.keys(BROWSE_ITEM_LABEL);

/** The result positions, first to last. */
const SEARCH_POSITIONS = ['1', '2', '3', '4-5', '6-10', '11+'] as const;

/** How visits reached the site, by the API's channel names. */
const CHANNEL_LABEL: Record<string, string> = {
  search: 'Suchmaschinen',
  ai: 'KI-Assistenten',
  social: 'Social Media',
  referral: 'Andere Websites',
  direct: 'Direkt',
};

const BROWSER_LABEL: Record<string, string> = {
  chrome: 'Chrome',
  safari: 'Safari',
  firefox: 'Firefox',
  edge: 'Edge',
  samsung: 'Samsung Internet',
  opera: 'Opera',
  other: 'Andere',
};

const OS_LABEL: Record<string, string> = {
  ios: 'iOS',
  android: 'Android',
  windows: 'Windows',
  macos: 'macOS',
  linux: 'Linux',
  chromeos: 'ChromeOS',
  other: 'Andere',
};

let regionNames: Intl.DisplayNames | null = null;

/** A country code as its German name; `zz`, the API's "not found", reads `Unbekannt`. */
export function countryName(code: string): string {
  if (code.toLowerCase() === 'zz') return 'Unbekannt';
  try {
    regionNames ??= new Intl.DisplayNames(['de'], { type: 'region' });
    return regionNames.of(code.toUpperCase()) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

let languageNames: Intl.DisplayNames | null = null;

/** A language code as its German name; `zz`, the API's "none given", reads `Unbekannt`. */
export function languageName(code: string): string {
  if (code.toLowerCase() === 'zz') return 'Unbekannt';
  try {
    languageNames ??= new Intl.DisplayNames(['de'], { type: 'language' });
    return languageNames.of(code.toLowerCase()) ?? code;
  } catch {
    return code;
  }
}

/** How a value of a breakdown dimension reads in a list; a value this build has no word for stays as is. */
export function breakdownValueLabel(dim: BreakdownDimension, value: string): string {
  switch (dim) {
    case 'page_type':
      return pageTypeLabel(value);
    case 'device':
      return DEVICE_LABEL[value] ?? value;
    case 'browser':
      return BROWSER_LABEL[value] ?? value;
    case 'os':
      return OS_LABEL[value] ?? value;
    case 'country':
      return countryName(value);
    case 'locale':
      return localeNames[value as Locale] ?? value;
    case 'browser_language':
      return languageName(value);
    case 'channel':
      return CHANNEL_LABEL[value] ?? value;
    default:
      return value;
  }
}

/**
 * The small line under a row of a breakdown: what the API added to the count, by what it sent. The
 * visitors come first where the dimension has them. A list of visits (where visits began, or any
 * list under a filter on how a visit began) has a bounce rate and an average visit; a list of page
 * views the time on the page and, for a page, how often it was the last of a visit.
 */
export function breakdownDetail(dim: BreakdownDimension, item: BreakdownItem): string | undefined {
  const parts: string[] = [];
  if (item.visitors !== undefined) parts.push(`${formatCount(item.visitors)} Besucher`);
  if (dim === 'path' && item.exits !== undefined) parts.push(`${formatCount(item.visits)} Besuche`);
  if (item.bounceRate !== undefined) parts.push(`Absprung ${formatShare(item.bounceRate)}`);
  if (item.avgVisitSeconds != null) parts.push(`Ø Dauer ${formatDuration(item.avgVisitSeconds)}`);
  if (item.avgTimeOnPageSeconds != null) {
    parts.push(`Ø Zeit ${formatDuration(item.avgTimeOnPageSeconds)}`);
  }
  if (item.exitRate !== undefined) parts.push(`Ausstieg ${formatShare(item.exitRate)}`);
  return parts.length > 0 ? parts.join(' · ') : undefined;
}

/** The title and the one-line question of each breakdown panel. */
export const BREAKDOWN_PANELS: Record<BreakdownDimension, { title: string; hint: string }> = {
  path: { title: 'Seiten', hint: 'Meistbesuchte Adressen' },
  entry: { title: 'Einstiegsseiten', hint: 'Womit ein Besuch beginnt' },
  referrer: { title: 'Herkunft', hint: 'Website, von der der Besuch kam' },
  channel: { title: 'Kanäle', hint: 'Wie die Besuche auf die Seite kamen' },
  page_type: { title: 'Seitenarten', hint: 'Wofür die Aufrufe gebraucht werden' },
  country: { title: 'Länder', hint: 'Aus der Adresse des Besuchers abgeleitet' },
  locale: { title: 'Sprachen', hint: 'Sprache der Seite, nicht des Browsers' },
  device: {
    title: 'Geräte',
    hint: 'Aus dem User-Agent abgeleitet; iPads ab iPadOS 13 zählen als Computer',
  },
  browser: { title: 'Browser', hint: 'Familie, aus dem User-Agent abgeleitet' },
  os: { title: 'Betriebssysteme', hint: 'Familie, aus dem User-Agent abgeleitet' },
  browser_language: { title: 'Browsersprache', hint: 'Erste Sprache, die der Browser angibt' },
  exit: { title: 'Ausstiegsseiten', hint: 'Womit ein Besuch endet' },
};

/**
 * The dimensions whose rows are visits that started, and so have a bounce rate and an average visit
 * duration. The exit page is a visit too, but one that ended, so it has neither.
 */
export const VISIT_DIMENSIONS: readonly BreakdownDimension[] = ['entry', 'referrer', 'channel'];

// ---------------------------------------------------------------------------------------------
// Events

/** What an event is called in the admin and when it fires. */
interface EventInfo {
  label: string;
  when: string;
}

/**
 * The events this site sends, in German, with the moment each fires. The type makes a new event in
 * `SiteEventMap` fail the build here until it has a line; an event outside the map reads as its
 * name with no sentence, since the API takes any.
 */
export const EVENT_INFO: Record<SiteEventName, EventInfo> = {
  search_opened: { label: 'Suche geöffnet', when: 'Ein Suchfeld wird geöffnet oder angeklickt.' },
  search_typed: {
    label: 'Suche eingegeben',
    when: 'Nach der ersten Eingabe ab drei Zeichen, einmal je Öffnung.',
  },
  search_no_results: {
    label: 'Suche ohne Treffer',
    when: 'Eine Eingabe ab drei Zeichen findet nichts.',
  },
  search_result_clicked: {
    label: 'Treffer geöffnet',
    when: 'Ein Treffer der Suche wird angeklickt; mit Feld, Treffertyp und Position.',
  },
  search_browse_clicked: {
    label: 'Vorschlag geöffnet',
    when: 'Ein Eintrag aus der Liste vor der Eingabe wird angeklickt.',
  },
  search_view_all: {
    label: 'Alle Ergebnisse',
    when: 'Der Knopf „Alle Ergebnisse für …“ führt von der Suche auf die Suchseite.',
  },
  favorite_add: { label: 'Favorit gesetzt', when: 'Ein Stern wird eingeschaltet.' },
  favorite_remove: { label: 'Favorit entfernt', when: 'Ein Stern wird ausgeschaltet.' },
  nearby_permission: {
    label: 'Standortfreigabe',
    when: 'Der Browser liefert eine Position (erteilt) oder die Freigabe wird jetzt verweigert.',
  },
  nearby_parks_loaded: {
    label: 'Parks in der Nähe geladen',
    when: 'Beim Laden: die erste Antwort der Nähe-Suche je Art und Quelle in einem Tab; ohne Park.',
  },
  language_switched: { label: 'Sprache gewechselt', when: 'Eine Sprache im Umschalter gewählt.' },
  theme_toggled: { label: 'Farbschema gewechselt', when: 'Der Schalter hat das Schema gesetzt.' },
  tab_changed: {
    label: 'Park-Reiter gewechselt',
    when: 'Ein Reiter der Parkseite wird geöffnet; der Kalender ist eine Seite für sich.',
  },
  location_banner_clicked: {
    label: 'Standort-Banner',
    when: 'Der Knopf im Standort-Banner wird gedrückt.',
  },
  blog_toast_opened: {
    label: 'Neue-Beiträge-Hinweis',
    when: 'Der Hinweis auf neue Beiträge führt zum Beitrag.',
  },
  glossary_term_viewed: {
    label: 'Glossarbegriff gelesen',
    when: 'Einmal je Aufruf einer Begriffsseite; mit der englischen Begriffs-ID.',
  },
  glossary_category_filtered: {
    label: 'Glossar gefiltert',
    when: 'Eine Kategorie auf der Glossar-Übersicht; „none“, wenn der Filter fällt.',
  },
  preferred_source_clicked: {
    label: 'Bevorzugte Quelle',
    when: 'Der Link „Bevorzugte Quelle bei Google“ im Footer.',
  },
  ride_alert_set: {
    label: 'Wartezeit-Alarm gesetzt',
    when: 'Ein Alarm wurde gespeichert; das Öffnen des Dialogs zählt nicht.',
  },
  ride_alert_removed: { label: 'Alarm entfernt', when: 'Ein Alarm wurde gelöscht.' },
  show_follow_add: {
    label: 'Show-Erinnerung gesetzt',
    when: 'Eine Erinnerung wurde eingeschaltet.',
  },
  show_follow_remove: {
    label: 'Show-Erinnerung entfernt',
    when: 'Eine Erinnerung wurde ausgeschaltet.',
  },
  assistant_opened: {
    label: 'Parky geöffnet',
    when: 'Das Chatfenster von Parky geht von zu auf offen.',
  },
  assistant_closed: {
    label: 'Parky geschlossen',
    when: 'Das Chatfenster schließt; mit der Zahl der Fragen, solange es offen war.',
  },
  assistant_question: {
    label: 'Frage an Parky',
    when: 'Eine Frage wird abgeschickt; ob Vorschlag oder getippt, nie ihr Text.',
  },
  assistant_answer: {
    label: 'Antwort von Parky',
    when: 'Eine Antwort ist fertig oder gescheitert; mit Ergebnis und Zahl der Datenabfragen.',
  },
  assistant_rated: {
    label: 'Parky bewertet',
    when: 'Daumen hoch oder runter unter einer Antwort.',
  },
  assistant_feedback_sent: {
    label: 'Feedback gesendet',
    when: 'Feedback aus dem Parky-Fenster ist angekommen; ob mit E-Mail, nie die E-Mail.',
  },
  assistant_challenge_failed: {
    label: 'Parky-Check gescheitert',
    when: 'Der Turnstile-Check vor Parky ist in diesem Browser fehlgeschlagen.',
  },
  planner_opened: {
    label: 'Planer geöffnet',
    when: 'Der Planer-Bereich geht von zu auf offen; mit dem Weg hinein.',
  },
  plan_day_started: {
    label: 'Plan begonnen',
    when: 'Ein Park und Tag bekommen den ersten Block, egal wie; mit dem Weg in die Öffnung („none“ bei zugeklapptem Planer) und dem Park, wo eine Seite ihn kennt.',
  },
  plan_optimized: {
    label: 'Plan optimiert',
    when: 'Der Planer sortiert den Tag und der Plan hat sich geändert; mit „Tag optimieren“, „Alle Headliner“ oder einer Antwort des Assistenten.',
  },
  planner_closed_empty: {
    label: 'Planer leer geschlossen',
    when: 'Der Bereich schließt, ohne dass ein Tag einen ersten Block bekam.',
  },
  planner_wizard_step: {
    label: 'Assistent: Schritt',
    when: 'Ein Schritt des Assistenten ist zum ersten Mal in dieser Öffnung zu sehen.',
  },
  planner_wizard_finished: {
    label: 'Assistent fertig',
    when: 'Der letzte Knopf des Assistenten; mit der Angabe, ob er die Headliner einplant.',
  },
  plan_item_added: {
    label: 'Block eingeplant',
    when: 'Ein Fahrgeschäft, eine Show oder ein eigener Block kommt in den Plan; mit dem Knopf, der es tat.',
  },
  plan_item_removed: {
    label: 'Block entfernt',
    when: 'Ein Block wird einzeln aus dem Plan genommen; mit dem Weg, auf dem es geschah.',
  },
  planner_fit_opened: {
    label: 'Passt-Assistent geöffnet',
    when: 'Der Tag hält nicht alles und der Assistent fragt; im Planer, am Knopf der Fahrgeschäft-Seite oder im letzten Schritt des Assistenten.',
  },
  planner_fit_lever: {
    label: 'Hebel angewandt',
    when: 'Ein Vorschlag des Passt-Assistenten wird eingeschaltet; Ausschalten zählt nicht.',
  },
  planner_undo: {
    label: 'Rückgängig',
    when: 'Ein Tag wird auf den Stand vor dem letzten Optimieren oder der letzten Antwort zurückgesetzt.',
  },
  planner_day_cleared: {
    label: 'Tag geleert',
    when: 'Ein ganzer Tag wird aus dem Plan gelöscht.',
  },
  planner_shared_opened: {
    label: 'Geteilter Plan geöffnet',
    when: 'Ein geteilter Link wird geöffnet und seine Antwort ist da; mit dem, was er enthielt.',
  },
  planner_shared_adopted: {
    label: 'Geteilten Plan übernommen',
    when: 'Ein geteilter Plan wird in diesen Browser übernommen.',
  },
  planner_push_on: {
    label: 'Push für den Plan an',
    when: 'Die Benachrichtigungen für den Plan sind eingeschaltet und von der API angenommen.',
  },
  attraction_filter_used: {
    label: 'Filter benutzt',
    when: 'Ein Filter der Parkseite wird eingeschaltet; der Größen-Regler beim ersten Wert.',
  },
  covered_ride_opened: {
    label: 'Überdachtes Fahrgeschäft',
    when: 'Ein Fahrgeschäft aus dem Regen-Hinweis wird geöffnet.',
  },
  compass_viewed: {
    label: 'Kompass gesehen',
    when: 'Einmal je Seitenaufruf, sobald der Kompass im Bild ist.',
  },
  compass_heading_on: {
    label: 'Kompass läuft',
    when: 'Einmal je Seitenaufruf, wenn der Kompass des Handys Werte liefert.',
  },
  compass_ride_pinned: { label: 'Kompass: Bahn markiert', when: 'Ein Tipp auf eine Marke.' },
  compass_ride_opened: {
    label: 'Kompass: Bahn geöffnet',
    when: 'Eine Fahrgeschäftsseite wird aus dem Kompass geöffnet; Leiste oder Liste.',
  },
  compass_pill_clicked: { label: 'Kompass-Knopf', when: 'Der Knopf „Zum Kompass“ im Hero.' },
  outbound_link_clicked: {
    label: 'Link nach außen',
    when: 'Website, Ticketshop, Karte oder Social-Link eines Parks.',
  },
  pwa_installed: { label: 'App installiert', when: 'Der Browser meldet die Installation.' },
  page_read: {
    label: 'Gelesen',
    when: 'Ein Beitrag, Park oder eine Bahn war fünf Sekunden im Vordergrund; speist die Meistgelesen-Listen.',
  },
  article_read: {
    label: 'Beitrag gelesen bis',
    when: 'Ein Guide oder eine News ist bis 25, 50, 75 oder 100 Prozent gelesen, einmal je Stufe.',
  },
  calendar_day_opened: {
    label: 'Kalendertag geöffnet',
    when: 'Ein Tag im Besuchskalender wird geöffnet.',
  },
  calendar_month_changed: {
    label: 'Kalendermonat gewechselt',
    when: 'Der Monatsschalter des Kalenders wird gedrückt.',
  },
  push_permission: {
    label: 'Push-Erlaubnis',
    when: 'Die Antwort auf die Frage des Browsers: erlaubt, abgelehnt oder weggeklickt.',
  },
  error_shown: {
    label: 'Fehlerseite gezeigt',
    when: 'Eine Fehlerseite wird angezeigt; ohne Text der Meldung.',
  },
  share_clicked: {
    label: 'Teilen gedrückt',
    when: 'Ein Teilen-Knopf unter einem Beitrag, Park oder Fahrgeschäft oder der Link des Plans; mit dem Weg, nicht dem Inhalt.',
  },
  internal_link_clicked: {
    label: 'Weiter auf park.fan',
    when: 'Ein Link auf eine andere Seite von park.fan aus einem markierten Block (Text, Parks im Beitrag, Weiterlesen, Header, Footer …); mit Block, Ziel-Seitenart und Platz.',
  },
  section_seen: {
    label: 'Stelle der Parkseite erreicht',
    when: 'Eine markierte Stelle einer Parkseite kommt ins Bild, einmal je Seitenaufruf; zählt auch, wo der Park das Kapitel nicht hat.',
  },
  nav_menu_opened: {
    label: 'Menü geöffnet',
    when: 'Ein Menü des Headers klappt auf, auch beim Darüberfahren mit der Maus, oder das Handy-Menü öffnet sich; einmal je Öffnung.',
  },
  faq_opened: {
    label: 'FAQ-Frage geöffnet',
    when: 'Eine Frage eines FAQ wird aufgeklappt; mit ihrem Platz in der Liste, nie mit ihrem Text.',
  },
};

/** The info of an event this build knows, `undefined` for any other. */
export function eventInfo(name: string): EventInfo | undefined {
  return (EVENT_INFO as Record<string, EventInfo>)[name];
}

/** The label of an event, or its bare name for one this build does not know. */
export function eventLabel(name: string): string {
  return eventInfo(name)?.label ?? name;
}

/** Whether an event belongs to the search dashboard. */
export function isSearchEvent(name: string): boolean {
  return name.startsWith('search_');
}

/** Whether an event belongs to the planner dashboard. */
export function isPlannerEvent(name: string): boolean {
  return name.startsWith('planner_') || name.startsWith('plan_');
}

/** The names of an event's properties in German. */
const PROP_LABEL: Record<string, string> = {
  surface: 'Suchfeld',
  result: 'Treffertyp',
  position: 'Position',
  item: 'Vorschlag',
  type: 'Art',
  source: 'Quelle',
  from: 'Von',
  to: 'Nach',
  theme: 'Schema',
  tab: 'Reiter',
  term: 'Begriff',
  category: 'Kategorie',
  filter: 'Filter',
  target: 'Ziel',
  kind: 'Art',
  key: 'Schlüssel',
  depth: 'Tiefe in Prozent',
  direction: 'Richtung',
  boundary: 'Fehlerseite',
  step: 'Schritt',
  headliners: 'Mit Headlinern',
  mode: 'Weg',
  lever: 'Hebel',
  outcome: 'Ergebnis',
  block: 'Block',
  dest: 'Führt zu',
  section: 'Stelle',
  menu: 'Menü',
};

/**
 * The blocks an internal link can sit in, in German. Typed by the module's union, so a block added
 * there fails the build here until it has its word.
 */
export const LINK_BLOCK_LABEL: Record<LinkBlock, string> = {
  body: 'Text des Beitrags',
  tags: 'Tags des Beitrags',
  parks: 'Parks im Beitrag',
  rides: 'Fahrgeschäfte im Beitrag',
  posts: 'Beiträge zum Park oder Fahrgeschäft',
  nav: 'Vorheriger, nächster Beitrag',
  related: 'Weiterlesen',
  most_read: 'Meistgelesen',
  nearby: 'Parks in der Nähe',
  favorites: 'Favoriten',
  featured: 'Beliebte Parks',
  header: 'Header',
  menu_sheet: 'Handy-Menü',
  footer: 'Footer',
  breadcrumbs: 'Brotkrumen',
};

/** The marked places of a park page, top to bottom, in German. */
export const SECTION_LABEL: Record<SeenSection, string> = {
  main_end: 'Ende der Fahrgeschäfte bzw. des Kalenders',
  nearby: 'Parks in der Nähe',
  blog: 'Beiträge',
  stats: 'Statistik',
  outlook: 'Jahresausblick',
  faq: 'FAQ',
  end: 'Seitenende',
};

/** The places in the order the page has them. */
export const SEEN_SECTION_ORDER = Object.keys(SECTION_LABEL) as SeenSection[];

/** The header's menus in German. */
export const NAV_MENU_LABEL: Record<NavMenuId, string> = {
  guides: 'Guides',
  news: 'News',
  parks: 'Parks entdecken',
  more: 'Mehr',
  favorites: 'Favoriten',
  sheet: 'Handy-Menü',
};

/** A value's word from one of the three tables above, or the value as sent when it has none. */
function labelFrom(table: Record<string, string>, value: string): string {
  return table[value] ?? value;
}

/**
 * The ways into the planner in German, and `none` for a day begun with the panel shut. Typed by the
 * store's union, so a way in added there fails the build here until it has its word.
 */
const PLANNER_OPENED_SOURCE_LABEL: Record<PlannerOpenedSource | 'none', string> = {
  tab: 'Reiter am Fensterrand',
  header: 'Kalender-Knopf im Header',
  'park-header': '„Tag planen“ im Park-Kopf',
  'calendar-day': 'Tag im Wartezeit-Kalender',
  wizard: 'Assistent',
  'plan-list': 'Tagesliste der Planerseite',
  'shared-link': 'Geteilter Plan',
  'home-hero': '„Heute planen“ auf der Startseite',
  'kids-page': 'Seite „Mit Kindern“',
  assistant: 'Parky, der Chat-Assistent',
  none: 'Planer zu',
};

/** The planner's property values in German, keyed by property, then value. */
const PLANNER_VALUE_LABEL: Record<string, Record<string, string>> = {
  step: { park: 'Park', date: 'Tag', setup: 'Wer kommt mit', headliners: 'Headliner' },
  kind: { ride: 'Fahrgeschäft', show: 'Show', block: 'Eigener Block' },
  source: {
    ...PLANNER_OPENED_SOURCE_LABEL,
    search: 'Suche im Planer',
    add_button: '„Zum Plan“ auf der Fahrgeschäft-Seite',
    drag: 'Ziehen und Ablegen',
    missing_headliners: 'Fehlende Headliner',
    show_picker: 'Show-Auswahl',
    block_menu: 'Eigener Block',
    headliners: '„Alle Headliner“',
    block: 'Kreuz am Block',
    action_bar: 'Aktionsleiste',
    keyboard: 'Entf-Taste',
    timeline: 'Liste ohne Zeitachse',
    optimize: 'Optimieren im Planer',
  },
  mode: { day: '„Tag optimieren“', headliners: '„Alle Headliner“', fit: 'Antwort des Assistenten' },
  lever: {
    drop_block: 'Block weglassen',
    shorten_block: 'Block kürzen',
    drop_all_blocks: 'Alle Blöcke weglassen',
  },
  outcome: { ready: 'Plan', empty: 'Leer', missing: 'Nicht gefunden', failed: 'Fehler' },
  headliners: { true: 'Ja', false: 'Nein' },
};

/** The name of an event property in German; an unknown one stays as sent. */
export function propLabel(prop: string): string {
  return PROP_LABEL[prop] ?? prop;
}

/** How a property's value reads: search fields, result kinds and suggestions get their words. */
export function propValueLabel(prop: string, value: string): string {
  if (prop === 'position') return `Platz ${value}`;
  if (prop === 'surface') return surfaceLabel(value);
  if (prop === 'result') return resultKindLabel(value);
  if (prop === 'item') return browseItemLabel(value);
  if (prop === 'from' || prop === 'to') return localeNames[value as Locale] ?? value;
  if (prop === 'depth') return `${value} %`;
  if (prop === 'block') return labelFrom(LINK_BLOCK_LABEL, value);
  if (prop === 'dest') return pageTypeLabel(value);
  if (prop === 'section') return labelFrom(SECTION_LABEL, value);
  if (prop === 'menu') return labelFrom(NAV_MENU_LABEL, value);
  return PLANNER_VALUE_LABEL[prop]?.[value] ?? value;
}

/**
 * The values of one property in the order they read best: positions first to last, depths shallow
 * to deep and a park page's places top to bottom, everything else as the API sent them, which is
 * biggest first.
 */
export function sortPropValues<Value extends { value: string }>(
  prop: string,
  values: readonly Value[]
): Value[] {
  if (prop === 'depth') return [...values].sort((a, b) => Number(a.value) - Number(b.value));
  if (prop === 'section') {
    const place = (value: string) => {
      const index = (SEEN_SECTION_ORDER as readonly string[]).indexOf(value);
      return index === -1 ? SEEN_SECTION_ORDER.length : index;
    };
    return [...values].sort((a, b) => place(a.value) - place(b.value));
  }
  if (prop !== 'position') return [...values];
  // A bucket of a list position, or the plain number an FAQ question sends.
  const rank = (value: string) => {
    const index = (SEARCH_POSITIONS as readonly string[]).indexOf(value);
    if (index !== -1) return index;
    const number = Number(value);
    return Number.isFinite(number) ? number : Number.MAX_SAFE_INTEGER;
  };
  return [...values].sort((a, b) => rank(a.value) - rank(b.value));
}

/** An entity the API could still resolve: it has a kind, a name and a public address. */
type ResolvedEntity = EventEntity & {
  kind: NonNullable<EventEntity['kind']>;
  name: string;
  url: string;
};

/** Whether an entity still resolves; a retired or deleted one is only an id and a count. */
export function isResolvedEntity(entity: EventEntity): entity is ResolvedEntity {
  return entity.kind !== null && entity.name !== null && entity.url !== null;
}

/** Where to read about an entity on the public site, in German, which is the admin's language. */
export function entityPublicHref(entity: Pick<ResolvedEntity, 'url'>): string {
  return `/de${entity.url}`;
}

/**
 * Where an entity is edited: a park and a ride by id, a show or a restaurant through its park's
 * address, which `/admin/go` resolves to the park that holds it. The API names a show by that
 * address with the park tab as the hash, and `/admin/go` reads a path, so the hash stays behind.
 */
export function entityEditorHref(entity: Pick<ResolvedEntity, 'id' | 'kind' | 'url'>): string {
  if (entity.kind === 'park') return `/admin/parks/${entity.id}`;
  if (entity.kind === 'attraction') return `/admin/attractions/${entity.id}`;
  const [path] = entity.url.split('#');
  return `/admin/go?path=${encodeURIComponent(`/de${path}`)}`;
}

/** "der häufigste" or "die 5 häufigsten", for a hint over a list cut at its biggest entries. */
export function mostCommonLabel(count: number): string {
  return count === 1 ? 'der häufigste' : `die ${formatCount(count)} häufigsten`;
}

/** A referrer value that reads as a host name: labels joined by dots, at least two of them. */
const HOST_PATTERN = /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/;

/**
 * The address a referrer row links to. A referrer is the external host of the first page, or the
 * name of a site the API knows (`google`, `chatgpt`), which is a label and not a host: only a
 * value that looks like a host gets a link.
 */
export function referrerHref(value: string): string | null {
  return HOST_PATTERN.test(value) ? `https://${value}` : null;
}

/** The editor a public path belongs to, for a path that is a park or a ride; `null` for the rest. */
export function pathEditorHref(path: string): string | null {
  const [, , ...segments] = path.split('/');
  const geo = segments[0] === 'parks' ? segments.length : 0;
  return geo === 5 || geo === 6 ? `/admin/go?path=${encodeURIComponent(path)}` : null;
}

// ---------------------------------------------------------------------------------------------
// Event detail and crosstab

/** The dimensions every event can be crossed by, besides its own properties. */
export const CROSSTAB_FIXED = [
  'page_type',
  'device',
  'locale',
  'day',
  'path',
  'country',
  'browser',
  'os',
] as const;

/** The title of a crosstab dimension: a fixed one by its word, `prop:<key>` by the property's. */
export function crosstabLabel(dim: string): string {
  switch (dim) {
    case 'page_type':
      return 'Seitenart';
    case 'device':
      return 'Gerät';
    case 'locale':
      return 'Sprache';
    case 'day':
      return 'Tag';
    case 'exit':
      return 'Ausstieg';
    default:
      if (dim.startsWith('prop:')) return propLabel(dim.slice(5));
      return isFilterDimension(dim) ? DIMENSION_LABEL[dim] : dim;
  }
}

/** How often each value of one property of an event came up; nothing for a property never sent. */
export function propValues(
  detail: Pick<EventDetailResponse, 'props'>,
  prop: string
): { value: string; count: number }[] {
  return detail.props.find((entry) => entry.prop === prop)?.values ?? [];
}

/** The count of one value of an event's property, 0 when it is not among the values listed. */
export function propCount(
  detail: Pick<EventDetailResponse, 'props'>,
  prop: string,
  value: string
): number {
  return propValues(detail, prop).find((entry) => entry.value === value)?.count ?? 0;
}

/** The dimensions an event can be crossed by: each property key it was sent with, then the fixed ones. */
export function crosstabDimensions(detail: Pick<EventDetailResponse, 'props'>): string[] {
  return [...detail.props.map((entry) => `prop:${entry.prop}`), ...CROSSTAB_FIXED];
}

/**
 * The pair the crosstab opens on: the first property against the page type, the page type against
 * the device for an event without properties.
 */
export function defaultCrosstab(detail: Pick<EventDetailResponse, 'props'>): {
  row: string;
  col: string;
} {
  const first = detail.props[0];
  return first
    ? { row: `prop:${first.prop}`, col: 'page_type' }
    : { row: 'page_type', col: 'device' };
}

/**
 * What the API puts in the place of the values past the 30 biggest of a crosstab side. It is a
 * value nothing real can be: `other` is a real page type.
 */
const CROSSTAB_REST = '__rest__';

/** What the API puts where a crosstab dimension has no value. */
const CROSSTAB_NONE = '(none)';

/**
 * How a value of a crosstab dimension reads: the remainder is `Übrige`, an empty value `Keine
 * Angabe`, a day or a period by the step of the answer.
 */
export function crosstabValueLabel(
  dim: string,
  value: string,
  interval: SeriesInterval = 'day'
): string {
  if (value === CROSSTAB_REST) return 'Übrige';
  if (value === CROSSTAB_NONE) return 'Keine Angabe';
  switch (dim) {
    case 'page_type':
      return pageTypeLabel(value);
    case 'device':
      return DEVICE_LABEL[value] ?? value;
    case 'locale':
      return localeNames[value as Locale] ?? value;
    case 'day':
      return formatPeriodLong(value, interval);
    default:
      if (dim.startsWith('prop:')) return propValueLabel(dim.slice(5), value);
      return dim === 'exit' || isFilterDimension(dim)
        ? breakdownValueLabel(dim as BreakdownDimension, value)
        : value;
  }
}

/** What the traffic crosstab counts: page views, or visits (by where they began and ended). */
export type CrosstabMetric = 'pageviews' | 'visits';

/** The dimensions of the page views, which every page view has. */
const PAGE_CROSSTAB_DIMENSIONS = [
  'day',
  'path',
  'page_type',
  'device',
  'browser',
  'os',
  'country',
  'locale',
  'browser_language',
] as const;

/**
 * The dimensions the traffic crosstab can cross for a metric. Visits add the ones only a visit has
 * (entry, exit, referrer, channel); their device, system and country are those of the
 * visit's first page.
 */
export function trafficCrosstabDimensions(metric: CrosstabMetric): string[] {
  return metric === 'visits'
    ? [...PAGE_CROSSTAB_DIMENSIONS, 'entry', 'exit', 'referrer', 'channel']
    : [...PAGE_CROSSTAB_DIMENSIONS];
}

/** The pairs the traffic crosstab offers as shortcuts, each with the metric that has its dimensions. */
export const TRAFFIC_CROSSTAB_PRESETS: readonly {
  label: string;
  metric: CrosstabMetric;
  row: string;
  col: string;
}[] = [
  { label: 'System × Gerät', metric: 'pageviews', row: 'os', col: 'device' },
  { label: 'Browser × System', metric: 'pageviews', row: 'browser', col: 'os' },
  {
    label: 'Sprache × Browsersprache',
    metric: 'pageviews',
    row: 'locale',
    col: 'browser_language',
  },
  { label: 'Kanal × Land', metric: 'visits', row: 'channel', col: 'country' },
  { label: 'Einstieg × Ausstieg', metric: 'visits', row: 'entry', col: 'exit' },
];

/** The count of a pair of keys, over a list of `{row, col, count}` cells that may repeat a pair. */
function cellLookup(cells: readonly { row: string; col: string; count: number }[]) {
  const lookup = new Map<string, number>();
  for (const cell of cells) {
    const key = `${cell.row}\u0000${cell.col}`;
    lookup.set(key, (lookup.get(key) ?? 0) + cell.count);
  }
  return (row: string, col: string) => lookup.get(`${row}\u0000${col}`) ?? 0;
}

/** A matrix of counts: rows with their cells in column order, the row sums and the biggest cell. */
interface CountMatrix {
  columns: readonly string[];
  rows: { key: string; cells: number[]; total: number }[];
  /** The biggest single cell, which scales the shading. */
  max: number;
  /** The column sums. */
  columnTotals: number[];
}

/**
 * Pivots `{row, column, value}` cells into a matrix over the given rows and columns, rows without
 * any count dropped so a page type nobody searched from does not take a line.
 */
export function countMatrix(
  cells: readonly { row: string; column: string; value: number }[],
  rows: readonly string[],
  columns: readonly string[]
): CountMatrix {
  const lookup = cellLookup(
    cells.map((cell) => ({ row: cell.row, col: cell.column, count: cell.value }))
  );
  const built = rows
    .map((key) => {
      const row = columns.map((column) => lookup(key, column));
      return { key, cells: row, total: sum(row) };
    })
    .filter((row) => row.total > 0);
  return {
    columns,
    rows: built,
    max: Math.max(0, ...built.flatMap((row) => row.cells)),
    columnTotals: columns.map((_, index) => sum(built.map((row) => row.cells[index]))),
  };
}

/** The crosstab answer as a matrix in the order the API sent its rows and columns. */
export function crosstabMatrix(crosstab: CrosstabResponse): CountMatrix {
  const lookup = cellLookup(crosstab.cells);
  const rows = crosstab.rows.map((key) => {
    const cells = crosstab.cols.map((col) => lookup(key, col));
    return { key, cells, total: sum(cells) };
  });
  return {
    columns: crosstab.cols,
    rows,
    max: Math.max(0, ...rows.flatMap((row) => row.cells)),
    columnTotals: crosstab.cols.map((_, index) => sum(rows.map((row) => row.cells[index]))),
  };
}

/** The matrix without the columns nobody counted in, for a table with little room. */
export function withoutEmptyColumns(matrix: CountMatrix): CountMatrix {
  const keep = matrix.columnTotals.map((total) => total > 0);
  return {
    columns: matrix.columns.filter((_, index) => keep[index]),
    rows: matrix.rows.map((row) => ({
      ...row,
      cells: row.cells.filter((_, index) => keep[index]),
    })),
    max: matrix.max,
    columnTotals: matrix.columnTotals.filter((_, index) => keep[index]),
  };
}

/**
 * The keys of a list: the known ones that turned up first in their own order (all of them with
 * `keepAllKnown`, for a short fixed list such as the device classes), then any other that turned
 * up, biggest first, so a value the site sends tomorrow is a row and not a gap.
 */
export function orderKeys(
  known: readonly string[],
  seen: readonly { key: string; count: number }[],
  keepAllKnown = false
): string[] {
  const totals = new Map<string, number>();
  for (const { key, count } of seen) totals.set(key, (totals.get(key) ?? 0) + count);
  const unknown = [...totals.keys()]
    .filter((key) => !known.includes(key))
    .sort((a, b) => (totals.get(b) ?? 0) - (totals.get(a) ?? 0));
  return [...known.filter((key) => keepAllKnown || totals.has(key)), ...unknown];
}

// ---------------------------------------------------------------------------------------------
// Ways through the site

/** The page types whose pages carry the marks of `section_seen`, in the order a table lists them. */
const MARKED_PAGE_TYPES = ['park', 'park_calendar', 'park_chapter'];

/** A place of a park page and, per page type, the views that reached it and their share. */
export interface SectionReachRow {
  section: string;
  /** One per column of {@link SectionReach.pageTypes}; `share` is null without a view to divide by. */
  cells: { reached: number; share: number | null }[];
}

/** How far down each kind of park page was read. */
export interface SectionReach {
  pageTypes: string[];
  /** The page views of each page type, in the order of `pageTypes`. */
  views: number[];
  rows: SectionReachRow[];
}

/**
 * How far down the park pages were read: `section_seen` by place and page type (a crosstab of
 * `prop:section` against `page_type`) over each page type's views (a breakdown by page type),
 * every known place top to bottom, so a place nobody reached reads 0. A page type is a column
 * once it has a view or a place reached. A share is at most 1, since a view reports a place once.
 */
export function sectionReach(
  crosstab: Pick<CrosstabResponse, 'rows' | 'cols' | 'cells'>,
  breakdown: Pick<BreakdownResponse, 'items'>
): SectionReach {
  const lookup = cellLookup(crosstab.cells);
  const viewsOf = (type: string) => breakdown.items.find((item) => item.value === type)?.views ?? 0;
  const pageTypes = MARKED_PAGE_TYPES.filter(
    (type) => viewsOf(type) > 0 || crosstab.cols.includes(type)
  );
  const views = pageTypes.map(viewsOf);
  const seen = crosstab.rows
    .filter((row) => row !== CROSSTAB_REST && row !== CROSSTAB_NONE)
    .map((key) => ({
      key,
      count: crosstab.cols.reduce((total, col) => total + lookup(key, col), 0),
    }));
  return {
    pageTypes,
    views,
    rows: orderKeys(SEEN_SECTION_ORDER, seen, true).map((section) => ({
      section,
      cells: pageTypes.map((type, index) => {
        const reached = lookup(section, type);
        return { reached, share: views[index] > 0 ? Math.min(1, reached / views[index]) : null };
      }),
    })),
  };
}

// ---------------------------------------------------------------------------------------------
// Search

/** One search field's row of the comparison, with its place and its share of all openings. */
interface SurfaceRow {
  surface: string;
  opened: number;
  typed: number;
  resultClicks: number;
  browseClicks: number;
  noResults: number;
  viewAll: number;
  clickRate: number;
  noResultRate: number;
  /** Share of all openings across the fields, 0..1. */
  openedShare: number;
}

/** The surfaces ranked by openings, ties in the order of {@link SEARCH_SURFACES}. */
export function surfaceRows(search: SearchOverview): SurfaceRow[] {
  const total = sum(search.surfaces.map((row) => row.opened));
  const rank = (surface: string) => {
    const index = SEARCH_SURFACES.indexOf(surface);
    return index === -1 ? SEARCH_SURFACES.length : index;
  };
  return search.surfaces
    .map((row) => ({ ...row, openedShare: total > 0 ? row.opened / total : 0 }))
    .sort((a, b) => b.opened - a.opened || rank(a.surface) - rank(b.surface));
}

/** The search fields of an answer in the order every chart and matrix keeps. */
export function surfaceOrder(search: SearchOverview): string[] {
  return orderKeys(
    SEARCH_SURFACES,
    search.surfaces.map((row) => ({ key: row.surface, count: row.opened }))
  );
}

/** The answer to „Hero oder Header?“: which of the two is opened more, and by how much. */
interface HeroOrHeader {
  hero: number;
  header: number;
  /** `null` while either has no openings. */
  leader: 'hero' | 'header' | null;
  /** The leader's openings over the other's, `null` without a leader or a divisor. */
  ratio: number | null;
}

/** Compares the two fields the owner asked about. */
export function heroOrHeader(search: SearchOverview): HeroOrHeader {
  const opened = (surface: string) =>
    search.surfaces.find((row) => row.surface === surface)?.opened ?? 0;
  const hero = opened('hero');
  const header = opened('header');
  if (hero === 0 && header === 0) return { hero, header, leader: null, ratio: null };
  const leader = hero === header ? null : hero > header ? 'hero' : 'header';
  const low = Math.min(hero, header);
  return {
    hero,
    header,
    leader,
    ratio: leader && low > 0 ? Math.max(hero, header) / low : null,
  };
}

/** Page type by search field: where each field is opened. Rows are the page types found. */
export function surfacePageTypeMatrix(search: SearchOverview): CountMatrix {
  const rows = orderKeys(
    PAGE_TYPES,
    search.bySurfaceAndPageType.map((cell) => ({ key: cell.pageType, count: cell.opened }))
  );
  return countMatrix(
    search.bySurfaceAndPageType.map((cell) => ({
      row: cell.pageType,
      column: cell.surface,
      value: cell.opened,
    })),
    rows,
    surfaceOrder(search)
  );
}

/** Result kind by search field: where which kind of result is opened. */
export function resultTypeMatrix(search: SearchOverview): CountMatrix {
  const rows = orderKeys(
    RESULT_KINDS,
    search.resultTypes.map((cell) => ({ key: cell.result, count: cell.clicks }))
  );
  return countMatrix(
    search.resultTypes.map((cell) => ({
      row: cell.result,
      column: cell.surface,
      value: cell.clicks,
    })),
    rows,
    surfaceOrder(search)
  );
}

/** Suggestion kind by search field: what is picked from the list shown before anything is typed. */
export function browseItemMatrix(search: SearchOverview): CountMatrix {
  const rows = orderKeys(
    BROWSE_ITEMS,
    search.browseItems.map((cell) => ({ key: cell.item, count: cell.clicks }))
  );
  return countMatrix(
    search.browseItems.map((cell) => ({
      row: cell.item,
      column: cell.surface,
      value: cell.clicks,
    })),
    rows,
    surfaceOrder(search)
  );
}

/** Search field by device class: how many openings came from a phone, a tablet and a computer. */
export function surfaceDeviceMatrix(search: SearchOverview): CountMatrix {
  const columns = orderKeys(
    DEVICES,
    search.bySurfaceAndDevice.map((cell) => ({ key: cell.device, count: cell.opened })),
    true
  );
  return countMatrix(
    search.bySurfaceAndDevice.map((cell) => ({
      row: cell.surface,
      column: cell.device,
      value: cell.opened,
    })),
    surfaceOrder(search),
    columns
  );
}

/** Click positions in order, a bucket nobody clicked kept at 0 so the shape of the list shows. */
export function positionRows(search: SearchOverview): { position: string; clicks: number }[] {
  return SEARCH_POSITIONS.map((position) => ({
    position,
    clicks: search.positions.find((row) => row.position === position)?.clicks ?? 0,
  }));
}

/** The daily openings of each field as one value list per field, over the days given. */
export function surfaceSeries(
  search: SearchOverview,
  days: readonly string[]
): Record<string, number[]> {
  const byKey = new Map<string, number>();
  for (const point of search.series) byKey.set(`${point.surface}\u0000${point.day}`, point.opened);
  return Object.fromEntries(
    surfaceOrder(search).map((surface) => [
      surface,
      days.map((day) => byKey.get(`${surface}\u0000${day}`) ?? 0),
    ])
  );
}

/** Which of the given periods the window cut off, by the `partial` flag of the series points. */
export function seriesPartial(search: SearchOverview, days: readonly string[]): boolean[] {
  const cut = new Set(search.series.filter((point) => point.partial).map((point) => point.day));
  return days.map((day) => cut.has(day));
}

/** The periods of the search series, oldest first. */
export function seriesDays(search: SearchOverview): string[] {
  return [...new Set(search.series.map((point) => point.day))].sort();
}

// ---------------------------------------------------------------------------------------------
// Planner

/** The planner funnel's stages in German, for its tiles and its series alike. */
export const PLANNER_STAGE_LABEL = {
  opened: 'Geöffnet',
  started: 'Plan begonnen',
  optimized: 'Optimiert',
  shared: 'Geteilt',
} as const;

/** The wizard's steps in the order it shows them. */
const PLANNER_WIZARD_STEPS = Object.keys(PLANNER_VALUE_LABEL.step);

/** What a planner block can be, in the order a matrix shows them. */
const PLANNER_ITEM_KINDS = Object.keys(PLANNER_VALUE_LABEL.kind);

/** A row of the wizard's steps: a step, or `finished` for its last press. */
interface PlannerWizardRow {
  key: string;
  count: number;
  /** Against the step most openings reached, 0..1. */
  reach: number;
}

/**
 * The wizard's steps in its order, a step nobody reached kept at 0, then its finish. The reach is
 * measured against the busiest step rather than the first, because a wizard started on a park page
 * skips the park step.
 */
export function plannerWizardRows(planner: PlannerOverview): PlannerWizardRow[] {
  const steps = orderKeys(
    PLANNER_WIZARD_STEPS,
    planner.wizardSteps.map((row) => ({ key: row.value, count: row.count })),
    true
  );
  const rows = [
    ...steps.map((key) => ({
      key,
      count: planner.wizardSteps.find((row) => row.value === key)?.count ?? 0,
    })),
    { key: 'finished', count: planner.wizardFinished },
  ];
  const base = Math.max(0, ...rows.map((row) => row.count));
  return rows.map((row) => ({ ...row, reach: base > 0 ? row.count / base : 0 }));
}

/** The blocks put into or taken out of a plan: the control by the kind of block. */
export function plannerItemMatrix(
  planner: PlannerOverview,
  action: PlannerOverview['items'][number]['action']
): CountMatrix {
  const cells = planner.items.filter((item) => item.action === action);
  return countMatrix(
    cells.map((item) => ({ row: item.source, column: item.kind, value: item.count })),
    orderKeys(
      [],
      cells.map((item) => ({ key: item.source, count: item.count }))
    ),
    orderKeys(
      PLANNER_ITEM_KINDS,
      cells.map((item) => ({ key: item.kind, count: item.count })),
      true
    )
  );
}

/** Page type by device class: where the planner is opened from, and on what. */
export function plannerPageTypeMatrix(planner: PlannerOverview): CountMatrix {
  const cells = planner.byPageTypeAndDevice;
  return countMatrix(
    cells.map((cell) => ({ row: cell.pageType, column: cell.device, value: cell.opened })),
    orderKeys(
      PAGE_TYPES,
      cells.map((cell) => ({ key: cell.pageType, count: cell.opened }))
    ),
    orderKeys(
      DEVICES,
      cells.map((cell) => ({ key: cell.device, count: cell.opened })),
      true
    )
  );
}

// ---------------------------------------------------------------------------------------------
// SEO

/** The change in visits as a signed figure: `+12`, `−8`, `±0`. */
export function formatChange(change: number): string {
  if (change === 0) return '±0';
  return `${change > 0 ? '+' : '−'}${formatCount(Math.abs(change))}`;
}
