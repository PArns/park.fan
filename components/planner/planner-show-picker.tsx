'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Theater } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatGridTime } from '@/lib/planner/park-time';
import { showDayHours, showLinesFor, type PlannerShowLine } from '@/lib/planner/shows';
import { usePlanner } from '@/lib/planner/use-planner';
import { PHONE_TARGET_32 } from '@/lib/planner/touch-target';
import type { PlanDay } from '@/lib/api/types';
import type { PlannerEntry, PlannerGeo } from '@/lib/planner/types';
import { cn } from '@/lib/utils';

interface PlannerShowPickerProps {
  /** The day's showtimes, as the grid draws them. The picker renders nothing when there are none. */
  lines: readonly PlannerShowLine[];
  /** Performances already in the plan, as `slug@minute`, so a picked one reads as taken. */
  planned: ReadonlySet<string>;
  onPick: (line: PlannerShowLine) => void;
  className?: string;
}

/** The key `planned` is built from, so the caller and the list agree on what "taken" means. */
function showLineKey(slug: string, minute: number): string {
  return `${slug}@${minute}`;
}

/**
 * Files one performance of one of the day's shows into the plan, answering "what else goes in the
 * day" from the day's own showtimes. A projection is listed with a `~` and the show band's word.
 * The entry is bound to the performance; see {@link addShowEntry}.
 */
function PlannerShowPicker({ lines, planned, onPick, className }: PlannerShowPickerProps) {
  const t = useTranslations('planner');
  const [open, setOpen] = useState(false);
  if (lines.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-planner-add-show=""
          className={cn(
            'text-muted-foreground hover:text-foreground hover:bg-accent/50 flex h-8 shrink-0 items-center gap-2 rounded-md px-2 text-left text-xs transition-colors',
            // 32 px drawn, 44 px to a finger on a phone, like „Eigener Block" beside it.
            PHONE_TARGET_32,
            className
          )}
        >
          <Theater className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{t('custom.addShow')}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        collisionPadding={8}
        className="z-[80] max-h-72 w-64 overflow-y-auto p-1"
      >
        <ul data-planner-show-list="">
          {lines.map((line) => {
            const taken = planned.has(showLineKey(line.slug, line.minute));
            const projected = line.source === 'projected';
            return (
              <li key={showLineKey(line.slug, line.minute)}>
                <button
                  type="button"
                  disabled={taken}
                  onClick={() => {
                    onPick(line);
                    setOpen(false);
                  }}
                  className="hover:bg-accent/50 disabled:text-muted-foreground flex min-h-11 w-full items-baseline gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors disabled:opacity-60 disabled:hover:bg-transparent"
                >
                  <span
                    className={cn(
                      'shrink-0 font-mono text-xs tabular-nums',
                      projected && 'text-foreground/70'
                    )}
                    title={projected ? t('shows.projected') : undefined}
                  >
                    {projected ? '~' : ''}
                    {formatGridTime(line.minute)}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{line.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

interface PlannerDayShowPickerProps {
  parkSlug: string;
  parkName: string;
  geo: PlannerGeo;
  timezone: string;
  date: string;
  day: PlanDay | null | undefined;
  entries: readonly PlannerEntry[];
  className?: string;
}

/**
 * {@link PlannerShowPicker} wired to one day of one park: the lines are the
 * ones the grid draws (same clip, same projections), and a pick files the
 * performance under that day.
 */
export function PlannerDayShowPicker({
  parkSlug,
  parkName,
  geo,
  timezone,
  date,
  day,
  entries,
  className,
}: PlannerDayShowPickerProps) {
  const { addShow } = usePlanner();
  const lines = useMemo(
    () =>
      day ? showLinesFor(day.shows, showDayHours(day.context.openHour, day.context.closeHour)) : [],
    [day]
  );
  const planned = useMemo(
    () =>
      new Set(
        entries.flatMap((entry) =>
          entry.showSlug ? [showLineKey(entry.showSlug, entry.startMinute)] : []
        )
      ),
    [entries]
  );

  return (
    <PlannerShowPicker
      lines={lines}
      planned={planned}
      className={className}
      onPick={(line) =>
        addShow({
          parkSlug,
          parkName,
          geo,
          timezone,
          date,
          showSlug: line.slug,
          showName: line.name,
          startMinute: line.minute,
        })
      }
    />
  );
}
