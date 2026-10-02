'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from '@/i18n/navigation';
import { escapeRefocusesTrigger, focusLeftMenu } from '@/lib/utils/menu-focus';

/**
 * The open/close behaviour every entry in the header's mega-menu bar shares.
 *
 * Extracted from `NavMenu` when the favorites entry moved into the same row: two copies of this
 * would be two chances for the hysteresis, the outside-click handling or the close-on-navigate
 * rule to drift, and a bar where one entry opens differently from its neighbours is worse than
 * one where none of them do.
 *
 * Two things it is built around:
 *
 * 1. **Open state is the PATH the panel was opened on, not a boolean.** The header lives in the
 *    locale layout and survives the route change, and the pointerdown handler deliberately
 *    ignores clicks INSIDE the band — which is exactly where the links are. So following one left
 *    the panel hanging over the page it had just navigated to. Comparing against the current path
 *    closes it during render, for free; a boolean plus an effect would do the same thing one
 *    render later and is the `setState`-in-an-effect the linter is right to refuse.
 * 2. **Hover has hysteresis.** Opening waits ~90 ms so a pointer crossing the bar on its way
 *    somewhere else does not flash three panels; closing waits ~180 ms so the diagonal from the
 *    trigger down into the panel does not fall through the gap. Neither timer runs for keyboard
 *    or touch, which open on click instead.
 * It used to take a `disabled` flag as well, for the header floating transparent over a hero: up
 * there the whole nav row was invisible, so a panel hanging open would have sat over the photo
 * attached to nothing. The row is visible and usable from the first screen line now, so an entry
 * that refuses to open has nothing left to protect.
 */

const OPEN_DELAY_MS = 90;
const CLOSE_DELAY_MS = 180;

export function useMenuTrigger() {
  const pathname = usePathname();
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Set while Escape moves the focus back into the wrapper, so `onFocus` does not undo the close. */
  const closingRef = useRef(false);

  const open = openedOn === pathname;

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // A timer that fires after a navigation writes the OLD path, which compares false — i.e. a menu
  // never opens itself onto a page the visitor has already left.
  const setRequested = (next: boolean) => setOpenedOn(next ? pathname : null);

  const schedule = (next: boolean, delay: number) => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setRequested(next);
    }, delay);
  };

  useEffect(() => clearTimer, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenedOn(null);
        // Putting the focus back on the trigger is what makes Escape usable with a keyboard — and
        // it is why Escape closed nothing: the trigger is INSIDE the wrapper, so `focus()`
        // dispatches a bubbling `focusin`, `onFocus` calls `setRequested(true)`, and the close
        // from the line above is overwritten in the same batch. The flag holds only for the
        // duration of that synchronous dispatch.
        // Only when the focus is in this band or nowhere: Escape belongs to what has focus, and a
        // hover-opened band must not pull it out of a field elsewhere on the page.
        const root = rootRef.current;
        if (
          !root ||
          !escapeRefocusesTrigger(root, document.activeElement, [
            document.body,
            document.documentElement,
          ])
        )
          return;
        closingRef.current = true;
        root.querySelector<HTMLElement>('a, button')?.focus();
        closingRef.current = false;
      }
    };
    // A click that lands outside the trigger and outside the band closes it. A click INSIDE is
    // left alone on purpose — it is either a link (whose navigation moves `pathname`, which is
    // what closes the band) or the trigger's own toggle, and closing here would race both.
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpenedOn(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  /** Spread onto the entry's wrapper: hover opens, leaving closes, focus commits at once. */
  const triggerProps = {
    ref: rootRef,
    onPointerEnter: (e: React.PointerEvent) => {
      if (e.pointerType === 'touch') return;
      schedule(true, OPEN_DELAY_MS);
    },
    onPointerLeave: (e: React.PointerEvent) => {
      if (e.pointerType === 'touch') return;
      schedule(false, CLOSE_DELAY_MS);
    },
    onFocus: () => !closingRef.current && setRequested(true),
    // Only a focus that names where it went can close the band — see `focusLeftMenu`. A button
    // that disables itself while it holds the focus blurs to nothing, and reading that as "the
    // visitor left" closed the band under its own click.
    onBlur: (e: React.FocusEvent) => {
      if (focusLeftMenu(e.currentTarget, e.relatedTarget as Node | null)) setOpenedOn(null);
    },
  };

  return {
    open,
    triggerProps,
    /** For the chevron button: toggles without waiting for the hover timers. */
    toggle: () => {
      clearTimer();
      setRequested(!open);
    },
    /**
     * For the band: a click on a link to the page already showing closes it.
     *
     * The band closes when `pathname` moves, and a link to the page it was opened on does not
     * move it: the outside-click handler above leaves clicks inside the band alone, so a category
     * clicked on the dictionary's own page scrolled that page under a band that stayed open —
     * until the pointer left it, and after a tap or an Enter until Escape or a click elsewhere.
     * Every band has a link or two like that, a heading on its own hub; the "more" band has
     * twenty-nine since it lists the twelve categories and the seventeen chapters of the guide and
     * the best-time hub, each a same-page link on its own hub. The phone sheet closes the same way
     * (`closeOnSamePageTap` in the header): same test, a modifier click or a new tab excepted.
     */
    closeOnSamePageClick: (e: React.MouseEvent<HTMLElement>) => {
      const link = (e.target as HTMLElement).closest('a');
      if (!link || link.target === '_blank') return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (new URL(link.href).pathname === window.location.pathname) {
        clearTimer();
        setOpenedOn(null);
      }
    },
  };
}
