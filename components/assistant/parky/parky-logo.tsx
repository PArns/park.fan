'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { ACT_MS, CLASS_ACTS, type ParkyCue } from '@/lib/assistant/parky/acts';
import {
  RIDE_MOTION,
  RIDES,
  VIEW,
  rideKeyframe,
  type ParkyRide,
} from '@/lib/assistant/parky/rides';
import { outfitFor, showyPool } from '@/lib/assistant/parky/look';
import { animateParky, parkyStill } from '@/lib/assistant/parky/motion';
import { useParkyLook } from '@/lib/assistant/parky/use-parky-look';
import {
  LOOK_GAZE,
  ParkyLookBack,
  ParkyLookFog,
  ParkyLookHands,
  ParkyLookHat,
  ParkyLookWear,
} from './looks';
import {
  BUBBLE,
  CABINS,
  CABIN_COLOURS,
  CHECKLIST_ROWS,
  CHEEKS,
  CONFETTI,
  EYES,
  FERRULE,
  FLOATERS,
  GRIN,
  HANDLE,
  HANDLE_END,
  HAPPY_EYES,
  HEART,
  LENS,
  MOON,
  NIGHT_STARS,
  SHUT_EYES,
  SMILE,
  STAR,
  ZED,
  blue,
  blush,
  capBlue,
  green,
  heartRed,
  ink,
  pink,
} from './drawing';
import { DREAM_MS, ParkyDreamCloud } from './dreams';
import { ParkyMoment, ParkyRideTrack, ParkySpotlight, ParkyVehicle } from './props';
import { ParkyWheel } from './wheel';
import { useGaze } from './use-gaze';
import { useIdleAct } from './use-idle-act';
import { LENS_OUT_MS, PUZZLED_MS, useSearchAlong } from './use-search-along';

/**
 * What Parky is busy with, each with its own look: `thinking` (waiting for the first word) gazes
 * up beside thought bubbles, `looking` (a lookup is running) reads in a little book, its eyes
 * following the lines and a page turning now and then, `talking` (the answer is written) moves its
 * mouth and nods, `scared` (flung up the screen by a hard scroll) stares down at the drop with
 * its mouth open while the launcher shakes it, `squashed` (pressed flat by a hard scroll up)
 * screws its eyes shut and grits its teeth, with a puff of impact at each side.
 */
export type ParkyMood = 'thinking' | 'looking' | 'talking' | 'scared' | 'squashed';

/** Where the pupils rest while Parky reads: down, into the book. */
const READING_GAZE = { x: 0, y: 2.8 };

/** Where the pupils go while Parky hangs high up: straight down, at the drop. */
const SCARED_GAZE = { x: 0, y: 2.6 };

/** Where the pupils rest while Parky ponders: up and to the side. */
const PONDER_GAZE = { x: 1.8, y: -2.4 };

/** Where the pupils rest while Parky searches: a little down, at the page, scanning across it. */
const SEARCH_GAZE = { x: 0, y: 0.8 };

/** Where the pupils rest while a bell rings: up, at it, over the left eye. */
const BELL_GAZE = { x: -1.8, y: -2.2 };

/**
 * Parky's face: a speech bubble in the brand's blue to green with big eyes that follow the mouse,
 * rosy cheeks and a smile, and for a hat a Ferris wheel with coloured cabins on an A-frame. It
 * blinks every 7 to 8 s, shows its {@link ParkyMood}, and while `idle` has a life of its own in
 * classes (`CLASS_ACTS`): small fidgets every 7 to 8 s, mischief about every half minute, and once
 * nobody moves everything sleepy until it falls asleep. While a search is open on the page it searches along, a magnifying
 * glass to its eye, leaning in at each keystroke. The motion lives in `app/parky.css`
 * (`.parky-*`) and only runs without `prefers-reduced-motion`.
 */
export function ParkyLogo({
  className,
  mood,
  talking = false,
  idle = false,
  calm = false,
  cue = null,
}: {
  className?: string;
  mood?: ParkyMood | null;
  /** Shorthand for `mood="talking"`. */
  talking?: boolean;
  /** A life of its own while nothing happens: acts, boredom and sleep. */
  idle?: boolean;
  /**
   * With `idle`, for Parky beside a conversation or in the homepage hero: he only blinks and
   * follows the pointer until he falls asleep, and wakes as any Parky does; no fidgets, no
   * mischief, no yawning and no dizziness when circled. What answers the visitor (cues, moods, searching along)
   * plays either way.
   */
  calm?: boolean;
  /** An act to play at once, with `idle`. */
  cue?: ParkyCue | null;
}) {
  const state: ParkyMood | null = mood ?? (talking ? 'talking' : null);
  // Two marks are on screen at once (button and window header); each needs its own gradient id.
  const ground = useId();
  const svg = useRef<SVGSVGElement>(null);
  // The circling easter egg plays its act through the same cue as one asked for from outside; its
  // ids count down from -1, so they never meet the launcher's.
  const [ownCue, setOwnCue] = useState<ParkyCue | null>(null);
  const [outerCue, setOuterCue] = useState(cue);
  const [latestCue, setLatestCue] = useState(cue);
  if (cue !== outerCue) {
    setOuterCue(cue);
    setLatestCue(cue);
  }
  const getDizzy = useCallback(() => {
    const next = { act: 'dizzy' as const, id: (ownCue?.id ?? 0) - 1 };
    setOwnCue(next);
    setLatestCue(next);
  }, [ownCue]);
  const { cross, ...mouseGaze } = useGaze(svg, idle && !calm ? getDizzy : undefined);
  // A mood has its own motion; the idle life is for a face with nothing to do, and a search open
  // on the page is something to do.
  const { search, puzzled } = useSearchAlong(idle && !state);
  const look = useParkyLook();
  const showy = useMemo(() => showyPool(CLASS_ACTS.showy, look), [look]);
  const { act, asleep, dream } = useIdleAct(idle && !state && !search, latestCue, svg, calm, showy);
  const outfit = outfitFor(look, act ?? state ?? (search ? 'search' : null));
  const searching = search === 'searching';
  const gaze =
    state === 'thinking' || act === 'lights'
      ? PONDER_GAZE
      : state === 'looking' || act === 'read' || act === 'plan'
        ? READING_GAZE
        : state === 'scared'
          ? SCARED_GAZE
          : act === 'bell'
            ? BELL_GAZE
            : act && LOOK_GAZE[act]
              ? LOOK_GAZE[act]
              : searching
                ? SEARCH_GAZE
                : mouseGaze;
  const squint = cross && gaze === mouseGaze;
  // Heart eyes and the cheer's happy squint take the place of the open eyes.
  const eyesOpen = !asleep && act !== 'love' && act !== 'cheer' && state !== 'squashed';
  const sleeping = asleep || act === 'nap';
  const ride =
    act !== null && (RIDES as readonly string[]).includes(act) ? (act as ParkyRide) : null;
  const motion = ride && ride !== 'coaster' ? RIDE_MOTION[ride] : null;
  // The rides beyond the loop move the whole face along their track, played from the same
  // geometry the rails are drawn from; the hat lifts off its head in the free fall.
  const body = useRef<SVGGElement>(null);
  const hat = useRef<SVGGElement>(null);
  useEffect(() => {
    if (!motion || !ride || !body.current) return;
    const timing = { duration: ACT_MS[ride], fill: 'both' as const };
    const runs = [animateParky(body.current, motion.stops.map(rideKeyframe), timing)];
    if (motion.hat && hat.current) {
      const lifts = motion.hat.map(({ at, lift }) => ({
        offset: at,
        transform: `translateY(${-lift}px)`,
      }));
      runs.push(animateParky(hat.current, lifts, timing));
    }
    return () => runs.forEach((run) => run.cancel());
  }, [motion, ride]);
  // Each keystroke in the search, Parky leans the glass in for a closer look.
  const lens = useRef<SVGGElement>(null);
  useEffect(() => {
    if (!searching || parkyStill()) return;
    let run: Animation | undefined;
    const onInput = () => {
      run?.cancel();
      run = lens.current?.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.14)' }, { transform: 'scale(1)' }],
        { duration: 280, easing: 'ease-out' }
      );
    };
    document.addEventListener('input', onInput, true);
    return () => {
      document.removeEventListener('input', onInput, true);
      run?.cancel();
    };
  }, [searching]);
  const length = act ? ACT_MS[act] : search === 'done' ? LENS_OUT_MS : puzzled ? PUZZLED_MS : null;
  return (
    <svg
      ref={svg}
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      className={cn('size-8 overflow-visible', className)}
      style={
        length || dream
          ? ({
              ...(length && { '--parky-act': `${length}ms` }),
              ...(dream && { '--parky-dream': `${DREAM_MS}ms` }),
            } as React.CSSProperties)
          : undefined
      }
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={ground} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={blue} />
          <stop offset="1" stopColor={green} />
        </linearGradient>
      </defs>
      <ParkyLookBack outfit={outfit} act={act} />
      {state === 'thinking' && (
        <g className="parky-thoughts" fill="white" stroke={blue} strokeWidth=".8">
          <circle cx="7" cy="9" r="1.5" />
          <circle cx="3.5" cy="4.5" r="2" />
          <circle cx="-1" cy="-1" r="2.7" />
          {/* The big cloud the small ones lead to, with dots that bob while Parky thinks. */}
          <ellipse className="parky-cloud" cx="-10" cy="-10" rx="10" ry="6.8" />
          <g className="parky-cloud-dots" fill={blue} stroke="none">
            <circle cx="-14.5" cy="-10" r="1.3" />
            <circle cx="-10" cy="-10" r="1.3" />
            <circle cx="-5.5" cy="-10" r="1.3" />
          </g>
        </g>
      )}
      {act === 'cheer' && (
        // Behind the body, so the pieces come out from behind the head.
        <g className="parky-confetti" transform="translate(24 14)">
          {CONFETTI.map((piece, i) => {
            const style = {
              '--dx': `${piece.dx}px`,
              '--dy': `${piece.dy}px`,
              '--spin': `${piece.spin}deg`,
            } as React.CSSProperties;
            const fill = [...CABIN_COLOURS, blue][i % 5];
            return piece.round ? (
              <circle key={i} r="1.3" fill={fill} style={style} />
            ) : (
              <rect key={i} x="-1.6" y="-.8" width="3.2" height="1.6" fill={fill} style={style} />
            );
          })}
        </g>
      )}
      {act === 'lights' && (
        // Night over the top left: a crescent moon and two stars that twinkle.
        <g className="parky-night">
          <path d={MOON} fill="oklch(0.9 0.1 95)" />
          <g fill="oklch(0.92 0.08 95)">
            {NIGHT_STARS.map((star) => (
              <g key={star.x} transform={`translate(${star.x} ${star.y})`}>
                <path className="parky-twinkle" d={STAR} />
              </g>
            ))}
          </g>
        </g>
      )}
      {puzzled && (
        // A question mark over the top left: the search found nothing.
        <g className="parky-alarm parky-query">
          <path
            d="M5.1 3.4a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1.1.9-1.1 1.8"
            fill="none"
            stroke={blue}
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <circle cx="7.5" cy="10.2" r="1.1" fill={blue} />
        </g>
      )}
      {act === 'bell' && (
        // A bell over the top left, swinging from its top, with the ring on either side.
        <g className="parky-alarm parky-bell">
          <g className="parky-bell-swing">
            <path
              d="M7.5.6c-2.5 0-3.8 1.9-3.8 4.4v2.6l-1.3 1.7h10.2l-1.3-1.7V5c0-2.5-1.3-4.4-3.8-4.4Z"
              fill="oklch(0.85 0.15 88)"
              stroke="oklch(0.6 0.13 70)"
              strokeWidth=".6"
            />
            <circle cx="7.5" cy="10.4" r="1.1" fill="oklch(0.6 0.13 70)" />
          </g>
          <path
            className="parky-ring"
            d="M1.2 2.2q-1.6 2.8 0 5.6M13.8 2.2q1.6 2.8 0 5.6"
            fill="none"
            stroke={blue}
            strokeWidth=".9"
            strokeLinecap="round"
          />
        </g>
      )}
      {dream && <ParkyDreamCloud dream={dream} ground={ground} />}
      {sleeping && !dream && (
        // Three Zs rising over the bubble's top left, away from the hat; once each in a nap.
        <g
          className={cn('parky-zzz', act === 'nap' && 'parky-zzz--nap')}
          fill="none"
          stroke={blue}
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={ZED} />
          <path d={ZED} />
          <path d={ZED} />
        </g>
      )}
      {(act === 'whistle' || act === 'dance' || act === 'love') && (
        // Two notes, or two hearts, drifting up beside the right cheek; outside the body, so they
        // do not sway.
        <g className="parky-notes" strokeWidth=".9" strokeLinecap="round">
          {FLOATERS.map((note) => (
            <g key={note.x} transform={`translate(${note.x} ${note.y})`}>
              {act === 'love' ? (
                <g className="parky-note">
                  <path d={HEART} transform="scale(.6)" fill={heartRed} />
                </g>
              ) : (
                <g className="parky-note" fill={note.colour} stroke={note.colour}>
                  <ellipse rx="1.6" ry="1.15" transform="rotate(-20)" stroke="none" />
                  <path d="M1.45-.4V-6.8q2.4.9 2.6 3.2" fill="none" />
                </g>
              )}
            </g>
          ))}
        </g>
      )}
      {ride && <ParkyRideTrack ride={ride} />}
      {act === 'applause' && <ParkySpotlight />}
      {act === 'startle' && (
        <g className="parky-alarm" fill={blue}>
          <path d="M7.5 0v5.2" stroke={blue} strokeWidth="2" strokeLinecap="round" />
          <circle cx="7.5" cy="8.4" r="1.15" />
        </g>
      )}
      <g
        key={act ?? state ?? (search ? 'search' : asleep ? 'asleep' : 'still')}
        ref={body}
        className={cn(
          'parky-body',
          act && `parky-act-${act}`,
          state && `parky-mood-${state}`,
          asleep && 'parky-asleep',
          searching && 'parky-searching'
        )}
      >
        {/* The hat: a Ferris wheel standing on Parky's head. */}
        <g ref={hat} className={cn('parky-hat', outfit.hat && 'parky-hat--dressed')}>
          {outfit.hat && <ParkyLookHat hat={outfit.hat} />}
          <ParkyWheel
            className={cn(
              'parky-wheel',
              (state === 'talking' ||
                state === 'looking' ||
                act === 'spin' ||
                act === 'twirl' ||
                ride ||
                act === 'dance' ||
                act === 'cheer' ||
                act === 'lights' ||
                searching) &&
                'parky-wheel--turning'
            )}
            glow={
              act === 'lights' &&
              // Lit up for the night: a glow round every cabin, twinkling one after another.
              CABINS.map((cabin, i) => (
                <circle
                  key={`glow ${cabin.x} ${cabin.y}`}
                  className="parky-glow"
                  cx={cabin.x}
                  cy={cabin.y}
                  r="2.8"
                  fill="oklch(0.92 0.16 95)"
                  style={{ animationDelay: `${(-i * 0.15).toFixed(2)}s` }}
                />
              ))
            }
          />
        </g>
        <path d={BUBBLE} fill={`url(#${ground})`} />
        <ParkyLookWear outfit={outfit} ground={ground} />
        {eyesOpen && (
          // One group per eye, so a wink closes one and the gum makes them cross.
          <g className="parky-eyes">
            {EYES.map((x) => (
              <g key={x} className="parky-eye">
                <ellipse cx={x} cy="22.5" rx="5.4" ry="6.2" fill="white" />
                {/* Properties, not the attribute, so the pupils ease to a new place and an act
                    that moves them itself can draw the gaze back to the middle. */}
                <g
                  className="parky-gaze"
                  style={
                    {
                      // Squinting at its nose, each pupil turns in towards the middle.
                      '--gaze-x': `${(squint ? (x < 24 ? gaze.x : -gaze.x) : gaze.x).toFixed(2)}px`,
                      '--gaze-y': `${gaze.y.toFixed(2)}px`,
                    } as React.CSSProperties
                  }
                >
                  <g className="parky-pupils">
                    <circle cx={x} cy="23" r="3" fill={ink} />
                    <circle cx={x + 1.1} cy="21.7" r="1.05" fill="white" />
                  </g>
                </g>
              </g>
            ))}
          </g>
        )}
        {sleeping && (
          // In a nap the shut eyes cross-fade with the open ones; asleep they are all there is.
          <path
            className="parky-shut"
            d={SHUT_EYES}
            fill="none"
            stroke={ink}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        )}
        {act === 'love' && (
          // Heart eyes, beating.
          <g fill={heartRed}>
            {EYES.map((x) => (
              <g key={x} transform={`translate(${x} 23)`}>
                <path className="parky-heart" d={HEART} />
              </g>
            ))}
          </g>
        )}
        {state === 'squashed' && (
          // Pressed flat: the eyes screwed shut into > <, a puff of impact out at each side.
          <g
            fill="none"
            stroke={ink}
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M13.6 20.2 19.6 23l-6 2.8M34.4 20.2 28.4 23l6 2.8" />
            <path
              d="M4.2 37.5 1 35.8M3.4 41.6H0M43.8 37.5l3.2-1.7M44.6 41.6H48"
              strokeOpacity=".5"
            />
          </g>
        )}
        {act === 'cheer' && (
          // A happy squint, the eyes turned up into arcs.
          <path d={HAPPY_EYES} fill="none" stroke={ink} strokeWidth="2" strokeLinecap="round" />
        )}
        {act === 'shades' && (
          // Sunglasses, slid down from the hat onto the eyes.
          <g className="parky-shades">
            <path d="M10 17h28" stroke={ink} strokeWidth="1.6" strokeLinecap="round" />
            <path d="M10.6 17H23v6.2c0 3.2-2.6 5.4-6.2 5.4s-6.2-2.2-6.2-5.4Z" fill={ink} />
            <path d="M25 17h12.4v6.2c0 3.2-2.6 5.4-6.2 5.4S25 26.4 25 23.2Z" fill={ink} />
            <path
              d="M13 19.4h3.2M27.4 19.4h3.2"
              stroke="white"
              strokeOpacity=".55"
              strokeWidth=".9"
              strokeLinecap="round"
            />
          </g>
        )}
        {act === 'nightcap' && (
          // A nightcap in place of the wheel: a white brim round the top of the head, the cap
          // flopping over to the left, a bobble at its tip and two stars on the cloth.
          <g className="parky-nightcap">
            <path
              d="M38.6 13.6C38.4 3.4 31.6-5.6 22.2-5.4 13.6-5.2 6.4-.8 2.4 4.6c4.4-1.6 8.6.2 10 4.4L9.4 13.6Z"
              fill={capBlue}
            />
            <path
              d="M22.2-5.4C13.6-5.2 6.4-.8 2.4 4.6c4.4-1.6 8.6.2 10 4.4"
              fill="none"
              stroke="white"
              strokeOpacity=".25"
              strokeWidth="1.2"
            />
            <g fill="oklch(0.9 0.12 95)">
              <path d={STAR} transform="translate(6 -1.5) scale(.7)" />
              <path d={STAR} transform="translate(13 4.5) scale(.55)" />
            </g>
            <path
              d="M9.2 13.8Q24 2.4 38.8 13.8"
              fill="none"
              stroke="white"
              strokeWidth="3.6"
              strokeLinecap="round"
            />
            <circle className="parky-bobble" cx="2.4" cy="5.4" r="2.6" fill="white" />
          </g>
        )}
        {CHEEKS.map((x) => (
          <ellipse key={x} cx={x} cy="31" rx="2.4" ry="1.4" fill={blush} opacity=".7" />
        ))}
        {state === 'squashed' ? (
          // Teeth gritted: a wavy line across a wide mouth.
          <path
            d="M18.6 33.6q1.35-1.6 2.7 0t2.7 0 2.7 0 2.7 0"
            fill="none"
            stroke={ink}
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        ) : state === 'scared' ? (
          // Agape: a round open mouth, the tongue showing at its bottom.
          <g>
            <ellipse cx="24" cy="34" rx="2.4" ry="3" fill={ink} />
            <ellipse cx="24" cy="35.9" rx="1.5" ry=".8" fill="oklch(0.7 0.15 15)" />
          </g>
        ) : state === 'talking' ? (
          <ellipse className="parky-mouth" cx="24" cy="33.5" rx="3" ry="2.2" fill={ink} />
        ) : searching ? (
          // Concentrating: the mouth pulled to one side, the tip of the tongue out.
          <g className="parky-focus">
            <ellipse cx="25.9" cy="34.5" rx="1.4" ry="1.1" fill="oklch(0.7 0.15 15)" />
            <path
              d="M21.2 33.2q2.6 1.5 5.6.2"
              fill="none"
              stroke={ink}
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </g>
        ) : (
          <path
            className="parky-smile"
            d={SMILE}
            fill="none"
            stroke={ink}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        )}
        {(act === 'yawn' || act === 'nightcap') && (
          <g className="parky-yawn">
            <ellipse cx="24" cy="34" rx="3" ry="3.4" fill={ink} />
            <ellipse cx="24" cy="36.2" rx="1.8" ry="1" fill="oklch(0.7 0.15 15)" />
          </g>
        )}
        {(act === 'whistle' || act === 'gum') && (
          <circle className="parky-purse" cx="24.5" cy="33.3" r="1.4" fill={ink} />
        )}
        {act === 'gum' && (
          <>
            <g className="parky-gum">
              <circle
                cx="24.5"
                cy="39"
                r="7.5"
                fill={pink}
                stroke="oklch(0.68 0.16 355)"
                strokeWidth=".6"
              />
              <ellipse cx="21.6" cy="35.8" rx="2" ry="1.1" fill="white" opacity=".75" />
            </g>
            {/* The pop: short strokes around where the bubble was. */}
            <path
              className="parky-pop"
              d="M24.5 29.5v-2.2M32 32.2l1.6-1.5M17 32.2l-1.6-1.5M34.2 39h2.2M14.8 39h-2.2"
              stroke="white"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </>
        )}
        {act === 'dizzy' && (
          <>
            <path
              className="parky-woozy"
              d="M19.5 33.5q1.25-1.6 2.5 0t2.5 0 2.5 0"
              fill="none"
              stroke={ink}
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            {/* Three stars round the head, each a third of the way behind the one before. */}
            <g className="parky-stars" fill="oklch(0.86 0.15 90)">
              <path d={STAR} />
              <path d={STAR} />
              <path d={STAR} />
            </g>
          </>
        )}
        {(ride || act === 'cheer') && <path className="parky-grin" d={GRIN} fill={ink} />}
        {ride && <ParkyVehicle ride={ride} ms={ACT_MS[ride]} />}
        {search && (
          // The glass over the right eye, which the stylesheet makes big behind it.
          <g
            className={cn('parky-lens', !searching && 'parky-lens--out')}
            style={{
              transformBox: 'view-box',
              transformOrigin: `${HANDLE_END.x}px ${HANDLE_END.y}px`,
            }}
          >
            <g
              ref={lens}
              style={{ transformBox: 'view-box', transformOrigin: `${LENS.x}px ${LENS.y}px` }}
            >
              <path
                d={HANDLE}
                stroke="oklch(0.56 0.12 55)"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <path d={FERRULE} stroke={ink} strokeWidth="3.8" />
              <circle
                cx={LENS.x}
                cy={LENS.y}
                r={LENS.r}
                fill="oklch(0.92 0.04 230)"
                fillOpacity=".22"
                stroke={ink}
                strokeWidth="1.7"
              />
              <circle
                cx={LENS.x}
                cy={LENS.y}
                r={LENS.r - 1}
                fill="none"
                stroke="white"
                strokeOpacity=".5"
                strokeWidth=".5"
              />
              {/* The glint, top left in the glass. */}
              <path
                d={`M${LENS.x - 4.8} ${LENS.y - 2.9}a5.4 5.4 0 0 1 3.2-3`}
                fill="none"
                stroke="white"
                strokeOpacity=".85"
                strokeWidth="1.1"
                strokeLinecap="round"
              />
            </g>
          </g>
        )}
        {act === 'plan' && (
          // A clipboard with a checklist, held below the eyes; the rows are ticked off one by one.
          <g className="parky-book parky-clipboard">
            <rect x="12" y="29" width="24" height="19.5" rx="2" fill="oklch(0.62 0.1 60)" />
            <rect x="14" y="31.4" width="20" height="15.6" rx="1" fill="white" />
            <rect x="21.5" y="27.4" width="5" height="3.4" rx="1.1" fill={ink} />
            {CHECKLIST_ROWS.map((y) => (
              <g key={y}>
                <rect
                  x="16"
                  y={y - 1.4}
                  width="2.8"
                  height="2.8"
                  rx=".5"
                  fill="none"
                  stroke={blue}
                  strokeWidth=".7"
                />
                <path
                  d={`M20.8 ${y}h10.6`}
                  stroke={blue}
                  strokeOpacity=".45"
                  strokeWidth=".9"
                  strokeLinecap="round"
                />
                <path
                  className="parky-tick"
                  d={`M16.1 ${y}l1.3 1.3 2.6-3.4`}
                  pathLength={1}
                  fill="none"
                  stroke="oklch(0.6 0.17 146)"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            ))}
          </g>
        )}
        {(state === 'looking' || act === 'read') && (
          // An open book held below the eyes, where the mouth was; a page turns now and then.
          <g className="parky-book">
            <path d="M24 30 5 26v18.5l19 4Z" fill="white" stroke={blue} strokeWidth="1.1" />
            <path d="M24 30 43 26v18.5l-19 4Z" fill="white" stroke={blue} strokeWidth="1.1" />
            <path
              d="M8.5 30.4l12 2.5M8.5 33.6l12 2.5M8.5 36.8l12 2.5M8.5 40l9 1.9M27.5 32.9l12-2.5M27.5 36.1l12-2.5M27.5 39.3l12-2.5M27.5 42.5l9-1.9"
              stroke={blue}
              strokeOpacity=".45"
              strokeWidth=".8"
              strokeLinecap="round"
            />
            <path
              className="parky-page"
              d="M24 30 43 26v18.5l-19 4Z"
              fill="oklch(0.97 0.01 240)"
              stroke={blue}
              strokeWidth=".9"
            />
            <path d="M24 30v18.5" stroke={blue} strokeWidth="1.3" />
          </g>
        )}
        <ParkyLookHands act={act} ground={ground} />
        <ParkyMoment act={act} />
      </g>
      {outfit.sky === 'fog' && <ParkyLookFog />}
    </svg>
  );
}
