import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { isHttpUrl } from '@/lib/admin/provenance';
import { isIsoDate } from '@/lib/utils/calendar-utils';
import { addDays, daysBetween } from '@/lib/utils/park-day';
import type { ParkSeason, ParkSeasonKind, ParkSeasonStatus } from './types';

/**
 * The season editor's pure half: labels, the draft a form edits, the bodies it sends, the API's
 * checks run before the request, and the date helpers behind the day picker. The rules are the
 * API's (`ParkSeasonService`, `SEASON_LIMITS`); see its docs/admin/curation.md#seasons.
 */

/** The API's bounds on one season: characters for the texts, entries for `dates`. */
export const SEASON_LIMITS = { name: 200, url: 2000, note: 4000, dates: 366 } as const;

/** What each kind is called on screen, in the order the editor offers them. */
export const SEASON_KIND_LABELS: Record<ParkSeasonKind, string> = {
  halloween: 'Halloween',
  christmas: 'Weihnachten',
  winter: 'Winter',
  summer_nights: 'Sommernächte',
  special_event: 'Sonderevent',
  opening: 'Saison',
  closure: 'Schließzeit',
  maintenance: 'Wartung',
};

/** What each status is called on screen; `announced` is the API's default. */
export const SEASON_STATUS_LABELS: Record<ParkSeasonStatus, string> = {
  confirmed: 'bestätigt',
  announced: 'angekündigt',
  expected: 'erwartet',
  cancelled: 'abgesagt',
};

/** The kinds as select options. */
export const SEASON_KIND_OPTIONS = Object.entries(SEASON_KIND_LABELS).map(([value, label]) => ({
  value,
  label,
}));

/** The statuses as select options. */
export const SEASON_STATUS_OPTIONS = Object.entries(SEASON_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

/* ------------------------------------------------------------------ the list's filters */

/** The filters of `/admin/seasons`, as the address carries them. */
export interface SeasonFilters {
  /** A year the season overlaps; null for every year. */
  year: string | null;
  kind: string | null;
  status: string | null;
  /** A trip region's slug: the seasons of its parks. */
  region: string | null;
  parkId: string | null;
  /** Only seasons running today. */
  current: boolean;
}

/** How many seasons one request asks for: the API's most. */
export const SEASON_LIST_LIMIT = 500;

/** `year=all` in the address: no year at all, since an absent one means the current year. */
const ALL_YEARS = 'all';

/**
 * The filters an address asks for. Without `year` the list opens on the current one, which is the
 * question asked most („what is on file for Halloween this year“).
 */
export function seasonFiltersFrom(params: URLSearchParams, currentYear: number): SeasonFilters {
  const year = params.get('year');
  return {
    year: year === ALL_YEARS ? null : /^\d{4}$/.test(year ?? '') ? year : String(currentYear),
    kind: params.get('kind') || null,
    status: params.get('status') || null,
    region: params.get('region') || null,
    parkId: params.get('parkId') || null,
    current: params.get('current') === 'true',
  };
}

/** The address query for a set of filters, the inverse of {@link seasonFiltersFrom}. */
export function seasonFilterQuery(filters: SeasonFilters, currentYear: number): string {
  const query = new URLSearchParams();
  if (filters.year === null) query.set('year', ALL_YEARS);
  else if (filters.year !== String(currentYear)) query.set('year', filters.year);
  for (const key of ['kind', 'status', 'region', 'parkId'] as const) {
    const value = filters[key];
    if (value) query.set(key, value);
  }
  if (filters.current) query.set('current', 'true');
  return query.toString();
}

/** The proxy path of `GET seasons` for a set of filters. */
export function seasonListPath(filters: SeasonFilters): string {
  const query = new URLSearchParams({ limit: String(SEASON_LIST_LIMIT) });
  for (const key of ['year', 'kind', 'status', 'region', 'parkId'] as const) {
    const value = filters[key];
    if (value) query.set(key, value);
  }
  if (filters.current) query.set('current', 'true');
  return `/api/admin/content/seasons?${query}`;
}

/* ------------------------------------------------------------------ days */

/** Whether a string is a `YYYY-MM-DD` day that exists: `2026-02-30` is not one. */
export function isRealDay(value: string): boolean {
  return (
    isIsoDate(value) &&
    !Number.isNaN(Date.parse(`${value}T12:00:00Z`)) &&
    addDays(value, 0) === value
  );
}

/** Every day of a range of real days that falls on `weekday` (0 Sunday to 6 Saturday). */
export function weekdayDates(start: string, end: string, weekday: number): string[] {
  if (!isRealDay(start) || !isRealDay(end) || end < start) return [];
  const first = new Date(`${start}T12:00:00Z`).getUTCDay();
  const days: string[] = [];
  for (let day = addDays(start, (weekday - first + 7) % 7); day <= end; day = addDays(day, 7)) {
    days.push(day);
  }
  return days;
}

/** The picked days that lie outside the range, which the API refuses. */
export function datesOutsideRange(dates: readonly string[], start: string, end: string): string[] {
  return dates.filter((date) => date < start || date > end);
}

/** A sorted list of distinct days. */
export function uniqueDays(dates: Iterable<string>): string[] {
  return [...new Set(dates)].sort();
}

const GERMAN_DAY = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;

/**
 * The days in a pasted text, as a park's calendar or a spreadsheet lists them: `2026-10-03` or
 * `3.10.2026`, separated by spaces, commas, semicolons or lines. What is not a real day is
 * returned as written, so the form can name it.
 */
export function parseSeasonDates(text: string): { dates: string[]; unreadable: string[] } {
  const dates: string[] = [];
  const unreadable: string[] = [];
  for (const token of text.split(/[\s,;]+/).filter(Boolean)) {
    const german = GERMAN_DAY.exec(token);
    const day = german
      ? `${german[3]}-${german[2].padStart(2, '0')}-${german[1].padStart(2, '0')}`
      : token;
    if (isRealDay(day)) dates.push(day);
    else unreadable.push(token);
  }
  return { dates: uniqueDays(dates), unreadable };
}

/**
 * Picked days as a person scans them, one month per group: „Okt. 3, 4, 10, 11 · Nov. 1“, with the
 * year where the days span two.
 */
export function formatSeasonDates(dates: readonly string[]): string {
  const sorted = uniqueDays(dates.filter(isRealDay));
  const years = new Set(sorted.map((date) => date.slice(0, 4)));
  const months = new Map<string, number[]>();
  for (const date of sorted) {
    const key = date.slice(0, 7);
    months.set(key, [...(months.get(key) ?? []), Number(date.slice(8))]);
  }
  return [...months.entries()]
    .map(([month, days]) => {
      const label = format(parseISO(`${month}-01`), years.size > 1 ? 'MMM yyyy' : 'MMM', {
        locale: de,
      });
      return `${label} ${days.join(', ')}`;
    })
    .join(' · ');
}

/**
 * A range as a person would write it, or the raw values while it is not one yet: a cleared
 * `<input type="date">` reports `''`.
 */
export function formatSeasonRange(start: string, end: string): string {
  if (!isRealDay(start) || !isRealDay(end)) return [start, end].filter(Boolean).join(' – ') || '—';
  const from = parseISO(start);
  const to = parseISO(end);
  if (start === end) return format(from, 'd. MMMM yyyy', { locale: de });
  if (start.slice(0, 4) === end.slice(0, 4)) {
    return `${format(from, 'd. MMM', { locale: de })} – ${format(to, 'd. MMM yyyy', { locale: de })}`;
  }
  return `${format(from, 'd. MMM yyyy', { locale: de })} – ${format(to, 'd. MMM yyyy', { locale: de })}`;
}

/** Days in a range, both ends counted; 0 while it is not one. */
export function rangeLength(start: string, end: string): number {
  if (!isRealDay(start) || !isRealDay(end) || end < start) return 0;
  return daysBetween(start, end) + 1;
}

/* ------------------------------------------------------------------ the draft */

/** One season as the form edits it: every field as typed, the texts as strings. */
export interface SeasonDraft {
  kind: ParkSeasonKind;
  name: string;
  startDate: string;
  endDate: string;
  /**
   * Null while the season runs every day of its range. An empty list is the picker switched on with
   * nothing picked yet, which saves as null too: the API keeps `[]` from meaning „on no day“.
   */
  dates: string[] | null;
  status: ParkSeasonStatus;
  separateTicket: boolean;
  priceFrom: string;
  priceCurrency: string;
  opensAt: string;
  closesAt: string;
  attractionIds: string[];
  url: string;
  sourceUrl: string;
  /** ISO 8601, or empty. */
  confirmedAt: string;
  note: string;
}

/** The fields of a draft, which is also where the form shows a problem. */
export type SeasonField = keyof SeasonDraft;

/** The draft of a stored season, or of a new one starting on `today`. */
export function seasonDraft(season: ParkSeason | null, today: string): SeasonDraft {
  return {
    kind: season?.kind ?? 'halloween',
    name: season?.name ?? '',
    startDate: season?.startDate ?? today,
    endDate: season?.endDate ?? today,
    dates: season?.dates && season.dates.length > 0 ? [...season.dates] : null,
    status: season?.status ?? 'announced',
    separateTicket: season?.separateTicket ?? false,
    priceFrom: season?.priceFrom ?? '',
    priceCurrency: season?.priceCurrency ?? (season ? '' : 'EUR'),
    opensAt: season?.opensAt ?? '',
    closesAt: season?.closesAt ?? '',
    attractionIds: [...(season?.attractionIds ?? [])],
    url: season?.url ?? '',
    sourceUrl: season?.sourceUrl ?? '',
    confirmedAt: season?.confirmedAt ?? '',
    note: season?.note ?? '',
  };
}

/**
 * A price as typed, in either notation: the people using this admin type German, so `53,50` is the
 * expected input. `'invalid'` rather than null for text that is neither empty nor a number, because
 * the two must not save the same way.
 */
export function parseSeasonPrice(raw: string): number | null | 'invalid' {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const parsed = Number(trimmed.replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed < 0) return 'invalid';
  return parsed;
}

/** The body a season is created with; also the shape {@link seasonPatch} compares. */
export type SeasonWriteBody = Record<string, unknown>;

/** The whole body of `POST parks/:id/seasons`: every field, an empty optional one as null. */
export function seasonBody(draft: SeasonDraft): SeasonWriteBody {
  const price = parseSeasonPrice(draft.priceFrom);
  const text = (value: string) => value.trim() || null;
  return {
    kind: draft.kind,
    name: text(draft.name),
    startDate: draft.startDate,
    endDate: draft.endDate,
    dates: draft.dates && draft.dates.length > 0 ? uniqueDays(draft.dates) : null,
    status: draft.status,
    separateTicket: draft.separateTicket,
    // Invalid text stays as typed, so the draft counts as changed; the form does not send it.
    priceFrom: price === 'invalid' ? draft.priceFrom.trim() : price,
    // A currency without a price is noise on the card, so it goes with the price.
    priceCurrency: price === null ? null : text(draft.priceCurrency.toUpperCase()),
    opensAt: text(draft.opensAt),
    closesAt: text(draft.closesAt),
    attractionIds: draft.attractionIds.length > 0 ? draft.attractionIds : null,
    url: text(draft.url),
    sourceUrl: text(draft.sourceUrl),
    confirmedAt: text(draft.confirmedAt),
    note: text(draft.note),
  };
}

/**
 * The `PATCH seasons/:id` body of an edit: the fields that changed, and null for one that was
 * emptied, which the API clears. Left out, the API would keep the stored value.
 */
export function seasonPatch(season: ParkSeason, draft: SeasonDraft): SeasonWriteBody {
  const before = seasonBody(seasonDraft(season, season.startDate));
  const after = seasonBody(draft);
  const patch: SeasonWriteBody = {};
  for (const key of Object.keys(after)) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) patch[key] = after[key];
  }
  return patch;
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const CURRENCY = /^[A-Z]{3}$/;

function tooLong(value: string, limit: number): string | null {
  return value.trim().length > limit ? `Höchstens ${limit.toLocaleString('de-DE')} Zeichen.` : null;
}

function urlProblem(value: string): string | null {
  const text = value.trim();
  if (text === '') return null;
  if (!isHttpUrl(text)) return 'Eine vollständige Adresse mit http:// oder https://.';
  return tooLong(text, SEASON_LIMITS.url);
}

/**
 * The API's checks on a season, in German at the field each belongs to, so the form names a
 * problem while it is typed instead of after a 400. Empty when the draft would save.
 */
export function seasonProblems(draft: SeasonDraft): Partial<Record<SeasonField, string>> {
  const problems: Partial<Record<SeasonField, string>> = {};
  const set = (field: SeasonField, message: string | null) => {
    if (message && !problems[field]) problems[field] = message;
  };

  const start = isRealDay(draft.startDate);
  const end = isRealDay(draft.endDate);
  if (!start) set('startDate', 'Ein Tag, an dem die Saison beginnt.');
  if (!end) set('endDate', 'Ein Tag, an dem die Saison endet.');
  if (start && end && draft.endDate < draft.startDate) set('endDate', 'Bis liegt vor Von.');

  set('name', tooLong(draft.name, SEASON_LIMITS.name));
  set('note', tooLong(draft.note, SEASON_LIMITS.note));

  const dates = uniqueDays(draft.dates ?? []);
  if (dates.length > SEASON_LIMITS.dates) {
    set('dates', `Höchstens ${SEASON_LIMITS.dates} Termine.`);
  }
  if (start && end) {
    const outside = datesOutsideRange(dates, draft.startDate, draft.endDate).length;
    if (outside > 0) {
      set(
        'dates',
        outside === 1
          ? 'Ein Termin liegt außerhalb des Zeitraums.'
          : `${outside} Termine liegen außerhalb des Zeitraums.`
      );
    }
  }

  const price = parseSeasonPrice(draft.priceFrom);
  if (price === 'invalid') set('priceFrom', 'Eine Zahl ab 0, etwa 53,50.');
  const currency = draft.priceCurrency.trim().toUpperCase();
  if (price !== null && !CURRENCY.test(currency)) {
    set('priceCurrency', 'Zum Preis gehört die Währung, drei Buchstaben wie EUR.');
  }

  for (const field of ['opensAt', 'closesAt'] as const) {
    const value = draft[field].trim();
    if (value && !TIME.test(value)) set(field, 'Eine Uhrzeit als HH:MM, etwa 19:00.');
  }

  set('url', urlProblem(draft.url));
  set('sourceUrl', urlProblem(draft.sourceUrl));

  if (draft.confirmedAt && Number.isNaN(Date.parse(draft.confirmedAt))) {
    set('confirmedAt', 'Kein Zeitpunkt.');
  }
  return problems;
}

/** An ISO time as a `datetime-local` value in the browser's zone, or empty. */
export function toDateTimeInput(iso: string): string {
  if (!iso || Number.isNaN(Date.parse(iso))) return '';
  return format(parseISO(iso), "yyyy-MM-dd'T'HH:mm");
}

/** A `datetime-local` value, read in the browser's zone, as ISO; empty stays empty. */
export function fromDateTimeInput(value: string): string {
  const time = value ? new Date(value).getTime() : Number.NaN;
  return Number.isNaN(time) ? '' : new Date(time).toISOString();
}
