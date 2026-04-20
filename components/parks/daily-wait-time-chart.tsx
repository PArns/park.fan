'use client';

import { useMemo } from 'react';
import { Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
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
  translations: {
    title: string;
    now: string;
    bestSlots: string; // contains "{hours}" placeholder
    min: string;
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

export function DailyWaitTimeChart({ slots, timezone, translations }: DailyWaitTimeChartData) {
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

  const hasData = typedSlots.some((s) => s.value !== null);
  if (!hasData) return null;

  const maxValue = Math.max(...typedSlots.map((s) => s.value ?? 0), 10);

  // Best upcoming slot: lowest wait time among future slots only.
  const futureSlots = typedSlots.filter((s) => s.type === 'forecast' && s.value !== null);
  const minForecast = futureSlots.length > 0 ? Math.min(...futureSlots.map((s) => s.value!)) : null;
  const bestTimes =
    minForecast !== null
      ? futureSlots.filter((s) => s.value === minForecast).map((s) => s.time)
      : [];
  const bestSlotsLabel =
    bestTimes.length > 0 ? translations.bestSlots.replace('{hours}', bestTimes.join(', ')) : null;

  // Show hour labels (HH:00)
  // If we have many slots, show every 2nd hour
  const showLabel = (slot: { time: string; type: SlotType }) => {
    if (slot.type === 'current') return true;
    const [h, m] = slot.time.split(':');
    if (m !== '00') return false;
    const hour = parseInt(h, 10);
    // If > 48 slots (12 hours), only show even hours
    if (typedSlots.length > 48) return hour % 2 === 0;
    return true;
  };

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
                  <span className="text-[10px] font-semibold sm:text-[11px]">
                    {slot.value}
                    <span className="text-[9px] font-normal sm:text-[10px]">
                      {' '}
                      {translations.min}
                    </span>
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Bars */}
          <div className="flex h-28 items-stretch gap-0.5 sm:h-32">
            {typedSlots.map((slot) => (
              <div key={slot.time} className="relative flex flex-1 flex-col justify-end">
                {slot.value !== null ? (
                  <div
                    className={cn(
                      'w-full rounded-t',
                      barColorClass(slot.value),
                      slot.type === 'past' && 'opacity-40'
                    )}
                    style={{ height: `${(slot.value / maxValue) * 100}%` }}
                  />
                ) : (
                  <div className="bg-muted/30 w-full rounded-t" style={{ height: '3px' }} />
                )}
              </div>
            ))}
          </div>

          {/* Time labels + current dot below bars */}
          <div className="mt-2 flex gap-0.5">
            {typedSlots.map((slot) => (
              <div
                key={slot.time}
                className={cn(
                  'flex flex-1 flex-col items-center gap-0.5',
                  !showLabel(slot) && 'invisible'
                )}
              >
                {slot.type === 'current' && <div className="bg-primary h-1.5 w-1.5 rounded-full" />}
                <span
                  className={cn(
                    'text-[11px] font-medium whitespace-nowrap sm:text-xs',
                    slot.type === 'current' ? 'text-primary font-semibold' : 'text-muted-foreground'
                  )}
                >
                  {slot.type === 'current' ? translations.now : `${slot.time.split(':')[0]}h`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Best slot hint — only upcoming hours */}
      {bestSlotsLabel && (
        <div className="mt-3 flex items-center gap-1.5">
          <Clock className="text-crowd-low h-3.5 w-3.5 shrink-0" />
          <span className="text-crowd-low text-xs font-medium">{bestSlotsLabel}</span>
        </div>
      )}
    </Card>
  );
}
