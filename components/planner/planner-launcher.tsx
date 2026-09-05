'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { PlannerFlyoutHost } from './planner-launcher-button';
import { PlannerEdgeTab } from './planner-edge-tab';
import { usePlanner } from '@/lib/planner/use-planner';
import { plannerUi } from '@/lib/planner/ui-store';
import { trackPlannerOpened } from '@/lib/analytics/umami';
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

  /**
   * One `planner_opened` per opening, with the way in that produced it.
   *
   * An effect OF ITS OWN, watching `open` rather than the request counter, and
   * both halves of that are load-bearing. The counter moves on every request
   * including the ones that arrive while the panel is already up — a second day
   * pressed in the calendar, the wizard finishing inside the panel — where
   * `setOpen(true)` above is a no-op and nothing opens; counting there would
   * bill those as openings. The closed → open edge is the event.
   *
   * So it is a second effect for a reason of arithmetic and not of lint. The
   * note on `plannerUi.getWizardSnapshot` warns that a call React cannot see
   * through, added beside the `setOpen` above, can take
   * `react-hooks/set-state-in-effect` down with it; putting
   * `trackPlannerOpened(plannerUi.getOpenSource())` there was tried here and
   * stayed green (the guarded early return is what the rule accepts), so that is
   * not what forced the split — the over-counting is. This effect holds no
   * `setState` either way, so the question cannot come back.
   */
  // The panel is worth loading once it has been opened, once there is something
  // in it, or once something has asked for it. Closing it again does not unload
  // the chunk: it is already in the browser, and unmounting the panel on close
  // is what resets the wizard.
  const wanted = open || total > 0 || openRequests > 0;
  const messages = useLazyMessages(PLANNER_NAMESPACES, wanted);
  /**
   * The panel is on screen — which is NOT the same as `open`.
   *
   * The `planner` namespace is 15 KB and arrives as its own chunk, so between
   * the press and the panel there is a fetch. `open` flips at the press; the
   * panel is drawn when the chunk lands. Billing the press counts an opening
   * the visitor never saw — and `useLazyMessages` does not retry a failed
   * fetch, so on a blocked asset it is an opening that never happens at all,
   * followed by a second and a third as somebody presses again because nothing
   * did. The edge tab already draws its own state off this composite rather
   * than off `open`; the event now agrees with it.
   */
  const panelVisible = wanted && messages.ready && open;

  const reported = useRef(false);
  useEffect(() => {
    if (panelVisible === reported.current) return;
    reported.current = panelVisible;
    if (panelVisible) trackPlannerOpened(plannerUi.getOpenSource());
  }, [panelVisible]);

  /**
   * How much of the window the panel is holding, for the page beside it.
   *
   * A CSS custom property on the document element rather than a prop, because
   * the reader is `app/[locale]/layout.tsx` — a Server Component shared by 3,109
   * prerendered routes, which cannot take a value from a client store. It is
   * unset until the panel opens, so the server renders `0px` through the
   * `var()` fallback and a visitor who never opens the planner never pays a
   * style recalculation for it.
   *
   * Written on every resize frame on purpose: the alternative is committing it
   * on release, and then the page visibly lags a panel edge the pointer is
   * already holding.
   */
  useEffect(() => {
    const root = document.documentElement;
    if (!open) {
      root.style.removeProperty('--planner-inset');
      root.removeAttribute('data-planner-open');
      return;
    }
    root.style.setProperty('--planner-inset', `${panelWidth}px`);
    // An ATTRIBUTE beside the width, and it earns its place: a ride card on the
    // page behind the panel becomes a drag source while the planner is open,
    // and it has to say so. Passing that down as a prop would mean a context
    // over the whole page and a re-render of forty cards on every open; an
    // attribute on the document element is a stylesheet match and costs the
    // cards nothing at all.
    root.setAttribute('data-planner-open', '');
    return () => {
      root.style.removeProperty('--planner-inset');
      root.removeAttribute('data-planner-open');
    };
  }, [open, panelWidth]);

  // MOUNTED as soon as the chunk is there, not only while open: the sheet plays
  // its own close animation and the wizard resets by unmounting with the panel,
  // so tying this to `open` would cut both.
  const panel =
    wanted && messages.ready ? <PlannerFlyoutHost open={open} onOpenChange={setOpen} /> : null;

  return (
    <>
      <PlannerEdgeTab
        open={open && panel !== null}
        total={total}
        panelWidth={panelWidth}
        // The tab is the one way in that never goes through the store, so it
        // names itself here — before the flip, because the transition effect
        // reads the source in the very next commit. Noted on the way out as well as
        // the way in, which costs nothing and keeps a close from leaving the
        // previous opener's name standing for whatever opens next.
        onToggle={() => {
          plannerUi.noteOpenSource('tab');
          setOpen((value) => !value);
        }}
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
