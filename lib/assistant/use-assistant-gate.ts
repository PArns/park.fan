'use client';

import { useSyncExternalStore } from 'react';
import { assistantGate, type AssistantGateStatus } from '@/lib/assistant/config';

/**
 * Where Parky's gate stands for this visitor, `pending` on the server and until it is decided, so
 * an offer of Parky never decides server-rendered markup.
 */
export function useAssistantGateStatus(): AssistantGateStatus {
  return useSyncExternalStore(
    assistantGate.subscribe,
    assistantGate.getStatus,
    assistantGate.getServerStatus
  );
}
