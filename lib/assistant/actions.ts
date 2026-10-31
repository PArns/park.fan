import type { PlannerBlockIcon, PlannerGeo } from '@/lib/planner/types';
import { PLANNER_BLOCK_ICONS } from '@/lib/planner/types';
import { locales } from '@/i18n/config';
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
    };

/** What an answer did, as a chip under it. */
export type AssistantActionChip = 'navigated' | 'planned' | 'optimized';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

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
    typeof park.timezone === 'string'
  );
}

const STATUSES = new Set(['OPERATING', 'CLOSED', 'DOWN', 'REFURBISHMENT', 'UNKNOWN']);
const CROWD = new Set(['very_low', 'low', 'moderate', 'high', 'very_high', 'extreme', 'closed']);
const short = (value: unknown, max = 120) => typeof value === 'string' && value.length <= max;
const orNull = (value: unknown, test: (v: unknown) => boolean) => value === null || test(value);

function isCard(card: AssistantCard | undefined): card is AssistantCard {
  if (!card || !short(card.name)) return false;
  // A status or level this widget has no badge for is left out rather than refusing the card.
  if (card.status !== null && !STATUSES.has(card.status)) card.status = null;
  if (card.crowdLevel !== null && !CROWD.has(card.crowdLevel)) card.crowdLevel = null;
  if (!orNull(card.url, (v) => typeof v === 'string' && safeAssistantHref(v) !== null)) {
    return false;
  }
  if (card.kind === 'ride') {
    return orNull(card.park, short) && orNull(card.waitMinutes, (v) => typeof v === 'number');
  }
  return (
    card.kind === 'park' &&
    orNull(card.place, short) &&
    Array.isArray(card.waits) &&
    card.waits.length <= 5 &&
    card.waits.every((w) => short(w.name) && typeof w.waitMinutes === 'number')
  );
}

/**
 * The action as the widget will carry it out, or null. Checked again here although the API built
 * it: the stream is model-driven, and a page change or a planner write is the user's state.
 */
export function readAssistantAction(raw: unknown): AssistantAction | null {
  const action = raw as AssistantAction | null;
  switch (action?.type) {
    case 'navigate':
      return safeAssistantHref(action.path) ? action : null;
    case 'request_location':
      return action;
    case 'card':
      return isCard(action.card) ? action : null;
    case 'planner_open_day':
    case 'planner_optimize':
      return isPark(action.park) && DAY.test(action.date) ? action : null;
    case 'planner_add_rides':
      return isPark(action.park) &&
        DAY.test(action.date) &&
        Array.isArray(action.rides) &&
        action.rides.length <= 10 &&
        action.rides.every((ride) => SLUG.test(ride.slug) && typeof ride.name === 'string')
        ? action
        : null;
    case 'planner_add_block':
      return isPark(action.park) &&
        DAY.test(action.date) &&
        typeof action.block?.label === 'string' &&
        action.block.label.length <= 40 &&
        (PLANNER_BLOCK_ICONS as readonly string[]).includes(action.block.icon)
        ? action
        : null;
    default:
      return null;
  }
}

/** A site path with the reader's locale in front, as the site's own links carry it. */
export function localizedPath(path: string, locale: string): string {
  const first = path.split('/')[1] ?? '';
  return (locales as readonly string[]).includes(first) ? path : `/${locale}${path}`;
}
