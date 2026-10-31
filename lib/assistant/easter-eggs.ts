/**
 * Parks Parky has a soft spot for, keyed by the geo path of their page (two parks are called
 * `disneyland-park`), with the ride it wants another go on. Each ride is one park.fan lists.
 */
export const PARK_EGGS: Record<string, { park: string; ride: string }> = {
  'europe/germany/bruehl/phantasialand': { park: 'Phantasialand', ride: 'Taron' },
  'europe/germany/rust/europa-park': { park: 'Europa-Park', ride: 'Silver Star' },
  'europe/netherlands/kaatsheuvel/efteling': { park: 'Efteling', ride: 'Baron 1898' },
  'europe/germany/soltau/heide-park': { park: 'Heide Park', ride: 'Colossos' },
  'europe/netherlands/sevenum/attractiepark-toverland': { park: 'Toverland', ride: 'Troy' },
  'europe/netherlands/biddinghuizen/walibi-holland': { park: 'Walibi Holland', ride: 'Untamed' },
  'europe/germany/bottrop/movie-park-germany': { park: 'Movie Park', ride: 'Star Trek' },
  'europe/germany/sierksdorf/hansa-park': { park: 'Hansa-Park', ride: 'Kärnan' },
  'europe/germany/hassloch/plopsaland-deutschland': {
    park: 'Plopsaland',
    ride: 'Expedition GeForce',
  },
  'europe/france/paris/disneyland-park': { park: 'Disneyland Paris', ride: 'Big Thunder Mountain' },
  'europe/france/plailly/parc-asterix': { park: 'Parc Astérix', ride: 'Toutatis' },
  'europe/spain/vila-seca/portaventura-park': { park: 'PortAventura', ride: 'Shambhala' },
  'europe/italy/ronchi/gardaland': { park: 'Gardaland', ride: 'Raptor' },
  'europe/sweden/gothenburg/liseberg': { park: 'Liseberg', ride: 'Helix' },
  'europe/poland/zator/energylandia': { park: 'Energylandia', ride: 'Zadra' },
  'europe/belgium/de-panne/plopsaland-belgium': {
    park: 'Plopsaland De Panne',
    ride: 'The Ride to Happiness',
  },
};

const PARK_PATH = /\/parks\/([^/]+\/[^/]+\/[^/]+\/[^/?#]+)/;

/** The geo path of the park a page belongs to (a park's page or one of its rides), or `null`. */
export function parkPathOf(pathname: string): string | null {
  return PARK_PATH.exec(pathname)?.[1] ?? null;
}

/** Days Parky has a line of its own for, in the browser's calendar. */
export type ParkyHoliday = 'halloween' | 'christmas' | 'newyear';

/** The holiday a date falls on: 31 October, 24 to 26 December, 31 December and 1 January. */
export function holidayOn(date: Date): ParkyHoliday | null {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if (month === 10 && day === 31) return 'halloween';
  if (month === 12 && day >= 24 && day <= 26) return 'christmas';
  if ((month === 12 && day === 31) || (month === 1 && day === 1)) return 'newyear';
  return null;
}

/** The Konami code, as `KeyboardEvent.key` reports it. */
const KONAMI = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
] as const;

/**
 * How far into the Konami code a key leaves somebody who had typed `progress` keys of it; the full
 * length means it is done. A wrong key starts over, or counts as the first one if it is.
 */
export function konamiProgress(progress: number, key: string): number {
  const typed = key.length === 1 ? key.toLowerCase() : key;
  if (typed === KONAMI[progress]) return progress + 1;
  // A third ↑ still leaves the last two as the code's start.
  if (typed === KONAMI[0]) return progress === 2 ? 2 : 1;
  return 0;
}

/** How many keys the Konami code has. */
export const KONAMI_LENGTH = KONAMI.length;
