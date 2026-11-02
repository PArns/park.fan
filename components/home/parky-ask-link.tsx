'use client';

import { useSyncExternalStore, type ReactNode } from 'react';
import { assistantGate } from '@/lib/assistant/config';
import { openParky } from '@/lib/assistant/open';
import { StopLink } from './home-stop';

/**
 * The Parky stop's link: where Parky shows for this visitor it opens the chat right here, and
 * otherwise it leads to Parky's page, where everybody may ask. It never invites a visitor the
 * rollout left out; that stays Parky's page's call. The same link either way, so nothing moves when
 * the gate decides in the browser.
 */
export function ParkyAskLink({ children }: { children: ReactNode }) {
  const status = useSyncExternalStore(
    assistantGate.subscribe,
    assistantGate.getStatus,
    assistantGate.getServerStatus
  );
  return (
    <StopLink
      href="/parky"
      onClick={
        status === 'on'
          ? (event) => {
              event.preventDefault();
              openParky();
            }
          : undefined
      }
    >
      {children}
    </StopLink>
  );
}
