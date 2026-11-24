'use client';

import type { ComponentProps } from 'react';
import { PlannerFitAssistant } from './planner-fit-assistant';
import { useLazyMessages } from '@/i18n/use-lazy-messages';
import { RouteMessagesProvider } from '@/i18n/route-messages-provider';

// Must stay in step with this file's entry in `LAZY_MESSAGE_BOUNDARIES`
// (`lib/i18n/route-namespaces.mjs`).
const FIT_ASSISTANT_NAMESPACES = ['planner'] as const;

/**
 * The lazy boundary around the fit assistant that `AddToPlannerButton` opens when a day has no
 * room for the ride, so the whole `planner` namespace stays out of every ride page's payload for a
 * dialog few visitors see. The button fetches the message chunk together with this module, so the
 * dialog opens with its words.
 *
 * This file must not call `useTranslations` itself: the generator counts a boundary's own calls but
 * stops at its imports, so a read here puts the namespace back into the ride route.
 */
export function PlannerFitAssistantLazy(props: ComponentProps<typeof PlannerFitAssistant>) {
  const messages = useLazyMessages(FIT_ASSISTANT_NAMESPACES, true);

  if (!messages.ready) return null;

  const assistant = <PlannerFitAssistant {...props} />;

  return messages.messages ? (
    <RouteMessagesProvider messages={messages.messages} namespaces={FIT_ASSISTANT_NAMESPACES}>
      {assistant}
    </RouteMessagesProvider>
  ) : (
    assistant
  );
}
