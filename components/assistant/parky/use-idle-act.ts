'use client';

import { useEffect, useRef, useState } from 'react';
import { pickRandom } from '@/lib/utils/pick-random';
import {
  ACT_MS,
  CLASS_ACTS,
  FOLLOW_UP,
  WAKE_ACTS,
  actFor,
  pauseOf,
  type ParkyAct,
  type ParkyCue,
} from '@/lib/assistant/parky/acts';
import { parkyBoredom } from '@/lib/assistant/parky/boredom';
import { useParkyBoredom } from '@/lib/assistant/parky/use-parky-boredom';
import { DREAMS, DREAM_MS, type ParkyDream } from './dreams';

/** The first yawn and the eyes falling shut wait a moment after the boredom sets in. */
const SETTLE_MS = 1_500;

/**
 * Parky's life while nothing happens, from the page-wide {@link parkyBoredom}: a little act now and
 * then with company, more and sleepier ones once bored, then eyes falling shut and sleep until
 * somebody moves, which wakes it with a start. Each act runs once and clears, so the face rests
 * between them.
 */
export function useIdleAct(
  enabled: boolean,
  cue: ParkyCue | null,
  svg: React.RefObject<SVGSVGElement | null>,
  calm: boolean,
  showy: readonly (ParkyAct | 'ride')[]
) {
  const boredom = useParkyBoredom(enabled);
  const [act, setAct] = useState<ParkyAct | null>(null);
  const [dream, setDream] = useState<ParkyDream | null>(null);
  // A cue already there when the face mounts (the button back after the window closed) is old.
  const played = useRef(cue?.id);
  /**
   * The act on stage and when it ends. A change of stage (bored, asleep, awake again) lets it play
   * out: cut short, a ride stopped in mid-air and the next stage's yawn came on its heels.
   */
  const running = useRef<{ act: ParkyAct; endsAt: number } | null>(null);
  useEffect(() => {
    // One timer at a time, re-armed from its own callback, so cleanup always reaches it (and one
    // more that ends a stale dream).
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (!boredom) {
      // No life of its own now (a mood, a search, a closed window): what played is over.
      running.current = null;
      timer = setTimeout(() => {
        setAct(null);
        setDream(null);
      }, 0);
      return () => clearTimeout(timer);
    }
    let lastDream: ParkyDream | null = null;
    // Whatever was dreamt is over with a new stage, a cue or a new sleep; the next dream comes from
    // the loop below.
    const wake = setTimeout(() => setDream(null), 0);
    const woke = parkyBoredom.wokeUp();
    let previous: ParkyAct | null = running.current?.act ?? null;
    const end = (done: ParkyAct, then: () => void) => {
      running.current = null;
      setAct(null);
      const after = FOLLOW_UP[done];
      if (after) play(0, after);
      else then();
    };
    const play = (wait: number, asked: ParkyAct | 'ride') => {
      timer = setTimeout(() => {
        // A ride is chosen when it is due, from where Parky is then; with no room the turn passes.
        const next = actFor(asked, svg.current?.getBoundingClientRect());
        if (!next) {
          if (running.current) end(running.current.act, loop);
          else loop();
          return;
        }
        previous = next;
        running.current = { act: next, endsAt: Date.now() + ACT_MS[next] };
        setAct(next);
        timer = setTimeout(() => end(next, loop), ACT_MS[next]);
      }, wait);
    };
    // Asleep he dreams now and then, in his own rhythm: a dream is no act, the face sleeps on.
    const dreamOn = () => {
      timer = setTimeout(() => {
        const next = pickRandom(DREAMS, lastDream);
        lastDream = next;
        setDream(next);
        timer = setTimeout(() => {
          setDream(null);
          dreamOn();
        }, DREAM_MS);
      }, pauseOf('dream'));
    };
    // When the next showy act is due; a fidget that would come after it gives way to it.
    let showyAt = Date.now() + pauseOf('showy');
    const loop = () => {
      // Asleep, the doze is the last act: the sleeping face takes over until somebody moves.
      if (boredom === 'asleep') {
        dreamOn();
        return;
      }
      // Calm, awake or bored, he only blinks and follows the pointer with his eyes, then sleeps.
      if (calm) return;
      if (boredom === 'bored') {
        play(pauseOf('sleepy'), pickRandom(CLASS_ACTS.sleepy, previous));
        return;
      }
      const wait = pauseOf('fidget');
      if (Date.now() + wait < showyAt) {
        play(wait, pickRandom(CLASS_ACTS.fidget, previous));
        return;
      }
      const due = Math.max(0, showyAt - Date.now());
      showyAt = Date.now() + due + pauseOf('showy');
      play(due, pickRandom(showy, previous));
    };
    const enter = () => {
      if (boredom === 'asleep') play(SETTLE_MS, 'doze');
      else if (woke) play(0, pickRandom(WAKE_ACTS));
      else if (calm) loop();
      else if (boredom === 'bored') play(SETTLE_MS, 'yawn');
      else loop();
    };
    const onStage = running.current;
    if (cue && cue.id !== played.current) {
      // A cue answers the visitor, so it plays at once, over whatever is on stage.
      played.current = cue.id;
      play(0, cue.act);
    } else if (onStage) {
      timer = setTimeout(() => end(onStage.act, enter), Math.max(0, onStage.endsAt - Date.now()));
    } else enter();
    return () => {
      clearTimeout(timer);
      clearTimeout(wake);
    };
  }, [boredom, cue, svg, calm, showy]);
  // Shown only while Parky has a life of its own, so a mood or a search never meets an act.
  const shown = boredom ? act : null;
  const asleep = boredom === 'asleep' && shown === null;
  return { act: shown, asleep, dream: asleep ? dream : null };
}
