'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { PlannerEdgeTab } from './planner-edge-tab';
import { usePlanner } from '@/lib/planner/use-planner';
import { plannerUi } from '@/lib/planner/ui-store';
import { trackPlannerClosed, trackPlannerOpened } from '@/lib/analytics/umami';
import { plannerPanelWidth } from '@/lib/planner/panel-width';
import { pastActiveDay } from '@/lib/planner/park-time';
import { useLazyMessages } from '@/i18n/use-lazy-messages';
import { RouteMessagesProvider } from '@/i18n/route-messages-provider';

// Must stay in step with this file's entry in `LAZY_MESSAGE_BOUNDARIES`
// (`lib/i18n/route-namespaces.mjs`): that list decides what the chunk carries, this one what the
// provider declares below it.
const PLANNER_NAMESPACES = ['planner', 'parks.weather'] as const;

const loadPlannerFlyoutHost = () =>
  import('./planner-launcher-button').then((mod) => mod.PlannerFlyoutHost);

type PlannerFlyoutHostComponent = Awaited<ReturnType<typeof loadPlannerFlyoutHost>>;

/**
 * The planner's way in, and the panel it opens.
 *
 * The tab is always drawn and the panel loads lazily: the tab reads only `navigation.planner`,
 * which the layout chrome already carries, while the `planner` namespace and the panel's code are
 * fetched once the panel is wanted. A ride's `AddToPlannerButton` puts an entry in first; a
 * calendar day sets the active day and signals through `plannerUi`, so the open state cannot key
 * off the count alone.
 */
export function PlannerLauncher() {
  const { total, state } = usePlanner();
  // A counter, not a boolean: two requests in a row are two events. The server snapshot is 0.
  const openRequests = useSyncExternalStore(
    plannerUi.subscribe,
    plannerUi.getSnapshot,
    plannerUi.getServerSnapshot
  );
  const [open, setOpen] = useState(false);
  /**
   * Whether the past-day question is on screen instead of the panel. Held here, where the ways in
   * that name no day arrive, and drawn by `PlannerFlyout`, since this file is a lazy message
   * boundary and may not read the `planner` namespace.
   */
  const [askingPastDay, setAskingPastDay] = useState(false);

  /**
   * The planner's own button was pressed: open it, unless it would open on a day that is over. Only
   * the edge tab and the header button come here; every other way in names its day. The plan is
   * read at the press, so a trip ending at midnight is past on the first click after it.
   */
  const openOrAsk = useCallback(() => {
    if (pastActiveDay(state)) setAskingPastDay(true);
    else setOpen(true);
  }, [state]);

  /**
   * Something outside the panel asked for it. An effect, because the request is another component's
   * event and a second request after a close must reopen it, hence comparing against the last
   * counter seen. The header button names no day, so it is treated like the tab. A callback rather
   * than a branch in the effect, which `react-hooks/set-state-in-effect` refuses.
   */
  const answerRequest = useCallback(() => {
    if (plannerUi.getOpenSource() === 'header') openOrAsk();
    else setOpen(true);
  }, [openOrAsk]);
  const lastSeen = useRef(0);
  useEffect(() => {
    if (openRequests === lastSeen.current) return;
    lastSeen.current = openRequests;
    answerRequest();
  }, [openRequests, answerRequest]);

  // The panel is worth loading once it has been opened, holds something, or was asked for. Closing
  // it does not unload the chunk; unmounting the panel on close is what resets the wizard.
  const wanted = open || total > 0 || openRequests > 0;
  const messages = useLazyMessages(PLANNER_NAMESPACES, wanted);
  // The panel's code is fetched once it is wanted, beside the messages. Held in state rather than
  // behind `next/dynamic`, because `panelVisible` has to know the code is there, and a rejected
  // import must leave the tab alone rather than reach an error boundary.
  const [Host, setHost] = useState<PlannerFlyoutHostComponent | null>(null);
  useEffect(() => {
    if (!wanted || Host) return;
    let live = true;
    loadPlannerFlyoutHost().then(
      (component) => {
        if (live) setHost(() => component);
      },
      () => {
        // Not retried: the tab stays, the panel does not open, and the next page load asks again.
      }
    );
    return () => {
      live = false;
    };
  }, [wanted, Host]);
  /**
   * The panel is on screen, which is not the same as `open`: the press flips `open` before the
   * chunk lands, and a fetch that fails never opens anything. The edge tab and `planner_opened`
   * both follow this.
   */
  const panelVisible = wanted && messages.ready && Host !== null && open;

  // One `planner_opened` per closed → open edge of what is on screen: a request while the panel is
  // already up opens nothing and is not counted.
  const reported = useRef(false);
  useEffect(() => {
    if (panelVisible === reported.current) return;
    reported.current = panelVisible;
    if (panelVisible) trackPlannerOpened(plannerUi.getOpenSource());
    else trackPlannerClosed();
  }, [panelVisible]);

  /**
   * How much of the window the panel is holding, for the page beside it. Follows `panelVisible`, so
   * the page does not make room for a panel not drawn yet. A CSS custom property on the document,
   * because the reader is the locale layout, a Server Component; unset until the panel opens, so
   * the server renders `0px`. Written on every resize frame from a subscription to the width store,
   * not from a render of the launcher.
   */
  useEffect(() => {
    const root = document.documentElement;
    if (!panelVisible) {
      root.style.removeProperty('--planner-inset');
      root.removeAttribute('data-planner-open');
      return;
    }
    // The store also speaks on a window resize where the capped width often stays; that writes
    // nothing.
    let written = '';
    const writeInset = () => {
      const inset = `${plannerPanelWidth.getSnapshot()}px`;
      if (inset === written) return;
      written = inset;
      root.style.setProperty('--planner-inset', inset);
    };
    writeInset();
    const unsubscribe = plannerPanelWidth.subscribe(writeInset);
    // An attribute beside the width: ride cards behind the panel become drag sources while it is
    // open, and a stylesheet match costs them nothing where a context would re-render them all.
    root.setAttribute('data-planner-open', '');
    return () => {
      unsubscribe();
      root.style.removeProperty('--planner-inset');
      root.removeAttribute('data-planner-open');
    };
  }, [panelVisible]);

  // Mounted as soon as the chunk is there, not only while open: the sheet plays its own close
  // animation and the wizard resets by unmounting with the panel.
  const panel =
    wanted && messages.ready && Host ? (
      <Host
        open={open}
        onOpenChange={setOpen}
        askingPastDay={askingPastDay}
        onAskingPastDayChange={setAskingPastDay}
      />
    ) : null;

  return (
    <>
      <PlannerEdgeTab
        open={open && panel !== null}
        total={total}
        // The tab never goes through the store, so it names itself, before the flip, since the
        // transition effect reads the source in the next commit. On the way out too, so a close
        // does not leave the previous opener's name standing.
        onToggle={() => {
          plannerUi.noteOpenSource('tab');
          if (open) setOpen(false);
          else openOrAsk();
        }}
      />
      {/* Until the chunk resolves, nothing is drawn rather than raw message keys. */}
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
