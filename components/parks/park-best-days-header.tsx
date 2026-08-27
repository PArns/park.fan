'use client';

import { CalendarDays, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CrowdCalendarFaqLink } from '@/components/faq/crowd-calendar-faq-link';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { Link } from '@/i18n/navigation';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import { getGermanArticle } from '@/lib/utils';
import type { Locale } from '@/i18n/config';

/** "den Europa-Park", not "Europa-Park", where the German title needs the accusative. */
export function localizedParkName(parkName: string, parkSlug: string, locale: string): string {
  if (locale !== 'de') return parkName;
  const nominative = getGermanArticle(parkName, parkSlug);
  const accusative = nominative === 'der' ? 'den' : nominative;
  return accusative ? `${accusative} ${parkName}` : parkName;
}

/**
 * The best-days section's frosted header. It carries NO calendar data — the park name, the subtitle
 * and the three links are all known without the seed — which is why it lives in its own file: the
 * loading placeholder (<ParkBestDaysSectionSkeleton>) renders this same component instead of grey
 * boxes shaped like it.
 *
 * That is what makes the reservation exact at every breakpoint and in every locale. "Beste
 * Reisezeit für den Europa-Park" wraps to two lines on a phone and one on a desktop, and no
 * fixed-width Skeleton can track that: sized placeholders left the mobile header 66–120px short,
 * and on the park page everything below — the whole attraction grid on desktop — absorbed the
 * difference as a jump the moment the streamed seed landed.
 */
export function ParkBestDaysHeader({
  parkName,
  parkSlug,
  locale,
  showCalendarLink = false,
  className,
}: {
  parkName: string;
  parkSlug: string;
  locale: string;
  showCalendarLink?: boolean;
  /** Passed through to `ChapterHeading` — the section and its skeleton square off the bottom so
   *  the card underneath can be glued to it. The guide page renders this header on its own and
   *  keeps all four corners. */
  className?: string;
}) {
  const t = useTranslations('parks.bestDays');
  const displayName = localizedParkName(parkName, parkSlug, locale);

  return (
    <ChapterHeading
      icon={CalendarDays}
      title={t('title', { park: displayName })}
      id="best-days-heading"
      frosted
      className={className}
      badge={
        showCalendarLink ? (
          <CrowdCalendarFaqLink className="border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/50 inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium no-underline transition-colors">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            {t('viewCalendarLink')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </CrowdCalendarFaqLink>
        ) : null
      }
      hint={
        <>
          {t('subtitle')}
          <span className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link
              href="/fancast"
              className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-xs font-medium transition-colors"
            >
              {t('fancastLink')}
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
            <Link
              href={`/${BEST_TIME_SEGMENTS[locale as Locale]}`}
              className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-xs font-medium transition-colors"
            >
              {t('bestTimeLink')}
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </span>
        </>
      }
    />
  );
}
