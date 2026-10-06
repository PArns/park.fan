'use client';

/**
 * "Open the planner", as a signal rather than as state. Whether the panel is on screen is neither
 * persisted nor owned by one component, and something outside the launcher (a calendar day) has to
 * ask for it. A counter, so two requests with a close between them are two events, where a boolean
 * would collapse them into a no-op.
 */

type Listener = () => void;

/**
 * Which way into the trip planner produced an open. A closed union, so a typo is a compile error
 * rather than a second spelling in the report.
 *
 * - `tab`: the tab on the window's right edge, on every page but a phone's.
 * - `header`: the header's calendar button, which replaces the tab on a phone
 *   (`PlannerHeaderButton`).
 * - `park-header`: "Tag im … planen" in a park page's or a wait-time calendar's header
 *   (`ParkPlannerLink`).
 * - `calendar-day`: "diesen Tag planen" in the wait-time calendar's day dialog (`PlanDayButton`).
 * - `wizard`: the wizard's last step on the planner's own page; inside the panel it opens nothing.
 * - `plan-list`: a day picked from the list on the planner's own page.
 * - `shared-link`: "Planer öffnen" on the shared-plan page, after taking a plan over.
 * - `home-hero`: "Heute planen" in the homepage hero (`HeroParkActions`).
 * - `kids-page`: a step of the height ladder on a park's "with kids" page (`KidsPlannerButton`).
 *
 * Not ways in: `AddToPlannerButton` files an entry without opening the panel, and
 * `PlannerInParkCta` is only drawn inside the open panel.
 */
export type PlannerOpenedSource =
  | 'tab'
  | 'header'
  | 'park-header'
  | 'calendar-day'
  | 'wizard'
  | 'plan-list'
  | 'shared-link'
  | 'home-hero'
  | 'kids-page';

/**
 * What a request asks the panel to do once it is on screen. `page-park-wizard` also starts the
 * wizard on the park the route is about. It carries no park: `plannerPagePark` already publishes
 * that, and a second copy could disagree with it.
 */
export type PlannerOpenIntent = 'panel' | 'page-park-wizard';

let requests = 0;
let wizardRequests = 0;
/**
 * Who asked last, for the one `planner_opened` property. Read once by the launcher in the commit
 * where the panel opens, and not part of any snapshot, which must stay a primitive. Initially the
 * edge tab, the one way in on every page; overwritten before it is read.
 */
let openSource: PlannerOpenedSource = 'tab';
const listeners = new Set<Listener>();

/** The planner's open signal: request counters to subscribe to, and who asked last. */
export const plannerUi = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): number {
    return requests;
  },
  /** Zero on the server, so the panel is never in the first HTML. */
  getServerSnapshot(): number {
    return 0;
  },
  /**
   * The subset of {@link getSnapshot}'s requests that asked for the wizard too. A second counter
   * rather than an intent to read back, because the panel's effect may hold nothing but a
   * `setState` (`react-hooks/set-state-in-effect`), and a plain number is what
   * `useSyncExternalStore` compares.
   */
  getWizardSnapshot(): number {
    return wizardRequests;
  },
  /** Zero on the server, for the same reason {@link getServerSnapshot} is. */
  getWizardServerSnapshot(): number {
    return 0;
  },
  /**
   * Ask for the panel; the caller has usually just set the active park and day. A wizard request
   * moves both counters, since the panel has to be on screen for the dialog. `source` comes first
   * with no default, so a new way in cannot ship unattributed.
   */
  requestOpen(source: PlannerOpenedSource, next: PlannerOpenIntent = 'panel'): void {
    openSource = source;
    requests += 1;
    if (next === 'page-park-wizard') wizardRequests += 1;
    for (const listener of listeners) listener();
  },
  /**
   * Say who is opening the panel without going through the counter: the edge tab sets the
   * launcher's `open` itself, but still owes the report a name.
   */
  noteOpenSource(source: PlannerOpenedSource): void {
    openSource = source;
  },
  /**
   * The way in that produced the open now on screen. Only meaningful in the commit where the panel
   * opens; at any other time it names whoever asked last.
   */
  getOpenSource(): PlannerOpenedSource {
    return openSource;
  },
};
