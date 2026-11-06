import { weatherCodeToScene } from '@/components/parks/weather-scene';
import { VIEW } from './rides';

/**
 * Parky's outfits: what he wears for the time of year and for the park's weather, what an act puts
 * aside while it plays, and the acts a season or the weather adds to his showy ones. Pure, so the
 * drawing (`components/assistant/parky/looks.tsx`), the speech bubble and the tests share one
 * answer.
 */

/** The times of year Parky dresses for, in the order the preview lists them. */
export const SEASONS = ['halloween', 'christmas', 'newyear', 'winter'] as const;
/** One of {@link SEASONS}. */
export type ParkySeason = (typeof SEASONS)[number];

/** The park weather Parky dresses for, in the order the preview lists them. */
export const WEATHERS = ['rain', 'storm', 'snow', 'cold', 'windy', 'fog', 'hot'] as const;
/** One of {@link WEATHERS}. */
export type ParkyWeather = (typeof WEATHERS)[number];

/**
 * What Parky wears right now: the season's piece and the park's weather, either or both; and
 * whether a show is on at the page's park, which he dresses nothing for but claps along to.
 */
export interface ParkyLook {
  season: ParkySeason | null;
  weather: ParkyWeather | null;
  show?: boolean;
}

/** Parky in his everyday look, the wheel and nothing else; also the server's answer. */
export const NO_LOOK: ParkyLook = { season: null, weather: null };

/**
 * The season a date falls in, in the browser's calendar: Halloween all October, Christmas 1 to 26
 * December, New Year 31 December and 1 January, winter from 2 January to the end of February.
 */
export function seasonOn(date: Date): ParkySeason | null {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if ((month === 12 && day === 31) || (month === 1 && day === 1)) return 'newyear';
  if (month === 10) return 'halloween';
  if (month === 12 && day <= 26) return 'christmas';
  if (month === 1 || month === 2) return 'winter';
  return null;
}

/** From this many °C Parky finds it hot. */
export const HOT_FROM_C = 28;
/** Below this many °C Parky finds it cold. */
export const COLD_BELOW_C = 5;
/** Gusts this strong, in km/h, count as windy. */
export const WINDY_GUSTS_KMH = 50;
/** A steady wind this strong, in km/h, counts as windy. */
export const WINDY_KMH = 35;

/** The park's weather now, as the nowcast reports it; any field may be missing. */
export interface WeatherReading {
  code: number | null;
  temperatureC: number | null;
  windKmh: number | null;
  gustsKmh: number | null;
}

/**
 * The look for the park's weather, the most striking state first: a storm, snow, rain, wind, fog,
 * heat, cold; `null` for weather with nothing to dress for. The codes are grouped as the weather
 * background groups them (`weatherCodeToScene`).
 */
export function weatherLook(reading: WeatherReading): ParkyWeather | null {
  const scene = reading.code === null ? null : weatherCodeToScene(reading.code).scene;
  if (scene === 'thunderstorm') return 'storm';
  if (scene === 'snow') return 'snow';
  if (scene === 'rain') return 'rain';
  if ((reading.gustsKmh ?? 0) >= WINDY_GUSTS_KMH || (reading.windKmh ?? 0) >= WINDY_KMH) {
    return 'windy';
  }
  if (scene === 'fog') return 'fog';
  const temperature = reading.temperatureC;
  if (temperature !== null && temperature >= HOT_FROM_C) return 'hot';
  if (temperature !== null && temperature < COLD_BELOW_C) return 'cold';
  return null;
}

/** The hats a season puts on Parky in place of the Ferris wheel. */
export type ParkyHat = 'pumpkin' | 'tree' | 'party' | 'beanie';

const SEASON_HAT: Record<ParkySeason, ParkyHat> = {
  halloween: 'pumpkin',
  christmas: 'tree',
  newyear: 'party',
  winter: 'beanie',
};

/**
 * The pieces of a look drawn at one moment, each on its own anchor: the hat in place of the wheel,
 * the scarf round his middle, the umbrella in his right hand, and the weather around him.
 */
export interface ParkyOutfit {
  hat: ParkyHat | null;
  scarf: boolean;
  umbrella: boolean;
  sky: ParkyWeather | null;
}

/**
 * What an act, a mood or the search puts aside while it lasts, the one table for an act and an
 * outfit competing. An act with its own hat (the nightcap) or one that needs the wheel (its
 * lights) sends the season's hat away; a ride and the dizziness after it fold the umbrella, and so
 * does anything held in his hands. An act missing here leaves the outfit as it is.
 */
const SETS_ASIDE: Record<string, readonly ('hat' | 'umbrella')[]> = {
  nightcap: ['hat'],
  lights: ['hat'],
  coaster: ['umbrella'],
  launch: ['umbrella'],
  hills: ['umbrella'],
  tower: ['umbrella'],
  flume: ['umbrella'],
  teacups: ['umbrella'],
  dizzy: ['umbrella'],
  shakeoff: ['umbrella'],
  airtime: ['umbrella'],
  candy: ['umbrella'],
  churro: ['umbrella'],
  balloon: ['umbrella'],
  map: ['umbrella'],
  photo: ['umbrella'],
  slurp: ['umbrella'],
  grumpy: ['umbrella'],
  read: ['umbrella'],
  plan: ['umbrella'],
  looking: ['umbrella'],
  search: ['umbrella'],
  snowglobe: ['umbrella'],
  snowman: ['umbrella'],
  fan: ['umbrella'],
  applause: ['umbrella'],
};

/** The pieces of `look` drawn while `doing` (an act, a mood, `search`, or nothing) plays. */
export function outfitFor(look: ParkyLook, doing: string | null): ParkyOutfit {
  const aside = (doing && SETS_ASIDE[doing]) || [];
  const wet = look.weather === 'rain' || look.weather === 'storm';
  return {
    hat: look.season && !aside.includes('hat') ? SEASON_HAT[look.season] : null,
    scarf: look.season === 'winter' || look.weather === 'cold' || look.weather === 'snow',
    umbrella: wet && !aside.includes('umbrella'),
    sky: look.weather,
  };
}

/** The acts that belong to a season or the weather, drawn in `components/assistant/parky/looks.tsx`. */
export const LOOK_ACTS = [
  'ghost',
  'snowglobe',
  'fireworks',
  'snowman',
  'brolly',
  'shiver',
  'fan',
] as const;
/** One of {@link LOOK_ACTS}. */
export type ParkyLookAct = (typeof LOOK_ACTS)[number];

/** An act a context adds to the showy pool that is no look act of its own. */
type ContextAct = ParkyLookAct | 'shades' | 'applause';

/**
 * The extra tickets a season, the weather or a show on at the park adds to the showy pool while it
 * holds; two tickets make an act about as likely as a ride. The heat also brings the sunglasses
 * out more.
 */
const CONTEXT_ACTS: Record<ParkySeason | ParkyWeather | 'show', readonly ContextAct[]> = {
  halloween: ['ghost', 'ghost'],
  christmas: ['snowglobe', 'snowglobe'],
  newyear: ['fireworks', 'fireworks'],
  winter: ['snowman', 'snowman'],
  snow: ['snowman', 'snowman'],
  rain: ['brolly', 'brolly'],
  storm: ['brolly'],
  cold: ['shiver', 'shiver'],
  hot: ['fan', 'fan', 'shades', 'shades'],
  windy: [],
  fog: [],
  show: ['applause', 'applause'],
};

/** The showy pool for a look: every base act, plus the tickets its season, weather and show add. */
export function showyPool<T extends string>(
  base: readonly T[],
  look: ParkyLook
): (T | ContextAct)[] {
  const contexts = [look.season, look.weather, look.show ? ('show' as const) : null];
  const extra = contexts.flatMap((context) => (context ? CONTEXT_ACTS[context] : []));
  return [...base, ...extra];
}

/** The act Parky answers the park's weather with, beside its line. */
export const WEATHER_ACT: Record<ParkyWeather, ParkyLookAct | 'spin' | 'look'> = {
  rain: 'brolly',
  storm: 'brolly',
  snow: 'snowman',
  cold: 'shiver',
  windy: 'spin',
  fog: 'look',
  hot: 'fan',
};

/**
 * How far a scene reaches past the drawing to the left and up, in its units: the snowman stands
 * beside Parky, the fireworks go off over his head.
 */
const SCENE_REACH: Partial<Record<string, { left: number; top: number }>> = {
  snowman: { left: -13, top: 22 },
  fireworks: { left: -10, top: -22 },
  ghost: { left: -7, top: -7 },
};

/**
 * Whether an act's scene stays on screen for a drawing whose box starts `left` and `top` pixels
 * into the viewport and is `width` pixels wide; an act without a scene always does.
 */
export function sceneFits(act: string, box: { left: number; top: number; width: number }): boolean {
  const reach = SCENE_REACH[act];
  if (!reach) return true;
  const unit = box.width / VIEW;
  return box.left + reach.left * unit >= 0 && box.top + reach.top * unit >= 0;
}

/**
 * A look asked for in `?parky=`, for trying the outfits out: a season, a weather, or both with a
 * comma (`?parky=christmas,rain`). Whatever else the switch says is left to the other switches.
 */
export function lookSwitch(value: string | null): Partial<ParkyLook> {
  const asked: Partial<ParkyLook> = {};
  for (const part of (value ?? '').split(',')) {
    if ((SEASONS as readonly string[]).includes(part)) asked.season = part as ParkySeason;
    if ((WEATHERS as readonly string[]).includes(part)) asked.weather = part as ParkyWeather;
  }
  return asked;
}
