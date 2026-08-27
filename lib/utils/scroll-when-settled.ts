'use client';

/** How far below the viewport's top edge a scrolled-to element comes to rest — the sticky bar
 *  plus a little air. */
export const HEADER_OFFSET = 100;
/** Give up looking for a target and take whatever the getter offers instead. */
const TARGET_DEADLINE_MS = 4000;
/** Stop correcting once the target has held still this long — ~15 frames. */
const STABLE_FRAMES = 15;
/** Hard stop for the correction phase, however busy the page stays. */
const SETTLE_DEADLINE_MS = 6000;

/** Keys that scroll the document — and only when nothing is typing them into a field, or a space
 *  in the attraction filter would count as the visitor taking the page over. */
const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);
function isScrollKey(e: KeyboardEvent): boolean {
  if (!SCROLL_KEYS.has(e.key)) return false;
  const el = e.target as HTMLElement | null;
  const tag = el?.tagName;
  return tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT' && !el?.isContentEditable;
}

export interface ScrollWhenSettledOptions {
  /** Where in the VIEWPORT the target comes to rest. Defaults to `HEADER_OFFSET`; the tile-row
   *  handoff passes the offset the row already had, which is what makes the row stay put. */
  offset?: number;
  /**
   * Animate the first scroll.
   *
   * True for a deep link, where the visitor asked to be taken somewhere and a jump would hide
   * the fact that the page moved. False when the scroll exists to PREVENT a movement — restoring
   * a row to the position it was already in has nothing to show, and animating it would be the
   * very scroll it is there to avoid.
   */
  smooth?: boolean;
}

/**
 * Scroll to an element and keep correcting until the page stops moving underneath it.
 *
 * The single `setTimeout(…, 500)` this replaces measured a document that was still rearranging,
 * and the deep link paid for it. A cold load of `#shows-<slug>` arrives on the server-rendered
 * pre-mount overview, which lists every attraction the park has; the card the hash names is inside
 * the tab panel and does not exist yet, so the fallback fired against that tall document and
 * scrolled 3974 px down — and then the overview collapsed into the short shows panel, the document
 * went 6817 → 5374 px, and the card the visitor had asked for ended up 2907 px ABOVE the viewport.
 * Nothing re-checked, so that is where they stayed: on the footer of a page they came to for one
 * show.
 *
 * Waiting longer does not fix it and neither does waiting for a quiet frame. Measured on this
 * page, the document goes 6817 → 13330 → 5194 → 5374 px, and the 13330 is the moment both the
 * overview and the panel are in the tree at once. A "has it settled" test lands inside that peak
 * as readily as anywhere else, and one measurement taken there is as wrong as one taken at 500 ms.
 *
 * So the position is not measured once but MAINTAINED. The reading it watches is the target's
 * DOCUMENT offset (`rect.top + scrollY`), which is invariant under scrolling — so a change in it
 * means the layout above the target moved, never that a smooth scroll is in flight, and the two
 * cannot be confused. Every change re-issues the scroll; `STABLE_FRAMES` frames without one end
 * it. The first correction is smooth by default, because in-page clicks (the panel's show rows,
 * already hydrated) converge on frame one and should look like a scroll; the rest are instant,
 * since animating a correction only means arriving late at a place that has moved again.
 *
 * Two deadlines, both load-bearing. A slug that no longer matches a show would poll for a target
 * forever, so after `TARGET_DEADLINE_MS` it takes whatever the getter offers — the tab row — and
 * scrolls there, which is where the open tab is anyway. And a page that never stops moving (a poll
 * landing, a photo decoding) would hold the visitor's scroll hostage, so `SETTLE_DEADLINE_MS` ends
 * the correction phase regardless. Returns its own canceller: a visitor clicking a second show
 * mid-flight must not be dragged back to the first.
 *
 * The visitor outranks all of it. Six seconds of maintenance is six seconds in which somebody can
 * decide to read something else, and a correction landing on top of their own scroll reads as the
 * page fighting them — so `wheel`, `touchmove` and the scrolling keys end the phase on the spot.
 * The `scroll` event cannot be used for this: `window.scrollTo` raises it too, so every correction
 * would cancel the next one.
 */
export function scrollWhenSettled(
  getTarget: () => HTMLElement | null,
  { offset = HEADER_OFFSET, smooth = true }: ScrollWhenSettledOptions = {}
) {
  let raf = 0;
  let cancelled = false;
  const startedAt = performance.now();
  let lastOffset: number | null = null;
  let stable = 0;

  const onKeyDown = (e: KeyboardEvent) => {
    if (isScrollKey(e)) finish();
  };
  const takeOver = () => finish();

  function addListeners() {
    window.addEventListener('wheel', takeOver, { passive: true });
    window.addEventListener('touchmove', takeOver, { passive: true });
    window.addEventListener('keydown', onKeyDown);
  }
  function removeListeners() {
    window.removeEventListener('wheel', takeOver);
    window.removeEventListener('touchmove', takeOver);
    window.removeEventListener('keydown', onKeyDown);
  }

  function finish() {
    if (cancelled) return;
    cancelled = true;
    cancelAnimationFrame(raf);
    removeListeners();
  }

  const tick = () => {
    if (cancelled) return;
    const elapsed = performance.now() - startedAt;
    const target = getTarget();

    if (!target) {
      // The panel mounts its cards through a `useDeferredValue` and no event says when, so this
      // is polled per frame. Past the deadline a getter still answering `null` has nothing left
      // to offer and there is nothing to scroll to.
      if (elapsed < TARGET_DEADLINE_MS) raf = requestAnimationFrame(tick);
      else finish();
      return;
    }

    const docTop = target.getBoundingClientRect().top + window.scrollY;
    if (docTop === lastOffset) {
      // Held still for another frame. Enough of them in a row and the layout is done.
      if (++stable >= STABLE_FRAMES) {
        finish();
        return;
      }
    } else {
      const first = lastOffset === null;
      lastOffset = docTop;
      stable = 0;
      window.scrollTo({
        top: Math.max(0, docTop - offset),
        behavior: first && smooth ? 'smooth' : 'auto',
      });
    }

    if (elapsed < SETTLE_DEADLINE_MS) raf = requestAnimationFrame(tick);
    else finish();
  };

  addListeners();
  // Synchronously, not on the next frame: called from an effect this lands before the browser
  // paints, so the correction is never a visible jump. Measured on park → calendar, the first
  // frame came 208 ms after the commit and the row sat 22 px off for all of it.
  tick();
  return finish;
}
