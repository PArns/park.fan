'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { PlannerFlyoutHost } from './planner-launcher-button';
import { PlannerEdgeTab } from './planner-edge-tab';
import { usePlanner } from '@/lib/planner/use-planner';
import { plannerUi } from '@/lib/planner/ui-store';
import { plannerPanelWidth } from '@/lib/planner/panel-width';
import { useLazyMessages } from '@/i18n/use-lazy-messages';
import { RouteMessagesProvider } from '@/i18n/route-messages-provider';

// Must stay in step with this file's entry in `LAZY_MESSAGE_BOUNDARIES`
// (`lib/i18n/route-namespaces.mjs`) — that list decides what the chunk carries,
// this one what the provider declares to anything nested below it.
const PLANNER_NAMESPACES = ['planner', 'parks.weather'] as const;

/**
 * The planner's way in, and the panel it opens.
 *
 * A tab on the window's right edge rather than a header control, and that is
 * settled by measurement rather than taste: the header is 48 px with 13 px of
 * horizontal slack left at 320 px, and its own documentation says the next
 * control there is a question about the bar's height rather than about the
 * button.
 *
 * **The tab is always drawn; the PANEL is what loads lazily.** It used to be the
 * whole control that waited — nothing appeared until something was planned or
 * something asked for the panel — which made the feature invisible to everybody
 * who had not already used it. The tab can afford to be eager because it reads
 * only `navigation.planner`, a word the layout chrome already carries for the
 * header, the footer and the parks menu; the `planner` namespace itself is 15 KB
 * that would otherwise ride in the chrome of every page × six locales, for a
 * panel most visitors never open, so it is still fetched on demand.
 *
 * The two entry points differ in which comes first. `AddToPlannerButton` on a
 * ride puts an entry in. A day in the park calendar is the other order — the day
 * is chosen before any ride — so it sets the active day and then signals through
 * `plannerUi`, which is why the open state cannot key purely off the count.
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
  const panelWidth = useSyncExternalStore(
    plannerPanelWidth.subscribe,
    plannerPanelWidth.getSnapshot,
    plannerPanelWidth.getServerSnapshot
  );
  const [open, setOpen] = useState(false);

  // Something outside the panel asked for it — a day picked in the park
  // calendar. An effect is right here and a render-time branch is not: the
  // request arrives from another component's event, and the panel must reopen on
  // a SECOND request after the visitor has closed it, which is why the counter
  // is compared against the last one seen rather than against zero.
  const lastSeen = useRef(0);
  useEffect(() => {
    if (openRequests === lastSeen.current) return;
    lastSeen.current = openRequests;
    setOpen(true);
  }, [openRequests]);

  // The panel is worth loading once it has been opened, once there is something
  // in it, or once something has asked for it. Closing it again does not unload
  // the chunk: it is already in the browser, and unmounting the panel on close
  // is what resets the wizard.
  const wanted = open || total > 0 || openRequests > 0;
  const messages = useLazyMessages(PLANNER_NAMESPACES, wanted);

  const panel =
    wanted && messages.ready ? <PlannerFlyoutHost open={open} onOpenChange={setOpen} /> : null;

  return (
    <>
      <PlannerEdgeTab
        open={open && panel !== null}
        total={total}
        panelWidth={panelWidth}
        onToggle={() => setOpen((value) => !value)}
      />
      {/* Until the chunk resolves — a same-origin module, a few milliseconds —
          nothing is drawn rather than raw message keys. */}
      {messages.messages ? (
        <RouteMessagesProvider messages={messages.messages} namespaces={PLANNER_NAMESPACES}>
          {panel}
        </RouteMessagesProvider>
      ) : (
        panel
      )}
    </>
  );
}
