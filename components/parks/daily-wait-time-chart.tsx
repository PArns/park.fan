'use client';

import { useMemo, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { ChartColumn, Clock, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SectionHeading } from '@/components/common/section-heading';
import { GlossaryTermLink } from '@/components/glossary/glossary-term-link';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { CROWD_DOT_CLASS, waitTimeCrowdTier } from '@/lib/utils/crowd-level-styles';

type SlotType = 'past' | 'current' | 'forecast';

interface TimeSlot {
  time: string; // "HH:mm"
  historyValue: number | null;
  forecastValue: number | null;
  /**
   * What this ride normally does at this time of day: the quiet quarter (P25) and the busy tenth
   * (P90) of its own history, the scale today's figure is read against. Hourly, so the four slots
   * of an hour share a value and the band reads as a step, as the rollup behind it is hourly too.
   */
  typicalLow?: number | null;
  typicalHigh?: number | null;
}

/** Everything `DailyWaitTimeChart` draws: today's slots, the best slots and its strings. */
export interface DailyWaitTimeChartData {
  slots: TimeSlot[];
  timezone: string;
  /** Best visit slots from the backend, times already in "HH:mm" park-local format. */
  bestSlots?: { time: string; rating: 'optimal' | 'good' }[];
  /**
   * Whether a corridor is being fetched for this ride. The legend then holds the third entry's box
   * from the first paint, so a legend that wraps on a narrow phone does not grow a line, and push
   * the chart down, when the band lands.
   */
  expectTypical?: boolean;
  /**
   * The caller's own heading already says what this chart is, so it draws none. Set by the ride
   * page, whose chapter title is the same string; the caller renders the KI-Prognose badge
   * beside it.
   */
  hideTitle?: boolean;
  translations: {
    title: string;
    now: string;
    bestSlots: string; // contains "{hours}" placeholder
    bestSlotsGood: string; // contains "{hours}" placeholder
    timeSuffix: string; // e.g. " Uhr" in DE, "" in EN
    min: string;
    ratingOptimal: string;
    ratingGood: string;
    /** "KI-Prognose" pill shown next to the title. */
    aiBadge: string;
    /** One line explaining recorded-vs-predicted. */
    aiExplainer: string;
    /** Legend label for past, measured bars (dimmed). */
    legendRecorded: string;
    /** Legend label for future, AI-forecast bars (solid). */
    legendForecast: string;
    /** Legend label for the historical corridor behind the bars. */
    legendTypical?: string;
  };
}

/** Format "HH:mm" for display: 12h AM/PM for EN, otherwise HH:mm + suffix. */
function formatSlotTime(hhmm: string, locale: string, timeSuffix: string): string {
  if (locale === 'en') {
    const [h, m] = hhmm.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    return getDateTimeFormat('en', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  }
  return `${hhmm}${timeSuffix}`;
}

function getCurrentTimeSlotInTimezone(timezone: string): string {
  const parts = getDateTimeFormat('en', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    hourCycle: 'h23',
    timeZone: timezone,
  }).formatToParts(new Date());
  const hour = parts.find((p) => p.type === 'hour')?.value || '00';
  const minute = parts.find((p) => p.type === 'minute')?.value || '00';
  const roundedMinute = Math.floor(parseInt(minute, 10) / 15) * 15;
  return `${hour.padStart(2, '0')}:${roundedMinute.toString().padStart(2, '0')}`;
}

/**
 * Bar chart of a ride's wait times today in 15-minute slots: measured up to now, AI forecast
 * after, over the ride's usual P25 to P90 corridor, with the best slots named under it.
 * Scrolls the current slot into view; renders nothing without data.
 */
export function DailyWaitTimeChart({
  slots,
  timezone,
  bestSlots,
  expectTypical,
  hideTitle,
  translations,
}: DailyWaitTimeChartData) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const currentTimeSlot = useMemo(() => getCurrentTimeSlotInTimezone(timezone), [timezone]);

  const typedSlots = useMemo(
    () =>
      slots.map((slot) => {
        let type: SlotType;
        if (slot.time < currentTimeSlot) type = 'past';
        else if (slot.time === currentTimeSlot) type = 'current';
        else type = 'forecast';

        const value =
          type === 'past'
            ? (slot.historyValue ?? null)
            : type === 'current'
              ? (slot.historyValue ?? slot.forecastValue ?? null)
              : (slot.forecastValue ?? null);

        return {
          time: slot.time,
          value,
          type,
          typicalLow: slot.typicalLow ?? null,
          typicalHigh: slot.typicalHigh ?? null,
        };
      }),
    [slots, currentTimeSlot]
  );

  const bestSlotsMap = useMemo(() => {
    const map = new Map<string, 'optimal' | 'good'>();
    bestSlots?.forEach((s) => map.set(s.time, s.rating));
    return map;
  }, [bestSlots]);

  const currentIndex = useMemo(
    () => typedSlots.findIndex((s) => s.type === 'current'),
    [typedSlots]
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || currentIndex < 0 || typedSlots.length === 0) return;
    const itemWidth = el.scrollWidth / typedSlots.length;
    const targetScroll = currentIndex * itemWidth - el.clientWidth / 2 + itemWidth / 2;
    el.scrollLeft = Math.max(0, targetScroll);
  }, [currentIndex, typedSlots.length]);

  const hasData = typedSlots.some((s) => s.value !== null);
  if (!hasData) return null;

  const maxValue = Math.max(
    ...typedSlots.map((s) => s.value ?? 0),
    ...typedSlots.map((s) => s.typicalHigh ?? 0),
    10
  );
  const hasCorridor = typedSlots.some((s) => s.typicalLow != null && s.typicalHigh != null);

  const fmt = (times: string[]) =>
    times.map((t) => formatSlotTime(t, locale, translations.timeSuffix)).join(', ');
  const optimalTimes = bestSlots?.filter((s) => s.rating === 'optimal').map((s) => s.time) ?? [];
  const goodTimes = bestSlots?.filter((s) => s.rating === 'good').map((s) => s.time) ?? [];
  const bestSlotsLabel =
    optimalTimes.length > 0 ? translations.bestSlots.replace('{hours}', fmt(optimalTimes)) : null;
  const bestSlotsGoodLabel =
    goodTimes.length > 0 ? translations.bestSlotsGood.replace('{hours}', fmt(goodTimes)) : null;

  const showLabel = (slot: { time: string; type: SlotType }, isLast: boolean) => {
    if (slot.type === 'current') return true;
    if (isLast) return true;
    const [h, m] = slot.time.split(':');
    if (m !== '00') return false;
    const hour = parseInt(h, 10);
    if (typedSlots.length > 48) return hour % 2 === 0;
    return true;
  };

  const lastSlotLabel = (() => {
    const last = typedSlots[typedSlots.length - 1];
    if (!last) return '';
    const [h, m] = last.time.split(':');
    if (m === '00') return `${h}h`;
    return `${(parseInt(h, 10) + 1).toString().padStart(2, '0')}h`;
  })();

  return (
    // Bare section (no Card) — rendered inside the unified live card on the attraction page.
    <div>
      {/* Suppressed where the chapter heading above already says it (`hideTitle`). The badge
        travels with the title, so the caller that hides this one renders it beside its own h2. */}
      {!hideTitle && (
        <SectionHeading
          icon={ChartColumn}
          title={translations.title}
          badge={
            <GlossaryTermLink termId="ai-forecast">
              <Badge className="border-primary/20 bg-primary/10 text-primary gap-1">
                <Sparkles className="h-3 w-3" />
                {translations.aiBadge}
              </Badge>
            </GlossaryTermLink>
          }
          variant="plain"
          as="h3"
          className="mb-1.5"
        />
      )}

      <p className="text-muted-foreground mb-3 text-xs sm:text-sm">{translations.aiExplainer}</p>

      <div className="text-muted-foreground mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
        <span className="flex items-center gap-1.5">
          <span className="bg-crowd-moderate h-2.5 w-2 rounded-sm opacity-40" aria-hidden="true" />
          {translations.legendRecorded}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="bg-crowd-moderate h-2.5 w-2 rounded-sm" aria-hidden="true" />
          {translations.legendForecast}
        </span>
        {(hasCorridor || expectTypical) && translations.legendTypical && (
          <span className={cn('flex items-center gap-1.5', !hasCorridor && 'invisible')}>
            <span className="bg-primary/15 h-2.5 w-4 rounded-sm" aria-hidden="true" />
            {translations.legendTypical}
          </span>
        )}
      </div>

      <div ref={scrollRef} className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
        <div style={{ minWidth: `${Math.max(320, typedSlots.length * 15)}px` }}>
          {/* `md:`/`xl:` and not `@min-[…]/page:`: the row scrolls at a fixed `minWidth`, so the
              breakpoint asks about the device (a number over every bar is noise on a phone), not
              the column. <LiveAttractionData>'s reserved box steps at the same two widths. */}
          <div className="mb-2 hidden gap-0.5 md:flex">
            {typedSlots.map((slot) => (
              <div
                key={slot.time}
                className={cn(
                  'min-w-[15px] flex-1 text-center leading-none',
                  slot.type === 'past' ? 'text-muted-foreground/60' : 'text-foreground/80'
                )}
              >
                {slot.value !== null && (
                  <span className="flex flex-col items-center leading-none">
                    <span className="text-[10px] font-semibold sm:text-[11px]">{slot.value}</span>
                    <span className="hidden text-[9px] font-normal sm:text-[10px] xl:block">
                      {translations.min}
                    </span>
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="flex h-28 items-stretch gap-0.5 sm:h-32">
            {typedSlots.map((slot) => {
              const bestRating = bestSlotsMap.get(slot.time);
              const barPct = slot.value !== null ? (slot.value / maxValue) * 100 : 0;
              return (
                <div
                  key={slot.time}
                  className="relative flex min-w-[15px] flex-1 flex-col justify-end"
                >
                  {/* The corridor, behind everything. One block per slot rather than a path, so it
                      shares the bars' scale by construction. It bleeds a pixel to each side across
                      the `gap-0.5`, so a band constant for an hour looks constant. */}
                  {slot.typicalLow != null && slot.typicalHigh != null && (
                    <div
                      aria-hidden="true"
                      className="bg-primary/15 pointer-events-none absolute -inset-x-px transition-all duration-500 motion-reduce:transition-none"
                      style={{
                        bottom: `${(slot.typicalLow / maxValue) * 100}%`,
                        height: `${((slot.typicalHigh - slot.typicalLow) / maxValue) * 100}%`,
                      }}
                    />
                  )}
                  {bestRating && slot.value !== null && (
                    <Tooltip>
                      <TooltipTrigger
                        className="absolute left-1/2 z-10 -translate-x-1/2 cursor-default bg-transparent p-0 transition-[bottom] duration-500 motion-reduce:transition-none"
                        style={{ bottom: `calc(${barPct}% + 3px)` }}
                      >
                        {/* A static ring: an endless animation inside the ride page's glass panel
                            makes the blur re-read every frame.
                            See docs/rules/work-nobody-can-see-is-still-work.md. */}
                        <span
                          className={cn(
                            'absolute -inset-0.5 rounded-full opacity-50',
                            bestRating === 'optimal' ? 'bg-emerald-400' : 'bg-emerald-700'
                          )}
                        />
                        <span
                          className={cn(
                            'relative block h-2 w-2 rounded-full',
                            bestRating === 'optimal' ? 'bg-emerald-400' : 'bg-emerald-700'
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <p className="font-semibold">
                          {formatSlotTime(slot.time, locale, translations.timeSuffix)}
                        </p>
                        <p className="text-muted-foreground">
                          {bestRating === 'optimal'
                            ? translations.ratingOptimal
                            : translations.ratingGood}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {slot.value !== null ? (
                    <div
                      className={cn(
                        // The scale can move once: `maxValue` takes the corridor
                        // into account and the corridor arrives after the bars.
                        // Half a second of height is the difference between the
                        // chart rescaling and the chart appearing to blink.
                        'w-full rounded-t transition-[height] duration-500 motion-reduce:transition-none',
                        // The app-wide wait scale, so a bar is the colour the same number
                        // is everywhere else (the planner's bars, WaitTimeValue).
                        CROWD_DOT_CLASS[waitTimeCrowdTier(slot.value)],
                        slot.type === 'past' && 'opacity-40'
                      )}
                      style={{ height: `${barPct}%` }}
                    />
                  ) : (
                    <div className="bg-muted/30 w-full rounded-t" style={{ height: '3px' }} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-2 flex gap-0.5">
            {typedSlots.map((slot, i) => {
              const isLast = i === typedSlots.length - 1;
              return (
                <div
                  key={slot.time}
                  className={cn(
                    'flex min-w-[15px] flex-1 flex-col items-center gap-0.5',
                    !showLabel(slot, isLast) && 'invisible'
                  )}
                >
                  {slot.type === 'current' && (
                    <div className="bg-primary h-1.5 w-1.5 rounded-full" />
                  )}
                  <span
                    className={cn(
                      'text-[11px] font-medium whitespace-nowrap sm:text-xs',
                      slot.type === 'current'
                        ? 'text-primary font-semibold'
                        : 'text-muted-foreground'
                    )}
                  >
                    {slot.type === 'current'
                      ? translations.now
                      : isLast && slot.time.split(':')[1] !== '00'
                        ? lastSlotLabel
                        : `${slot.time.split(':')[0]}h`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {(bestSlotsLabel || bestSlotsGoodLabel) && (
        <div className="mt-3 flex flex-col gap-1">
          {bestSlotsLabel && (
            <div className="flex items-center gap-1.5">
              <Clock className="text-crowd-low h-3.5 w-3.5 shrink-0" />
              <span className="text-crowd-low text-xs font-medium">{bestSlotsLabel}</span>
            </div>
          )}
          {bestSlotsGoodLabel && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
              <span className="text-xs font-medium text-emerald-700">{bestSlotsGoodLabel}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
