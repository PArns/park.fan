/**
 * The weather chain: pure, deterministic, Babylon-free and DOM-free.
 *
 * A Markov chain over the five `WeatherKind`s with season-dependent transition weights. Read a
 * row as "when it is X, what comes next"; the diagonal is heavy on purpose, so a spell's length
 * falls out of the chain instead of being a second number to keep in step with it. A per-tick
 * roll would give a park that flickers between sunshine and thunder inside a minute.
 *
 * Two things changed from the model this was ported from. Snow is gone as a state, because
 * `WeatherKind` in `core/types.ts` has five members and inventing a sixth in a type this module
 * does not own would break every consumer's switch; its winter weight is split between overcast
 * and rain, and the precipitation layer draws flakes instead of drops when the air is below
 * 1.5 °C, so a cold December still looks like December. And the 96-day year is gone: core's solar
 * model dates the day against a 365-day calendar (`seasonForDay` in `core/sun.ts`), and two
 * calendars would put a summer sun over an autumn park.
 */

import { seasonForDay } from '../core/sun';
import type { Season, WeatherKind } from '../core/types';

export const WEATHER_KINDS: readonly WeatherKind[] = [
  'clear',
  'cloudy',
  'overcast',
  'rain',
  'storm',
];

const SEASON_INDEX: Record<Season, number> = { spring: 0, summer: 1, autumn: 2, winter: 3 };

/** `TRANSITIONS[season][from]` → weight per `WEATHER_KINDS` entry. */
const TRANSITIONS: number[][][] = [
  // spring
  [
    [60, 25, 8, 6, 1],
    [22, 45, 20, 12, 1],
    [8, 28, 40, 22, 2],
    [6, 20, 30, 40, 4],
    [4, 16, 30, 40, 10],
  ],
  // summer
  [
    [72, 20, 5, 3, 0],
    [34, 44, 14, 7, 1],
    [14, 34, 36, 14, 2],
    [12, 28, 28, 28, 4],
    [10, 24, 26, 32, 8],
  ],
  // autumn
  [
    [52, 28, 12, 7, 1],
    [18, 42, 26, 13, 1],
    [6, 24, 44, 24, 2],
    [5, 16, 32, 43, 4],
    [3, 12, 30, 44, 11],
  ],
  // winter — the source model's snow column split evenly between overcast and rain
  [
    [46, 26, 19, 9, 0],
    [16, 38, 33, 13, 0],
    [5, 20, 54, 20, 1],
    [4, 14, 41, 39, 2],
    [3, 10, 40, 42, 6],
  ],
];

/** Mean temperature per season and the swing across a day, °C. */
const SEASON_TEMP: Array<[number, number]> = [
  [13, 8],
  [23, 9],
  [12, 7],
  [3, 5],
];

/**
 * A spell is 45 minutes to 5¼ hours of park time. Both ends are measured against how long a guest
 * takes to cross the park: shorter and the crowd never reacts, longer and one shower is the day.
 */
const MIN_SPELL_MINUTES = 45;
const MAX_SPELL_MINUTES = MIN_SPELL_MINUTES * 7;

/** Below this the precipitation layer draws snow instead of rain. */
export const SNOW_TEMPERATURE_C = 1.5;

export interface WeatherSlot {
  kind: WeatherKind;
  /** Park minutes until the chain is rolled again. */
  minutesLeft: number;
  /** 0..1 — how hard it is doing whatever it is doing. */
  intensity: number;
  windMs: number;
  temperatureC: number;
  /** 0..1 surface wetness, integrated so a shower's puddles outlive the shower. */
  wetness: number;
  /** Set by `environment:weather`, or by `?weather=` at boot: the chain stops rolling. */
  forced?: boolean;
  /** xoshiro state, so a save resumes the same weather rather than a fresh one. */
  rng?: [number, number, number, number];
}

export function freshSlot(kind: WeatherKind = 'clear'): WeatherSlot {
  return {
    kind,
    minutesLeft: MIN_SPELL_MINUTES,
    intensity: kind === 'clear' ? 0 : 0.5,
    windMs: 2.5,
    temperatureC: 15,
    wetness: kind === 'rain' || kind === 'storm' ? 0.7 : 0,
  };
}

export interface WeatherRng {
  next(): number;
  range(min: number, max: number): number;
}

/** Weighted pick over `WEATHER_KINDS`. */
function pickWeighted(weights: number[], rng: WeatherRng): WeatherKind {
  let total = 0;
  for (const w of weights) total += w;
  let roll = rng.next() * total;
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return WEATHER_KINDS[i];
  }
  return WEATHER_KINDS[weights.length - 1];
}

/** Cloud cover the visuals and the sun attenuation read, per state and intensity. */
export function cloudFor(kind: WeatherKind, intensity: number): number {
  switch (kind) {
    case 'clear':
      return 0.04 + 0.1 * intensity;
    case 'cloudy':
      return 0.28 + 0.3 * intensity;
    case 'overcast':
      return 0.72 + 0.22 * intensity;
    case 'rain':
      return 0.82 + 0.16 * intensity;
    case 'storm':
      return 0.9 + 0.1 * intensity;
  }
}

/** How fast a surface takes on water, and how fast it gives it back, per park minute. */
function wetnessTarget(kind: WeatherKind, intensity: number): number {
  if (kind === 'storm') return 0.85 + 0.15 * intensity;
  if (kind === 'rain') return 0.35 + 0.6 * intensity;
  return 0;
}

/**
 * Advance the chain by `dtMinutes` park minutes. Mutates and returns `slot` so the caller can
 * keep it in `world.modules.environment` without a copy per tick.
 */
export function stepWeather(
  slot: WeatherSlot,
  dtMinutes: number,
  day: number,
  minute: number,
  rng: WeatherRng
): WeatherSlot {
  const season = seasonForDay(day);
  const s = SEASON_INDEX[season];

  if (!slot.forced) {
    slot.minutesLeft -= dtMinutes;
    if (slot.minutesLeft <= 0) {
      const from = Math.max(0, WEATHER_KINDS.indexOf(slot.kind));
      slot.kind = pickWeighted(TRANSITIONS[s][from], rng);
      slot.minutesLeft = rng.range(MIN_SPELL_MINUTES, MAX_SPELL_MINUTES);
      slot.intensity =
        slot.kind === 'clear'
          ? 0
          : slot.kind === 'storm'
            ? rng.range(0.7, 1)
            : rng.range(0.25, 0.85);
      slot.windMs =
        slot.kind === 'storm'
          ? rng.range(12, 22)
          : rng.range(0.5, 7) * (1 + slot.intensity);
    }
  }

  // Temperature: a smooth daily sine about the season's mean, coldest around 04:00, pulled down
  // by cloud and rain.
  const [mean, swing] = SEASON_TEMP[s];
  const dayPhase = ((minute - 240) / 1440) * Math.PI * 2;
  const cloudPenalty = slot.kind === 'clear' ? 0 : slot.kind === 'cloudy' ? 1.5 : 4;
  slot.temperatureC =
    Math.round((mean + Math.sin(dayPhase) * swing - cloudPenalty * slot.intensity) * 10) / 10;

  // Wetness lags the weather in both directions: tarmac takes a few minutes to soak and the best
  // part of an hour to dry, which is why a park still looks rained-on after the sun comes back.
  const target = wetnessTarget(slot.kind, slot.intensity);
  const rate = target > slot.wetness ? 0.06 : 0.014;
  const delta = target - slot.wetness;
  const stepAmount = Math.min(Math.abs(delta), rate * dtMinutes);
  slot.wetness = Math.max(0, Math.min(1, slot.wetness + Math.sign(delta) * stepAmount));

  return slot;
}

/** Precipitation falls in `rain` and `storm` only; below freezing it falls as snow. */
export function isSnowing(slot: WeatherSlot): boolean {
  return (
    (slot.kind === 'rain' || slot.kind === 'storm') && slot.temperatureC <= SNOW_TEMPERATURE_C
  );
}
