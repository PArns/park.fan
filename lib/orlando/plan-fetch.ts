import { orlandoRelayUrl, type OrlandoRelayRoute } from './paths';
import type { TripPlan } from './plan';
import type { TripCalendar, TripWhen } from './types';

/**
 * How the planner asks for a plan and a calendar window: through the same-origin relay
 * (`app/api/trip-regions/[...path]/route.ts`), which adds the site's data key. The fetches are
 * plain functions so the query keys and the error rules can be tested without React; the hooks
 * that debounce and cache them are in `components/orlando/planner/use-trip-plan.ts`.
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

/** The plan's cache key: its request query, in the order the URL writes it. */
export function planQueryKey(query: Record<string, string>): readonly unknown[] {
  return ['orlando-plan', new URLSearchParams(query).toString()];
}

/** A calendar window's cache key, shared by the date sheet and the result. */
export function calendarQueryKey(from: string, to: string): readonly unknown[] {
  return ['orlando-calendar', from, to];
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
  route: OrlandoRelayRoute,
  query: Record<string, string>,
  signal: AbortSignal | undefined
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(orlandoRelayUrl(route, query), { signal });
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') throw error;
    throw new PlanRequestError('failed', 0, (error as Error)?.message ?? 'network');
  }
  return readJson<T>(response, route);
}

/** `GET …/plan` through the relay. Throws a {@link PlanRequestError}. */
export function fetchTripPlan(
  query: Record<string, string>,
  signal?: AbortSignal
): Promise<TripPlan> {
  return relayGet<TripPlan>('plan', query, signal);
}

/** `GET …/calendar` through the relay, for a window of at most 92 days. */
export function fetchTripCalendar(
  from: string,
  to: string,
  signal?: AbortSignal
): Promise<TripCalendar> {
  return relayGet<TripCalendar>('calendar', { from, to }, signal);
}

/** The When search's cache key: its request query. */
export function whenQueryKey(query: Record<string, string>): readonly unknown[] {
  return ['orlando-when', new URLSearchParams(query).toString()];
}

/** `GET …/when` through the relay. Throws a {@link PlanRequestError}. */
export function fetchTripWhen(
  query: Record<string, string>,
  signal?: AbortSignal
): Promise<TripWhen> {
  return relayGet<TripWhen>('when', query, signal);
}
