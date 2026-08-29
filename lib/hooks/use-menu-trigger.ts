'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from '@/i18n/navigation';

/**
 * The open/close behaviour every entry in the header's mega-menu bar shares.
 *
 * Extracted from `NavMenu` when the favorites entry moved into the same row: two copies of this
 * would be two chances for the hysteresis, the outside-click handling or the close-on-navigate
 * rule to drift, and a bar where one entry opens differently from its neighbours is worse than
 * one where none of them do.
 *
 * Three things it is built around:
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
 * 3. **`disabled` wins, derived rather than synchronized.** A panel hanging open while the header
 *    floats transparent would sit over the hero attached to nothing. Closing it from an effect
 *    would leave it up for one more frame.
 */

const OPEN_DELAY_MS = 90;
const CLOSE_DELAY_MS = 180;

export function useMenuTrigger({ disabled }: { disabled?: boolean } = {}) {
  const pathname = usePathname();
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const requested = openedOn === pathname;
  const open = requested && !disabled;

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
        rootRef.current?.querySelector<HTMLElement>('a, button')?.focus();
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
      if (disabled || e.pointerType === 'touch') return;
      schedule(true, OPEN_DELAY_MS);
    },
    onPointerLeave: (e: React.PointerEvent) => {
      if (e.pointerType === 'touch') return;
      schedule(false, CLOSE_DELAY_MS);
    },
    onFocus: () => !disabled && setRequested(true),
    onBlur: (e: React.FocusEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpenedOn(null);
    },
  };

  return {
    open,
    triggerProps,
    /** For the chevron button: toggles without waiting for the hover timers. */
    toggle: () => {
      clearTimer();
      setRequested(!requested);
    },
  };
}
