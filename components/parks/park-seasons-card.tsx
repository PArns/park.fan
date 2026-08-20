import { getTranslations } from 'next-intl/server';
import { CalendarRange, ExternalLink, Ticket } from 'lucide-react';
import { GlassCard } from '@/components/common/glass-card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ParkSeason, ParkSeasonStatus } from '@/lib/api/types';

/**
 * What is on at this park, and how sure we are of it.
 *
 * The seasons are researched by hand from the park's own calendar, and the
 * reason they carry a status is that a visitor planning October needs the
 * difference between dates a park has published and dates it merely ran last
 * year. Rendering all of them the same way would be a lie with dates on it, so
 * `expected` says so and `cancelled` is struck through rather than hidden — a
 * cancelled Halloween is exactly what somebody came to find out.
 *
 * `dates` is the other half. Walibi Holland's Fright Nights are the weekends
 * between 3 October and 1 November plus three single dates; drawn as a range
 * that tells a visitor the park is haunted on a Tuesday. When the list exists,
 * the card says how many days it actually covers.
 */

const STATUS_TONE: Record<ParkSeasonStatus, string> = {
  confirmed: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  announced: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400',
  expected: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  cancelled: 'border-border/60 bg-muted/50 text-muted-foreground',
};

function formatRange(locale: string, start: string, end: string): string {
  const from = new Date(`${start}T12:00:00Z`);
  const to = new Date(`${end}T12:00:00Z`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return `${start} – ${end}`;

  const sameYear = from.getUTCFullYear() === to.getUTCFullYear();
  const short: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', timeZone: 'UTC' };
  const full: Intl.DateTimeFormatOptions = { ...short, year: 'numeric' };

  return `${from.toLocaleDateString(locale, sameYear ? short : full)} – ${to.toLocaleDateString(locale, full)}`;
}

export async function ParkSeasonsCard({
  seasons,
  locale,
  className,
}: {
  seasons: ParkSeason[];
  locale: string;
  className?: string;
}) {
  if (seasons.length === 0) return null;

  const t = await getTranslations('parks.seasons');

  return (
    <GlassCard variant="medium" className={cn('mb-8', className)}>
      <div className="mb-4 flex items-center gap-2">
        <CalendarRange className="text-muted-foreground h-4 w-4" aria-hidden="true" />
        <h2 className="text-lg font-semibold">{t('title')}</h2>
      </div>

      <ul className="space-y-3">
        {seasons.map((season) => {
          const cancelled = season.status === 'cancelled';
          return (
            <li
              key={season.id}
              className="border-border/60 flex flex-wrap items-start gap-x-3 gap-y-1 border-b pb-3 last:border-0 last:pb-0"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn('font-medium', cancelled && 'line-through opacity-70')}>
                    {season.name?.trim() || t(`kind.${season.kind}`)}
                  </span>
                  <Badge variant="outline" className={STATUS_TONE[season.status]}>
                    {t(`status.${season.status}`)}
                  </Badge>
                  {season.separateTicket && (
                    <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                      <Ticket className="h-3 w-3" aria-hidden="true" />
                      {season.priceFrom
                        ? t('fromPrice', {
                            price: `${season.priceFrom} ${season.priceCurrency ?? ''}`.trim(),
                          })
                        : t('separateTicket')}
                    </span>
                  )}
                </div>

                <p className="text-muted-foreground mt-0.5 text-sm">
                  {formatRange(locale, season.startDate, season.endDate)}
                  {season.dates && season.dates.length > 0 && (
                    <> · {t('selectedDays', { count: season.dates.length })}</>
                  )}
                  {season.opensAt && season.closesAt && (
                    <>
                      {' '}
                      · {season.opensAt}–{season.closesAt}
                    </>
                  )}
                </p>
              </div>

              {season.url && (
                <a
                  href={season.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="border-border/60 hover:border-primary/50 hover:text-primary inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors"
                >
                  {t('details')}
                  <ExternalLink className="h-3 w-3 opacity-60" aria-hidden="true" />
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}
