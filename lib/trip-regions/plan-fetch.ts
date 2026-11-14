import { tripRegionRelayUrl, type TripRelayRoute } from './paths';
import type { TripPlan } from './plan';
import { WHEN_HOLIDAY_COUNTRIES } from './plan-when';
import type { TripCalendar, TripSchoolBreaks, TripWhen } from './types';

/**
 * How the planner asks for a plan and a calendar window: through the same-origin relay
 * (`app/api/trip-regions/[...path]/route.ts`), which adds the site's data key. The fetches are
 * plain functions so the query keys and the error rules can be tested without React; the hooks
 * that debounce and cache them are in `components/trip-regions/planner/use-trip-plan.ts`.
 */

/** How long the planner waits for the controls to settle before it asks for a plan. */
export const PLAN_DEBOUNCE_MS = 400;

/**
 * A request the planner could not complete. `invalid` is the API's 400: the trip as asked cannot
 * be planned, and asking again changes nothing, so it is not retried. `failed` is anything else
 * (the network, a 5xx, the relay's 502) and is.
 */
export class PlanRequestError extends Error {
  readonly kind: 'invalid' | 'failed';
  readonly status: number;

  constructor(kind: 'invalid' | 'failed', status: number, message: string) {
    super(message);
    this.name = 'PlanRequestError';
    this.kind = kind;
    this.status = status;
  }
}

/** Whether a failed request is worth asking again. */
export function retryPlanRequest(failureCount: number, error: unknown): boolean {
  if (error instanceof PlanRequestError && error.kind === 'invalid') return false;
  return failureCount < 2;
}

/** The plan's cache key: its region and request query, in the order the URL writes it. */
export function planQueryKey(region: string, query: Record<string, string>): readonly unknown[] {
  return ['trip-plan', region, new URLSearchParams(query).toString()];
}

/** A calendar window's cache key, shared by the date sheet and the result. */
export function calendarQueryKey(region: string, from: string, to: string): readonly unknown[] {
  return ['trip-calendar', region, from, to];
}

async function readJson<T>(response: Response, what: string): Promise<T> {
  if (response.ok) return (await response.json()) as T;
  let message = `${what}: ${response.status}`;
  try {
    const body = (await response.json()) as { message?: string | string[]; error?: string };
    const text = Array.isArray(body.message)
      ? body.message.join('; ')
      : (body.message ?? body.error);
    if (text) message = text;
  } catch {
    // Not JSON: the status says enough.
  }
  throw new PlanRequestError(
    response.status === 400 ? 'invalid' : 'failed',
    response.status,
    message
  );
}

/** One keyed route through the relay, its failures as {@link PlanRequestError}s. */
async function relayGet<T>(
  region: string,
  route: TripRelayRoute,
  query: Record<string, string>,
  signal: AbortSignal | undefined
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(tripRegionRelayUrl(region, route, query), { signal });
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') throw error;
    throw new PlanRequestError('failed', 0, (error as Error)?.message ?? 'network');
  }
  return readJson<T>(response, route);
}

/** `GET …/plan` through the relay. Throws a {@link PlanRequestError}. */
export function fetchTripPlan(
  region: string,
  query: Record<string, string>,
  signal?: AbortSignal
): Promise<TripPlan> {
  return relayGet<TripPlan>(region, 'plan', query, signal);
}

/** `GET …/calendar` through the relay, for a window of at most 92 days. */
export function fetchTripCalendar(
  region: string,
  from: string,
  to: string,
  signal?: AbortSignal
): Promise<TripCalendar> {
  return relayGet<TripCalendar>(region, 'calendar', { from, to }, signal);
}

/** The When search's cache key: its region and request query. */
export function whenQueryKey(region: string, query: Record<string, string>): readonly unknown[] {
  return ['trip-when', region, new URLSearchParams(query).toString()];
}

/** `GET …/when` through the relay. Throws a {@link PlanRequestError}. */
export function fetchTripWhen(
  region: string,
  query: Record<string, string>,
  signal?: AbortSignal
): Promise<TripWhen> {
  return relayGet<TripWhen>(region, 'when', query, signal);
}

/** The school-holiday regions' cache key, per trip region (its route answers them). */
export function schoolBreaksQueryKey(region: string): readonly unknown[] {
  return ['trip-school-breaks', region];
}

/** `GET …/school-breaks` through the relay, for the countries the When mode's picker offers. */
export function fetchSchoolBreaks(region: string, signal?: AbortSignal): Promise<TripSchoolBreaks> {
  return relayGet<TripSchoolBreaks>(
    region,
    'school-breaks',
    { countries: WHEN_HOLIDAY_COUNTRIES.join(',') },
    signal
  );
}
