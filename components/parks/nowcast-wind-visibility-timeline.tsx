'use client';

import { memo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CloudFog, Wind as WindIcon } from 'lucide-react';
import { Distance, Wind } from '@/components/common/unit-display';
import {
  LOW_VISIBILITY_M,
  NOTABLE_GUST_KMH,
  formatStepTime,
  nowcastOutlook,
} from '@/lib/utils/nowcast-conditions';
import type { WeatherNowcastStep } from '@/lib/api/types';

interface NowcastWindVisibilityTimelineProps {
  steps: WeatherNowcastStep[];
  /** Forecast snapshot time (UTC ISO), the stable reference for "now". */
  observedAt: string;
  /** Park timezone; step times are naive park-local. */
  timezone: string;
}

// Gusts map 0..100 km/h to the bar height; a stronger slot caps at full height.
const GUST_SCALE_TOP_KMH = 100;
// Visibility maps 2 km (bar empty) down to 0 m (bar full), so a bar grows as the view closes in.
const VISIBILITY_SCALE_TOP_M = 2000;

const NOTABLE_BAR = 'bg-amber-500 dark:bg-amber-400';
const CALM_BAR = 'bg-foreground/20';

interface BarRowProps {
  values: (number | null)[];
  /** Bar height as a share of the row, 0-100. */
  height: (value: number) => number;
  isNotable: (value: number) => boolean;
}

function BarRow({ values, height, isNotable }: BarRowProps) {
  return (
    <div className="flex h-6 items-end gap-px" aria-hidden="true">
      {values.map((value, i) => (
        <div key={i} className="flex h-full min-w-0 flex-1 items-end">
          {value != null && (
            <div
              className={`w-full rounded-[1px] ${isNotable(value) ? NOTABLE_BAR : CALM_BAR}`}
              style={{ height: `${Math.min(100, Math.max(8, Math.round(height(value))))}%` }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Gusts and visibility for the rest of the nowcast window, drawn from the steps the weather card
 * already holds. A row appears only when its value crosses {@link NOTABLE_GUST_KMH} or
 * {@link LOW_VISIBILITY_M}, and with both calm the component renders nothing and takes no space.
 */
export const NowcastWindVisibilityTimeline = memo(function NowcastWindVisibilityTimeline({
  steps,
  observedAt,
  timezone,
}: NowcastWindVisibilityTimelineProps) {
  const locale = useLocale();
  const t = useTranslations('parks.weather');

  const { steps: upcoming, gust, visibility } = nowcastOutlook(steps, observedAt, timezone);
  if (!gust && !visibility) return null;

  const first = formatStepTime(upcoming[0].time, locale);
  const last = formatStepTime(upcoming[upcoming.length - 1].time, locale);

  return (
    <div className="bg-foreground/5 space-y-2 rounded-lg px-3 py-2 text-xs">
      {gust && (
        <div className="space-y-1">
          <p className="tabular-nums">
            <WindIcon
              className="mr-1 inline h-3.5 w-3.5 -translate-y-px opacity-70"
              aria-hidden="true"
            />
            <span className="opacity-70">
              {t('gustsLabel')}: {t('outlook.upTo')}
            </span>{' '}
            <span className="font-medium">
              <Wind kmh={gust.kmh} />
            </span>{' '}
            <span className="opacity-70">
              {t('outlook.around', { time: formatStepTime(gust.time, locale) })}
            </span>
          </p>
          <BarRow
            values={upcoming.map((s) => s.windGusts)}
            height={(v) => (v / GUST_SCALE_TOP_KMH) * 100}
            isNotable={(v) => v >= NOTABLE_GUST_KMH}
          />
        </div>
      )}
      {visibility && (
        <div className="space-y-1">
          <p className="tabular-nums">
            <CloudFog
              className="mr-1 inline h-3.5 w-3.5 -translate-y-px opacity-70"
              aria-hidden="true"
            />
            <span className="opacity-70">
              {t('visibilityLabel')}: {t('outlook.downTo')}
            </span>{' '}
            <span className="font-medium">
              <Distance meters={visibility.meters} />
            </span>{' '}
            <span className="opacity-70">
              {t('outlook.around', { time: formatStepTime(visibility.time, locale) })}
            </span>
          </p>
          <BarRow
            values={upcoming.map((s) => s.visibility)}
            height={(v) => (1 - Math.min(v, VISIBILITY_SCALE_TOP_M) / VISIBILITY_SCALE_TOP_M) * 100}
            isNotable={(v) => v < LOW_VISIBILITY_M}
          />
        </div>
      )}
      <div className="flex justify-between tabular-nums opacity-60">
        <span>{first}</span>
        <span>{last}</span>
      </div>
      <p className="opacity-70">{t('outlook.note')}</p>
    </div>
  );
});
