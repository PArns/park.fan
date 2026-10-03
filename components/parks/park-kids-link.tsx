import { getTranslations } from 'next-intl/server';
import { Baby } from 'lucide-react';

import { ChapterHeading } from '@/components/common/chapter-heading';
import { GlassCard } from '@/components/common/glass-card';
import { ParkKidsHeightFilter } from '@/components/parks/park-kids-height-filter';
import { Link } from '@/i18n/navigation';
import { parkKidsPath } from '@/lib/parks/kids-segments';
import type { KidsPageData } from '@/lib/parks/kids-page';
import { parkArgs } from '@/lib/i18n/park-phrase';
import type { Locale } from '@/i18n/config';

/**
 * The park page's link to its "with kids" page.
 *
 * Server-rendered and rendered only for a park that clears the gate (`kidsPageData` is `null`
 * below it), so no park page links at a 404. It sits under the ride tabs, where a parent who has
 * just moved the height slider is looking. The numbers in its text are the ones the other page
 * prints.
 *
 * Under the link is the height slider again (`ParkKidsHeightFilter`), the panel's own state and
 * not a copy of it: on a phone the panel keeps its slider behind the „Filter“ button, and this
 * block was the one place about children's heights that had no control for them (PO, 2026-10-03).
 */
export async function ParkKidsLink({
  data,
  locale,
  continent,
  country,
  city,
  parkSlug,
  parkName,
  articleDe,
}: {
  data: KidsPageData;
  locale: Locale;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  parkName: string;
  articleDe: string | null | undefined;
}) {
  const t = await getTranslations('parks.kidsPage');
  const phrases = parkArgs(locale, parkName, articleDe);

  return (
    <section className="mt-8" aria-labelledby="kids-link-heading">
      <ChapterHeading icon={Baby} title={t('linkTitle')} id="kids-link-heading" frosted />
      <GlassCard variant="tile">
        <Link
          href={parkKidsPath(locale, continent, country, city, parkSlug)}
          className="group block"
        >
          <span className="block font-medium group-hover:underline">
            {t('linkAnchor', phrases)}
          </span>
          <span className="text-muted-foreground block text-sm leading-relaxed">
            {t('linkBody', {
              withHeight: data.withHeight,
              total: data.total,
              steps: data.tiers.length,
            })}
          </span>
        </Link>
        <ParkKidsHeightFilter toListLabel={t('filterToList')} className="mt-4" />
      </GlassCard>
    </section>
  );
}
