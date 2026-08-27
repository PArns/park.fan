'use client';

import type { ReactNode } from 'react';
import { useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import {
  PARK_CALENDAR_SEGMENTS,
  PARK_CALENDAR_CANONICAL_SEGMENT,
} from '@/lib/parks/calendar-segments';
import type { Locale } from '@/i18n/config';

/** Every locale's calendar segment, for stripping one off a path whatever language wrote it. */
const ALL_SEGMENTS = new Set(Object.values(PARK_CALENDAR_SEGMENTS));

/**
 * Link to this park's crowd calendar, from the FAQ answers and the best-days section header.
 *
 * It used to be an `<a href="#calendar">` with a hand-written click handler that assigned
 * `window.location.hash`, because next-intl's `Link` uses `pushState` and does not reliably fire
 * `hashchange` — the event the tab switcher listened to. The calendar is a page now, so this is
 * an ordinary `Link`, and the browser gets back what a real link has: middle-click, "open in new
 * tab", a URL in the status bar, and a back button that undoes the visit.
 *
 * The target is derived from the CURRENT path rather than from geo props, because every call site
 * is somewhere under one park and the calendar is that park's path plus one segment — derived this
 * way it cannot disagree with the park being rendered, which four threaded props could.
 *
 * Which means it has to cut the path back to the park first. The FAQ is part of the shared park
 * shell, so it renders ON the calendar pages too, where the path already ends in the calendar
 * segment and possibly a month: appending blindly produced
 * `…/wartezeiten-kalender/wartezeiten-kalender` and `…/2026/9/wartezeiten-kalender`, both of which the month
 * parser rejects — a 404 from the FAQ of every calendar page of every park in every locale.
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

  // Drop everything from the calendar segment onwards, in whatever locale it was written — a
  // visitor can reach a `/de/…` page holding an `/en/…` link from a language switch.
  const parts = pathname.replace(/\/$/, '').split('/');
  const cut = parts.findIndex((p) => ALL_SEGMENTS.has(p));
  const parkPath = cut === -1 ? parts.join('/') : parts.slice(0, cut).join('/');

  return (
    <Link href={`${parkPath}/${segment}`} className={className}>
      {children}
    </Link>
  );
}
