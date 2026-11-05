import { formatInTimeZone } from 'date-fns-tz';
import type { RideAlertLocal, ShowFollowLocal } from '@/lib/push/push-follows-store';
import type { PushWriteError } from '@/lib/push/push-follows';
import type { AssistantAction, AssistantActionChip } from './actions';

/**
 * The reminders as Parky reads them with each question, from the bells' local mirror, and what a
 * reminder Parky asks for writes. No request here: the mirror is what the bells draw.
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
export const ALERTS_SNAPSHOT_MAX = 100;

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

/**
 * The reminder an action asks for, in the ids the push endpoints take; null for a performance that
 * is already over, which the API would refuse.
 */
export function alertTarget(
  action: Extract<AssistantAction, { type: 'alert_ride_set' | 'alert_show_set' }>,
  now: number = Date.now()
): AssistantAlertTarget | null {
  if (action.type === 'alert_ride_set') {
    return {
      kind: 'ride',
      attractionId: action.rideId,
      name: action.rideName,
      thresholdMinutes: action.kind === 'reopen' ? null : (action.thresholdMinutes ?? null),
    };
  }
  const start = parkClock(action.start, action.park.timezone);
  if (!start || Date.parse(action.start) <= now) return null;
  return {
    kind: 'show',
    showId: action.showId,
    name: action.showName,
    startTime: action.start,
    start,
  };
}
