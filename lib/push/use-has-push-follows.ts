'use client';

import { useEffect, useState } from 'react';
import { hasAnyPushFollowsLocal, PUSH_FOLLOWS_CHANGED_EVENT } from './push-follows-store';

/** Whether this browser has any ride alert or show follow at all — gates the "view all" link. */
export function useHasPushFollows(): boolean {
  const [has, setHas] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHas(hasAnyPushFollowsLocal());
    const handler = () => setHas(hasAnyPushFollowsLocal());
    window.addEventListener(PUSH_FOLLOWS_CHANGED_EVENT, handler);
    return () => window.removeEventListener(PUSH_FOLLOWS_CHANGED_EVENT, handler);
  }, []);

  return has;
}
