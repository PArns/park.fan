'use client';

import { hasAnyPushFollowsLocal } from './push-follows-store';
import { useLocalPushFollowsValue } from './use-local-push-follows-value';

/** Whether this browser has any ride alert or show follow at all — gates the "view all" link. */
export function useHasPushFollows(): boolean {
  const [has] = useLocalPushFollowsValue(false, hasAnyPushFollowsLocal, []);
  return has;
}
