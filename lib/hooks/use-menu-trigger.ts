'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from '@/i18n/navigation';
import { escapeRefocusesTrigger, focusLeftMenu } from '@/lib/utils/menu-focus';

/**
 * The open/close behaviour every entry in the header's mega-menu bar shares, so no entry opens
 * differently from its neighbours.
 *
 * 1. Open state is the path the panel was opened on, not a boolean. The header survives route
 *    changes and clicks inside the band are ignored, so a followed link would leave the panel
 *    hanging; comparing against the current path closes it during render, with no effect.
 * 2. Hover has hysteresis: opening waits so a pointer crossing the bar does not flash panels,
 *    closing waits so the diagonal into the panel does not fall through the gap. Keyboard and
 *    touch open on click instead.
 */

const OPEN_DELAY_MS = 90;
const CLOSE_DELAY_MS = 180;

/**
 * Open state and trigger handlers for one header mega-menu entry: hover opens after 90 ms and
 * closes after 180 ms, click toggles, and navigating closes the panel.
 */
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
        // Focus goes back to the trigger, inside the wrapper, so its bubbling `focusin` would
        // reopen the band in the same batch; the flag holds for that synchronous dispatch. Only
        // when the focus is in this band or nowhere: Escape belongs to what has focus.
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
    // Only a focus that names where it went can close the band (see `focusLeftMenu`): a button
    // that disables itself while focused blurs to nothing, which is not the visitor leaving.
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
     * For the band: a click on a link to the page already showing closes it. Otherwise the band
     * closes only when `pathname` moves, so a same-page link would scroll the page under an open
     * band. The phone sheet does the same (`closeOnSamePageTap`).
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
