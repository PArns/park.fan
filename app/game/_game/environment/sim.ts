/**
 * Weather — the one system every other one reads and none writes.
 *
 * It runs first for that reason (see `core/sim/order.ts`). The model is a Markov chain over six
 * states with season-dependent transition weights, which is enough to produce a plausible week:
 * clear spells that last, rain that arrives via cloud rather than out of nothing, and storms that
 * only follow rain. A per-tick roll would give a park that flickers between sunshine and snow.
 */

import type { SimSystem } from '../core/sim/context';
import { TICKS_PER_GAME_MINUTE } from '../core/units';
import type { WeatherState } from '../core/schema';

type Kind = WeatherState['kind'];

const KINDS: Kind[] = ['clear', 'cloudy', 'overcast', 'rain', 'storm', 'snow'];

/**
 * Transition weights per season, `from → to`.
 *
 * Read a row as "when it is X, what comes next". The diagonal is heavy on purpose: weather is
 * mostly the continuation of itself, and the spell length falls out of that rather than being a
 * second number to keep in step.
 */
const TRANSITIONS: Record<number, Record<Kind, number[]>> = {
  // spring
  0: {
    clear: [60, 25, 8, 6, 1, 0],
    cloudy: [22, 45, 20, 12, 1, 0],
    overcast: [8, 28, 40, 22, 2, 0],
    rain: [6, 20, 30, 40, 4, 0],
    storm: [4, 16, 30, 40, 10, 0],
    snow: [10, 25, 30, 25, 2, 8],
  },
  // summer
  1: {
    clear: [72, 20, 5, 3, 0, 0],
    cloudy: [34, 44, 14, 7, 1, 0],
    overcast: [14, 34, 36, 14, 2, 0],
    rain: [12, 28, 28, 28, 4, 0],
    storm: [10, 24, 26, 32, 8, 0],
    snow: [40, 30, 20, 10, 0, 0],
  },
  // autumn
  2: {
    clear: [52, 28, 12, 7, 1, 0],
    cloudy: [18, 42, 26, 13, 1, 0],
    overcast: [6, 24, 44, 24, 2, 0],
    rain: [5, 16, 32, 43, 4, 0],
    storm: [3, 12, 30, 44, 11, 0],
    snow: [8, 22, 32, 26, 2, 10],
  },
  // winter
  3: {
    clear: [46, 26, 16, 6, 0, 6],
    cloudy: [16, 38, 28, 8, 0, 10],
    overcast: [5, 20, 46, 12, 1, 16],
    rain: [4, 14, 34, 32, 2, 14],
    storm: [3, 10, 32, 34, 6, 15],
    snow: [6, 14, 26, 8, 0, 46],
  },
};

/** Mean temperature per season, and the swing across a day. */
const SEASON_TEMP: Array<[mean: number, swing: number]> = [
  [13, 8],
  [23, 9],
  [12, 7],
  [3, 5],
];

const MIN_SPELL_TICKS = TICKS_PER_GAME_MINUTE * 45;

export const weatherSystem: SimSystem = {
  id: 'weather',

  init(ctx) {
    // Season follows the day unless a scenario pinned it, and a pinned one still advances — a
    // scenario that starts in summer should still reach autumn.
    ctx.world.state.weather.season = seasonForDay(ctx.clock.day, ctx.world.state.weather.season);
  },

  tick(ctx) {
    const weather = ctx.world.state.weather;
    weather.season = seasonForDay(ctx.clock.day, weather.season);

    if (weather.ticksLeft > 0) {
      weather.ticksLeft--;
    } else {
      const rng = ctx.rng('weather');
      const row = TRANSITIONS[weather.season]![weather.kind]!;
      weather.kind = rng.pickWeighted(KINDS, row);
      // A spell is 45 minutes to 5 hours. Both ends measured against how long a guest takes to
      // cross the park: shorter and the crowd never reacts, longer and a rainy day is the whole day.
      weather.ticksLeft = rng.int(MIN_SPELL_TICKS, MIN_SPELL_TICKS * 7);
      weather.intensity =
        weather.kind === 'clear'
          ? 0
          : weather.kind === 'storm'
            ? rng.range(0.7, 1)
            : rng.range(0.25, 0.85);
      weather.windMs =
        weather.kind === 'storm' ? rng.range(12, 22) : rng.range(0.5, 7) * (1 + weather.intensity);
    }

    // Temperature is a smooth daily sine around the season mean, pulled down by cloud and rain.
    const [mean, swing] = SEASON_TEMP[weather.season]!;
    const dayPhase = ((ctx.clock.minuteOfDay - 240) / 1440) * Math.PI * 2;
    const cloudPenalty =
      weather.kind === 'clear' ? 0 : weather.kind === 'cloudy' ? 1.5 : weather.kind === 'snow' ? 6 : 4;
    weather.temperatureC =
      Math.round((mean + Math.sin(dayPhase) * swing - cloudPenalty * weather.intensity) * 10) / 10;
  },

  audit(ctx) {
    return { weatherIntensity: ctx.world.state.weather.intensity };
  },
};

/**
 * A 96-day year, four 24-day seasons.
 *
 * Short on purpose: a real 365-day year means a player never sees winter, and the seasons exist to
 * change what the park looks like and how many people come, not to model a calendar.
 */
function seasonForDay(day: number, fallback: number): number {
  if (!Number.isFinite(day)) return fallback;
  return Math.floor((day % 96) / 24);
}
