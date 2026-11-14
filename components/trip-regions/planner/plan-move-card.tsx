'use client';

import { useTranslations } from 'next-intl';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatParkDay } from '@/lib/utils/park-day';
import { oneFullStop } from '@/lib/utils/metadata';
import type { PlanDay } from '@/lib/trip-regions/plan';
import { usePlanContext } from './plan-context';
import { PLAN_FOCUS } from './plan-controls';
import { useBaseName } from './plan-place-words';
import { MOVE_INK, MoveIcon, useMoveNotes, useMoveWords } from './plan-stay-band';

/**
 * A day that is only the move to the next city (`travel`), as the Days view's card in the move's
 * dashed primary ink: the date and „Reisetag“ with the typical times, the two cities on the line
 * with the mode between them, the service and its length, the hotel change's buffer and that the
 * times are typical, and the leg's notes (the luggage sent ahead, a seat) as chips. A press opens
 * the day's sheet.
 */
export function PlanMoveCard({
  day,
  buffer,
  onOpen,
}: {
  day: PlanDay;
  /** The minutes the plan gave the hotel change (`meta.moveBuffer`). */
  buffer: number | undefined;
  onOpen: (date: string) => void;
}) {
  const t = useTranslations('tripPlanner');
  const { locale } = usePlanContext();
  const words = useMoveWords();
  const notes = useMoveNotes();
  const baseName = useBaseName();
  const move = day.move;
  if (!move) return null;
  const date = formatParkDay(locale, day.date, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const service = move.name ?? words.mode(move.mode);
  const said = notes(move);

  return (
    <button
      type="button"
      onClick={() => onOpen(day.date)}
      aria-label={[words.label(day, move), ...said].join('. ')}
      data-plan-move-card={move.when}
      className={cn(
        'flex w-full flex-col gap-2 rounded-2xl border p-4 text-left transition-colors hover:brightness-105',
        MOVE_INK,
        PLAN_FOCUS
      )}
    >
      <span className="flex items-baseline justify-between gap-3 text-sm" aria-hidden="true">
        <span className="font-semibold">
          {date} · {t('day.travel')}
        </span>
        <span className="text-muted-foreground text-xs tabular-nums">
          {words.time(move.departAt)}–{words.time(move.arriveAt)}
        </span>
      </span>
      <span className="flex items-center gap-2 text-lg font-semibold" aria-hidden="true">
        <span>{baseName(move.from)}</span>
        <span className="bg-primary/40 h-px min-w-6 flex-1" />
        <MoveIcon mode={move.mode} className="text-primary-ink size-5 shrink-0" />
        <span className="bg-primary/40 h-px min-w-6 flex-1" />
        <span>{baseName(move.to)}</span>
      </span>
      <span className="text-muted-foreground text-sm leading-relaxed" aria-hidden="true">
        {oneFullStop(
          [
            t('result.move.ride', { service, duration: words.duration(move) }),
            buffer != null ? t('move.buffer', { minutes: buffer }) : null,
            t('move.typical'),
          ]
            .filter(Boolean)
            .join(' ')
        )}
      </span>
      {said.length > 0 && (
        <span className="flex flex-wrap gap-1.5" aria-hidden="true">
          {said.map((note) => (
            <span
              key={note}
              className="bg-background/70 text-muted-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
            >
              <Info className="size-3.5 shrink-0" />
              {note}
            </span>
          ))}
        </span>
      )}
    </button>
  );
}
