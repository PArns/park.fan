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
import { cn } from '@/lib/utils';

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

  // Whether there is anything to switch at all. The store is the panel's, not
  // the day's, so `visible` can be false over a park that has no shows — and
  // there the strip says "keine Spielzeiten" rather than "ausgeblendet", with no
  // switch on it. Collapsing THAT would take a strip away and leave nothing to
  // bring it back with.
  const switchable = Boolean(onToggle) && lines !== null && lines.length > 0;
  // The phone's hidden state: no strip, just the switch.
  const collapsed = switchable && !visible;

  return (
    <div
      data-planner-show-band=""
      // `max-sm:min-h-11`, and it is the strip that grows rather than only the
      // switch inside it. A 44 px pseudo-element hanging out of a 22 px strip
      // was tried and is wrong here: this strip is `sticky top-0` INSIDE the
      // grid's scroller, so the overhang follows the scroll across the blocks —
      // and a block is selected by a plain `onClick` on its own `<li>` with no
      // pointer-type gate (`planner-block.tsx`), so the top-right corner of
      // whatever block passed underneath would toggle the shows instead of
      // opening its action row.
      //
      // Growing costs the axis nothing, which is the part worth writing down:
      // the strip is scrolled CONTENT, not part of the scroller's box, so
      // `check:planner`'s axis measurement is unmoved. What it does cost is
      // coverage — stuck at the top it hides 44 px of grid instead of 22 — and
      // that is recoverable by scrolling, where a stolen tap is not.
      //
      // **`max-sm:` and not `planner-phone:`, and that trade is why** (PAR-76).
      // "Recoverable by scrolling" assumes the viewport is taller than the
      // strip. On a landscape phone it is not: the axis' scroller is 16 px
      // there, so a 44 px strip stuck at its top covers the whole of it,
      // permanently, and no amount of scrolling moves a `sticky top-0` child
      // out of the way. The 22 px version at least leaves something to look at.
      // The tap this gives up is the shows toggle's, in the one arrangement
      // where the axis it would reveal is 16 px tall — the same bargain the
      // axis' own 200 px floor makes two files over, and the same reason: the
      // chrome there is 343 px of a 359 px sheet, and a class cannot mint room.
      // Both are PAR-168's to spend.
      //
      // Unconditional, though the switch it was raised for renders only where
      // there are shows: a height that depends on the answer is not a
      // reservation, and this strip's whole job in the loading state is to keep
      // the grid from moving when `/plan/day` lands. Tying `min-h-11` to
      // `lines?.length` would buy back 22 px on a park with no shows and pay
      // for it with a 22 px jump on every park that has them, one second after
      // the panel opens.
      //
      // `collapsed` is the one state that gives the 44 px back, and it is the
      // state a reader ASKED for: the switch is off, so there is nothing to
      // reserve room for. Below `sm` the strip then goes to `h-0` and drops its
      // rule, its glass and its text, and the switch alone hangs into the grid
      // from the top right — 44 × 44 of cover instead of 44 × the full width.
      // The way back is where the way out was, which is what makes it a switch
      // rather than a one-way door; the header row this could otherwise have
      // moved to has 119 px left for the park name at 390 px — 63 until
      // PAR-188 dropped the ×, which is where the other 56 came from — and the
      // name itself measures 80 of them, so a fourth 44 px control there is
      // still paid for out of the park name (the arithmetic is in
      // `planner-flyout.tsx`, and what the extra room does or does not buy
      // that row is PAR-202). A row of its own in `PlannerDayFoot` would cost
      // more chrome than the strip gives back.
      //
      // It is the phone's state alone: every class here is `max-sm:`, so the
      // desktop keeps the "Ausgeblendet" strip it has always had. CSS rather
      // than a `useMediaQuery` branch, because this component is also
      // server-rendered by the guide's demos, where the hook's snapshot would
      // ship the phone's markup to every desktop and then delete it.
      className={cn(
        'border-border/60 bg-background/95 text-muted-foreground sticky top-0 z-40 flex min-h-[22px] items-center gap-1.5 border-b px-2 text-[10px] backdrop-blur-sm',
        collapsed
          ? 'max-sm:pointer-events-none max-sm:h-0 max-sm:min-h-0 max-sm:items-start max-sm:border-b-0 max-sm:bg-transparent max-sm:backdrop-blur-none'
          : 'max-sm:min-h-11'
      )}
      // Supplementary rather than load-bearing: the label already says the times
      // are a projection, and this says which day they were taken from.
      title={observedOn ? t('shows.projectedFrom', { date: observedOn }) : undefined}
    >
      <Theater className={cn('size-3 shrink-0', collapsed && 'max-sm:hidden')} aria-hidden="true" />
      {lines === null ? (
        <span aria-hidden="true">&nbsp;</span>
      ) : lines.length === 0 ? (
        <span className="truncate">{t('shows.none')}</span>
      ) : !visible ? (
        /* Hidden, and on a desktop the band says so rather than disappearing
           with them: there the strip is not what is short, and a reader who
           turned the shows off by accident would otherwise have nothing left to
           read. On a phone the sentence goes with the strip — the switch stays,
           so nothing is lost but the row. */
        <span className={cn('truncate', collapsed && 'max-sm:hidden')}>{t('shows.hidden')}</span>
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
          // 16 px measured, and the smallest target in the panel. It grows
          // inside a strip that grew with it — see the strip's own note for why
          // this is the one place a pseudo-element was the wrong instrument.
          //
          // Collapsed, it is the only thing left of the strip: it takes back the
          // pointer its parent gave up, and it carries the glass the strip was
          // wearing, because on its own it sits over the grid's own blocks and
          // an unbacked icon there is a shape in a drawing.
          className={cn(
            'hover:text-foreground -my-0.5 ml-auto flex size-4 shrink-0 items-center justify-center rounded transition-colors max-sm:-my-0 max-sm:size-11',
            collapsed &&
              'max-sm:border-border/60 max-sm:bg-background/95 max-sm:pointer-events-auto max-sm:rounded-md max-sm:border max-sm:shadow-sm max-sm:backdrop-blur-sm'
          )}
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
