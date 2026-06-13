'use client';

import { useEffect, useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { CalendarDays, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatePopProps {
  label: string;
  value: string;
  onChange: (next: string) => void;
  allowClear?: boolean;
}

/**
 * Date field with a real calendar popover (react-day-picker). Click the field
 * → pop opens. ISO `yyyy-MM-dd` is what we store in the frontmatter; the
 * picker shows the localised long form.
 */
export function DatePop({ label, value, onChange, allowClear }: DatePopProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onEsc);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const date = value ? parseISO(value) : undefined;
  const display = date ? format(date, 'PP') : 'Pick a date';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'border-border/60 hover:border-border bg-background/60 flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors',
          open && 'border-primary/40'
        )}
      >
        <div className="bg-primary/15 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
          <CalendarDays className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
            {label}
          </div>
          <div
            className={cn(
              'text-sm font-medium',
              value ? 'text-foreground' : 'text-muted-foreground/60'
            )}
          >
            {display}
          </div>
        </div>
        {allowClear && value && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onChange('');
              }
            }}
            className="hover:bg-accent/40 cursor-pointer rounded-full p-1 transition-colors"
            aria-label="Clear date"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
      </button>
      {open && (
        <div className="border-border/60 bg-popover absolute top-full left-0 z-20 mt-1 rounded-xl border p-2 shadow-xl">
          <DayPicker
            mode="single"
            selected={date}
            onSelect={(d) => {
              if (d) onChange(format(d, 'yyyy-MM-dd'));
              setOpen(false);
            }}
            showOutsideDays
            weekStartsOn={1}
          />
        </div>
      )}
    </div>
  );
}
