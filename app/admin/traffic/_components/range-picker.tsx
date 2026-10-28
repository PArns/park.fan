'use client';

import { useState } from 'react';
import { CalendarRange, Check, ChevronDown } from 'lucide-react';
import {
  RANGE_PRESETS,
  customRangeError,
  presetOf,
  rangeLabel,
  type TrafficRange,
} from '@/lib/admin/traffic-range';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { TextInput } from '../../_ui/controls';

/**
 * The window of every traffic page: a button that names it and opens the presets (today,
 * yesterday, the last 7, 30 or 90 days, this and last week, this and last month, 12 months) and a
 * custom first and last day. A preset applies at once; a custom range waits for its button, since
 * half a range is no range, and says why when the API would refuse it.
 */
export function RangePicker({
  range,
  today,
  onChange,
}: {
  range: TrafficRange;
  today: string;
  onChange: (range: TrafficRange) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = presetOf(range, today);
  const window = range.kind === 'dates' ? { from: range.from, to: range.to } : { from: '', to: '' };
  const [from, setFrom] = useState(window.from);
  const [to, setTo] = useState(window.to);
  const [touched, setTouched] = useState(false);
  const error = touched ? customRangeError(from, to, today) : null;

  const choose = (next: TrafficRange) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setFrom(window.from);
          setTo(window.to);
          setTouched(false);
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Zeitraum wählen"
          className="border-border/60 hover:border-primary/50 flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors max-sm:min-h-9"
        >
          <CalendarRange className="text-primary h-3.5 w-3.5" aria-hidden="true" />
          <span>{rangeLabel(range, today)}</span>
          <ChevronDown className="text-muted-foreground h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="z-[75] w-[min(20rem,calc(100vw-2rem))] p-3">
        <ul className="grid grid-cols-2 gap-1.5" aria-label="Zeiträume">
          {RANGE_PRESETS.map((preset) => {
            const on = active?.id === preset.id;
            return (
              <li key={preset.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => choose(preset.resolve(today))}
                  className={cn(
                    'flex w-full items-center justify-between gap-1 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors max-sm:min-h-10',
                    on
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'hover:bg-accent text-foreground/90'
                  )}
                >
                  {preset.label}
                  {on && <Check className="h-3 w-3" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
        <form
          className="border-border/50 mt-3 space-y-2 border-t pt-3"
          onSubmit={(event) => {
            event.preventDefault();
            setTouched(true);
            if (customRangeError(from, to, today) === null) {
              choose({ kind: 'dates', from, to });
            }
          }}
        >
          <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
            Eigener Zeitraum
          </p>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-muted-foreground space-y-1 text-[11px]">
              Von
              <TextInput
                type="date"
                value={from}
                max={today}
                onChange={(event) => setFrom(event.target.value)}
              />
            </label>
            <label className="text-muted-foreground space-y-1 text-[11px]">
              Bis
              <TextInput
                type="date"
                value={to}
                max={today}
                onChange={(event) => setTo(event.target.value)}
              />
            </label>
          </div>
          {error && (
            <p role="alert" className="text-destructive text-xs">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="bg-primary text-primary-foreground w-full rounded-md px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-90 max-sm:min-h-10"
          >
            Übernehmen
          </button>
          <p className="text-muted-foreground text-[11px]">
            Tage in UTC, höchstens 366, nicht nach heute.
          </p>
        </form>
      </PopoverContent>
    </Popover>
  );
}
