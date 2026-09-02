'use client';

import { useTranslations } from 'next-intl';
import { CalendarDays, CloudOff, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import type { PlanDay } from '@/lib/api/types';

interface PlannerContextBandProps {
  day: PlanDay | null;
  loading?: boolean;
}

/** Fixed height whatever it holds — this panel is on every page. */
const BAND_CLASS = 'flex min-h-[76px] flex-col justify-center gap-2 px-3 py-2';

/**
 * What kind of day this is, above the plan.
 *
 * Everything here is a fact about the date rather than about the plan, and each
 * one is a reason the numbers below look the way they do: a bridge day, a school
 * holiday in the region next door, rain at four.
 *
 * The weather is the interesting case. It reaches about two weeks and then stops,
 * and the API does not substitute a climate normal — so past that this says the
 * forecast does not reach, rather than leaving a gap that reads as "no rain
 * expected". A missing forecast and a dry day look identical otherwise.
 */
export function PlannerContextBand({ day, loading = false }: PlannerContextBandProps) {
  const t = useTranslations('planner');

  if (loading || !day) {
    return (
      <div className={cn(BAND_CLASS, 'animate-pulse')} aria-hidden="true">
        <div className="bg-muted/50 h-4 w-40 rounded" />
        <div className="bg-muted/40 h-4 w-56 rounded" />
      </div>
    );
  }

  const { context, tier } = day;
  const hours =
    context.openHour !== null && context.closeHour !== null
      ? t('context.hours', {
          open: String(context.openHour).padStart(2, '0'),
          close: String(context.closeHour).padStart(2, '0'),
        })
      : null;

  const tierLabel =
    tier === 'measured'
      ? t('tier.measured')
      : tier === 'composed'
        ? t('tier.composed')
        : t('tier.longRange');

  const tierHint =
    tier === 'measured'
      ? t('tier.measuredHint')
      : tier === 'composed'
        ? t('tier.composedHint')
        : t('tier.longRangeHint');

  const crowd = context.crowdLevel;
  const hasCrowd = Boolean(crowd) && crowd !== 'closed';

  return (
    <div className={BAND_CLASS}>
      <div className="flex flex-wrap items-center gap-1.5">
        {hasCrowd && <CrowdLevelBadge level={crowd} />}

        {hours && (
          <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
            <Clock className="size-3" />
            {hours}
          </span>
        )}

        {context.isHoliday && (
          <Badge variant="outline" className="text-[11px]">
            {t('context.holiday')}
          </Badge>
        )}
        {context.isBridgeDay && (
          <Badge variant="outline" className="text-[11px]">
            {t('context.bridgeDay')}
          </Badge>
        )}
        {context.isSchoolVacation && (
          <Badge variant="outline" className="text-[11px]">
            {t('context.schoolVacation')}
          </Badge>
        )}
        {context.isWeekend && (
          <Badge variant="outline" className="text-[11px]">
            {t('context.weekend')}
          </Badge>
        )}
        {context.neighborHolidays && context.neighborHolidays.length > 0 && (
          <Badge variant="outline" className="text-[11px]">
            {t('context.neighborHolidays')}
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {!context.weather && (
          <span className="text-muted-foreground inline-flex items-center gap-1 text-[11px]">
            <CloudOff className="size-3" />
            {t('context.weatherUnknown')}
          </span>
        )}
        <span className="text-muted-foreground inline-flex items-center gap-1 text-[11px]">
          <CalendarDays className="size-3" />
          <span className="text-foreground/80 font-medium">{tierLabel}</span>
          <span className="max-sm:sr-only">{tierHint}</span>
        </span>
      </div>
    </div>
  );
}
