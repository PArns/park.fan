'use client';

/**
 * "Open the planner", as a signal rather than as state.
 *
 * The plan itself lives in `store.ts` and is persisted; whether the panel is on
 * screen is neither persisted nor owned by any one component. The launcher holds
 * the `open` boolean, and something else entirely — a day in the park calendar —
 * needs to be able to ask for it. A context would mean wrapping the layout for a
 * boolean; a field on the plan would write UI state into localStorage and hand a
 * visitor a panel that opens by itself the next time they arrive.
 *
 * So: a counter. Every request increments it, subscribers see it change, and two
 * requests in a row are two events rather than one no-op — which is what a plain
 * boolean would collapse them into once the panel had been closed in between.
 */

import type { PlannerOpenedSource } from '@/lib/analytics/umami';

type Listener = () => void;

/**
 * What a request asks the panel to do once it is on screen.
 *
 * `panel` is the old signal unchanged and stays the default, so every caller
 * that just wants the panel reads exactly as before. `page-park-wizard` is the
 * one thing a park page's own header button could not say: open the panel AND
 * start the wizard on the park the route is about, so the reader lands on the
 * date step instead of on a panel with another button in it.
 *
 * It carries no park, deliberately. `plannerPagePark` already publishes which
 * park the route behind the panel is about, and the panel already reads it —
 * a park passed through here would be a second copy of that answer, free to
 * disagree with the beacon's the moment the reader walks to another park.
 *
 * The reader is the panel: `PlannerFlyout`'s `startPagePark` is exactly this
 * action, and it has only ever been reachable from a button drawn inside the
 * panel. This is what lets something outside ask for it.
 */
export type PlannerOpenIntent = 'panel' | 'page-park-wizard';

let requests = 0;
let wizardRequests = 0;
/**
 * Who asked last, for the one `planner_opened` property.
 *
 * NOT a third counter and not part of any snapshot: it is read once, by the
 * launcher, in the commit where the panel actually goes from closed to open, and
 * nothing renders from it. `useSyncExternalStore` wants a primitive it can
 * compare, and a source in the snapshot would either be a second number to map
 * back to a string or an object that loops the subscribers — see
 * {@link plannerUi.getWizardSnapshot}.
 *
 * The initial value is the edge tab because that is the only way in that exists
 * on every page; it is overwritten before it is ever read.
 */
let openSource: PlannerOpenedSource = 'tab';
const listeners = new Set<Listener>();

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
   * The subset of {@link getSnapshot}'s requests that asked for the wizard too.
   *
   * A SECOND COUNTER rather than an intent the panel reads back, and that is
   * not a style choice. The panel's reader is an effect of the same shape the
   * launcher's is — compare the count against the last one seen, act once — and
   * an effect like that may hold nothing but a `setState`: reading the intent
   * inside it is a call React cannot see through, and the React 19 lint refuses
   * the whole effect over it (`react-hooks/set-state-in-effect`, measured on
   * exactly this code). Two counters put the question in the subscription
   * instead, where each subscriber compares its own number and a `panel`
   * request cannot be mistaken for a wizard one by a reader that forgot to ask.
   *
   * Both are plain numbers, which is what `useSyncExternalStore` wants: an
   * object snapshot would have to be memoized to keep it from looping.
   */
  getWizardSnapshot(): number {
    return wizardRequests;
  },
  /** Zero on the server, for the same reason {@link getServerSnapshot} is. */
  getWizardServerSnapshot(): number {
    return 0;
  },
  /**
   * Ask for the panel. The caller has usually just set the active park and day.
   *
   * A wizard request is ALSO a panel request — the panel has to be on screen
   * for the dialog to open over it — so it moves both counters and the panel's
   * own subscriber needs no special case for it.
   *
   * `source` comes FIRST and has no default, so a new way in cannot reach
   * production unattributed: leaving it out is a compile error, and the two
   * unions share no member, so swapping the arguments is one too. The intent
   * keeps its default, which is why every existing caller reads as before bar
   * the one word it now names itself with.
   */
  requestOpen(source: PlannerOpenedSource, next: PlannerOpenIntent = 'panel'): void {
    openSource = source;
    requests += 1;
    if (next === 'page-park-wizard') wizardRequests += 1;
    for (const listener of listeners) listener();
  },
  /**
   * Say who is opening the panel without going through the counter.
   *
   * One caller, and it is the edge tab: it holds no plan and points at no day,
   * so it sets the launcher's `open` itself rather than sending a request the
   * launcher would only turn back into the same `setOpen(true)`. It still owes
   * the report a name, and this is the whole of what it owes.
   */
  noteOpenSource(source: PlannerOpenedSource): void {
    openSource = source;
  },
  /**
   * The way in that produced the open now on screen.
   *
   * Only meaningful in the commit where the panel goes from closed to open —
   * read at any other moment it names whoever asked last, which may be a request
   * that arrived while the panel was already up and opened nothing.
   */
  getOpenSource(): PlannerOpenedSource {
    return openSource;
  },
};
