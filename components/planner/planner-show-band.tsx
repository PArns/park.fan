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
  className,
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

  // Whether there is anything to switch at all. The store is the panel's, not
  // the day's, so `visible` can be false over a park that has no shows — and
  // there the strip says "keine Spielzeiten" rather than "ausgeblendet", with no
  // switch on it. Collapsing THAT would take a strip away and leave nothing to
  // bring it back with.
  const switchable = Boolean(onToggle) && lines !== null && lines.length > 0;

  return (
    <div
      data-planner-show-band=""
      // Not drawn on a phone since PAR-482: the planner hides it there with
      // `className` and the switch below becomes a button in the foot
      // (`PlannerShowsButton`). The strip was `sticky top-0` inside the axis'
      // scroller and grew to 44 px on a phone to carry a 44 px switch, which
      // is 44 px of axis covered for a line that repeats what the grid already
      // draws at every show. So what is left here is the desktop's strip, and
      // the trip-planner page's demos, which render it without a switch.
      //
      // The strip reserves its height in every state, so the grid does not move
      // when `/plan/day` lands; `min-h` rather than a height tied to
      // `lines?.length`, which would jump on every park that has shows.
      className={cn(
        'border-border/60 bg-background/95 text-muted-foreground sticky top-0 z-40 flex min-h-[22px] items-center gap-1.5 border-b px-2 text-[10px] backdrop-blur-sm',
        className
      )}
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
           reader who turned the shows off by accident would otherwise have
           nothing left to read. */
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
 * The phone's switch for the shows, at the end of the foot's optimise row.
 *
 * The phone does not draw {@link PlannerShowBand} (PAR-482), and the band was
 * where the switch lived. It sat in the context band as a chip for a while,
 * where it pushed the chip row onto a second line; the row that took the
 * notification bell had room once the bell went up beside the ×. Same store,
 * same toggle: a reader who turned the shows off on the desktop finds them off
 * here, with the way back in sight.
 *
 * The theatre masks and nothing else, for the row's width: at 360 px the row
 * holds the headliner button, the call to action and this, in every locale.
 * The masks are the mark every show line in the grid carries, so the button
 * names what it hides by looking like it, and `aria-pressed` with the primary
 * tint says whether they are on. Drawn 36 × 32, reaching 44 × 44 like the
 * buttons beside it: 12 px up and 4 px to each side.
 *
 * The caller renders it only where {@link dayHasShowLines} holds.
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
