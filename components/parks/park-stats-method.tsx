import { getTranslations } from 'next-intl/server';
import { Ruler } from 'lucide-react';

import { ChapterHeading } from '@/components/common/chapter-heading';
import { GlassCard } from '@/components/common/glass-card';
import { buildGlossaryTermHref } from '@/lib/glossary/segments';
import { getGlossaryTerms } from '@/lib/glossary/translations';
import { parkArgs } from '@/lib/i18n/park-phrase';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import type { Locale } from '@/i18n/config';
import type { ParkHistoricalStats, ParkHourlyProfile } from '@/lib/api/types';

/**
 * Glossary terms this section links, in the order the prose reaches them.
 *
 * Ids, not slugs: a slug is per-locale and this list is not. An id the glossary has no entry for
 * renders as plain words rather than as a link at a 404 — the term set is content and can be
 * edited without this file knowing.
 */
type MethodTermId = 'wait-time' | 'posted-wait-time' | 'crowd-level';

interface ParkStatsMethodProps {
  stats: ParkHistoricalStats;
  /** `null` for a park with no readable hourly profile — the third paragraph then does not run. */
  profile: ParkHourlyProfile | null;
  locale: Locale;
  parkName: string;
  articleDe: string | null | undefined;
}

/**
 * How the numbers above this section were made.
 *
 * The one part of the wait-time record that is prose rather than a card, and the one part no
 * competitor prints: queue-times.com shows averages without ever saying over how many measured
 * days, while this payload carries that count per park — a median of 149 across the 119 parks
 * that qualify, min 31, max 190 (measured 2026-09-21, `docs/seo/dedicated-landing-pages.md` §5).
 * So the section names THIS park's number, and it is also what gives the page indexable text
 * under its own heading rather than four tables and a title.
 *
 * Every figure in it comes out of the payload the tables above were drawn from. Nothing here is
 * written down in a message: `{days}`, `{years}` and the hourly window are interpolated, so a
 * park with 31 measured days cannot inherit a sentence about 149.
 *
 * The hourly paragraph is separate because its window is: the profile is asked for one year where
 * the aggregate takes two, and a park can have the aggregate and not the profile at all.
 */
export async function ParkStatsMethod({
  stats,
  profile,
  locale,
  parkName,
  articleDe,
}: ParkStatsMethodProps) {
  const [t, terms] = await Promise.all([
    getTranslations('parks.statsPage.method'),
    getGlossaryTerms(locale),
  ]);
  const bySlugId = new Map(terms.map((term) => [term.id, term]));

  /**
   * A glossary link, or the plain words when the term is not in this locale's glossary. Never a
   * dropped phrase: the sentence has to read either way, so the chunks always render.
   */
  const link = (id: MethodTermId) => {
    const term = bySlugId.get(id);
    const href = term ? buildGlossaryTermHref(locale, term.slug) : null;
    return function GlossaryChunk(chunks: React.ReactNode) {
      return href ? (
        <a
          href={href}
          className="decoration-primary/40 hover:decoration-primary underline underline-offset-2"
        >
          {chunks}
        </a>
      ) : (
        <>{chunks}</>
      );
    };
  };

  const park = parkArgs(locale, parkName, articleDe);
  // The window's first day, spelled the way the reader's locale spells a date. `dataFrom` is a
  // plain `YYYY-MM-DD` with no zone in it, so it is read as UTC and printed as UTC — a park in
  // Los Angeles must not have its window start a day earlier than the payload says it does.
  const hourlyFrom = profile
    ? getDateTimeFormat(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(`${profile.meta.dataFrom}T00:00:00Z`))
    : null;

  return (
    <section className="mt-8" aria-labelledby="stats-method-heading">
      <ChapterHeading icon={Ruler} title={t('title')} id="stats-method-heading" frosted />
      <GlassCard variant="tile">
        <div className="text-muted-foreground max-w-3xl space-y-4 text-sm leading-relaxed">
          <p>
            {t.rich('measured', {
              ...park,
              days: stats.meta.totalSampleDays,
              years: stats.meta.windowYears,
              wait: link('wait-time'),
              posted: link('posted-wait-time'),
            })}
          </p>
          <p>
            {t.rich('percentiles', {
              wait: link('wait-time'),
              crowd: link('crowd-level'),
            })}
          </p>
          {profile && hourlyFrom && (
            <p>
              {t('hourly', {
                days: profile.meta.totalSampleDays,
                from: hourlyFrom,
              })}
            </p>
          )}
        </div>
      </GlassCard>
    </section>
  );
}
