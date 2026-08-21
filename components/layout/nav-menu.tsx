'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Link } from '@/i18n/navigation';

/**
 * A header entry that is BOTH a link and the trigger of a panel.
 *
 * Three things this is built around, in order of how much they constrain it:
 *
 * 1. **The panel's markup is always in the document.** It is `hidden` (display:none) when closed,
 *    never unmounted. A crawler does not hover, so a panel mounted on first hover contributes
 *    nothing to the link graph — which would defeat the reason the continent and country links are
 *    in the header at all. Google indexes CSS-hidden navigation normally; content that only
 *    appears after an interaction is what it cannot see.
 * 2. **The trigger is a real `<a>`.** "Parks entdecken" goes to `/parks` and "Blog" to `/blog`
 *    whether or not the panel ever opens — with a keyboard, on a touch screen, and for the
 *    crawler. The panel is an accelerator, not the only way through.
 * 3. **Hover has hysteresis.** Opening waits ~90 ms so a pointer crossing the bar on its way
 *    somewhere else does not flash three panels; closing waits ~180 ms so the diagonal from the
 *    trigger down into the panel does not fall through the gap. Both timers are cleared on
 *    unmount, and neither runs for keyboard or touch, which open on click instead.
 *
 * Not a Radix `NavigationMenu`: it unmounts its content when closed, which is precisely the
 * behaviour rule 1 forbids, and forcing it to mount means fighting the library for the rest of its
 * API. This is one `useState`, two timers and a `hidden` class.
 */

const OPEN_DELAY_MS = 90;
const CLOSE_DELAY_MS = 180;

interface NavMenuProps {
  /** Where the trigger itself navigates. */
  href: string;
  label: string;
  /** Panel body. Rendered on the server, present in the HTML, hidden until opened. */
  children: React.ReactNode;
  /** Mirrors the rest of the bar: nothing in the header is focusable while it floats transparent. */
  disabled?: boolean;
  /** Width of the panel. Passed rather than fixed because parks and blog hold different amounts. */
  panelClassName?: string;
}

export function NavMenu({ href, label, children, disabled, panelClassName }: NavMenuProps) {
  const [requested, setRequested] = useState(false);
  // Derived, not synchronized: a panel hanging open while the header floats transparent would
  // sit over the hero attached to nothing. Closing it from an effect would be a second render
  // with the panel still up for a frame — `disabled` simply wins here.
  const open = requested && !disabled;
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
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
        setRequested(false);
        rootRef.current?.querySelector<HTMLAnchorElement>('a')?.focus();
      }
    };
    // Any navigation away closes it: the panel is inside a sticky bar that survives the route
    // change, so nothing else would.
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setRequested(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      onPointerEnter={(e) => {
        if (disabled || e.pointerType === 'touch') return;
        schedule(true, OPEN_DELAY_MS);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === 'touch') return;
        schedule(false, CLOSE_DELAY_MS);
      }}
      onFocus={() => !disabled && setRequested(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setRequested(false);
      }}
    >
      <div className="flex items-center gap-1">
        <Link
          href={href}
          prefetch={false}
          className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
          tabIndex={disabled ? -1 : 0}
          data-header-stagger
        >
          {label}
        </Link>
        {/* Separate from the link so a click can open the panel without swallowing the
            navigation — and so touch and keyboard have a control at all. */}
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={label}
          tabIndex={disabled ? -1 : 0}
          onClick={() => {
            clearTimer();
            setRequested((v) => !v);
          }}
          className="text-muted-foreground hover:text-foreground -m-1 cursor-pointer p-1 transition-colors"
        >
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Positioned against the HEADER, not against this trigger — which is why the root above
          carries no `relative`. Centred on the trigger, a 700 px panel hanging off an entry that
          sits 276 px from the left edge starts at −36 px and is cut off by the viewport, and the
          narrower the window the worse it gets. Anchored to the header's own container it starts
          where the logo starts and cannot leave the page at any width.

          Flat on purpose: opaque `bg-popover`, a hairline border, one shadow. The frosted glass
          and the pointer-depth tilt belong to the cards on the pages — a menu doing the same would
          compete with the page it covers, and `backdrop-filter` over a scrolling document is the
          most expensive repaint on this site. */}
      <div id={panelId} className={`absolute inset-x-0 top-full z-50 pt-3 ${open ? '' : 'hidden'}`}>
        <div className="container mx-auto px-4 md:px-0">
          <div
            className={`bg-popover text-popover-foreground border-border/60 w-fit max-w-full rounded-xl border p-4 shadow-xl ${panelClassName ?? ''}`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
