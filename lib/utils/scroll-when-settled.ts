'use client';

/** How far below the viewport's top edge a scrolled-to element comes to rest: the sticky bar
 *  plus a little air. */
export const HEADER_OFFSET = 100;
/** Give up looking for a target and take whatever the getter offers instead. */
const TARGET_DEADLINE_MS = 4000;
/** Stop correcting once the target has held still this many frames. */
const STABLE_FRAMES = 15;
/** Hard stop for the correction phase, however busy the page stays. */
const SETTLE_DEADLINE_MS = 6000;

/** Keys that scroll the document, unless they are typed into a field: a space in the attraction
 *  filter is not the visitor taking the page over. */
const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);
function isScrollKey(e: KeyboardEvent): boolean {
  if (!SCROLL_KEYS.has(e.key)) return false;
  const el = e.target as HTMLElement | null;
  const tag = el?.tagName;
  return tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT' && !el?.isContentEditable;
}

/** Options for {@link scrollWhenSettled}. */
export interface ScrollWhenSettledOptions {
  /** Where in the VIEWPORT the target comes to rest. Defaults to `HEADER_OFFSET`; the tile-row
   *  handoff passes the offset the row already had, so the row stays put. */
  offset?: number;
  /**
   * Animate the first scroll. True for a deep link, where a jump would hide that the page moved;
   * false when the scroll exists to prevent a movement, since animating it would be the very
   * scroll it is there to avoid.
   */
  smooth?: boolean;
}

/**
 * Scroll to an element and keep correcting until the page stops moving underneath it.
 *
 * A deep link like `#shows-<slug>` lands while the layout above the target is still collapsing
 * (the server-rendered overview giving way to the tab panel), so one measurement at any moment can
 * be far off. The position is therefore maintained: it watches the target's document offset
 * (`rect.top + scrollY`), which scrolling does not change, re-scrolls on every change and stops
 * after `STABLE_FRAMES` still frames. Only the first scroll may be smooth.
 *
 * `TARGET_DEADLINE_MS` gives up on a target that never appears, `SETTLE_DEADLINE_MS` on a page that
 * never stops moving, and `wheel`, `touchmove` or a scroll key ends it at once so it never fights
 * the visitor (the `scroll` event cannot be used, since `scrollTo` raises it). Returns its own
 * canceller, so a second click does not drag the visitor back to the first target.
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
      // polls per frame until the deadline.
      if (elapsed < TARGET_DEADLINE_MS) raf = requestAnimationFrame(tick);
      else finish();
      return;
    }

    const docTop = target.getBoundingClientRect().top + window.scrollY;
    if (docTop === lastOffset) {
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
  // paints, so the first correction is never a visible jump.
  tick();
  return finish;
}
