import {
  trackSiteEvent,
  type TicketLinkKind,
  type TicketLinkSurface,
  type TicketMode,
  type TripDaysBucket,
  type SiteEventMap,
} from '@/lib/analytics/site-analytics';
import { daysBetween } from '@/lib/utils/park-day';
import { DEFAULT_FIND_DAYS } from './plan-query';
import type { TripPlan } from './plan';
import type { TicketLink, TripWhen } from './types';

/**
 * The trip planner's events as our own statistic counts them: the properties each event carries,
 * built from what the planner knows. Pure, so `scripts/test-orlando-plan.mjs` pins them; the calls
 * sit where the visitor acts, through {@link trackTripEvent}, which adds the region. Low-cardinality
 * values only, never anything a person typed
 * (docs/development/analytics.md#what-an-event-never-carries); docs/features/orlando-planner.md#analytics.
 */

/** A trip planner event's name: every `trip_*` event of the statistic. */
export type TripEventName = Extract<keyof SiteEventMap, `trip_${string}`>;

/** A trip planner event's own properties, without the region {@link trackTripEvent} adds. */
export type TripEventProps<Name extends TripEventName> = Omit<SiteEventMap[Name], 'region'>;

/** The properties after an event's name: optional for an event with none of its own. */
export type TripEventArgs<Name extends TripEventName> =
  object extends TripEventProps<Name>
    ? [props?: TripEventProps<Name>]
    : [props: TripEventProps<Name>];

/** {@link trackTripEvent} with its region already given, as `useTripEvents` hands it out. */
export type TrackTripEvent = <Name extends TripEventName>(
  name: Name,
  ...args: TripEventArgs<Name>
) => void;

/** Report a trip planner event for the region it plans, by its slug (`orlando`). */
export function trackTripEvent<Name extends TripEventName>(
  region: string,
  name: Name,
  ...[props]: TripEventArgs<Name>
): void {
  trackSiteEvent<string>(name, { region, ...props } as Record<string, string | number | boolean>);
}

/** A seller's name as a property value: the characters the statistic keeps, at most 60. */
export function sellerProp(seller: string): string {
  const clean = seller
    .replace(/[^\p{L}\p{N} ._:/+#-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
  return clean || 'unknown';
}

/** A link's host without `www.`, or `unknown` for a url that is none. */
export function hostProp(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '') || 'unknown';
  } catch {
    return 'unknown';
  }
}

/** Which tickets a plan was made with, from the plan's own tickets and suggestions. */
export function ticketModeOf(owned: number, suggested: number): TicketMode {
  if (owned > 0 && suggested > 0) return 'mixed';
  return owned > 0 ? 'owned' : 'plan_first';
}

/** `ticket_link_clicked` for one link of the list a visitor saw, `index` 0-based in that list. */
export function ticketLinkClickProps(input: {
  product: string;
  link: TicketLink;
  index: number;
  visitor: { locale: string; market: 'us' | 'uk' | 'intl' | null };
  surface: TicketLinkSurface;
  ticketMode: TicketMode;
}): SiteEventMap['ticket_link_clicked'] {
  const { link, visitor } = input;
  const kind: TicketLinkKind = link.sponsored ? 'sponsored' : link.official ? 'official' : 'plain';
  return {
    product: input.product,
    seller: sellerProp(link.seller),
    host: hostProp(link.url),
    kind,
    position: input.index + 1,
    locale_match:
      Boolean(link.locales?.includes(visitor.locale)) ||
      Boolean(visitor.market && link.markets?.includes(visitor.market)),
    surface: input.surface,
    ticket_mode: input.ticketMode,
  };
}

/** A trip's length as a bucket, arrival and departure included. */
export function tripDaysBucket(days: number): TripDaysBucket {
  if (days <= 4) return '1-4';
  if (days <= 7) return '5-7';
  if (days <= 10) return '8-10';
  return days <= 14 ? '11-14' : '15-21';
}

/**
 * `trip_plan_requested` from the request's own query, the API's names: what the visitor decided,
 * never the dates themselves. `parks` 0 is the headliners, the API's default. `hopperResorts` are
 * the region's resorts that sell a hopper (`hopperResorts` in plan-tickets), so `hopper` says
 * none, some or all of them without naming a resort of any one region.
 */
export function tripPlanRequestProps(
  query: Readonly<Record<string, string>>,
  mode: 'dates' | 'when',
  hopperResorts: readonly string[]
): TripEventProps<'trip_plan_requested'> {
  const days =
    mode === 'when'
      ? Number(query.days ?? DEFAULT_FIND_DAYS)
      : query.from && query.to
        ? daysBetween(query.from, query.to) + 1
        : 0;
  const chosen = (query.hopper ?? '').split(',').filter(Boolean);
  const every =
    query.ticket === 'hopper' ||
    (hopperResorts.length > 0 && hopperResorts.every((r) => chosen.includes(r)));
  return {
    mode,
    days: tripDaysBucket(days),
    parks: query.parks ? query.parks.split(',').length : 0,
    tickets: query.tickets ? 'owned' : 'none',
    hopper: every ? 'all' : chosen.length > 0 ? 'some' : 'none',
    blocks: query.blocks === '1' ? 'on' : query.blocks === '0' ? 'off' : 'default',
    rest: query.rest === 'none' ? 'none' : query.rest?.startsWith('max:') ? 'max' : 'auto',
  };
}

/** The rules a plan loosened, the one that weighs most first: a day outside its ticket. */
const RELAXED: ReadonlyArray<[string, 'ticket_window' | 'blocks' | 'streak']> = [
  ['ticket_window_relaxed', 'ticket_window'],
  ['blocks_relaxed', 'blocks'],
  ['streak_relaxed', 'streak'],
];

/** `trip_plan_shown` for a plan on screen: ok, or relaxed with the rule, and what it left out. */
export function tripPlanShownProps(
  plan: Pick<TripPlan, 'meta' | 'unplaced'>
): TripEventProps<'trip_plan_shown'> {
  const relaxed = RELAXED.find(([code]) => plan.meta.relaxed?.includes(code))?.[1];
  return {
    mode: 'dates',
    outcome: relaxed ? 'relaxed' : 'ok',
    ...(relaxed && { relaxed }),
    unplaced: plan.unplaced.length,
  };
}

/** `trip_plan_shown` for a search's answer, with the windows it found. */
export function tripWhenShownProps(
  when: Pick<TripWhen, 'windows'>
): TripEventProps<'trip_plan_shown'> {
  return { mode: 'when', outcome: 'ok', windows: when.windows.length };
}

/** `trip_plan_shown` for a request that failed, with its status (0: no answer at all). */
export function tripPlanFailedProps(
  status: number | undefined,
  mode: 'dates' | 'when'
): TripEventProps<'trip_plan_shown'> {
  return { mode, outcome: 'error', status: status ?? 0 };
}
