'use client';

import { CalendarDays, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CrowdCalendarFaqLink } from '@/components/faq/crowd-calendar-faq-link';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { Link } from '@/i18n/navigation';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import { getGermanArticle } from '@/lib/utils';
import type { Locale } from '@/i18n/config';
import { parkArgs } from '@/lib/i18n/park-phrase';

/** "den Europa-Park", not "Europa-Park", where the German title needs the accusative. */
export function localizedParkName(parkName: string, parkSlug: string, locale: string): string {
  if (locale !== 'de') return parkName;
  const nominative = getGermanArticle(parkName, parkSlug);
  const accusative = nominative === 'der' ? 'den' : nominative;
  return accusative ? `${accusative} ${parkName}` : parkName;
}

/**
 * The best-days section's frosted header. It carries no calendar data, so the loading skeleton
 * renders this same component and reserves the exact height at every breakpoint and in every
 * locale. See docs/rules/a-streamed-section-owes-the-page-its-height.md.
 */
export function ParkBestDaysHeader({
  parkName,
  parkSlug,
  articleDe,
  locale,
  showCalendarLink = false,
  className,
}: {
  parkName: string;
  parkSlug: string;
  /** The park's German article, for the heading's "für den/das …". */
  articleDe?: string | null;
  locale: string;
  showCalendarLink?: boolean;
  /**
   * Passed through to `ChapterHeading`: the section and its skeleton square off the bottom so the
   * card underneath can join it. The guide page keeps all four corners.
   */
  className?: string;
}) {
  const t = useTranslations('parks.bestDays');
  const displayName = localizedParkName(parkName, parkSlug, locale);

  return (
    <ChapterHeading
      icon={CalendarDays}
      title={t('title', parkArgs(locale as Locale, displayName, articleDe))}
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
