import { getTranslations } from 'next-intl/server';

import {
  WeekdayForecastHover,
  type WeekdayForecastPark,
} from '@/components/parks/weekday-forecast-hover';
import { cn } from '@/lib/utils';
import { CROWD_CHIP_CLASS, CROWD_DOT_CLASS } from '@/lib/utils/crowd-level-styles';
import { getDateTimeFormat, weekdayName, WEEKDAYS_MONDAY_FIRST } from '@/lib/utils/intl-format';
import { formatRuns, formatWeekdayList, WEEKEND } from '@/lib/utils/day-runs';
import type { BestDaysTier, ParkBestDays } from '@/lib/parks/park-stats-derive';

const MONTHS: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/** Day and month on one line, each kept whole, so a narrow column breaks between them and never inside one. */
function EndColumn({ label, parts }: { label: string; parts: (string | null)[] }) {
  const shown = parts.filter((p): p is string => p != null);
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground mb-1.5 text-xs">{label}</dt>
      <dd className="font-medium">
        {shown.map((part, i) => (
          <span key={i}>
            {i > 0 && ' · '}
            <span className="whitespace-nowrap">{part}</span>
          </span>
        ))}
      </dd>
    </div>
  );
}

const isWeekend = (d: number) => WEEKEND.includes(d);

/** Chip per tier: the crowd scale's two ends for the quiet and busy days, a neutral chip between. */
const TIER_CHIP_CLASS: Record<BestDaysTier, string> = {
  quiet: CROWD_CHIP_CLASS.low,
  middle: 'border-border/60 bg-muted/40 text-foreground/80 border',
  busy: CROWD_CHIP_CLASS.high,
};

/**
 * The park header's answer to „when is it quiet": seven weekday cells tiered against the park's
 * own other days, Monday to Friday and the weekend as two bands, and from `sm` up the quietest and
 * busiest weekdays and months below them (beside them from `lg`, where both fit on one line), from
 * the two-year aggregate. On a phone the columns are hidden by CSS only, so the HTML still carries
 * them. Server-rendered and clock-free, so hydration has nothing to compare. Always renders; the
 * caller gates on `deriveParkBestDays` returning a value.
 *
 * With `forecast`, each weekday cell opens the forecast for that weekday's next dates on hover or
 * tap (`WeekdayForecastHover`); the cells themselves stay this component's markup.
 */
export async function ParkBestDaysSummary({
  bestDays,
  locale,
  forecast,
  className,
}: {
  bestDays: ParkBestDays;
  locale: string;
  forecast?: WeekdayForecastPark;
  className?: string;
}) {
  const t = await getTranslations('parkBestDays');
  const tOutlook = await getTranslations('parks.yearlyOutlook');
  const tLegend = await getTranslations('attractions.historyLegend');
  const tierLabel = { quiet: t('quieter'), middle: t('middle'), busy: t('busier') };

  // Three or more months go short, so a column holds them on one line.
  const monthName = (keys: number[]) => {
    const format = getDateTimeFormat(locale, {
      month: keys.length > 2 ? 'short' : 'long',
      timeZone: 'UTC',
    });
    return (m: number) => format.format(Date.UTC(2024, m - 1, 12));
  };
  const dayLabels = { weekdays: t('weekdays'), weekend: t('weekend') };
  const days = (keys: number[]) => formatWeekdayList(keys, locale, dayLabels);
  const months = (keys: number[]) =>
    keys.length ? formatRuns(keys, MONTHS, locale, monthName(keys)) : null;

  const quiet = { days: days(bestDays.quietDays), months: months(bestDays.quietMonths) };
  const busy = { days: days(bestDays.busyDays), months: months(bestDays.busyMonths) };
  const hasQuiet = bestDays.days.includes('quiet');
  const hasBusy = bestDays.days.includes('busy');

  // Monday to Friday and the weekend as two bands: a cell opens a band where the weekend starts or
  // ends. Two neighbours of one tier share the left cell's border as the hairline; where the tier
  // changes each keeps its own, or a coloured cell would be edged in its neighbour's grey.
  const scale = (
    <ol className="flex">
      {WEEKDAYS_MONDAY_FIRST.map((d, i) => {
        const tier = bestDays.days[d];
        const prev = WEEKDAYS_MONDAY_FIRST[i - 1];
        const next = WEEKDAYS_MONDAY_FIRST[i + 1];
        const opensBand = prev === undefined || isWeekend(prev) !== isWeekend(d);
        const closesBand = next === undefined || isWeekend(next) !== isWeekend(d);
        const sharesBorder = !opensBand && bestDays.days[prev] === tier;
        return (
          <li
            key={d}
            data-weekday={d}
            className={cn(
              'flex h-7 flex-1 items-center justify-center text-xs font-medium',
              forecast && 'cursor-help',
              tier
                ? TIER_CHIP_CLASS[tier]
                : 'border-border text-muted-foreground border border-dashed',
              opensBand && 'rounded-l-md',
              sharesBorder && 'border-l-0',
              opensBand && i > 0 && 'ml-2',
              closesBand && 'rounded-r-md'
            )}
          >
            {/* Drawn, not written: as text the short name runs into the sr-only one ("Mo" +
                "Montag" reads "MoMontag") in every text extraction and in the Markdown agents get. */}
            <span
              aria-hidden="true"
              className="before:content-[attr(data-label)]"
              data-label={weekdayName(d, locale, 'short')}
            />
            <span className="sr-only">
              {weekdayName(d, locale)}: {tier ? tierLabel[tier] : t('thin')}
            </span>
          </li>
        );
      })}
    </ol>
  );

  // First letter up: the panel names the weekday as a heading, and „samedi" is how French writes it
  // mid-sentence.
  const heading = (d: number) => {
    const name = weekdayName(d, locale);
    return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1);
  };
  const forecastLabels = {
    caption: t('forecastCaption'),
    weekdays: [0, 1, 2, 3, 4, 5, 6].map(heading),
    openCalendar: tOutlook('openDay'),
    signals: {
      school: tLegend('schoolVacation'),
      holiday: tLegend('holiday'),
      bridge: tLegend('bridgeDay'),
    },
  };

  return (
    <div data-park-best-days className={cn('mt-4 flex flex-col lg:flex-row lg:gap-10', className)}>
      <div className="sm:w-96 sm:shrink-0">
        {/* Caption and key share one line, which is the phone's whole budget beside the chips; the
          window is left out of that line by CSS, not markup, so the HTML still states it. */}
        <div className="text-muted-foreground mb-1.5 flex flex-wrap items-center justify-between gap-x-3 text-xs">
          <p>
            {t('caption')}
            <span className="max-sm:hidden">, {t('period', { count: bestDays.windowYears })}</span>
          </p>
          {(hasQuiet || hasBusy) && (
            <p className="flex items-center gap-3" aria-hidden="true">
              {hasQuiet && (
                <span className="inline-flex items-center gap-1">
                  <span className={cn('size-2 rounded-full', CROWD_DOT_CLASS.low)} />
                  {tierLabel.quiet}
                </span>
              )}
              {hasBusy && (
                <span className="inline-flex items-center gap-1">
                  <span className={cn('size-2 rounded-full', CROWD_DOT_CLASS.high)} />
                  {tierLabel.busy}
                </span>
              )}
            </p>
          )}
        </div>
        {forecast ? (
          <WeekdayForecastHover park={forecast} labels={forecastLabels}>
            {scale}
          </WeekdayForecastHover>
        ) : (
          scale
        )}
      </div>

      <dl className="hidden text-sm sm:mt-3 sm:flex sm:gap-10 lg:mt-0">
        {(quiet.days || quiet.months) && (
          <EndColumn label={t('quietest')} parts={[quiet.days, quiet.months]} />
        )}
        {(busy.days || busy.months) && (
          <EndColumn label={t('busiest')} parts={[busy.days, busy.months]} />
        )}
      </dl>
    </div>
  );
}
