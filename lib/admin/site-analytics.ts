import { locales, localeNames, type Locale } from '@/i18n/config';
import type {
  SearchBrowseItem,
  SearchResultKind,
  SearchSurface,
  SiteEventName,
  SitePageType,
} from '@/lib/analytics/site-analytics';
import type {
  AnalyticsTotals,
  BreakdownDimension,
  EventEntity,
  SearchOverview,
} from '@/lib/api/admin-site-analytics';

/**
 * The pure half of the traffic dashboards (`app/admin/traffic`): the windows and filters a URL can
 * ask for, the change against the window before, the words for every closed list the API
 * answers in, and the shapes the tables and the matrix are drawn from. Kept apart from the
 * pages so it can be tested.
 */

/** A window the dashboards offer, in UTC days with today included. */
export const TRAFFIC_RANGES = [
  { days: 1, label: 'Heute' },
  { days: 7, label: '7 Tage' },
  { days: 30, label: '30 Tage' },
  { days: 90, label: '90 Tage' },
  { days: 365, label: '365 Tage' },
] as const;

/** One of the {@link TRAFFIC_RANGES}. */
export type TrafficDays = (typeof TRAFFIC_RANGES)[number]['days'];

/** The window shown when the URL names none. */
export const DEFAULT_TRAFFIC_DAYS: TrafficDays = 30;

/** The window a `days` query value names; anything else falls back to 30 days. */
export function parseTrafficDays(raw: string | null | undefined): TrafficDays {
  const days = Number(raw);
  return TRAFFIC_RANGES.find((range) => range.days === days)?.days ?? DEFAULT_TRAFFIC_DAYS;
}

/** The language a `locale` query value names, `null` for all of them or for junk. */
export function parseTrafficLocale(raw: string | null | undefined): Locale | null {
  return (locales as readonly string[]).includes(raw ?? '') ? (raw as Locale) : null;
}

/** German first, then the rest: most of the traffic, and the admin's own language. */
export const TRAFFIC_LOCALES: readonly Locale[] = [
  'de',
  ...locales.filter((locale) => locale !== 'de'),
];

/** The query string both ends read, `days=30&locale=de`; `extra` is appended as given. */
export function trafficQuery(
  filters: { days: number; locale: Locale | null },
  extra: Record<string, string | number> = {}
): string {
  const params = new URLSearchParams({ days: String(filters.days) });
  if (filters.locale) params.set('locale', filters.locale);
  for (const [key, value] of Object.entries(extra)) params.set(key, String(value));
  return params.toString();
}

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

/** Whether a window holds any traffic at all, so an empty one can say so instead of drawing zeros. */
export function hasTraffic(totals: AnalyticsTotals): boolean {
  return totals.pageviews > 0 || totals.events > 0 || totals.visits > 0;
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

/** A float with one decimal, `2,4`. */
export function formatDecimal(value: number): string {
  return oneDecimal.format(value);
}

/** A 0..1 share as a percentage: `42 %`, `4,2 %` under ten, `< 0,1 %` for a trace, `–` for none. */
export function formatShare(share: number): string {
  if (share <= 0) return '–';
  const percent = share * 100;
  if (percent < 0.1) return '< 0,1 %';
  return `${percent < 10 ? oneDecimal.format(percent) : number.format(Math.round(percent))} %`;
}

/** A day (`2026-10-28`) as `28.10.`, for an axis. */
export function formatAxisDay(day: string): string {
  const [, month, date] = day.split('-');
  return `${date}.${month}.`;
}

/** A day as `Mi 28.10.2026`, for a tooltip. */
export function formatLongDay(day: string): string {
  const parsed = new Date(`${day}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return day;
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}

// ---------------------------------------------------------------------------------------------
// Words for the closed lists

/** The German name of a page type. */
export const PAGE_TYPE_LABEL: Record<SitePageType, string> = {
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

/** Every page type in the order the matrix lists them: the pages people search from first. */
export const PAGE_TYPES = Object.keys(PAGE_TYPE_LABEL) as SitePageType[];

/** The window width classes, narrowest first. */
export const VIEWPORTS = ['mobile', 'tablet', 'desktop'] as const;

/** The German name of a window width class, with the pixel limit. */
export const VIEWPORT_LABEL: Record<(typeof VIEWPORTS)[number], string> = {
  mobile: 'Telefon (unter 768 px)',
  tablet: 'Tablet (768 bis 1023 px)',
  desktop: 'Computer (ab 1024 px)',
};

/** The German name of a search field. */
export const SURFACE_LABEL: Record<SearchSurface, string> = {
  hero: 'Hero (Startseite)',
  header: 'Header',
  keyboard: 'Tastenkürzel (⌘K)',
  search_page: 'Suchseite',
  listing_guides: 'Guide-Liste',
  listing_news: 'News-Liste',
  guides_panel: 'Guides-Menü',
};

/** The search fields in the order they are compared: the two the question is about first. */
export const SEARCH_SURFACES = Object.keys(SURFACE_LABEL) as SearchSurface[];

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

/** The result kinds in the order a column list shows them. */
export const RESULT_KINDS = Object.keys(RESULT_KIND_LABEL) as SearchResultKind[];

/** What was picked from the list a search field shows before anything is typed. */
export const BROWSE_ITEM_LABEL: Record<SearchBrowseItem, string> = {
  nearby_park: 'Park in der Nähe',
  in_park_ride: 'Fahrgeschäft im Park',
  popular_park: 'Beliebter Park',
  news: 'News',
  guide: 'Guide',
};

/** The suggestion kinds in the order a list shows them. */
export const BROWSE_ITEMS = Object.keys(BROWSE_ITEM_LABEL) as SearchBrowseItem[];

/** The result positions, first to last. */
export const SEARCH_POSITIONS = ['1', '2', '3', '4-5', '6-10', '11+'] as const;

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

/** How a value of a breakdown dimension reads in a list; a value this build has no word for stays as is. */
export function breakdownValueLabel(dim: BreakdownDimension, value: string): string {
  switch (dim) {
    case 'page_type':
      return PAGE_TYPE_LABEL[value as SitePageType] ?? value;
    case 'viewport':
      return VIEWPORT_LABEL[value as (typeof VIEWPORTS)[number]] ?? value;
    case 'browser':
      return BROWSER_LABEL[value] ?? value;
    case 'os':
      return OS_LABEL[value] ?? value;
    case 'country':
      return countryName(value);
    case 'locale':
      return localeNames[value as Locale] ?? value;
    default:
      return value;
  }
}

/** The title and the one-line question of each breakdown panel. */
export const BREAKDOWN_PANELS: Record<BreakdownDimension, { title: string; hint: string }> = {
  path: { title: 'Seiten', hint: 'Meistbesuchte Adressen' },
  entry: { title: 'Einstiegsseiten', hint: 'Womit ein Besuch beginnt' },
  referrer: { title: 'Herkunft', hint: 'Website oder utm_source beim ersten Aufruf' },
  page_type: { title: 'Seitenarten', hint: 'Wofür die Aufrufe gebraucht werden' },
  country: { title: 'Länder', hint: 'Aus der Adresse des Besuchers abgeleitet' },
  locale: { title: 'Sprachen', hint: 'Ein Klick filtert die ganze Seite' },
  viewport: { title: 'Gerätegröße', hint: 'Fensterbreite beim Aufruf' },
  browser: { title: 'Browser', hint: 'Familie, aus dem User-Agent abgeleitet' },
  os: { title: 'Betriebssysteme', hint: 'Familie, aus dem User-Agent abgeleitet' },
};

// ---------------------------------------------------------------------------------------------
// Events

/** What an event is called in the admin and when it fires. */
export interface EventInfo {
  label: string;
  when: string;
}

/**
 * Every event of the API's schema in German, with the moment it fires. The type makes a new event
 * in the facade fail the build here until it has a line, so the table never shows a bare name
 * without saying what it counts.
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
    label: 'Alle Treffer',
    when: 'Der Knopf „Alle Treffer“ führt von der Suche auf die Suchseite.',
  },
  favorite_add: { label: 'Favorit gesetzt', when: 'Ein Stern wird eingeschaltet.' },
  favorite_remove: { label: 'Favorit entfernt', when: 'Ein Stern wird ausgeschaltet.' },
  nearby_permission: {
    label: 'Standortfreigabe',
    when: 'Der Browser liefert eine Position (erteilt) oder die Freigabe wird jetzt verweigert.',
  },
  nearby_parks_loaded: {
    label: 'Parks in der Nähe geladen',
    when: 'Beim Laden: jede neue Antwort der Nähe-Suche, im Park mit dessen UUID.',
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
  glossary_searched: {
    label: 'Glossar durchsucht',
    when: 'Die Glossarsuche hält drei Zeichen und ist zur Ruhe gekommen.',
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
  planner_opened: {
    label: 'Planer geöffnet',
    when: 'Der Planer-Bereich geht von zu auf offen; mit dem Weg hinein.',
  },
  plan_day_started: {
    label: 'Plan begonnen',
    when: 'Ein Park und Tag bekommen den ersten Block, egal wie.',
  },
  plan_optimized: {
    label: 'Plan optimiert',
    when: 'Der Planer sortiert den Tag und der Plan hat sich geändert.',
  },
  planner_closed_empty: {
    label: 'Planer leer geschlossen',
    when: 'Der Bereich schließt, ohne dass ein Tag einen ersten Block bekam.',
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
  compass_pill_clicked: {
    label: 'Kompass-Knopf',
    when: 'Der Knopf „Zum Kompass“ im Hero.',
  },
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
  share_clicked: { label: 'Teilen gedrückt', when: 'Der Knopf zum Teilen wird gedrückt.' },
};

/** The label of an event, or its bare name for one an older build does not know. */
export function eventLabel(name: string): string {
  return EVENT_INFO[name as SiteEventName]?.label ?? name;
}

/** Whether an event belongs to the search dashboard. */
export function isSearchEvent(name: string): boolean {
  return name.startsWith('search_');
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
};

/** The name of an event property in German; an unknown one stays as sent. */
export function propLabel(prop: string): string {
  return PROP_LABEL[prop] ?? prop;
}

/** How a property's value reads: search fields, result kinds and suggestions get their words. */
export function propValueLabel(prop: string, value: string): string {
  if (prop === 'position') return `Platz ${value}`;
  if (prop === 'surface') return SURFACE_LABEL[value as SearchSurface] ?? value;
  if (prop === 'result') return RESULT_KIND_LABEL[value as SearchResultKind] ?? value;
  if (prop === 'item') return BROWSE_ITEM_LABEL[value as SearchBrowseItem] ?? value;
  if (prop === 'from' || prop === 'to') return localeNames[value as Locale] ?? value;
  return value;
}

/**
 * The values of one property in the order they read best: positions first to last, everything
 * else as the API sent them, which is biggest first.
 */
export function sortPropValues<Value extends { value: string }>(
  prop: string,
  values: readonly Value[]
): Value[] {
  if (prop !== 'position') return [...values];
  const rank = (value: string) => {
    const index = (SEARCH_POSITIONS as readonly string[]).indexOf(value);
    return index === -1 ? SEARCH_POSITIONS.length : index;
  };
  return [...values].sort((a, b) => rank(a.value) - rank(b.value));
}

/** Where to read about an entity on the public site, in German, which is the admin's language. */
export function entityPublicHref(entity: Pick<EventEntity, 'url'>): string {
  return `/de${entity.url}`;
}

/**
 * Where an entity is edited: a park and a ride by id, a show through its public address, which
 * `/admin/go` resolves to the park that holds it.
 */
export function entityEditorHref(entity: Pick<EventEntity, 'id' | 'kind' | 'url'>): string {
  if (entity.kind === 'park') return `/admin/parks/${entity.id}`;
  if (entity.kind === 'attraction') return `/admin/attractions/${entity.id}`;
  return `/admin/go?path=${encodeURIComponent(`/de${entity.url}`)}`;
}

/** The editor a public path belongs to, for a path that is a park or a ride; `null` for the rest. */
export function pathEditorHref(path: string): string | null {
  const [, , ...segments] = path.split('/');
  const geo = segments[0] === 'parks' ? segments.length : 0;
  return geo === 5 || geo === 6 ? `/admin/go?path=${encodeURIComponent(path)}` : null;
}

// ---------------------------------------------------------------------------------------------
// Search

/** One search field's row of the comparison, with its place and its share of all openings. */
export interface SurfaceRow {
  surface: SearchSurface;
  opened: number;
  typed: number;
  resultClicks: number;
  browseClicks: number;
  noResults: number;
  viewAll: number;
  clickRate: number;
  noResultRate: number;
  /** Share of all openings across the seven fields, 0..1. */
  openedShare: number;
}

/** The surfaces ranked by openings, ties in the order of {@link SEARCH_SURFACES}. */
export function surfaceRows(search: SearchOverview): SurfaceRow[] {
  const total = search.surfaces.reduce((sum, row) => sum + row.opened, 0);
  return search.surfaces
    .map((row) => ({ ...row, openedShare: total > 0 ? row.opened / total : 0 }))
    .sort(
      (a, b) =>
        b.opened - a.opened ||
        SEARCH_SURFACES.indexOf(a.surface) - SEARCH_SURFACES.indexOf(b.surface)
    );
}

/** The answer to „Hero oder Header?“: which of the two is opened more, and by how much. */
export interface HeroOrHeader {
  hero: number;
  header: number;
  /** `null` while either has no openings. */
  leader: 'hero' | 'header' | null;
  /** The leader's openings over the other's, `null` without a leader or a divisor. */
  ratio: number | null;
}

/** Compares the two fields the owner asked about. */
export function heroOrHeader(search: SearchOverview): HeroOrHeader {
  const opened = (surface: SearchSurface) =>
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

/** A matrix of counts: rows with their cells in column order, the row sums and the biggest cell. */
export interface CountMatrix<Row extends string, Column extends string> {
  columns: readonly Column[];
  rows: { key: Row; cells: number[]; total: number }[];
  /** The biggest single cell, which scales the shading. */
  max: number;
  /** The column sums. */
  columnTotals: number[];
}

/**
 * Pivots `{row, column, value}` cells into a matrix over the given rows and columns, rows without
 * any count dropped so a page type nobody searched from does not take a line.
 */
export function countMatrix<Row extends string, Column extends string>(
  cells: readonly { row: Row; column: Column; value: number }[],
  rows: readonly Row[],
  columns: readonly Column[]
): CountMatrix<Row, Column> {
  const lookup = new Map<string, number>();
  for (const cell of cells) {
    const key = `${cell.row}\u0000${cell.column}`;
    lookup.set(key, (lookup.get(key) ?? 0) + cell.value);
  }
  const built = rows
    .map((key) => {
      const row = columns.map((column) => lookup.get(`${key}\u0000${column}`) ?? 0);
      return { key, cells: row, total: row.reduce((sum, value) => sum + value, 0) };
    })
    .filter((row) => row.total > 0);
  return {
    columns,
    rows: built,
    max: Math.max(0, ...built.flatMap((row) => row.cells)),
    columnTotals: columns.map((_, index) => built.reduce((sum, row) => sum + row.cells[index], 0)),
  };
}

/** The matrix without the columns nobody counted in, for a table with little room. */
export function withoutEmptyColumns<Row extends string, Column extends string>(
  matrix: CountMatrix<Row, Column>
): CountMatrix<Row, Column> {
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

/** Surface by page type, from the API's flat list. */
export function surfacePageTypeMatrix(search: SearchOverview) {
  return countMatrix(
    search.bySurfaceAndPageType.map((cell) => ({
      row: cell.pageType,
      column: cell.surface,
      value: cell.opened,
    })),
    PAGE_TYPES,
    SEARCH_SURFACES
  );
}

/** Result kind by surface: where which kind of result is opened. */
export function resultTypeMatrix(search: SearchOverview) {
  return countMatrix(
    search.resultTypes.map((cell) => ({
      row: cell.result,
      column: cell.surface,
      value: cell.clicks,
    })),
    RESULT_KINDS,
    SEARCH_SURFACES
  );
}

/** Suggestion kind by surface: what is picked from the list shown before anything is typed. */
export function browseItemMatrix(search: SearchOverview) {
  return countMatrix(
    search.browseItems.map((cell) => ({
      row: cell.item,
      column: cell.surface,
      value: cell.clicks,
    })),
    BROWSE_ITEMS,
    SEARCH_SURFACES
  );
}

/** Surface by viewport class: how many openings came from a phone, a tablet and a computer. */
export function surfaceViewportMatrix(search: SearchOverview) {
  return countMatrix(
    search.bySurfaceAndViewport.map((cell) => ({
      row: cell.surface,
      column: cell.viewport,
      value: cell.opened,
    })),
    SEARCH_SURFACES,
    VIEWPORTS
  );
}

/** Click positions in order, a bucket nobody clicked kept at 0 so the shape of the list shows. */
export function positionRows(search: SearchOverview): { position: string; clicks: number }[] {
  return SEARCH_POSITIONS.map((position) => ({
    position,
    clicks: search.positions.find((row) => row.position === position)?.clicks ?? 0,
  }));
}

/** The daily openings of each surface as one value list per surface, over the days given. */
export function surfaceSeries(
  search: SearchOverview,
  days: readonly string[]
): Record<SearchSurface, number[]> {
  const byKey = new Map<string, number>();
  for (const point of search.series) byKey.set(`${point.surface}\u0000${point.day}`, point.opened);
  return Object.fromEntries(
    SEARCH_SURFACES.map((surface) => [
      surface,
      days.map((day) => byKey.get(`${surface}\u0000${day}`) ?? 0),
    ])
  ) as Record<SearchSurface, number[]>;
}

/** The distinct days of a series, in order. */
export function seriesDays(search: SearchOverview): string[] {
  return [...new Set(search.series.map((point) => point.day))].sort();
}

/** The sum of a list of numbers. */
export function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
