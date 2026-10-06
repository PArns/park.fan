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
 * Link to this park's crowd calendar, from the FAQ answers and the best-days section header: an
 * ordinary `Link`, with middle-click and back button. The target is derived from the current path,
 * so it cannot disagree with the park being rendered. The FAQ renders on the calendar pages too,
 * so the path is first cut back to the park, or the segment would be appended twice and 404.
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
