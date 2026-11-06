'use client';

import { trackSiteEvent } from '@/lib/analytics/site-analytics';
import {
  followShow,
  setReopenAlert,
  setRideAlert,
  type PushWriteResult,
} from '@/lib/push/push-follows';
import { getExistingPushIdentity, supportsPush } from '@/lib/push/push-registration';
import type { AssistantAlertTarget, AssistantPushState } from './alerts-context';

/**
 * Ready only with a subscription and the permission granted: then a write reuses the subscription
 * and cannot prompt, which an action arriving mid-stream must never do.
 */
export async function readPushState(): Promise<AssistantPushState> {
  if (!supportsPush() || Notification.permission === 'denied') return 'unavailable';
  if (Notification.permission !== 'granted') return 'needs-permission';
  return (await getExistingPushIdentity()) ? 'ready' : 'needs-permission';
}

/**
 * A reminder through the bells' own writes (subscription reuse, the 404 retry, the mirror after
 * the server), counted like a bell's press, which is also what makes Parky ring his bell.
 */
export async function writeAssistantAlert(
  target: AssistantAlertTarget
): Promise<PushWriteResult<unknown>> {
  if (target.kind === 'show') {
    const result = await followShow(target.showId, target.startTime);
    if (result.ok) trackSiteEvent('show_follow_add', { source: 'assistant' }, target.showId);
    return result;
  }
  const result =
    target.thresholdMinutes === null
      ? await setReopenAlert(target.attractionId)
      : await setRideAlert(target.attractionId, target.thresholdMinutes);
  if (result.ok) trackSiteEvent('ride_alert_set', { source: 'assistant' }, target.attractionId);
  return result;
}
