import type { PlannerBlockIcon, PlannerGeo } from '@/lib/planner/types';
import { PLANNER_BLOCK_ICONS } from '@/lib/planner/types';
import { isValidLocale, type Locale } from '@/i18n/config';
import { safeAssistantHref } from './links';

/** The park as the API names it for the planner. */
export interface AssistantPlannerPark {
  slug: string;
  name: string;
  geo: PlannerGeo;
  timezone: string;
}

/** A park or ride card from live data; mirrors the API's `AssistantCard`. */
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
    }
  | {
      kind: 'rides';
      park: string;
      order: 'longest' | 'shortest';
      rides: Array<{ name: string; waitMinutes: number; url?: string | null }>;
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
  /** The same page in another of the site's languages, once the answer is complete. */
  | { type: 'switch_locale'; locale: Locale }
  /** Parky passed the visitor's feedback on to the team. */
  | { type: 'feedback_sent' };

/** What an answer did, as a chip under it. */
export type AssistantActionChip = 'navigated' | 'planned' | 'optimized' | 'language' | 'feedback';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const OPTIMIZE_MODES = new Set(['order', 'headliners']);

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
const isRideList = (rides: unknown) =>
  Array.isArray(rides) &&
  rides.length <= 10 &&
  rides.every(
    (r) =>
      short(r?.name) && typeof r?.waitMinutes === 'number' && (r.url == null || isSiteUrl(r.url))
  );
const isParkList = (parks: unknown) =>
  Array.isArray(parks) &&
  parks.length <= 8 &&
  parks.every((p) => short(p?.name) && orNull(p?.place, short) && orNull(p?.url, isSiteUrl));

/** A checked link as the path it was checked as, so what a card links is what passed. */
const sitePath = (url: string | null | undefined) => (url == null ? null : safeAssistantHref(url));

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
  if (card.kind === 'rides') {
    if (!short(card.park) || !isRideList(card.rides)) return false;
    for (const ride of card.rides) ride.url = sitePath(ride.url);
    return true;
  }
  if (!short(card.name)) return false;
  // A status or level this widget has no badge for is left out rather than refusing the card.
  if (card.status !== null && !STATUSES.has(card.status)) card.status = null;
  if (card.crowdLevel !== null && !CROWD.has(card.crowdLevel)) card.crowdLevel = null;
  if (card.kind === 'ride') {
    return orNull(card.park, short) && orNull(card.waitMinutes, (v) => typeof v === 'number');
  }
  return card.kind === 'park' && orNull(card.place, short) && isRideList(card.waits);
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
    default:
      return null;
  }
}
