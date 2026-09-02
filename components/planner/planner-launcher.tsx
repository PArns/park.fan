'use client';

import { PlannerLauncherButton } from './planner-launcher-button';
import { usePlanner } from '@/lib/planner/use-planner';
import { useLazyMessages } from '@/i18n/use-lazy-messages';
import { RouteMessagesProvider } from '@/i18n/route-messages-provider';

const PLANNER_NAMESPACES = ['planner'] as const;

/**
 * The planner's way in, and the panel it opens.
 *
 * A floating button rather than a header control, and that is settled by
 * measurement rather than taste: the header is 48 px with 13 px of horizontal
 * slack left at 320 px, and its own documentation says the next control there is
 * a question about the bar's height rather than about the button.
 *
 * It only appears once something is planned. That is what makes the translations
 * worth fetching lazily: this is mounted in the layout, so its namespace would
 * otherwise ride along in the chrome of every page × six locales, for a panel
 * most visitors never open. The entry point that matters is the "add" control on
 * a ride, which puts the first entry in — see `AddToPlannerButton`.
 *
 * `fixed` costs no layout shift by construction, which is why this is the one
 * part of the feature with no box to reserve.
 */
export function PlannerLauncher() {
  const { total } = usePlanner();

  // Nothing planned: no button, and no chunk fetched. On the server this is
  // always the case, so the first paint never carries it and hydration has
  // nothing to reconcile.
  const messages = useLazyMessages(PLANNER_NAMESPACES, total > 0);

  if (total === 0) return null;

  // The chunk is a same-origin module and resolves in a few milliseconds. Until
  // it does, nothing is drawn rather than raw message keys — this is a floating
  // button, so its absence shifts no layout and the wait is invisible.
  if (!messages.ready) return null;

  const button = <PlannerLauncherButton total={total} />;

  return messages.messages ? (
    <RouteMessagesProvider messages={messages.messages} namespaces={PLANNER_NAMESPACES}>
      {button}
    </RouteMessagesProvider>
  ) : (
    button
  );
}
