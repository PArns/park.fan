import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import type { PlanDay } from '@/lib/api/types';
import type { RideAlertLocal, ShowFollowLocal } from '@/lib/push/push-follows-store';
import type { PushWriteError } from '@/lib/push/push-follows';
import { parkToday } from '@/lib/planner/park-time';
import type { AssistantActionChip } from './actions';

/**
 * The reminders as Parky reads them with each question, from the bells' local mirror, and the
 * ids a reminder Parky asks for resolves to. No request here: the mirror is what the bells draw.
 */

/** Whether a reminder can be written now without a prompt. */
export type AssistantPushState = 'ready' | 'needs-permission' | 'unavailable';

/** The `alerts` field of a chat request. */
export interface AssistantAlertsSnapshot {
  push: AssistantPushState;
  rides: Array<{
    park: string;
    rideSlug: string;
    name: string;
    kind: 'wait_below' | 'reopen';
    thresholdMinutes?: number;
  }>;
  shows: Array<{ park: string; showSlug: string; name: string; start?: string }>;
}

/** The most rides and shows a question carries. */
export const ALERTS_SNAPSHOT_MAX = 30;

/** A pinned performance as the park's `HH:MM`, or nothing where the zone is not known. */
function parkClock(instant: string | null, timezone: string | undefined): string | undefined {
  if (!instant || !timezone) return undefined;
  try {
    return formatInTimeZone(instant, timezone, 'HH:mm');
  } catch {
    return undefined;
  }
}

/**
 * The mirror's reminders; entries stored before the mirror kept their names are left out, as
 * Parky could not name them. `undefined` where push is out of reach and nothing is set.
 */
export function assistantAlertsSnapshot(
  push: AssistantPushState,
  rideAlerts: readonly RideAlertLocal[],
  showFollows: readonly ShowFollowLocal[]
): AssistantAlertsSnapshot | undefined {
  const rides = rideAlerts
    .flatMap((a) =>
      a.parkSlug && a.slug && a.name
        ? [
            {
              park: a.parkSlug,
              rideSlug: a.slug,
              name: a.name,
              ...(a.kind === 'reopen' || a.thresholdMinutes === null
                ? { kind: 'reopen' as const }
                : { kind: 'wait_below' as const, thresholdMinutes: a.thresholdMinutes }),
            },
          ]
        : []
    )
    .slice(0, ALERTS_SNAPSHOT_MAX);
  const shows = showFollows
    .flatMap((f) => {
      if (!f.parkSlug || !f.slug || !f.name) return [];
      const start = parkClock(f.startTime, f.timezone);
      return [{ park: f.parkSlug, showSlug: f.slug, name: f.name, ...(start ? { start } : {}) }];
    })
    .slice(0, ALERTS_SNAPSHOT_MAX);
  if (push === 'unavailable' && rides.length === 0 && shows.length === 0) return undefined;
  return { push, rides, shows };
}

/** A reminder resolved to the ids the API takes. */
export type AssistantAlertTarget =
  | {
      kind: 'ride';
      attractionId: string;
      name: string;
      /** `null` for the reopen alert. */
      thresholdMinutes: number | null;
    }
  | {
      kind: 'show';
      showId: string;
      name: string;
      /** The performance as an instant, and as the park's `HH:MM`. */
      startTime: string;
      start: string;
    };

/** A reminder Parky asked for, as its card in the chat keeps it. */
export interface AssistantAlertPrompt {
  id: string;
  target: AssistantAlertTarget;
  /** `confirm` waits for the visitor's press, which may prompt for notifications. */
  state: 'confirm' | 'set' | 'failed';
  error?: PushWriteError;
}

/** What carrying out an action leaves under the answer: a chip, or a reminder's card. */
export type AssistantActionOutcome = AssistantActionChip | AssistantAlertPrompt | null;

/** The ride by its slug in today's `/plan/day`, or null. */
export function rideTarget(
  day: PlanDay | null,
  rideSlug: string,
  thresholdMinutes: number | null
): AssistantAlertTarget | null {
  const ride = day?.rides.find((r) => r.attractionSlug === rideSlug && r.attractionId);
  return ride?.attractionId
    ? { kind: 'ride', attractionId: ride.attractionId, name: ride.attractionName, thresholdMinutes }
    : null;
}

/**
 * The performance at `start` today in the park's zone, by its slug in today's `/plan/day`, or null
 * for a time the day does not list or one already past.
 */
export function showTarget(
  day: PlanDay | null,
  showSlug: string,
  start: string,
  now: number = Date.now()
): AssistantAlertTarget | null {
  const show = day?.shows?.find((s) => s.showSlug === showSlug && s.showId);
  if (!day || !show?.showId || !show.times.some((t) => t.trim() === start)) return null;
  const instant = fromZonedTime(`${parkToday(day.timezone, now)}T${start}:00`, day.timezone);
  if (instant.getTime() <= now) return null;
  return {
    kind: 'show',
    showId: show.showId,
    name: show.showName,
    startTime: instant.toISOString(),
    start,
  };
}
