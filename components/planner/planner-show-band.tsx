'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Eye, EyeOff, Theater } from 'lucide-react';
import type { PlannerShowLine } from '@/lib/planner/shows';
import { plannerShowsVisible } from '@/lib/planner/shows-visible';
import {
  getMinuteTick,
  getZero,
  subscribeToMinute,
  subscribeToNothing,
} from '@/lib/planner/minute-tick';
import { formatGridTime, parkMinuteNow } from '@/lib/planner/park-time';
import { cn } from '@/lib/utils';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { PHONE_TARGET_32_UP } from '@/lib/planner/touch-target';

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
  /** The planner passes `planner-phone:hidden`: see {@link PlannerShowsButton}. */
  className?: string;
}

/**
 * The shows above the grid. It names the next one, never the day's cast list: the grid already
 * draws each show, and what it cannot say is which one is next. A projection says
 * "voraussichtlich", prints its time with `~` and names the date it was observed on, from the API's
 * own `source`. The band reserves its height in every state.
 */
export function PlannerShowBand({
  lines,
  timezone,
  isToday,
  visible = true,
  onToggle,
  className,
}: PlannerShowBandProps) {
  const t = useTranslations('planner');
  const locale = useLocale();

  // Only where a showtime can go past: on any other date the strip holds no timer.
  const live = visible && isToday && lines !== null && lines.length > 0;
  const tick = useSyncExternalStore(
    live ? subscribeToMinute : subscribeToNothing,
    live ? getMinuteTick : getZero,
    getZero
  );

  const nowMinute = useMemo(
    // `tick` is read, not merely listed: its change is what re-reads the clock, and an unread
    // dependency is one an autofix would remove.
    () => (live && tick >= 0 ? parkMinuteNow(timezone) : null),
    [live, timezone, tick]
  );

  // Still to come until it starts: the payload has no duration.
  const upcoming = (lines ?? []).filter((line) => nowMinute === null || line.minute >= nowMinute);
  const next = upcoming[0];
  // Names, not showtimes: the same show at 14:00 and 17:00 is one thing on twice.
  const alsoComing = new Set(upcoming.slice(1).map((line) => line.name));

  const projected = next?.source === 'projected';
  // Noon UTC: midnight UTC renders as the day before west of Greenwich.
  const observedOn =
    projected && next?.observedOn
      ? getDateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(
          new Date(`${next.observedOn}T12:00:00Z`)
        )
      : null;
  const label = projected ? t('shows.projected') : isToday ? t('shows.next') : t('shows.first');

  // Whether there is anything to switch: `visible` is the panel's, so it can be false over a park
  // with no shows, where the strip says "keine Spielzeiten" and offers no switch.
  const switchable = Boolean(onToggle) && lines !== null && lines.length > 0;

  return (
    <div
      data-planner-show-band=""
      // Desktop only: the planner hides it on a phone with `className`, where it would cover axis
      // to repeat the grid, and the switch moves to the foot (`PlannerShowsButton`). `min-h`, so
      // the grid does not move when `/plan/day` lands.
      className={cn(
        'border-border/60 bg-background/95 text-muted-foreground sticky top-0 z-40 flex min-h-[22px] items-center gap-1.5 border-b px-2 text-[10px] backdrop-blur-sm',
        className
      )}
      // Supplementary: the label already says the times are projected; this says from which day.
      title={observedOn ? t('shows.projectedFrom', { date: observedOn }) : undefined}
    >
      <Theater className="size-3 shrink-0" aria-hidden="true" />
      {lines === null ? (
        <span aria-hidden="true">&nbsp;</span>
      ) : lines.length === 0 ? (
        <span className="truncate">{t('shows.none')}</span>
      ) : !visible ? (
        /* Hidden, and the band says so, or a reader who switched shows off by accident has nothing
           to read. */
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

      {/* The switch, last in the row, `ml-auto` only where nothing else took the slack. Only where
          there is something to switch. */}
      {switchable && (
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

/**
 * The phone's switch for the shows, at the end of the foot's optimise row, since the phone does not
 * draw {@link PlannerShowBand}. Same store as the desktop's. The theatre masks alone, for the row's
 * width; `aria-pressed` with the primary tint says whether shows are on. Drawn 36 × 32, reaching
 * 44 × 44. The caller renders it only where {@link dayHasShowLines} holds.
 */
export function PlannerShowsButton() {
  const t = useTranslations('planner');
  const visible = useSyncExternalStore(
    plannerShowsVisible.subscribe,
    plannerShowsVisible.getSnapshot,
    plannerShowsVisible.getServerSnapshot
  );

  return (
    <button
      type="button"
      onClick={plannerShowsVisible.toggle}
      data-planner-shows-button={visible ? 'on' : 'off'}
      aria-pressed={visible}
      aria-label={t('shows.chip')}
      title={visible ? t('shows.hide') : t('shows.show')}
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-md transition-colors',
        PHONE_TARGET_32_UP,
        'planner-phone:after:-inset-x-1',
        visible
          ? 'bg-primary/10 text-primary hover:bg-primary/20'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      )}
    >
      <Theater className="size-4" aria-hidden="true" />
    </button>
  );
}
