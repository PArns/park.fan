'use client';

import { PlanDayButton, type PlanDayButtonProps } from './plan-day-button';
import { useLazyMessages } from '@/i18n/use-lazy-messages';
import { RouteMessagesProvider } from '@/i18n/route-messages-provider';

// Must stay in step with this file's entry in `LAZY_MESSAGE_BOUNDARIES`
// (`lib/i18n/route-namespaces.mjs`).
const PLANNER_NAMESPACES = ['planner'] as const;

/**
 * The lazy boundary around the calendar's "plan this day" button, so the `planner` namespace is not
 * in the payload of every park page and calendar URL for one label. It costs no flash: the button
 * only renders inside the day dialog, so the chunk lands while the dialog animates in.
 *
 * This file must not call `useTranslations` itself: the generator counts a boundary's own calls but
 * stops at its imports, so a read here puts the namespace back into every page's chrome.
 */
export function PlanDayButtonLazy(props: PlanDayButtonProps) {
  const messages = useLazyMessages(PLANNER_NAMESPACES, true);

  if (!messages.ready) return null;

  const button = <PlanDayButton {...props} />;

  return messages.messages ? (
    <RouteMessagesProvider messages={messages.messages} namespaces={PLANNER_NAMESPACES}>
      {button}
    </RouteMessagesProvider>
  ) : (
    button
  );
}
