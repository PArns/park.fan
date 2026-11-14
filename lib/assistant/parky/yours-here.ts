import { plannerStore } from '@/lib/planner/store';
import { getRiddenSnapshot } from '@/lib/utils/ridden-rides';
import { listRideAlertsLocal } from '@/lib/push/push-follows-store';
import { lastParkBack } from '@/lib/assistant/last-park';
import { yoursMoments, type YoursMoment } from './yours';

/**
 * What this browser keeps about the visitor, read for {@link yoursMoments}: the day planner, the
 * rides ticked off, the alerts' names, and the last chat's park on a later visit. Browser only.
 */
export function yoursHere(now: number = Date.now()): YoursMoment[] {
  return yoursMoments({
    planner: plannerStore.getSnapshot(),
    ridden: getRiddenSnapshot().size,
    alerts: listRideAlertsLocal().flatMap((alert) => (alert.name ? [alert.name] : [])),
    lastPark: lastParkBack(now),
    now,
  });
}
