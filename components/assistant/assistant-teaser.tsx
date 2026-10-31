'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { pickRandom } from '@/lib/utils/pick-random';
import { trackSiteEvent, type AssistantLineKind } from '@/lib/analytics/site-analytics';
import {
  countReaction,
  markParkLine,
  muteLines,
  parkLineDue,
  reactionsShown,
  REACTIONS_PER_SESSION,
  setTeasersShown,
  teasersShown,
  TEASER_SCHEDULE_MS,
} from '@/lib/assistant/teaser-store';
import { parkyBoredom } from '@/lib/assistant/parky-boredom';
import { useParkyBoredom } from '@/lib/assistant/use-parky-boredom';
import type { ParkyEntrance } from '@/lib/assistant/entrance';
import {
  holidayOn,
  KONAMI_LENGTH,
  konamiProgress,
  PARK_EGGS,
  parkPathOf,
  type ParkyHoliday,
} from '@/lib/assistant/easter-eggs';
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
/** A line that falls due over another line or a sleeping Parky tries again this much later. */
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

interface Line {
  text: string;
  kind: AssistantLineKind;
}

/**
 * A short line beside the closed Parky button ("Hey, ich bin Parky – klick mich an!"), at most
 * twice a session and never once Parky was opened or a line was closed. A press on the line opens
 * Parky. After its entrance Parky's first line fits how it arrived, and it also speaks up when it
 * gets bored or is woken from sleep, a few times a session. Easter eggs: on a holiday the first
 * invitation is the day's, on the page of a park in `PARK_EGGS` Parky names its favourite ride there
 * and rides a coaster, and so it does after the Konami code. Every line counts as
 * `assistant_line_shown` with its kind. Loaded only when the button is drawn, so its strings stay
 * out of the page's chrome.
 */
export function AssistantTeaser({
  onOpen,
  onRide,
  entering = false,
  arrival = null,
}: {
  onOpen: () => void;
  /** Parky should ride a coaster now. */
  onRide: () => void;
  /** An entrance is under way: no line until Parky has landed. */
  entering?: boolean;
  /** The entrance Parky has just made, whose line is then the session's first. */
  arrival?: ParkyEntrance | null;
}) {
  const t = useTranslations('assistant');
  const pathname = usePathname();
  const [line, setLine] = useState<Line | null>(null);
  const boredom = useParkyBoredom(true);
  // What the timers need to know without being re-armed by it.
  const latest = useRef({ line, boredom, onRide });
  useEffect(() => {
    latest.current = { line, boredom, onRide };
  });

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
        // Never over another line and never from a sleeping Parky.
        if (latest.current.line || latest.current.boredom === 'asleep') {
          return next(RETRY_MS, keys, kind);
        }
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
      if (latest.current.line || reactionsShown() >= REACTIONS_PER_SESSION) return;
      countReaction();
      setLine({ text: t(pickRandom(REACTION_KEYS[kind])), kind });
    }, REACTION_DELAY_MS[kind]);
    // Somebody came back before the line was due: Parky is not bored any more.
    return () => clearTimeout(timer);
  }, [boredom, t]);

  // A park Parky likes: its favourite ride there, then a ride on a coaster.
  useEffect(() => {
    const path = parkPathOf(pathname);
    const egg = path ? PARK_EGGS[path] : undefined;
    if (!path || !egg || entering || !parkLineDue(path)) return;
    let timer: ReturnType<typeof setTimeout>;
    const say = (wait: number) => {
      timer = setTimeout(() => {
        if (latest.current.line || latest.current.boredom === 'asleep') return say(RETRY_MS);
        if (!parkLineDue(path)) return;
        markParkLine(path);
        setLine({ text: t(pickRandom(PARK_KEYS), egg), kind: 'park' });
        timer = setTimeout(() => latest.current.onRide(), RIDE_AFTER_MS);
      }, wait);
    };
    say(PARK_LINE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [pathname, entering, t]);

  // The Konami code buys a free ride, typed anywhere on the page.
  useEffect(() => {
    let progress = 0;
    const onKey = (event: KeyboardEvent) => {
      progress = konamiProgress(progress, event.key);
      if (progress < KONAMI_LENGTH) return;
      progress = 0;
      setLine({ text: t('secretKonami'), kind: 'secret' });
      latest.current.onRide();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [t]);

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
