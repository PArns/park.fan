'use client';

import { PlanDayButton, type PlanDayButtonProps } from './plan-day-button';
import { useLazyMessages } from '@/i18n/use-lazy-messages';
import { RouteMessagesProvider } from '@/i18n/route-messages-provider';

// Must stay in step with this file's entry in `LAZY_MESSAGE_BOUNDARIES`
// (`lib/i18n/route-namespaces.mjs`).
const PLANNER_NAMESPACES = ['planner'] as const;

/**
 * The lazy boundary around the calendar's "plan this day" button.
 *
 * Without it the `planner` namespace lands in the payload of the park page and
 * all 27,984 calendar URLs — two of the three highest-invocation routes in the
 * app — for one label, in six locales, on every request including the crawler's.
 *
 * A lazy boundary usually costs a flash, and here it costs none: this button
 * only ever renders inside the day-detail DIALOG, so the chunk is fetched at the
 * moment the dialog opens and lands while it is still animating in. Nothing is
 * drawn until it does, rather than a raw message key — the button sits at the
 * end of a row of badges, so its arrival moves nothing above it.
 *
 * This file must not call `useTranslations` itself: the generator counts a
 * boundary's own calls while stopping the walk at its imports, so a namespace
 * read here goes straight back into the chrome of every page.
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
