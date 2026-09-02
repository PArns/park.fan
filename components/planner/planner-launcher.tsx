'use client';

import { useSyncExternalStore } from 'react';
import { PlannerLauncherButton } from './planner-launcher-button';
import { usePlanner } from '@/lib/planner/use-planner';
import { plannerUi } from '@/lib/planner/ui-store';
import { useLazyMessages } from '@/i18n/use-lazy-messages';
import { RouteMessagesProvider } from '@/i18n/route-messages-provider';

// Must stay in step with this file's entry in `LAZY_MESSAGE_BOUNDARIES`
// (`lib/i18n/route-namespaces.mjs`) — that list decides what the chunk carries,
// this one what the provider declares to anything nested below it.
const PLANNER_NAMESPACES = ['planner', 'parks.weather'] as const;

/**
 * The planner's way in, and the panel it opens.
 *
 * A floating button rather than a header control, and that is settled by
 * measurement rather than taste: the header is 48 px with 13 px of horizontal
 * slack left at 320 px, and its own documentation says the next control there is
 * a question about the bar's height rather than about the button.
 *
 * It only appears once something is planned, OR once something has asked for the
 * panel. That is what makes the translations worth fetching lazily: this is
 * mounted in the layout, so its namespace would otherwise ride along in the
 * chrome of every page × six locales, for a panel most visitors never open.
 *
 * The two entry points differ in which comes first. `AddToPlannerButton` on a
 * ride puts an entry in, and the launcher appears because there is now something
 * to see. A day in the park calendar is the other order — the day is chosen
 * before any ride — so it sets the active day and then signals through
 * `plannerUi`, which is why the launcher cannot key purely off the count.
 *
 * `fixed` costs no layout shift by construction, which is why this is the one
 * part of the feature with no box to reserve.
 */
export function PlannerLauncher() {
  const { total } = usePlanner();
  // A counter, not a boolean: two requests in a row are two events, and the
  // server snapshot is 0 so this is never in the first HTML.
  const openRequests = useSyncExternalStore(
    plannerUi.subscribe,
    plannerUi.getSnapshot,
    plannerUi.getServerSnapshot
  );

  const wanted = total > 0 || openRequests > 0;

  // Nothing planned and nothing asking: no button, and no chunk fetched. On the
  // server that is always the case, so the first paint never carries it and
  // hydration has nothing to reconcile.
  const messages = useLazyMessages(PLANNER_NAMESPACES, wanted);

  if (!wanted) return null;

  // The chunk is a same-origin module and resolves in a few milliseconds. Until
  // it does, nothing is drawn rather than raw message keys — this is a floating
  // button, so its absence shifts no layout and the wait is invisible.
  if (!messages.ready) return null;

  const button = <PlannerLauncherButton total={total} openRequests={openRequests} />;

  return messages.messages ? (
    <RouteMessagesProvider messages={messages.messages} namespaces={PLANNER_NAMESPACES}>
      {button}
    </RouteMessagesProvider>
  ) : (
    button
  );
}
