/**
 * The ticket catalog of a trip region as `/admin/tickets` edits it: every product the trip planner
 * computes with, its rules, its purchase links and the research behind it. The backend
 * owns it (`/v1/admin/content/regions/:region/tickets`, the API's
 * docs/frontend/trip-regions.md#editing-the-catalog); this module holds what the page and its form
 * share, pure so `pnpm test:admin-tickets` can pin it.
 */
import { locales, type Locale } from '@/i18n/config';
import type { SiteEventMap } from '@/lib/analytics/site-analytics';
import type { CrosstabResponse } from '@/lib/api/admin-site-analytics';
import { hostProp, sellerProp } from '@/lib/trip-regions/plan-analytics';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { CROSSTAB_REST } from './site-analytics';

/**
 * Where a product or a link is sold: `us` the operators' own shops, `uk` shops in the UK and
 * Ireland, `intl` sellers elsewhere. The planner shows it as a label and filters nothing by it.
 */
export type TicketMarket = 'us' | 'uk' | 'intl';

/** The markets in the order the form lists them. */
export const TICKET_MARKETS: readonly TicketMarket[] = ['us', 'uk', 'intl'];

/** What each market is called in the admin. */
export const TICKET_MARKET_LABELS: Record<TicketMarket, string> = {
  us: 'US-Shops',
  uk: 'UK-Shops',
  intl: 'Händler im Ausland',
};

/** The site languages a link can be limited to: the site's own six. */
export const TICKET_LOCALES: readonly Locale[] = locales;

/** How well the researched sources agree on a product's rules. */
export type TicketConfidence = 'high' | 'medium' | 'low';

/** What each confidence is called in the admin. */
export const TICKET_CONFIDENCE_LABELS: Record<TicketConfidence, string> = {
  high: 'sicher',
  medium: 'wahrscheinlich',
  low: 'unsicher',
};

/** Where a product's window starts: the date chosen at purchase, or the first visit. */
export type TicketAnchor = 'start' | 'first_use';

/** What each anchor is called in the admin. */
export const TICKET_ANCHOR_LABELS: Record<TicketAnchor, string> = {
  start: 'Startdatum beim Kauf',
  first_use: 'Erster Besuch',
};

/** How a product hops between parks: never, as the `.h` option, or always. */
export type TicketHopping = 'none' | 'optional' | 'included';

/** What each hopping kind is called in the admin. */
export const TICKET_HOPPING_LABELS: Record<TicketHopping, string> = {
  none: 'Kein Hopping',
  optional: 'Als Option (.h)',
  included: 'Immer dabei',
};

/** A range of ticket lengths in days, both ends included. */
export interface TicketDaysRange {
  min: number;
  max: number;
}

/** One length of a product and the calendar days its use may spread over, from the start. */
export interface TicketWindowRow {
  days: number;
  window: number;
}

/** Parks one hop day or hop evening may combine; `ticketDays` limits the set to those lengths. */
export interface TicketHopSet {
  parks: string[];
  ticketDays?: TicketDaysRange;
}

/** At most `max` days on which any of `parks` is visited; 0 means the length does not cover them. */
export interface TicketCap {
  parks: string[];
  max: number;
  ticketDays?: TicketDaysRange;
}

/** Visits on a separate allowance that use no ticket day; `days` is as many as the ticket's days. */
export interface TicketAllowance {
  parks: string[];
  visits: number | 'days';
}

/** Where a product is bought. Exactly one link per product is the operator's own shop. */
export interface TicketLink {
  /** The seller's own name, not translated. */
  seller: string;
  url: string;
  official?: true;
  /** An affiliate or paid link, labelled on the site and linked `rel="sponsored"`. */
  sponsored: boolean;
  /** Whom the link is for; absent: everyone. */
  markets?: TicketMarket[];
  /** The site languages it is for; absent: every one. */
  locales?: string[];
}

/** Start dates a product is sold for, both ends optional. */
export interface TicketSaleRange {
  from?: string;
  to?: string;
}

/** One source of the research behind a product. Admin only. */
export interface TicketSource {
  url: string;
  title?: string;
  /** `YYYY-MM-DD`. */
  accessed?: string;
  note?: string;
}

/** A product as `GET …/tickets` answers it: the public product plus what only the editor sees. */
export interface AdminTicketProduct {
  /** The public id; the same as `slug`. */
  id: string;
  slug: string;
  region: string;
  name: string;
  /** The region group whose operator sells it. */
  resort: string;
  markets: TicketMarket[];
  parks: string[];
  days: TicketDaysRange | 'unlimited';
  windowTable?: TicketWindowRow[];
  windowDays?: number;
  anchor: TicketAnchor;
  hopping: TicketHopping;
  hopSets?: TicketHopSet[];
  caps?: TicketCap[];
  allowance?: TicketAllowance;
  reservedDayParks?: string[];
  onSale?: TicketSaleRange[];
  until?: string;
  pass?: true;
  blockouts?: true;
  blockoutUrl?: string;
  reservationUrl?: string;
  confidence: TicketConfidence;
  description?: string;
  links: TicketLink[];
  /** The official link's url. */
  shopUrl: string;
  notes?: string;
  /** False once archived: off the public catalog and never suggested. */
  active: boolean;
  sortOrder: number;
  /** The order plan first tries a resort's products in, lower first; null: never suggested. */
  suggestRank: number | null;
  sources: TicketSource[];
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}

/** `GET …/tickets`: every product of the region, archived ones too, in the admin's order. */
export interface AdminTicketCatalog {
  region: string;
  version: string;
  tickets: AdminTicketProduct[];
}

/** One reason the API refused a product, by the path of the field it is about. */
export interface TicketProblem {
  /** `windowTable[2].window`, `links`, `dryRun.owned`. */
  path: string;
  message: string;
}

/** The outcome of one dry-run plan. */
export type TicketDryRunResult = 'ok' | 'failed' | 'skipped';

/** The dry run of `validate`: the product planned once owned and once in plan first. */
export interface TicketDryRun {
  owned: TicketDryRunResult;
  planFirst: TicketDryRunResult;
  /** Why a run was skipped. */
  note?: string;
}

/** What each dry-run plan is called in the admin. */
export const TICKET_DRY_RUN_LABELS: Record<keyof Omit<TicketDryRun, 'note'>, string> = {
  owned: 'Als eigenes Ticket',
  planFirst: 'Im Vorschlag ohne Tickets',
};

/** How each dry-run outcome reads, and the chip tone it takes. */
export const TICKET_DRY_RUN_RESULTS: Record<
  TicketDryRunResult,
  { label: string; tone: 'success' | 'danger' | 'muted' }
> = {
  ok: { label: 'geplant', tone: 'success' },
  failed: { label: 'gescheitert', tone: 'danger' },
  skipped: { label: 'übersprungen', tone: 'muted' },
};

/** `POST …/tickets/validate`: the checks and the dry run, nothing saved. */
export interface TicketValidation {
  ok: boolean;
  problems: TicketProblem[];
  /** Absent while the checks fail: a dry run needs a valid product. */
  dryRun?: TicketDryRun;
}

/** The backend's limits, repeated where the form checks before it asks. */
export const MAX_TICKET_DAYS = 30;
/** The longest window a length may have. */
export const MAX_TICKET_WINDOW = 366;
/** Links per product. */
export const MAX_TICKET_LINKS = 10;
/** Characters of any url the catalog stores. */
export const MAX_TICKET_URL_LENGTH = 500;
/** Characters of a seller's name. */
export const MAX_TICKET_SELLER_LENGTH = 80;

/** The proxy path of a region's catalog, or of one product and its actions below it. */
export function ticketCatalogPath(region: string, ...segments: string[]): string {
  return [
    `/api/admin/content/regions/${encodeURIComponent(region)}/tickets`,
    ...segments.map(encodeURIComponent),
  ].join('/');
}

/**
 * How soon a saved edit is seen, as the API publishes it: plans drop the old catalog within 30
 * seconds (every instance lets go of its copy by then), the open catalog route and the site's
 * ticket list within 15 minutes, its edge window.
 */
export const TICKET_PUBLISH_DELAY =
  'Pläne rechnen nach spätestens 30 Sekunden damit, die Ticketliste der Website folgt nach spätestens 15 Minuten.';

/** The query key every ticket read sits under, so one invalidation drops all of them. */
export const TICKETS_QUERY_KEY = ['admin', 'tickets'] as const;

/** The query key of one region's catalog. */
export function ticketCatalogKey(region: string): readonly unknown[] {
  return [...TICKETS_QUERY_KEY, region];
}

/* ------------------------------------------------------------------ the form's draft */

/** How the form asks for a product's days: one length, several, or none (a pass, a window). */
export type TicketDaysMode = 'fixed' | 'range' | 'unlimited';

/** A window row while it is typed: an emptied field is `null` until it holds a number again. */
export interface TicketWindowDraftRow {
  days: number;
  window: number | null;
}

/** A length limit while it is typed; `null` on the row means the rule holds for every length. */
export interface TicketDaysDraft {
  min: number | null;
  max: number | null;
}

/** A hop set or a cap as the form holds it. */
export interface TicketRuleDraft {
  parks: string[];
  /** Only caps have one. */
  max?: number | null;
  ticketDays: TicketDaysDraft | null;
}

/** A sale range as typed; `''` is an open end. */
export interface TicketSaleDraft {
  from: string;
  to: string;
}

/**
 * Everything the form edits, in the shapes its fields hold. It keeps what the current choice hides
 * (the window table while the days are unlimited), so switching back restores it; `ticketBody`
 * decides what is sent.
 */
export interface TicketDraft {
  slug: string;
  name: string;
  description: string;
  resort: string;
  parks: string[];
  markets: TicketMarket[];
  daysMode: TicketDaysMode;
  daysMin: number | null;
  daysMax: number | null;
  windowTable: TicketWindowDraftRow[];
  windowDays: number | null;
  anchor: TicketAnchor;
  hopping: TicketHopping;
  hopSets: TicketRuleDraft[];
  caps: TicketRuleDraft[];
  allowance: { parks: string[]; visits: number | 'days' | null } | null;
  reservedDayParks: string[];
  pass: boolean;
  blockouts: boolean;
  blockoutUrl: string;
  reservationUrl: string;
  onSale: TicketSaleDraft[];
  until: string;
  links: TicketLink[];
  sources: TicketSource[];
  notes: string;
  confidence: TicketConfidence;
  suggestRank: number | null;
}

/**
 * A new product's draft: one day, one link that is the operator's shop, nothing suggested, and no
 * resort until one is picked.
 */
export function emptyTicketDraft(): TicketDraft {
  return {
    slug: '',
    name: '',
    description: '',
    resort: '',
    parks: [],
    markets: ['us'],
    daysMode: 'fixed',
    daysMin: 1,
    daysMax: 1,
    windowTable: [{ days: 1, window: 1 }],
    windowDays: null,
    anchor: 'start',
    hopping: 'none',
    hopSets: [],
    caps: [],
    allowance: null,
    reservedDayParks: [],
    pass: false,
    blockouts: false,
    blockoutUrl: '',
    reservationUrl: '',
    onSale: [],
    until: '',
    links: [{ seller: '', url: '', official: true, sponsored: false }],
    sources: [],
    notes: '',
    confidence: 'medium',
    suggestRank: null,
  };
}

function ruleDraft(rule: TicketHopSet | TicketCap): TicketRuleDraft {
  return {
    parks: [...rule.parks],
    ...('max' in rule && { max: rule.max }),
    ticketDays: rule.ticketDays ? { ...rule.ticketDays } : null,
  };
}

/** The draft of a stored product, every optional field filled with its empty form value. */
export function draftFromProduct(product: AdminTicketProduct): TicketDraft {
  const range = product.days === 'unlimited' ? null : product.days;
  return {
    slug: product.slug,
    name: product.name,
    description: product.description ?? '',
    resort: product.resort,
    parks: [...product.parks],
    markets: [...product.markets],
    daysMode: range === null ? 'unlimited' : range.min === range.max ? 'fixed' : 'range',
    daysMin: range?.min ?? 1,
    daysMax: range?.max ?? 1,
    windowTable: (product.windowTable ?? []).map((row) => ({ ...row })),
    windowDays: product.windowDays ?? null,
    anchor: product.anchor,
    hopping: product.hopping,
    hopSets: (product.hopSets ?? []).map(ruleDraft),
    caps: (product.caps ?? []).map(ruleDraft),
    allowance: product.allowance
      ? { parks: [...product.allowance.parks], visits: product.allowance.visits }
      : null,
    reservedDayParks: [...(product.reservedDayParks ?? [])],
    pass: product.pass === true,
    blockouts: product.blockouts === true,
    blockoutUrl: product.blockoutUrl ?? '',
    reservationUrl: product.reservationUrl ?? '',
    onSale: (product.onSale ?? []).map((range) => ({ from: range.from ?? '', to: range.to ?? '' })),
    until: product.until ?? '',
    links: (product.links ?? []).map((link) => ({ ...link })),
    sources: (product.sources ?? []).map((source) => ({ ...source })),
    notes: product.notes ?? '',
    confidence: product.confidence,
    suggestRank: product.suggestRank ?? null,
  };
}

/**
 * The window table for the lengths `min` to `max`: a length keeps the window it had, a new one
 * starts at the window of the length before it and never under its own days, the two checks the
 * API runs. A range that is not one yet (empty, reversed, over 30) leaves the table as it is.
 */
export function windowTableFor(
  rows: readonly TicketWindowDraftRow[],
  min: number | null,
  max: number | null
): TicketWindowDraftRow[] {
  if (
    min === null ||
    max === null ||
    !Number.isInteger(min) ||
    !Number.isInteger(max) ||
    min < 1 ||
    max < min ||
    max > MAX_TICKET_DAYS
  ) {
    return [...rows];
  }
  const table: TicketWindowDraftRow[] = [];
  let previous = 0;
  for (let days = min; days <= max; days++) {
    const kept = rows.find((row) => row.days === days);
    const window = kept ? kept.window : Math.max(days, previous);
    table.push({ days, window });
    previous = window ?? previous;
  }
  return table;
}

/** The table with the window of one length changed. */
export function setTicketWindow(
  rows: readonly TicketWindowDraftRow[],
  days: number,
  window: number | null
): TicketWindowDraftRow[] {
  return rows.map((row) => (row.days === days ? { days, window } : row));
}

/**
 * The draft with new days: a fixed length is its own range, and the window table follows the
 * lengths. Switching to unlimited keeps the lengths and the table for a way back.
 */
export function setTicketDays(
  draft: TicketDraft,
  mode: TicketDaysMode,
  min: number | null,
  max: number | null
): TicketDraft {
  const effectiveMax = mode === 'fixed' ? min : max;
  return {
    ...draft,
    daysMode: mode,
    daysMin: min,
    daysMax: effectiveMax,
    windowTable:
      mode === 'unlimited'
        ? draft.windowTable
        : windowTableFor(draft.windowTable, min, effectiveMax),
  };
}

/* ------------------------------------------------------------------ what is sent */

/** A product as the API takes it on `POST`, `PATCH` and `validate`: no `id`, `shopUrl` or stamps. */
export type TicketWriteBody = Record<string, unknown>;

function trimmed(value: string | undefined): string | undefined {
  const text = value?.trim();
  return text ? text : undefined;
}

function cleanLink(link: TicketLink): TicketLink {
  return {
    seller: link.seller.trim(),
    url: link.url.trim(),
    ...(link.official && { official: true as const }),
    sponsored: link.sponsored,
    ...(link.markets && link.markets.length > 0 && { markets: link.markets }),
    ...(link.locales && link.locales.length > 0 && { locales: link.locales }),
  };
}

function cleanSource(source: TicketSource): TicketSource {
  const title = trimmed(source.title);
  const accessed = trimmed(source.accessed);
  const note = trimmed(source.note);
  return {
    url: source.url.trim(),
    ...(title && { title }),
    ...(accessed && { accessed }),
    ...(note && { note }),
  };
}

function cleanRule(rule: TicketRuleDraft): Record<string, unknown> {
  return {
    parks: rule.parks,
    ...('max' in rule && { max: rule.max }),
    ...(rule.ticketDays && { ticketDays: rule.ticketDays }),
  };
}

/**
 * The full product the draft stands for, with only the fields its choices use: no window table
 * for unlimited days, no hop sets without hopping, no empty optional field. Arrays keep the draft's
 * order and rows, so a problem's index (`links[2].url`) points at the row the form shows.
 */
export function ticketBody(draft: TicketDraft): TicketWriteBody {
  const unlimited = draft.daysMode === 'unlimited';
  const body: TicketWriteBody = {
    slug: draft.slug.trim(),
    name: draft.name.trim(),
    resort: draft.resort,
    markets: draft.markets,
    parks: draft.parks,
    days: unlimited
      ? 'unlimited'
      : {
          min: draft.daysMin,
          max: draft.daysMode === 'fixed' ? draft.daysMin : draft.daysMax,
        },
    anchor: draft.anchor,
    hopping: draft.hopping,
    confidence: draft.confidence,
    links: draft.links.map(cleanLink),
    sources: draft.sources.map(cleanSource),
    suggestRank: draft.suggestRank,
  };
  const description = trimmed(draft.description);
  if (description) body.description = description;
  if (!unlimited) body.windowTable = draft.windowTable;
  if (unlimited && draft.windowDays !== null) body.windowDays = draft.windowDays;
  if (unlimited && draft.pass) body.pass = true;
  if (draft.hopping !== 'none') body.hopSets = draft.hopSets.map(cleanRule);
  if (draft.caps.length > 0) body.caps = draft.caps.map(cleanRule);
  if (draft.allowance) body.allowance = draft.allowance;
  if (draft.reservedDayParks.length > 0) body.reservedDayParks = draft.reservedDayParks;
  if (draft.onSale.length > 0) {
    body.onSale = draft.onSale.map((range) => ({
      ...(range.from && { from: range.from }),
      ...(range.to && { to: range.to }),
    }));
  }
  const until = trimmed(draft.until);
  if (until) body.until = until;
  if (draft.blockouts) body.blockouts = true;
  const blockoutUrl = trimmed(draft.blockoutUrl);
  if (blockoutUrl) body.blockoutUrl = blockoutUrl;
  const reservationUrl = trimmed(draft.reservationUrl);
  if (reservationUrl) body.reservationUrl = reservationUrl;
  const notes = trimmed(draft.notes);
  if (notes) body.notes = notes;
  return body;
}

/**
 * The `PATCH` for an edit: the fields that differ from the stored product, and `null` for an
 * optional field the edit emptied, which the API clears, where leaving it out would keep the
 * stored value. Never `slug`, which is fixed after create. Empty when nothing changed.
 */
export function ticketPatch(original: AdminTicketProduct, draft: TicketDraft): TicketWriteBody {
  const before = ticketBody(draftFromProduct(original));
  const after = ticketBody(draft);
  const patch: TicketWriteBody = {};
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (key === 'slug') continue;
    if (!(key in after)) patch[key] = null;
    else if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) patch[key] = after[key];
  }
  return patch;
}

/**
 * What the form's live check sends: a new product whole to `validate`, an edit as its `PATCH` to
 * `validate?slug=`, which merges it onto the stored product as the save will and does not count
 * the product's own slug as taken. The edit's full body would not do, since an emptied field left
 * out of it is put back by the merge.
 */
export function ticketCheck(
  region: string,
  product: AdminTicketProduct | null,
  draft: TicketDraft
): { path: string; body: TicketWriteBody } {
  const path = ticketCatalogPath(region, 'validate');
  return product
    ? {
        path: `${path}?slug=${encodeURIComponent(product.slug)}`,
        body: ticketPatch(product, draft),
      }
    : { path, body: ticketBody(draft) };
}

/* ------------------------------------------------------------------ the list's line */

function dayWord(count: number): string {
  return count === 1 ? 'Tag' : 'Tage';
}

/**
 * A product's days and window in one line, as the list shows them: „4 Tage in 7“, „14 Tage am
 * Stück“, „1–10 Tage in 1–14“, „Pass, beliebig viele Tage“. A window counted from the first visit
 * says so.
 */
export function formatTicketDays(
  product: Pick<AdminTicketProduct, 'days' | 'windowTable' | 'windowDays' | 'pass' | 'anchor'>
): string {
  const fromFirstVisit = product.anchor === 'first_use' ? ' ab dem ersten Besuch' : '';
  if (product.pass) return 'Pass, beliebig viele Tage';
  if (product.days === 'unlimited') {
    return product.windowDays
      ? `${product.windowDays} Tage am Stück${fromFirstVisit}`
      : 'beliebig viele Tage';
  }
  const { min, max } = product.days;
  const table = product.windowTable ?? [];
  const windowOf = (days: number) => table.find((row) => row.days === days)?.window;
  if (min === max) {
    const window = windowOf(min);
    // A single day has no window to speak of, wherever it is counted from.
    if (window === undefined || (window === 1 && min === 1)) return `${min} ${dayWord(min)}`;
    if (window === min) return `${min} Tage am Stück${fromFirstVisit}`;
    return `${min} ${dayWord(min)} in ${window}${fromFirstVisit}`;
  }
  const lengths = `${min}–${max} Tage`;
  const first = windowOf(min);
  const last = windowOf(max);
  if (first === undefined || last === undefined) return lengths;
  const consecutive = table
    .filter((row) => row.days >= min && row.days <= max)
    .every((row) => row.window === row.days);
  if (consecutive) return `${lengths} am Stück${fromFirstVisit}`;
  return `${lengths} in ${first}–${last}${fromFirstVisit}`;
}

function parseDay(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const time = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(time) ? null : time;
}

function formatDate(value: string, withYear = true): string {
  const time = parseDay(value);
  if (time === null) return value;
  return getDateTimeFormat('de-DE', {
    day: 'numeric',
    month: 'numeric',
    ...(withYear && { year: 'numeric' }),
    timeZone: 'UTC',
  }).format(time);
}

function formatSaleRange(range: TicketSaleRange): string {
  if (range.from && range.to) {
    const sameYear = range.from.slice(0, 4) === range.to.slice(0, 4);
    return `${formatDate(range.from, !sameYear)}–${formatDate(range.to)}`;
  }
  if (range.from) return `ab ${formatDate(range.from)}`;
  if (range.to) return `bis ${formatDate(range.to)}`;
  return 'jederzeit';
}

/**
 * When a product is sold and how long a pass lasts, in one line: „Start 3.1.–22.5.2027“, „Start ab
 * 3.9.2026 · gültig bis 31.12.2027“. Without either, the API knows no limit and the line says so.
 */
export function formatTicketSale(product: Pick<AdminTicketProduct, 'onSale' | 'until'>): string {
  const parts: string[] = [];
  const ranges = product.onSale ?? [];
  if (ranges.length > 0) parts.push(`Start ${ranges.map(formatSaleRange).join(', ')}`);
  if (product.until) parts.push(`gültig bis ${formatDate(product.until)}`);
  return parts.length > 0 ? parts.join(' · ') : 'keine Verkaufsgrenze bekannt';
}

/** How many links a product has and how many of them are partner links: „3 Links, 1 Partnerlink“. */
export function formatTicketLinks(links: readonly TicketLink[]): string {
  const count = `${links.length} ${links.length === 1 ? 'Link' : 'Links'}`;
  const partner = links.filter((link) => link.sponsored).length;
  if (partner === 0) return count;
  return `${count}, ${partner} ${partner === 1 ? 'Partnerlink' : 'Partnerlinks'}`;
}

/* ------------------------------------------------------------------ links */

/**
 * What is wrong with a url the catalog stores, in German, or null: an absolute `https` address of
 * at most 500 characters without user or password, the API's own check.
 */
export function ticketUrlProblem(url: string): string | null {
  const text = url.trim();
  if (text === '') return 'Die Adresse fehlt.';
  if (text.length > MAX_TICKET_URL_LENGTH) {
    return `Höchstens ${MAX_TICKET_URL_LENGTH} Zeichen.`;
  }
  let parsed: URL;
  try {
    parsed = new URL(text);
  } catch {
    return 'Keine vollständige Adresse, sie beginnt mit https://.';
  }
  if (parsed.protocol !== 'https:') return 'Nur https-Adressen.';
  if (parsed.username || parsed.password) return 'Ohne Benutzername und Passwort.';
  return null;
}

/**
 * The API's checks on a product's links, run in the form so a link shows its problem while it is
 * typed: one to ten links, exactly one of them the operator's shop, a seller name and a valid url
 * on each. The paths are the API's, so these sit where its own problems would.
 */
export function ticketLinkProblems(links: readonly TicketLink[]): TicketProblem[] {
  const problems: TicketProblem[] = [];
  if (links.length === 0) {
    problems.push({ path: 'links', message: 'Mindestens ein Link: der Shop des Betreibers.' });
  } else if (links.length > MAX_TICKET_LINKS) {
    problems.push({ path: 'links', message: `Höchstens ${MAX_TICKET_LINKS} Links.` });
  }
  const official = links.filter((link) => link.official).length;
  if (links.length > 0 && official === 0) {
    problems.push({ path: 'links', message: 'Ein Link muss der offizielle Shop sein.' });
  } else if (official > 1) {
    problems.push({ path: 'links', message: 'Nur ein Link kann der offizielle Shop sein.' });
  }
  links.forEach((link, index) => {
    const seller = link.seller.trim();
    if (seller === '') {
      problems.push({ path: `links[${index}].seller`, message: 'Der Verkäufer fehlt.' });
    } else if (seller.length > MAX_TICKET_SELLER_LENGTH) {
      problems.push({
        path: `links[${index}].seller`,
        message: `Höchstens ${MAX_TICKET_SELLER_LENGTH} Zeichen.`,
      });
    }
    const url = ticketUrlProblem(link.url);
    if (url) problems.push({ path: `links[${index}].url`, message: url });
  });
  return problems;
}

/** The links with the one at `index` as the operator's shop and no other. */
export function setOfficialTicketLink(links: readonly TicketLink[], index: number): TicketLink[] {
  return links.map((link, at) => {
    const { official: _official, ...rest } = link;
    return at === index ? { ...rest, official: true } : rest;
  });
}

/** The list with the item at `from` moved to `to`; out-of-range moves return it unchanged. */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  if (from < 0 || from >= list.length || to < 0 || to >= list.length || from === to) {
    return [...list];
  }
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/* ------------------------------------------------------------------ problems */

/**
 * The problem list of a refused write or a `validate` answer (`{ problems: [{ path, message }] }`),
 * or an empty list when the payload carries none.
 */
export function ticketProblemsOf(payload: unknown): TicketProblem[] {
  if (!payload || typeof payload !== 'object') return [];
  const list = (payload as { problems?: unknown }).problems;
  if (!Array.isArray(list)) return [];
  return list.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const { path, message } = entry as { path?: unknown; message?: unknown };
    if (typeof message !== 'string') return [];
    return [{ path: typeof path === 'string' ? path : '', message }];
  });
}

/** The product field a problem's path is about: `windowTable[2].window` → `windowTable`. */
export function ticketProblemField(path: string): string {
  return /^[^.[]*/.exec(path)?.[0] ?? '';
}

/** The messages of the problems at exactly `path`, for the field that owns it. */
export function ticketProblemsAt(problems: readonly TicketProblem[], path: string): string[] {
  return problems.filter((problem) => problem.path === path).map((problem) => problem.message);
}

function isUnder(problemPath: string, path: string): boolean {
  return (
    problemPath === path || problemPath.startsWith(`${path}.`) || problemPath.startsWith(`${path}[`)
  );
}

/**
 * The problems at `path` and below it (`days`, `days.min`; `links[1]`, `links[1].url`), for a row
 * or a field that shows its parts together, without those under `except`, which fields of their
 * own show. `links[1]` does not take `links[10]`.
 */
export function ticketProblemsUnder(
  problems: readonly TicketProblem[],
  path: string,
  except: readonly string[] = []
): TicketProblem[] {
  return problems.filter(
    (problem) =>
      isUnder(problem.path, path) && !except.some((shown) => isUnder(problem.path, shown))
  );
}

/**
 * The problems no field of the form shows: a path outside `fields`, the dry run's
 * (`dryRun.owned`) or none at all. The form lists them on their own, so a check the API adds first
 * is never lost.
 */
export function strayTicketProblems(
  problems: readonly TicketProblem[],
  fields: readonly string[]
): TicketProblem[] {
  return problems.filter((problem) => !fields.includes(ticketProblemField(problem.path)));
}

/** Two problem lists as one, each path and message once. */
export function mergeTicketProblems(...lists: ReadonlyArray<readonly TicketProblem[]>) {
  const seen = new Set<string>();
  const merged: TicketProblem[] = [];
  for (const problem of lists.flat()) {
    const key = `${problem.path}\u0000${problem.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(problem);
  }
  return merged;
}

/* ------------------------------------------------------------------ the catalog's order */

/** The products in the admin's order, `sortOrder` first and the API's order after that. */
export function sortTicketProducts<T extends Pick<AdminTicketProduct, 'sortOrder'>>(
  products: readonly T[]
): T[] {
  return products
    .map((product, index) => ({ product, index }))
    .sort((a, b) => a.product.sortOrder - b.product.sortOrder || a.index - b.index)
    .map(({ product }) => product);
}

/**
 * The whole region's order after moving one product up (`-1`) or down (`1`) inside its resort, as
 * `PUT …/order` takes it: it swaps places with the nearest product of the same resort, wherever
 * the others sit. Null at the end of its resort.
 */
export function ticketOrderAfterMove(
  products: ReadonlyArray<Pick<AdminTicketProduct, 'slug' | 'resort'>>,
  slug: string,
  direction: -1 | 1
): string[] | null {
  const index = products.findIndex((product) => product.slug === slug);
  if (index === -1) return null;
  const resort = products[index].resort;
  let other = index + direction;
  while (other >= 0 && other < products.length && products[other].resort !== resort) {
    other += direction;
  }
  if (other < 0 || other >= products.length) return null;
  const slugs = products.map((product) => product.slug);
  [slugs[index], slugs[other]] = [slugs[other], slugs[index]];
  return slugs;
}

/** One resort's products under its name, for the list. */
export interface TicketResortGroup<T> {
  key: string;
  name: string;
  products: T[];
}

/**
 * The products grouped by resort, the region's groups in the region's order and a resort the
 * region does not know after them under its key, each group in the admin's order.
 */
export function groupTicketsByResort<T extends Pick<AdminTicketProduct, 'resort' | 'sortOrder'>>(
  products: readonly T[],
  groups: ReadonlyArray<{ key: string; name: string }>
): TicketResortGroup<T>[] {
  const sorted = sortTicketProducts(products);
  const known = groups
    .map((group) => ({
      key: group.key,
      name: group.name,
      products: sorted.filter((product) => product.resort === group.key),
    }))
    .filter((group) => group.products.length > 0);
  const knownKeys = new Set(groups.map((group) => group.key));
  const unknown = [...new Set(sorted.map((product) => product.resort))]
    .filter((resort) => !knownKeys.has(resort))
    .map((resort) => ({
      key: resort,
      name: resort,
      products: sorted.filter((product) => product.resort === resort),
    }));
  return [...known, ...unknown];
}

/* ------------------------------------------------------------------ clicks */

/**
 * The event the planner sends for a click on a ticket link, with the product, the seller and the
 * host among its properties (`SiteEventMap`); the admin only reads it.
 */
export const TICKET_LINK_EVENT = 'ticket_link_clicked' satisfies keyof SiteEventMap;

/** The window the ticket admin counts clicks in, in UTC days with today. */
export const TICKET_CLICK_DAYS = 30;

/**
 * The event's own page in the admin, opened on its days and on product against host, the table the
 * figures here are read from.
 */
export const TICKET_CLICKS_HREF = `/admin/traffic/events/${TICKET_LINK_EVENT}?days=${TICKET_CLICK_DAYS}&row=prop:product&col=prop:host`;

/** The crosstab answer the click figures are read from: product against host or seller. */
export type TicketClickTable = Pick<CrosstabResponse, 'rows' | 'cols' | 'cells'>;

/** A crosstab with nothing in it, for an event that has never been sent. */
export const EMPTY_TICKET_CLICKS: TicketClickTable = { rows: [], cols: [], cells: [] };

/**
 * The host and the seller a click names its link by, spelled as the planner sends them; the host
 * is null for an address that is none yet.
 */
function clickKeys(link: TicketLink): { host: string | null; seller: string } {
  const host = hostProp(link.url.trim());
  return { host: host === 'unknown' ? null : host, seller: sellerProp(link.seller) };
}

/** A product's clicks in the window: its total and each link's, `null` where they cannot be told. */
export interface TicketClicks {
  total: number | null;
  links: Array<number | null>;
}

function cellCount(table: TicketClickTable, row: string, col: string): number {
  return table.cells.find((cell) => cell.row === row && cell.col === col)?.count ?? 0;
}

/**
 * Whether a value's count can be read off one side of the table: it is listed, or the side is
 * whole. A side cut at 30 values folds the rest into `__rest__`, and a value missing there may sit
 * in it, so its count is unknown rather than 0.
 */
function readable(side: readonly string[], value: string): boolean {
  return side.includes(value) || !side.includes(CROSSTAB_REST);
}

/**
 * A product's clicks, from the event counted by product against host and, for links of one
 * product that share a host, by product against seller. A link is told apart by its host, which
 * survives a renamed seller; by its seller only where the host does not tell. `byHost` null (the
 * read failed) makes every figure unknown; an empty table makes every figure 0.
 */
export function ticketClicks(
  product: Pick<AdminTicketProduct, 'slug' | 'links'>,
  byHost: TicketClickTable | null,
  bySeller: TicketClickTable | null
): TicketClicks {
  const unknown = { total: null, links: product.links.map(() => null) };
  if (!byHost || !readable(byHost.rows, product.slug)) return unknown;
  const total = byHost.cells
    .filter((cell) => cell.row === product.slug)
    .reduce((sum, cell) => sum + cell.count, 0);
  const keys = product.links.map(clickKeys);
  const hosts = keys.map((key) => key.host);
  const sellers = keys.map((key) => key.seller);
  const links = product.links.map((_, index) => {
    const host = hosts[index];
    if (host === null) return null;
    if (hosts.filter((other) => other === host).length === 1) {
      return readable(byHost.cols, host) ? cellCount(byHost, product.slug, host) : null;
    }
    const seller = sellers[index];
    if (
      !bySeller ||
      sellers.filter((other, at) => other === seller && hosts[at] === host).length > 1 ||
      !readable(bySeller.rows, product.slug) ||
      !readable(bySeller.cols, seller)
    ) {
      return null;
    }
    return cellCount(bySeller, product.slug, seller);
  });
  return { total, links };
}

/** Whether a product has two links on one host, which only the seller tells apart. */
export function sharesTicketLinkHost(product: Pick<AdminTicketProduct, 'links'>): boolean {
  const hosts = product.links.map((link) => clickKeys(link).host).filter(Boolean);
  return new Set(hosts).size < hosts.length;
}
