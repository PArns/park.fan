import type { PlannerBlockIcon, PlannerDayPrefs, PlannerGeo } from '@/lib/planner/types';
import type { RopeDropStrength } from '@/lib/api/types';
import { PLANNER_BLOCK_ICONS } from '@/lib/planner/types';
import { MAX_RIDER_CM, MIN_RIDER_CM } from '@/lib/planner/party';
import { MAX_THRESHOLD_MIN, MIN_THRESHOLD_MIN } from '@/lib/push/threshold-minutes';
import { isValidLocale, type Locale } from '@/i18n/config';
import { safeAssistantHref } from './links';
import type { FavoriteType } from '@/lib/utils/favorites';
import { isUuid } from '@/lib/utils';

/** The park as the API names it for the planner. */
export interface AssistantPlannerPark {
  slug: string;
  name: string;
  geo: PlannerGeo;
  timezone: string;
}

/** A card from live data (parks, rides, days, stats, shows, restaurants); mirrors the API's `AssistantCard`. */
export type AssistantCard =
  | {
      kind: 'park';
      name: string;
      place: string | null;
      status: string | null;
      crowdLevel: string | null;
      opens: string | null;
      closes: string | null;
      waits: Array<{ name: string; waitMinutes: number }>;
      url: string | null;
    }
  | {
      kind: 'ride';
      name: string;
      park: string | null;
      status: string | null;
      crowdLevel: string | null;
      waitMinutes: number | null;
      url: string | null;
      /** Each of these is sent only when it holds. */
      ropeDrop?: { strength: RopeDropStrength | null; savings: number };
      singleRider?: true;
      virtualLine?: true;
      paidExpress?: true;
      worksPeriod?: true;
      outOfSeason?: true;
    }
  | {
      kind: 'rides';
      park: string;
      order: 'longest' | 'shortest';
      /** A row without a wait shows its status; answers stored before `status` have none. */
      rides: Array<{
        name: string;
        waitMinutes: number | null;
        status?: string | null;
        url?: string | null;
      }>;
      url: string | null;
    }
  | {
      kind: 'parks';
      parks: Array<{
        name: string;
        place: string | null;
        url: string | null;
        status?: string | null;
        crowdLevel?: string | null;
        avgWaitMinutes?: number | null;
      }>;
    }
  | {
      kind: 'calendar';
      park: string;
      url: string | null;
      /** Consecutive park-local days; the hours are instants with the park's offset. */
      days: Array<{
        date: string;
        status: 'OPERATING' | 'CLOSED' | 'UNKNOWN';
        crowdLevel: string | null;
        opens: string | null;
        closes: string | null;
        holiday: boolean;
      }>;
    }
  | {
      kind: 'tiles';
      park: string;
      url: string | null;
      date: string;
      /** Right now, or a forecast for `date`. */
      live: boolean;
      crowdLevel: string | null;
      avgWaitMinutes: number | null;
      /** Live: the highest so far today; forecast: the expected headliner peak. */
      peakWaitMinutes: number | null;
      openRides: number | null;
      totalRides: number | null;
      opens: string | null;
      closes: string | null;
      weather: {
        condition: string | null;
        tempMin: number | null;
        tempMax: number | null;
        /** WMO code; the condition text is the fallback without one. */
        weatherCode?: number | null;
        /** The season's usual values, past the forecast's reach. */
        climateNormal: boolean;
      } | null;
    }
  | {
      kind: 'shows';
      park: string;
      url: string | null;
      date: string;
      /** `times` are instants with the park's offset. */
      shows: Array<{ name: string; status: string | null; times: string[]; url: string | null }>;
    }
  | {
      kind: 'restaurants';
      park: string;
      url: string | null;
      restaurants: Array<{
        name: string;
        status: string | null;
        land: string | null;
        cuisine: string | null;
        requiresReservation: boolean | null;
      }>;
    };

/** What Parky may ask the widget to do; mirrors the API's `ClientAction`. */
export type AssistantAction =
  | { type: 'navigate'; path: string }
  | { type: 'card'; card: AssistantCard }
  | { type: 'request_location' }
  | { type: 'planner_open_day'; park: AssistantPlannerPark; date: string }
  | {
      type: 'planner_add_rides';
      park: AssistantPlannerPark;
      date: string;
      rides: Array<{ slug: string; name: string }>;
    }
  | {
      type: 'planner_add_block';
      park: AssistantPlannerPark;
      date: string;
      block: {
        label: string;
        icon: PlannerBlockIcon;
        startMinute?: number;
        durationMinutes: number;
      };
    }
  | {
      type: 'planner_optimize';
      park: AssistantPlannerPark;
      date: string;
      mode: 'order' | 'headliners';
    }
  | { type: 'planner_remove'; park: AssistantPlannerPark; date: string; entryIds: string[] }
  | {
      type: 'planner_move';
      park: AssistantPlannerPark;
      date: string;
      entryId: string;
      toIndex: number;
    }
  | {
      type: 'planner_update_block';
      park: AssistantPlannerPark;
      date: string;
      entryId: string;
      label?: string;
      /** Park-local `HH:MM`. */
      start?: string;
      durationMinutes?: number;
    }
  | {
      type: 'planner_add_show';
      park: AssistantPlannerPark;
      date: string;
      showSlug: string;
      /** Park-local `HH:MM`, one of the day's showtimes. */
      start: string;
    }
  | {
      type: 'planner_set_prefs';
      park: AssistantPlannerPark;
      date: string;
      prefs: PlannerDayPrefs;
    }
  | {
      type: 'planner_mark_done';
      park: AssistantPlannerPark;
      date: string;
      entryIds: string[];
      done: boolean;
    }
  | { type: 'planner_clear_day'; park: AssistantPlannerPark; date: string }
  | { type: 'planner_reserve_days'; park: AssistantPlannerPark; dates: string[] }
  | { type: 'planner_undo'; park: AssistantPlannerPark; date: string }
  | { type: 'planner_share' }
  | {
      type: 'alert_ride_set';
      park: AssistantPlannerPark;
      /** The ride's UUID, which the push endpoint takes as `attractionId`. */
      rideId: string;
      rideSlug: string;
      rideName: string;
      kind: 'wait_below' | 'reopen';
      /** With `wait_below` only. */
      thresholdMinutes?: number;
    }
  | {
      type: 'alert_show_set';
      park: AssistantPlannerPark;
      showId: string;
      showSlug: string;
      showName: string;
      /** The performance as an ISO instant with the park's offset, the endpoint's `startTime`. */
      start: string;
    }
  /**
   * Star or unstar one thing, by the id the favourites cookie keeps. `kind` is the favourite's
   * type, since `type` names the action.
   */
  | { type: 'favorite_set'; kind: FavoriteType; id: string; name: string; on: boolean }
  /** Exactly one of the two slugs. */
  | { type: 'alert_remove'; park: AssistantPlannerPark; rideSlug: string; showSlug?: never }
  | { type: 'alert_remove'; park: AssistantPlannerPark; showSlug: string; rideSlug?: never }
  /** The same page in another of the site's languages, once the answer is complete. */
  | { type: 'switch_locale'; locale: Locale }
  /** Parky passed the visitor's feedback on to the team. */
  | { type: 'feedback_sent' };

/** What an answer did, as a chip under it. */
export type AssistantActionChip =
  | 'navigated'
  | 'planned'
  | 'optimized'
  | 'language'
  | 'feedback'
  | 'alert'
  | 'alertRemoved'
  | 'favorite'
  | 'unfavorite';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const OPTIMIZE_MODES = new Set(['order', 'headliners']);
/** Park-local `HH:MM`, the way the planner prints a start. */
const CLOCK = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
/** A planner entry id as `makeId` mints it: a slug and a counter. */
const ENTRY_ID = /^[a-z0-9-]{1,100}$/;
const MAX_PLAN_ENTRIES = 40;
const MAX_RESERVED_DAYS = 14;

/** A zone the browser's `Intl` knows: the planner formats every time of the park in it. */
function isTimeZone(value: unknown): boolean {
  if (typeof value !== 'string' || value.length > 64) return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

const isWhole = (value: unknown, min: number, max: number) =>
  Number.isInteger(value) && (value as number) >= min && (value as number) <= max;

function isPark(value: unknown): value is AssistantPlannerPark {
  const park = value as AssistantPlannerPark | null;
  return (
    !!park &&
    SLUG.test(park.slug) &&
    typeof park.name === 'string' &&
    park.name.length <= 120 &&
    [park.geo?.continent, park.geo?.country, park.geo?.city].every(
      (part) => typeof part === 'string' && SLUG.test(part)
    ) &&
    isTimeZone(park.timezone)
  );
}

const STATUSES = new Set(['OPERATING', 'CLOSED', 'DOWN', 'REFURBISHMENT', 'UNKNOWN']);
const CROWD = new Set(['very_low', 'low', 'moderate', 'high', 'very_high', 'extreme', 'closed']);
const short = (value: unknown, max = 120) => typeof value === 'string' && value.length <= max;
const orNull = (value: unknown, test: (v: unknown) => boolean) => value === null || test(value);

const isSiteUrl = (v: unknown) => typeof v === 'string' && safeAssistantHref(v) !== null;
/** Rides with their waits; `waitless` lets a row go without one (the rides card shows its status). */
const isRideList = (rides: unknown, waitless = false) =>
  Array.isArray(rides) &&
  rides.length <= 10 &&
  rides.every(
    (r) =>
      short(r?.name) &&
      (typeof r?.waitMinutes === 'number' || (waitless && r?.waitMinutes == null)) &&
      (r.url == null || isSiteUrl(r.url))
  );
const isParkList = (parks: unknown) =>
  Array.isArray(parks) &&
  parks.length <= 8 &&
  parks.every((p) => short(p?.name) && orNull(p?.place, short) && orNull(p?.url, isSiteUrl));

/** A checked link as the path it was checked as, so what a card links is what passed. */
const sitePath = (url: string | null | undefined) => (url == null ? null : safeAssistantHref(url));

const status = (v: unknown) => (typeof v === 'string' && STATUSES.has(v) ? v : null);
const RIDE_FLAGS = [
  'singleRider',
  'virtualLine',
  'paidExpress',
  'worksPeriod',
  'outOfSeason',
] as const;
const ROPE_DROP_STRENGTHS = new Set(['high', 'moderate', null]);
const MAX_ROWS = 12;
const MAX_SHOW_TIMES = 24;

const DAY_STATUSES = new Set(['OPERATING', 'CLOSED', 'UNKNOWN']);
const MAX_CALENDAR_DAYS = 42;
const number = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const instant = (v: unknown) =>
  short(v, 40) && !Number.isNaN(Date.parse(v as string)) ? (v as string) : null;
const level = (v: unknown, unknown: boolean) =>
  typeof v === 'string' && (CROWD.has(v) || (unknown && v === 'unknown')) ? v : null;

/** Days in order, one per date, within the six weeks a card can draw. */
function isDayRun(days: unknown): days is Array<{ date: string }> {
  if (!Array.isArray(days) || days.length === 0 || days.length > MAX_CALENDAR_DAYS) return false;
  const dates = days.map((d) =>
    typeof d?.date === 'string' && DAY.test(d.date) ? Date.parse(d.date) : NaN
  );
  return (
    dates.every((at, i) => !Number.isNaN(at) && (i === 0 || at > dates[i - 1])) &&
    dates[dates.length - 1] - dates[0] < MAX_CALENDAR_DAYS * 86_400_000
  );
}

/** Days and stats: what the card cannot draw is dropped, a malformed shape refuses the card. */
function isDaysOrTiles(card: AssistantCard): boolean {
  if (card.kind === 'calendar') {
    if (!isDayRun(card.days)) return false;
    for (const day of card.days) {
      if (!DAY_STATUSES.has(day.status)) day.status = 'UNKNOWN';
      day.crowdLevel = day.status === 'CLOSED' ? null : level(day.crowdLevel, true);
      day.opens = instant(day.opens);
      day.closes = instant(day.closes);
      day.holiday = day.holiday === true;
    }
    return true;
  }
  if (card.kind !== 'tiles' || !DAY.test(card.date) || typeof card.live !== 'boolean') return false;
  card.crowdLevel = level(card.crowdLevel, true);
  card.avgWaitMinutes = number(card.avgWaitMinutes);
  card.peakWaitMinutes = number(card.peakWaitMinutes);
  card.openRides = number(card.openRides);
  card.totalRides = number(card.totalRides);
  card.opens = instant(card.opens);
  card.closes = instant(card.closes);
  const w = card.weather;
  card.weather =
    w && typeof w === 'object'
      ? {
          condition: short(w.condition, 40) ? w.condition : null,
          tempMin: number(w.tempMin),
          tempMax: number(w.tempMax),
          weatherCode: number(w.weatherCode),
          climateNormal: w.climateNormal === true,
        }
      : null;
  return true;
}

/** Shows and restaurants: a row with a bad link or name refuses the card, a bad value is dropped. */
function isShowsOrRestaurants(card: AssistantCard): boolean {
  if (card.kind === 'shows') {
    if (!DAY.test(card.date) || !Array.isArray(card.shows) || card.shows.length > MAX_ROWS) {
      return false;
    }
    for (const show of card.shows) {
      if (!short(show?.name) || !orNull(show.url ?? null, isSiteUrl)) return false;
      show.url = sitePath(show.url);
      show.status = status(show.status);
      show.times = Array.isArray(show.times)
        ? show.times.slice(0, MAX_SHOW_TIMES).flatMap((t) => instant(t) ?? [])
        : [];
    }
    return true;
  }
  if (card.kind !== 'restaurants') return false;
  if (!Array.isArray(card.restaurants) || card.restaurants.length > MAX_ROWS) return false;
  for (const r of card.restaurants) {
    if (!short(r?.name)) return false;
    r.status = status(r.status);
    r.land = short(r.land) ? r.land : null;
    r.cuisine = short(r.cuisine) ? r.cuisine : null;
    r.requiresReservation =
      typeof r.requiresReservation === 'boolean' ? r.requiresReservation : null;
  }
  return true;
}

/** A ride card's extras, kept only in the form the badges draw. */
function readRideExtras(card: Extract<AssistantCard, { kind: 'ride' }>): void {
  for (const flag of RIDE_FLAGS) if (card[flag] !== true) delete card[flag];
  const rope = card.ropeDrop;
  if (
    rope !== undefined &&
    !(number(rope?.savings) !== null && ROPE_DROP_STRENGTHS.has(rope.strength ?? null))
  ) {
    delete card.ropeDrop;
  }
}

function isCard(card: AssistantCard | undefined): card is AssistantCard {
  if (!card) return false;
  if (card.kind === 'parks') {
    if (!isParkList(card.parks)) return false;
    // A status or level without a badge here is dropped, not the card.
    for (const park of card.parks) {
      park.url = sitePath(park.url);
      if (park.status != null && !STATUSES.has(park.status)) park.status = null;
      if (park.crowdLevel != null && !CROWD.has(park.crowdLevel)) park.crowdLevel = null;
      if (park.avgWaitMinutes != null && typeof park.avgWaitMinutes !== 'number') {
        park.avgWaitMinutes = null;
      }
    }
    return true;
  }
  if (!orNull(card.url, isSiteUrl)) return false;
  card.url = sitePath(card.url);
  if (card.kind === 'calendar' || card.kind === 'tiles') {
    return short(card.park) && isDaysOrTiles(card);
  }
  if (card.kind === 'shows' || card.kind === 'restaurants') {
    return short(card.park) && isShowsOrRestaurants(card);
  }
  if (card.kind === 'rides') {
    if (!short(card.park) || !isRideList(card.rides, true)) return false;
    for (const ride of card.rides) {
      ride.url = sitePath(ride.url);
      ride.waitMinutes = number(ride.waitMinutes);
      ride.status = status(ride.status);
    }
    return true;
  }
  if (!short(card.name)) return false;
  // A status or level this widget has no badge for is left out rather than refusing the card.
  if (card.status !== null && !STATUSES.has(card.status)) card.status = null;
  if (card.crowdLevel !== null && !CROWD.has(card.crowdLevel)) card.crowdLevel = null;
  if (card.kind === 'ride') {
    readRideExtras(card);
    return orNull(card.park, short) && orNull(card.waitMinutes, (v) => typeof v === 'number');
  }
  return card.kind === 'park' && orNull(card.place, short) && isRideList(card.waits);
}

/** The entry ids that look like ids, at most a day's worth, one each; null where none is left. */
function entryIds(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const ids = [...new Set(value.filter((id) => typeof id === 'string' && ENTRY_ID.test(id)))];
  return ids.length > 0 ? ids.slice(0, MAX_PLAN_ENTRIES) : null;
}

/**
 * The planner's edits, each built anew from the fields it names, so nothing else rides along. An
 * optional field that fails its check is left out; a required one refuses the action.
 */
function readPlannerEdit(action: Record<string, unknown>): AssistantAction | null {
  const { park, date } = action;
  if (!isPark(park)) return null;
  if (action.type === 'planner_reserve_days') {
    const dates = Array.isArray(action.dates)
      ? [...new Set(action.dates.filter((d) => typeof d === 'string' && DAY.test(d)))]
      : [];
    return dates.length > 0
      ? { type: 'planner_reserve_days', park, dates: dates.slice(0, MAX_RESERVED_DAYS) }
      : null;
  }
  if (typeof date !== 'string' || !DAY.test(date)) return null;
  const day = { park, date };
  switch (action.type) {
    case 'planner_remove': {
      const ids = entryIds(action.entryIds);
      return ids ? { type: 'planner_remove', ...day, entryIds: ids } : null;
    }
    case 'planner_mark_done': {
      const ids = entryIds(action.entryIds);
      return ids && typeof action.done === 'boolean'
        ? { type: 'planner_mark_done', ...day, entryIds: ids, done: action.done }
        : null;
    }
    case 'planner_move':
      return typeof action.entryId === 'string' &&
        ENTRY_ID.test(action.entryId) &&
        isWhole(action.toIndex, 0, MAX_PLAN_ENTRIES - 1)
        ? {
            type: 'planner_move',
            ...day,
            entryId: action.entryId,
            toIndex: action.toIndex as number,
          }
        : null;
    case 'planner_update_block': {
      if (typeof action.entryId !== 'string' || !ENTRY_ID.test(action.entryId)) return null;
      const edit = {
        ...(short(action.label, 40) && (action.label as string).trim()
          ? { label: (action.label as string).trim() }
          : {}),
        ...(typeof action.start === 'string' && CLOCK.test(action.start)
          ? { start: action.start }
          : {}),
        ...(isWhole(action.durationMinutes, 10, 240)
          ? { durationMinutes: action.durationMinutes as number }
          : {}),
      };
      return Object.keys(edit).length > 0
        ? { type: 'planner_update_block', ...day, entryId: action.entryId, ...edit }
        : null;
    }
    case 'planner_add_show':
      return typeof action.showSlug === 'string' &&
        SLUG.test(action.showSlug) &&
        typeof action.start === 'string' &&
        CLOCK.test(action.start)
        ? { type: 'planner_add_show', ...day, showSlug: action.showSlug, start: action.start }
        : null;
    case 'planner_set_prefs': {
      const raw = (action.prefs ?? {}) as Record<string, unknown>;
      const prefs: PlannerDayPrefs = {
        ...(isWhole(raw.riderHeightCm, MIN_RIDER_CM, MAX_RIDER_CM)
          ? { riderHeightCm: raw.riderHeightCm as number }
          : {}),
        ...(typeof raw.avoidWet === 'boolean' ? { avoidWet: raw.avoidWet } : {}),
        ...(typeof raw.earlyEntry === 'boolean' ? { earlyEntry: raw.earlyEntry } : {}),
      };
      return Object.keys(prefs).length > 0 ? { type: 'planner_set_prefs', ...day, prefs } : null;
    }
    case 'planner_clear_day':
    case 'planner_undo':
      return { type: action.type, ...day };
    default:
      return null;
  }
}

const FAVORITE_TYPES = new Set(['park', 'attraction', 'show', 'restaurant']);

const isSlug = (value: unknown): value is string => typeof value === 'string' && SLUG.test(value);
const isName = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= 120;

/** A reminder Parky sets or takes away, built anew like the planner's edits. */
function readAlert(action: Record<string, unknown>): AssistantAction | null {
  const { park } = action;
  if (!isPark(park)) return null;
  switch (action.type) {
    case 'alert_ride_set': {
      if (
        typeof action.rideId !== 'string' ||
        !isUuid(action.rideId) ||
        !isSlug(action.rideSlug) ||
        !isName(action.rideName)
      ) {
        return null;
      }
      const ride = {
        park,
        rideId: action.rideId,
        rideSlug: action.rideSlug,
        rideName: action.rideName.trim(),
      };
      if (action.kind === 'reopen') return { type: 'alert_ride_set', ...ride, kind: 'reopen' };
      return action.kind === 'wait_below' &&
        isWhole(action.thresholdMinutes, MIN_THRESHOLD_MIN, MAX_THRESHOLD_MIN)
        ? {
            type: 'alert_ride_set',
            ...ride,
            kind: 'wait_below',
            thresholdMinutes: action.thresholdMinutes as number,
          }
        : null;
    }
    case 'alert_show_set': {
      const start = instant(action.start);
      return typeof action.showId === 'string' &&
        isUuid(action.showId) &&
        isSlug(action.showSlug) &&
        isName(action.showName) &&
        start
        ? {
            type: 'alert_show_set',
            park,
            showId: action.showId,
            showSlug: action.showSlug,
            showName: action.showName.trim(),
            start,
          }
        : null;
    }
    case 'alert_remove':
      // Exactly one: a removal names what it takes away.
      if (isSlug(action.rideSlug) === isSlug(action.showSlug)) return null;
      return isSlug(action.rideSlug)
        ? { type: 'alert_remove', park, rideSlug: action.rideSlug }
        : { type: 'alert_remove', park, showSlug: action.showSlug as string };
    default:
      return null;
  }
}

/**
 * The action as the widget will carry it out, or null. Checked again here although the API built
 * it: the stream is model-driven, and a page change or a planner write is the user's state.
 */
export function readAssistantAction(raw: unknown): AssistantAction | null {
  const action = raw as AssistantAction | null;
  switch (action?.type) {
    case 'navigate': {
      const path = typeof action.path === 'string' ? safeAssistantHref(action.path) : null;
      return path ? { type: 'navigate', path } : null;
    }
    case 'request_location':
      return { type: 'request_location' };
    case 'feedback_sent':
      return { type: 'feedback_sent' };
    case 'switch_locale':
      // One of the site's six, nothing else: a new object, so no other field rides along.
      return typeof action.locale === 'string' && isValidLocale(action.locale)
        ? { type: 'switch_locale', locale: action.locale }
        : null;
    case 'card':
      return isCard(action.card) ? action : null;
    case 'planner_open_day':
      return isPark(action.park) && DAY.test(action.date) ? action : null;
    case 'planner_optimize':
      return isPark(action.park) && DAY.test(action.date) && OPTIMIZE_MODES.has(action.mode)
        ? action
        : null;
    case 'planner_add_rides':
      return isPark(action.park) &&
        DAY.test(action.date) &&
        Array.isArray(action.rides) &&
        action.rides.length <= 10 &&
        action.rides.every((ride) => SLUG.test(ride.slug) && short(ride.name))
        ? action
        : null;
    case 'planner_add_block':
      return isPark(action.park) &&
        DAY.test(action.date) &&
        short(action.block?.label, 40) &&
        (PLANNER_BLOCK_ICONS as readonly string[]).includes(action.block.icon) &&
        isWhole(action.block.durationMinutes, 10, 240) &&
        (action.block.startMinute == null || isWhole(action.block.startMinute, 0, 24 * 60 - 1))
        ? action
        : null;
    case 'planner_share':
      return { type: 'planner_share' };
    case 'planner_remove':
    case 'planner_move':
    case 'planner_update_block':
    case 'planner_add_show':
    case 'planner_set_prefs':
    case 'planner_mark_done':
    case 'planner_clear_day':
    case 'planner_reserve_days':
    case 'planner_undo':
      return readPlannerEdit(action as unknown as Record<string, unknown>);
    case 'favorite_set': {
      const raw = action as unknown as Record<string, unknown>;
      // `type` is taken by the action itself; the API may name the favourite's `favoriteType`.
      const kind = raw.kind ?? raw.favoriteType;
      return typeof kind === 'string' &&
        FAVORITE_TYPES.has(kind) &&
        typeof raw.id === 'string' &&
        isUuid(raw.id) &&
        isName(raw.name) &&
        typeof raw.on === 'boolean'
        ? {
            type: 'favorite_set',
            kind: kind as FavoriteType,
            id: raw.id,
            name: raw.name.trim(),
            on: raw.on,
          }
        : null;
    }
    case 'alert_ride_set':
    case 'alert_show_set':
    case 'alert_remove':
      return readAlert(action as unknown as Record<string, unknown>);
    default:
      return null;
  }
}
