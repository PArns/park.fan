'use client';

import type { ReactNode } from 'react';
import { useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import {
  PARK_CALENDAR_SEGMENTS,
  PARK_CALENDAR_CANONICAL_SEGMENT,
} from '@/lib/parks/calendar-segments';
import type { Locale } from '@/i18n/config';

/**
 * Link to this park's crowd calendar, from the FAQ answers and the best-days section header.
 *
 * It used to be an `<a href="#calendar">` with a hand-written click handler that assigned
 * `window.location.hash`, because next-intl's `Link` uses `pushState` and does not reliably fire
 * `hashchange` — the event the tab switcher listened to. The calendar is a page now, so this is
 * an ordinary `Link`, and the browser gets back what a real link has: middle-click, "open in new
 * tab", a URL in the status bar, and a back button that undoes the visit.
 *
 * The target is built from the CURRENT path rather than from geo props. Every call site sits on a
 * park page, whose locale-relative path is exactly `/parks/<continent>/<country>/<city>/<park>`,
 * so the calendar is that path plus one segment — and derived this way it cannot disagree with
 * the park being rendered, which four threaded props could. It also spares the best-days section,
 * its skeleton and its header three props each, none of which they otherwise need.
 */
export function CrowdCalendarFaqLink({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const locale = useLocale();
  // Locale-relative already (next-intl's usePathname strips the prefix), which is what `Link`
  // wants back.
  const pathname = usePathname();
  const segment = PARK_CALENDAR_SEGMENTS[locale as Locale] ?? PARK_CALENDAR_CANONICAL_SEGMENT;

  return (
    <Link href={`${pathname.replace(/\/$/, '')}/${segment}`} className={className}>
      {children}
    </Link>
  );
}
