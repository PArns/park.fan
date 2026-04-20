'use client';

import { useMemo } from 'react';
import { Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type SlotType = 'past' | 'current' | 'forecast';

interface TimeSlot {
  time: string; // "HH:mm"
  historyValue: number | null;
  forecastValue: number | null;
}

export interface DailyWaitTimeChartData {
  slots: TimeSlot[];
  timezone: string;
  /** Best visit slots from the backend, times already in "HH:mm" park-local format. */
  bestSlots?: { time: string; rating: 'optimal' | 'good' }[];
  translations: {
    title: string;
    now: string;
    bestSlots: string; // contains "{hours}" placeholder
    bestSlotsGood: string; // contains "{hours}" placeholder
    timeSuffix: string; // e.g. " Uhr" in DE, "" in EN
    min: string;
    ratingOptimal: string;
    ratingGood: string;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function barColorClass(w: number): string {
  if (w < 20) return 'bg-crowd-very-low';
  if (w < 35) return 'bg-crowd-low';
  if (w < 50) return 'bg-crowd-moderate';
  if (w < 65) return 'bg-crowd-high';
  return 'bg-crowd-very-high';
}

function getCurrentTimeSlotInTimezone(timezone: string): string {
  const parts = new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    hourCycle: 'h23',
    timeZone: timezone,
  }).formatToParts(new Date());
  const hour = parts.find((p) => p.type === 'hour')?.value || '00';
  const minute = parts.find((p) => p.type === 'minute')?.value || '00';
  // Round to nearest 15m slot
  const roundedMinute = Math.floor(parseInt(minute, 10) / 15) * 15;
  return `${hour.padStart(2, '0')}:${roundedMinute.toString().padStart(2, '0')}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DailyWaitTimeChart({
  slots,
  timezone,
  bestSlots,
  translations,
}: DailyWaitTimeChartData) {
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

        return { time: slot.time, value, type };
      }),
    [slots, currentTimeSlot]
  );

  // Best slots map from backend data (HH:mm → rating)
  const bestSlotsMap = useMemo(() => {
    const map = new Map<string, 'optimal' | 'good'>();
    bestSlots?.forEach((s) => map.set(s.time, s.rating));
    return map;
  }, [bestSlots]);

  const hasData = typedSlots.some((s) => s.value !== null);
  if (!hasData) return null;

  const maxValue = Math.max(...typedSlots.map((s) => s.value ?? 0), 10);

  // Bottom hint: show optimal and good times with time suffix
  const fmt = (times: string[]) =>
    times.map((t) => `${t}${translations.timeSuffix}`).join(', ');
  const optimalTimes = bestSlots?.filter((s) => s.rating === 'optimal').map((s) => s.time) ?? [];
  const goodTimes = bestSlots?.filter((s) => s.rating === 'good').map((s) => s.time) ?? [];
  const bestSlotsLabel =
    optimalTimes.length > 0
      ? translations.bestSlots.replace('{hours}', fmt(optimalTimes))
      : null;
  const bestSlotsGoodLabel =
    goodTimes.length > 0
      ? translations.bestSlotsGood.replace('{hours}', fmt(goodTimes))
      : null;

  // Show hour labels (HH:00), always show last slot
  const showLabel = (slot: { time: string; type: SlotType }, isLast: boolean) => {
    if (slot.type === 'current') return true;
    if (isLast) return true;
    const [h, m] = slot.time.split(':');
    if (m !== '00') return false;
    const hour = parseInt(h, 10);
    // If > 48 slots (12 hours), only show even hours
    if (typedSlots.length > 48) return hour % 2 === 0;
    return true;
  };

  // For the last slot, round up to next hour if not on the hour
  const lastSlotLabel = (() => {
    const last = typedSlots[typedSlots.length - 1];
    if (!last) return '';
    const [h, m] = last.time.split(':');
    if (m === '00') return `${h}h`;
    return `${(parseInt(h, 10) + 1).toString().padStart(2, '0')}h`;
  })();

  return (
    <Card className="p-4 sm:p-6">
      <h2 className="mb-4 text-xl font-semibold">{translations.title}</h2>

      {/* Horizontal scroll on small screens */}
      <div className="-mx-1 overflow-x-auto px-1">
        <div className="min-w-[320px]">
          {/* Value labels above bars */}
          <div className="mb-2 flex gap-0.5">
            {typedSlots.map((slot) => (
              <div
                key={slot.time}
                className={cn(
                  'flex-1 text-center leading-none',
                  slot.type === 'past' ? 'text-muted-foreground/60' : 'text-foreground/80'
                )}
              >
                {slot.value !== null && (
                  <span className="flex flex-col items-center leading-none">
                    <span className="text-[10px] font-semibold sm:text-[11px]">{slot.value}</span>
                    <span className="text-[9px] font-normal sm:text-[10px]">{translations.min}</span>
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Bars */}
          <div className="flex h-28 items-stretch gap-0.5 sm:h-32">
            {typedSlots.map((slot) => {
              const bestRating = bestSlotsMap.get(slot.time);
              const barPct = slot.value !== null ? (slot.value / maxValue) * 100 : 0;
              return (
                <div key={slot.time} className="relative flex flex-1 flex-col justify-end">
                  {/* Best-time dot above bar */}
                  {bestRating && slot.value !== null && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="absolute left-1/2 z-10 -translate-x-1/2 cursor-default"
                          style={{ bottom: `calc(${barPct}% + 3px)` }}
                        >
                          {/* Pulsing ring */}
                          <span
                            className={cn(
                              'absolute -inset-0.5 animate-ping rounded-full opacity-50 [animation-duration:2s]',
                              bestRating === 'optimal' ? 'bg-emerald-400' : 'bg-emerald-700'
                            )}
                          />
                          {/* Solid dot */}
                          <span
                            className={cn(
                              'relative block h-2 w-2 rounded-full',
                              bestRating === 'optimal' ? 'bg-emerald-400' : 'bg-emerald-700'
                            )}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <p className="font-semibold">{slot.time}{translations.timeSuffix}</p>
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
                        'w-full rounded-t',
                        barColorClass(slot.value),
                        slot.type === 'past' && 'opacity-40',
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

          {/* Time labels + current dot below bars */}
          <div className="mt-2 flex gap-0.5">
            {typedSlots.map((slot, i) => {
              const isLast = i === typedSlots.length - 1;
              return (
                <div
                  key={slot.time}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-0.5',
                    !showLabel(slot, isLast) && 'invisible'
                  )}
                >
                  {slot.type === 'current' && <div className="bg-primary h-1.5 w-1.5 rounded-full" />}
                  <span
                    className={cn(
                      'text-[11px] font-medium whitespace-nowrap sm:text-xs',
                      slot.type === 'current' ? 'text-primary font-semibold' : 'text-muted-foreground'
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

      {/* Best slot hints — optimal and good times from backend */}
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
    </Card>
  );
}
