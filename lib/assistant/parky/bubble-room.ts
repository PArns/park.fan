/**
 * Where Parky's speech bubble may appear. It sits over the page's bottom right corner, so it stays
 * away from the planners while the visitor works in one, and never sits over something they could
 * press. Browser only.
 */

/** What counts as a control the bubble must not cover. */
const CONTROL =
  'button, [role="button"], a[data-slot="button"], input:not([type="hidden"]), select, textarea, summary, [role="tab"], [role="switch"], [role="checkbox"], [role="radio"], [role="slider"]';

/** The bubble keeps this far from a control, which also covers its slight scale as it fades in. */
const MARGIN_PX = 8;

/**
 * A planner flow is under way: the day planner's panel is open (`data-planner-open`, set by
 * `PlannerLauncher`), or part of the trip planner (`data-trip-planner`) is on screen.
 */
export function plannerFlowOnScreen(): boolean {
  if (document.documentElement.hasAttribute('data-planner-open')) return true;
  const trip = document.querySelector('[data-trip-planner]');
  if (!trip) return false;
  const box = trip.getBoundingClientRect();
  return box.bottom > 0 && box.top < window.innerHeight && box.height > 0;
}

/**
 * Whether a bubble at `box` would sit over a control of the page: nine points across it and its
 * margin, each with everything stacked under it. `own` is the bubble's own markup, left out.
 */
export function coversControl(box: DOMRect, own: Element | null): boolean {
  const left = box.left - MARGIN_PX;
  const right = box.right + MARGIN_PX;
  const top = box.top - MARGIN_PX;
  const bottom = box.bottom + MARGIN_PX;
  for (const x of [left, (left + right) / 2, right]) {
    for (const y of [top, (top + bottom) / 2, bottom]) {
      for (const element of document.elementsFromPoint(x, y)) {
        if (own?.contains(element)) continue;
        if (element.closest(CONTROL)) return true;
      }
    }
  }
  return false;
}
