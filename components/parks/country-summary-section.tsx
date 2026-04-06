import { getTranslations } from 'next-intl/server';
import { TrendingDown, TrendingUp, Star } from 'lucide-react';
import { GlassCard } from '@/components/common/glass-card';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { Link } from '@/i18n/navigation';
import type { CountrySummary, CrowdLevel } from '@/lib/api/types';

interface CountrySummarySectionProps {
  summary: CountrySummary;
  countryName: string;
  locale: string;
}

const scoreToCrowdLevel = (score: number): CrowdLevel => {
  if (score <= 1.5) return 'very_low';
  if (score <= 2.5) return 'low';
  if (score <= 3.5) return 'moderate';
  if (score <= 4.5) return 'high';
  if (score <= 5.5) return 'very_high';
  return 'extreme';
};

function MonthList({ months, locale }: { months: number[]; locale: string }) {
  const names = months.map((m) =>
    new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2024, m - 1, 1))
  );
  return <span className="capitalize">{names.join(', ')}</span>;
}

export async function CountrySummarySection({
  summary,
  countryName,
  locale,
}: CountrySummarySectionProps) {
  const t = await getTranslations('explore.countrySummary');

  const hasMonthData = summary.avgPeakMonths.length > 0 || summary.avgQuietMonths.length > 0;

  return (
    <section aria-labelledby="country-summary-heading" className="mb-8 space-y-4">
      {/* Intro text — indexable SEO content */}
      <p id="country-summary-heading" className="text-muted-foreground text-sm">
        {summary.parkCount === 1
          ? t('introSingle', { country: countryName, parkCount: summary.parkCount })
          : t('introPlural', {
              country: countryName,
              parkCount: summary.parkCount,
              cityCount: summary.cityCount,
            })}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Top Parks */}
        {summary.topParks.length > 0 && (
          <GlassCard variant="light" className="space-y-3 p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Star className="text-primary h-4 w-4" aria-hidden="true" />
              {t('topParksTitle')}
            </h2>
            <ul className="space-y-2">
              {summary.topParks.map((park) => (
                <li key={park.slug} className="flex items-center justify-between gap-2 text-sm">
                  <Link
                    href={`/parks${park.path.replace(/^\/parks/, '')}`}
                    className="hover:text-primary truncate transition-colors"
                  >
                    {park.name}
                    <span className="text-muted-foreground ml-1 text-xs">· {park.city}</span>
                  </Link>
                  <CrowdLevelBadge
                    level={scoreToCrowdLevel(park.avgAnnualCrowdScore)}
                    className="shrink-0 text-xs"
                  />
                </li>
              ))}
            </ul>
          </GlassCard>
        )}

        {/* Best / busiest months */}
        {hasMonthData && (
          <GlassCard variant="light" className="space-y-3 p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <TrendingDown className="text-primary h-4 w-4" aria-hidden="true" />
              {t('bestMonthsTitle')}
            </h2>
            <dl className="space-y-2 text-sm">
              {summary.avgQuietMonths.length > 0 && (
                <div className="flex items-start gap-2">
                  <TrendingDown
                    className="mt-0.5 h-4 w-4 shrink-0 text-green-500"
                    aria-hidden="true"
                  />
                  <div>
                    <dt className="text-muted-foreground text-xs">{t('quietMonthsLabel')}</dt>
                    <dd>
                      <MonthList months={summary.avgQuietMonths} locale={locale} />
                    </dd>
                  </div>
                </div>
              )}
              {summary.avgPeakMonths.length > 0 && (
                <div className="flex items-start gap-2">
                  <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
                  <div>
                    <dt className="text-muted-foreground text-xs">{t('peakMonthsLabel')}</dt>
                    <dd>
                      <MonthList months={summary.avgPeakMonths} locale={locale} />
                    </dd>
                  </div>
                </div>
              )}
            </dl>
          </GlassCard>
        )}
      </div>
    </section>
  );
}
