'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { pickRandom } from '@/lib/utils/pick-random';
import {
  onSiteEvent,
  trackSiteEvent,
  type AssistantLineKind,
} from '@/lib/analytics/site-analytics';
import {
  answeredWithLine,
  countAnswer,
  countReaction,
  linesMuted,
  muteLines,
  reactionsShown,
  REACTIONS_PER_SESSION,
  setTeasersShown,
  teasersShown,
  TEASER_SCHEDULE_MS,
} from '@/lib/assistant/teaser-store';
import { parkyBoredom } from '@/lib/assistant/parky-boredom';
import { useParkyBoredom } from '@/lib/assistant/use-parky-boredom';
import { useSearchOpen } from '@/lib/analytics/search-presence';
import type { ParkyEntrance } from '@/lib/assistant/entrance';
import {
  holidayOn,
  KONAMI_LENGTH,
  konamiProgress,
  PARK_EGG_CHANCE,
  PARK_FAVOURITES,
  parkNameIn,
  parkPageOf,
  parkySwitch,
  topCoaster,
  type ParkEgg,
  type ParkyHoliday,
} from '@/lib/assistant/easter-eggs';
import { parkStatsQuery } from '@/lib/hooks/use-park-stats-queries';
import { reactionTo, type ParkyReaction } from '@/lib/assistant/reactions';
import { usePageLocked } from '@/lib/hooks/use-page-locked';
import type { ParkyCue } from './parky-logo';
import { PARKY_LAYER } from './parky-layer';

const VISIBLE_MS = 7_000;
const TEASER_KEYS = [
  'teaser1',
  'teaser2',
  'teaser3',
  'teaser4',
  'teaser5',
  'teaser6',
  'teaser7',
  'teaser8',
  'teaser9',
] as const;
/** What Parky says once it gets bored, and when somebody wakes it. */
const REACTION_KEYS = {
  bored: ['teaserBored1', 'teaserBored2', 'teaserBored3', 'teaserBored4'],
  woke: ['teaserWoke1', 'teaserWoke2', 'teaserWoke3'],
} as const;
/** The bored line waits for the first yawn to end, the woken line for the start. */
const REACTION_DELAY_MS = { bored: 4_500, woke: 1_000 } as const;
/**
 * A line that falls due over another line, a sleeping Parky or an open search tries again this
 * much later.
 */
const RETRY_MS = 5_000;
/** What Parky says after each entrance. */
const ENTRANCE_KEYS = {
  scurry: 'entranceScurry',
  drop: 'entranceDrop',
  roll: 'entranceRoll',
  peek: 'entrancePeek',
  pop: 'entrancePop',
} as const satisfies Record<ParkyEntrance, string>;
/** A beat between landing and speaking. */
const LANDED_PAUSE_MS = 300;
/** On a holiday the first invitation is the day's own line. */
const HOLIDAY_KEYS = {
  halloween: 'holidayHalloween',
  christmas: 'holidayChristmas',
  newyear: 'holidayNewYear',
} as const satisfies Record<ParkyHoliday, string>;
/** A park's own line, with `{park}` and `{ride}`. */
const PARK_KEYS = ['parkLine1', 'parkLine2', 'parkLine3', 'parkLine4'] as const;
/** On a park Parky likes, its line comes a moment after the page has settled. */
const PARK_LINE_DELAY_MS = 5_000;
/** The coaster ride follows the line once it has been read. */
const RIDE_AFTER_MS = 1_200;
/**
 * Parky answers what the visitor did with its act at once and its line a beat later, once a dialog
 * the action opened (the planner's wizard) has locked the page.
 */
const ANSWER_AFTER_MS = 600;
/** An answer held back by a dialog or a search is dropped if they stay open longer than this. */
const ANSWER_HELD_MS = 15_000;

interface Line {
  text: string;
  kind: AssistantLineKind;
}

/**
 * A short line beside the closed Parky button ("Hey, ich bin Parky – klick mich an!"), at most
 * twice a session and never once Parky was opened or a line was closed. A press on the line opens
 * Parky. After its entrance Parky's first line fits how it arrived, and it also speaks up when it
 * gets bored or is woken from sleep, a few times a session. Easter eggs: on a holiday the first
 * invitation is the day's; now and then on a park's page Parky names a ride there and rides a
 * coaster, and so it does after the Konami code. It answers what the visitor does (the trip planner
 * opened, a plan finished, a favourite, an alert, the theme switched, the app installed) with an act
 * every time and a line once a session per kind. While a search or a modal dialog is open Parky keeps
 * quiet, since the bubble would cover the results or the dialog's buttons: a line on screen goes,
 * the next waits, and an answer is said once they close, if it is still fresh. Every line counts as
 * `assistant_line_shown` with its kind. Loaded only when the button is drawn, so its strings stay
 * out of the page's chrome.
 */
export function AssistantTeaser({
  onOpen,
  onAct,
  entering = false,
  arrival = null,
}: {
  onOpen: () => void;
  /** Parky should play this act now: a ride, or its answer to something the visitor did. */
  onAct: (act: ParkyCue['act']) => void;
  /** An entrance is under way: no line until Parky has landed. */
  entering?: boolean;
  /** The entrance Parky has just made, whose line is then the session's first. */
  arrival?: ParkyEntrance | null;
}) {
  const t = useTranslations('assistant');
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [line, setLine] = useState<Line | null>(null);
  const boredom = useParkyBoredom(true);
  const searching = useSearchOpen();
  const locked = usePageLocked();
  const covered = searching || locked;
  const [wasCovered, setWasCovered] = useState(covered);
  if (wasCovered !== covered) {
    setWasCovered(covered);
    // The bubble would sit over the palette's list, the field's results or a dialog's buttons.
    if (covered) setLine(null);
  }
  // What the timers need to know without being re-armed by it.
  const latest = useRef({ line, boredom, covered, entering, onAct });
  useEffect(() => {
    latest.current = { line, boredom, covered, entering, onAct };
  });
  /** Whether a line would interrupt: another shows, Parky sleeps, a search or dialog is open. */
  const busy = () =>
    latest.current.line !== null || latest.current.boredom === 'asleep' || latest.current.covered;

  // Every line goes after a while, whoever said it; a new one starts the wait again.
  useEffect(() => {
    if (!line) return;
    trackSiteEvent('assistant_line_shown', { line: line.kind });
    const timer = setTimeout(() => setLine(null), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [line]);

  useEffect(() => {
    if (entering) return;
    let shown = teasersShown();
    let timer: ReturnType<typeof setTimeout>;
    const holiday = holidayOn(new Date());
    const next = (wait: number, keys: readonly string[], kind: AssistantLineKind) => {
      if (shown >= TEASER_SCHEDULE_MS.length) return;
      timer = setTimeout(() => {
        // Never over another line, from a sleeping Parky or into a search.
        if (busy()) return next(RETRY_MS, keys, kind);
        if (teasersShown() >= TEASER_SCHEDULE_MS.length) return;
        shown += 1;
        setTeasersShown(shown);
        setLine({ text: t(pickRandom(keys)), kind });
        // The day's line once; the next invitation is an ordinary one.
        next(VISIBLE_MS + (TEASER_SCHEDULE_MS[shown] ?? 0), TEASER_KEYS, 'invitation');
      }, wait);
    };
    // After an entrance the first line is its own, in place of the first invitation.
    if (arrival && shown === 0) next(LANDED_PAUSE_MS, [ENTRANCE_KEYS[arrival]], 'entrance');
    else if (holiday && shown === 0) {
      next(TEASER_SCHEDULE_MS[0], [HOLIDAY_KEYS[holiday]], 'holiday');
    } else next(TEASER_SCHEDULE_MS[shown] ?? 0, TEASER_KEYS, 'invitation');
    return () => clearTimeout(timer);
  }, [t, entering, arrival]);

  useEffect(() => {
    const kind =
      boredom === 'bored' ? 'bored' : boredom === 'awake' && parkyBoredom.wokeUp() ? 'woke' : null;
    if (!kind) return;
    const timer = setTimeout(() => {
      if (busy() || reactionsShown() >= REACTIONS_PER_SESSION) return;
      countReaction();
      setLine({ text: t(pickRandom(REACTION_KEYS[kind])), kind });
    }, REACTION_DELAY_MS[kind]);
    // Somebody came back before the line was due: Parky is not bored any more.
    return () => clearTimeout(timer);
  }, [boredom, t]);

  // Now and then on a park's page: a ride there, then a ride on a coaster.
  useEffect(() => {
    const target = parkPageOf(pathname);
    if (!target || entering || linesMuted()) return;
    if (parkySwitch() !== 'egg' && Math.random() >= PARK_EGG_CHANCE) return;
    let live = true;
    let timer: ReturnType<typeof setTimeout>;
    // A favourite's ride whatever the numbers say; any other park's from its own data, the name
    // from the page's structured data and the ride from the `/stats` the page loads anyway.
    const eggFor = async (): Promise<ParkEgg | null> => {
      const path = `${target.continent}/${target.country}/${target.city}/${target.parkSlug}`;
      if (PARK_FAVOURITES[path]) return PARK_FAVOURITES[path];
      const park = parkNameIn(document.querySelectorAll('script[type="application/ld+json"]'));
      if (!park) return null;
      const stats = await queryClient
        .fetchQuery(parkStatsQuery(target, 'default', true))
        .catch(() => null);
      const ride = topCoaster(stats?.topAttractions ?? []);
      return ride ? { park, ride } : null;
    };
    const say = (wait: number) => {
      timer = setTimeout(async () => {
        if (busy()) return say(RETRY_MS);
        const egg = await eggFor();
        if (!live || !egg || linesMuted()) return;
        setLine({
          text: t(pickRandom(PARK_KEYS), { park: egg.park, ride: egg.ride }),
          kind: 'park',
        });
        timer = setTimeout(() => latest.current.onAct('ride'), RIDE_AFTER_MS);
      }, wait);
    };
    say(PARK_LINE_DELAY_MS);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [pathname, entering, t, queryClient]);

  // The Konami code buys a free ride, typed anywhere on the page.
  useEffect(() => {
    let progress = 0;
    const onKey = (event: KeyboardEvent) => {
      progress = konamiProgress(progress, event.key);
      if (progress < KONAMI_LENGTH) return;
      progress = 0;
      setLine({ text: t('secretKonami'), kind: 'secret' });
      latest.current.onAct('ride');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [t]);

  // What the visitor does, as the page reports it: an act each time, a line once a session per
  // kind. It may take the place of a line on screen, since it answers what just happened. Into an
  // entrance, a search or a dialog it waits; not at all once the lines were closed by hand.
  const held = useRef<{ reaction: ParkyReaction; at: number } | null>(null);
  const answer = useCallback(
    (reaction: ParkyReaction) => {
      if (linesMuted() || answeredWithLine(reaction.line)) return;
      countAnswer(reaction.line);
      setLine({ text: t(pickRandom(reaction.keys)), kind: reaction.line });
    },
    [t]
  );
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const stop = onSiteEvent((name, props) => {
      const reaction = reactionTo(name, props);
      if (!reaction) return;
      latest.current.onAct(reaction.act);
      if (linesMuted() || answeredWithLine(reaction.line)) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (latest.current.covered || latest.current.entering) {
          held.current = { reaction, at: Date.now() };
        } else answer(reaction);
      }, ANSWER_AFTER_MS);
    });
    return () => {
      stop();
      clearTimeout(timer);
    };
  }, [answer]);
  // A held answer is said once nothing is in its way, unless it has gone stale meanwhile.
  const blocked = covered || entering;
  useEffect(() => {
    if (blocked || !held.current) return;
    const { reaction, at } = held.current;
    held.current = null;
    if (Date.now() - at > ANSWER_HELD_MS) return;
    const timer = setTimeout(() => answer(reaction), LANDED_PAUSE_MS);
    return () => clearTimeout(timer);
  }, [blocked, answer]);

  return (
    <div
      aria-live="polite"
      className={cn(
        // The bubble's tail ends at Parky's body beside his mouth: a 56 px button on a phone,
        // 64 px from `sm`, both 1rem from the corner.
        'fixed right-[4.75rem] bottom-[max(1rem,env(safe-area-inset-bottom))] max-w-[min(15rem,calc(100vw-6rem))] sm:right-[5.25rem]',
        PARKY_LAYER,
        'planner-wide:right-[calc(var(--planner-inset,0px)+5.25rem)]',
        'origin-[100%_75%] transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none',
        line
          ? 'translate-x-0 scale-100 opacity-100'
          : 'pointer-events-none translate-x-2 scale-95 opacity-0'
      )}
    >
      {line && (
        <div className="bg-background border-border/60 relative flex items-start gap-1 rounded-2xl border py-2 pr-1.5 pl-3 text-sm shadow-xl">
          <button
            type="button"
            onClick={() => {
              trackSiteEvent('assistant_line_clicked', { line: line.kind });
              setLine(null);
              onOpen();
            }}
            className="text-left font-medium"
          >
            {line.text}
          </button>
          <button
            type="button"
            onClick={() => {
              trackSiteEvent('assistant_line_closed', { line: line.kind });
              muteLines();
              setLine(null);
            }}
            aria-label={t('close')}
            className="text-muted-foreground hover:text-foreground -mt-0.5 shrink-0 rounded-full p-0.5"
          >
            <X className="size-3.5" />
          </button>
          {/* The tail: a square on its corner, half under the bubble, pointing at Parky. */}
          <span
            aria-hidden="true"
            className="bg-background border-border/60 pointer-events-none absolute -right-1.5 bottom-2.5 size-3 rotate-45 border-t border-r"
          />
        </div>
      )}
    </div>
  );
}
