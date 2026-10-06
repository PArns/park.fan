import { hasUsableThresholdRange } from '@/lib/push/threshold-minutes';

/**
 * Pure logic behind the ride list in `RideAlertDialog`, kept out of the component
 * (which has JSX in it) so `scripts/test-threshold-minutes.mjs` can run it under plain
 * Node.
 */

export interface RideAlertPickerAttraction {
  id: string;
  name: string;
  currentWaitTime?: number | null;
  /** The ride's live status. A stopped ride can take the reopen alert, whatever its queue reads. */
  status?: string | null;
}

/** Statuses that mean the ride is not running and may come back: the reopen alert's subject. */
const STOPPED_STATUSES: ReadonlySet<string> = new Set(['DOWN', 'CLOSED', 'REFURBISHMENT']);

/** Whether the ride stands (`DOWN`, `CLOSED`, `REFURBISHMENT`) and so has a reopening to wait for. */
export function isStoppedRide(attraction: { status?: string | null }): boolean {
  return attraction.status != null && STOPPED_STATUSES.has(attraction.status);
}

/**
 * The alert kinds a ride offers. A running ride has only the wait-time alert; a stopped one,
 * where the park's wait times can be read, has both — and the reopening is the one to pick first.
 */
export function rideAlertKindsFor(
  attraction: { status?: string | null } | undefined,
  reopenAvailable: boolean
): readonly RideAlertPickerKind[] {
  return reopenAvailable && attraction && isStoppedRide(attraction) ? ['reopen', 'wait'] : ['wait'];
}

/** Which alert the add-form is filling in. `reopen` is "tell me when it opens again". */
export type RideAlertPickerKind = 'wait' | 'reopen';

/** Whether a stored or fetched alert is the reopen kind; an absent `kind` is a wait-time alert. */
export function isReopenAlert(alert: { kind?: string | null }): boolean {
  return alert.kind === 'reopen';
}

export interface RideAlertPickerRow<T extends RideAlertPickerAttraction> {
  attraction: T;
  /**
   * False when the ride's queue is already too short for any alert — the bell's own rule,
   * {@link hasUsableThresholdRange}. The row stays in the list so the visitor can see why the
   * ride is not on offer, but it cannot be picked: picking it used to open a slider running
   * from 5 to 5, an alert that is already true the moment it is saved.
   */
  selectable: boolean;
}

/**
 * Every ride the add-form may offer, by name. Rides that already carry an alert stay out,
 * as they always have — that alert is edited in the list above the form, not added twice.
 *
 * Sorted with `localeCompare` in the page's locale and on a copy: the park's own order is
 * the API's, which nobody scanning for one ride by name can use.
 */
export function rideAlertPickerRows<T extends RideAlertPickerAttraction>(
  attractions: readonly T[],
  alertedIds: ReadonlySet<string>,
  locale: string,
  reopenAvailable = false
): RideAlertPickerRow<T>[] {
  return attractions
    .filter((a) => !alertedIds.has(a.id))
    .sort((a, b) => a.name.localeCompare(b.name, locale))
    .map((attraction) => ({
      attraction,
      // A stopped ride offers the reopen alert, which has no threshold to fit under the queue,
      // so no queue is too short for it.
      selectable:
        (reopenAvailable && isStoppedRide(attraction)) ||
        hasUsableThresholdRange(attraction.currentWaitTime),
    }));
}

/** Diacritics and punctuation folded, so "winjas" finds "Winja's" and "fly" finds "F.L.Y.". */
export function foldRideName(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/** The rows whose name contains the typed text. An empty query keeps every row. */
export function filterRideAlertPickerRows<T extends RideAlertPickerAttraction>(
  rows: readonly RideAlertPickerRow<T>[],
  query: string
): RideAlertPickerRow<T>[] {
  const needle = foldRideName(query);
  if (needle.length === 0) return [...rows];
  return rows.filter((row) => foldRideName(row.attraction.name).includes(needle));
}

/**
 * Which ride the form is set to: the visitor's own pick while it is still on offer and
 * selectable, otherwise the first selectable row, otherwise none. Never a row that is not
 * selectable — that is how the 5-to-5 slider reached the screen, by defaulting to whatever
 * came first.
 */
export function resolveRideAlertSelection<T extends RideAlertPickerAttraction>(
  rows: readonly RideAlertPickerRow<T>[],
  pickedId: string
): string {
  if (pickedId && rows.some((row) => row.selectable && row.attraction.id === pickedId)) {
    return pickedId;
  }
  return rows.find((row) => row.selectable)?.attraction.id ?? '';
}
