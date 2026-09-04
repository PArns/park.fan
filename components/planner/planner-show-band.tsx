'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Eye, EyeOff, Theater } from 'lucide-react';
import type { PlannerShowLine } from '@/lib/planner/shows';
import {
  getMinuteTick,
  getZero,
  subscribeToMinute,
  subscribeToNothing,
} from '@/lib/planner/minute-tick';
import { formatGridTime, parkMinuteNow } from '@/lib/planner/park-time';

interface PlannerShowBandProps {
  /** `null` while the day payload is still on its way. */
  lines: PlannerShowLine[] | null;
  /** The park's IANA zone — the only clock this panel ever reads. */
  timezone: string;
  isToday: boolean;
  /** `false` while the switch has them hidden; the band still offers the switch. */
  visible?: boolean;
  /** Absent where there is nothing to switch — a day with no shows at all. */
  onToggle?: () => void;
}

/**
 * The shows above the grid.
 *
 * It names ONE of them, never the day's cast list. The first version joined
 * every name with a `·` and carried no time at all — four proper nouns over a
 * plan, which said neither what the strip was nor anything the grid did not: the
 * grid already draws each show as a rule with its name on it and its time in the
 * gutter. What the grid cannot say is which one is next, because that is a
 * comparison against the now line somebody has to scroll to and make by eye.
 *
 * The other half of its job is the source. `/plan/day` answers with the
 * operator's listing where one exists and with the last matching weekday carried
 * forward everywhere else, and the two may not read alike — so a projection says
 * "voraussichtlich", prints its time with a `~`, and carries the date it was
 * actually observed on. Nothing here invents the distinction: it is the API's
 * own `source`, and the grid's lines soften in step.
 *
 * The band reserves its height in every state, so the grid below it does not
 * move when the answer arrives.
 */
export function PlannerShowBand({
  lines,
  timezone,
  isToday,
  visible = true,
  onToggle,
}: PlannerShowBandProps) {
  const t = useTranslations('planner');
  const locale = useLocale();

  // Only where a showtime can go past: on any other date the strip is a fixed
  // sentence and has no reason to hold the panel's minute timer open.
  const live = visible && isToday && lines !== null && lines.length > 0;
  const tick = useSyncExternalStore(
    live ? subscribeToMinute : subscribeToNothing,
    live ? getMinuteTick : getZero,
    getZero
  );

  const nowMinute = useMemo(
    // `tick` is read rather than merely listed: the number it carries means
    // nothing, but its change once a minute is what re-reads the park's clock —
    // and a dependency the body never touches is one an autofix would remove.
    () => (live && tick >= 0 ? parkMinuteNow(timezone) : null),
    [live, timezone, tick]
  );

  // A show counts as still to come until it STARTS, not until it ends: its own
  // duration is not in the payload, and somebody standing outside the theatre at
  // 14:00 is being told the right thing either way.
  const upcoming = (lines ?? []).filter((line) => nowMinute === null || line.minute >= nowMinute);
  const next = upcoming[0];
  // Names, not showtimes: two stages at 14:00 are two things a reader can go to,
  // while the same show at 14:00 and 17:00 is one thing on twice and counting it
  // twice would overstate what is left of the day.
  const alsoComing = new Set(upcoming.slice(1).map((line) => line.name));

  const projected = next?.source === 'projected';
  // Noon UTC, the house pattern: `new Date('2026-08-28')` is midnight UTC and
  // renders as the 27th for every reader west of Greenwich.
  const observedOn =
    projected && next?.observedOn
      ? new Date(`${next.observedOn}T12:00:00Z`).toLocaleDateString(locale, {
          day: 'numeric',
          month: 'long',
        })
      : null;
  const label = projected ? t('shows.projected') : isToday ? t('shows.next') : t('shows.first');

  return (
    <div
      data-planner-show-band=""
      className="border-border/60 bg-background/95 text-muted-foreground sticky top-0 z-40 flex min-h-[22px] items-center gap-1.5 border-b px-2 text-[10px] backdrop-blur-sm"
      // Supplementary rather than load-bearing: the label already says the times
      // are a projection, and this says which day they were taken from.
      title={observedOn ? t('shows.projectedFrom', { date: observedOn }) : undefined}
    >
      <Theater className="size-3 shrink-0" aria-hidden="true" />
      {lines === null ? (
        <span aria-hidden="true">&nbsp;</span>
      ) : lines.length === 0 ? (
        <span className="truncate">{t('shows.none')}</span>
      ) : !visible ? (
        /* Hidden, and the band says so rather than disappearing with them: a
           strip that vanished would take the switch with it, and a reader who
           turned the shows off by accident would have nothing left to press. */
        <span className="truncate">{t('shows.hidden')}</span>
      ) : next ? (
        <>
          <span className="shrink-0">{label}</span>
          <span
            className={`shrink-0 tabular-nums ${projected ? 'text-foreground/70' : 'text-foreground font-medium'}`}
          >
            {projected ? '~' : ''}
            {formatGridTime(next.minute)}
          </span>
          <span className="truncate">{next.name}</span>
          {alsoComing.size > 0 && (
            <span className="ml-auto shrink-0 tabular-nums">
              {t('shows.more', { count: alsoComing.size })}
            </span>
          )}
        </>
      ) : (
        <span className="truncate">{t('shows.over')}</span>
      )}

      {/* The switch. Last in the row and `ml-auto` only where nothing else took
          the slack, so it never pushes the "+N weitere" count off the strip.
          It renders only where there is something to switch: on a day the API
          answered with no shows there is nothing to hide, and a control that
          toggles an empty set is a control that does nothing. */}
      {onToggle && lines !== null && lines.length > 0 && (
        <button
          type="button"
          onClick={onToggle}
          data-planner-shows-toggle={visible ? 'on' : 'off'}
          aria-pressed={visible}
          title={visible ? t('shows.hide') : t('shows.show')}
          className="hover:text-foreground -my-0.5 ml-auto flex size-4 shrink-0 items-center justify-center rounded transition-colors"
        >
          {visible ? (
            <Eye className="size-3" aria-hidden="true" />
          ) : (
            <EyeOff className="size-3" aria-hidden="true" />
          )}
          <span className="sr-only">{visible ? t('shows.hide') : t('shows.show')}</span>
        </button>
      )}
    </div>
  );
}
