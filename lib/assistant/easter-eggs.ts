/** What Parky says a park's line about: the park's name and the ride it wants another go on. */
export interface ParkEgg {
  park: string;
  ride: string;
}

/**
 * Parks whose ride Parky names whatever the numbers say, keyed by the geo path of their page (two
 * parks are called `disneyland-park`). Every other park gets its line from its own data
 * ({@link topCoaster}). Each ride is one park.fan lists.
 */
export const PARK_FAVOURITES: Record<string, ParkEgg> = {
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

const PARK_PAGE = /^\/[a-z]{2}\/parks\/([^/]+)\/([^/]+)\/([^/]+)\/([^/]+)$/;

/** The four segments of a park's own page, the only page its line is said on; `null` elsewhere. */
export function parkPageOf(
  pathname: string
): { continent: string; country: string; city: string; parkSlug: string } | null {
  const match = PARK_PAGE.exec(pathname);
  if (!match) return null;
  const [, continent, country, city, parkSlug] = match;
  return { continent, country, city, parkSlug };
}

/** How often a park's page gets its line and the coaster ride: sometimes, not every visit. */
export const PARK_EGG_CHANCE = 0.4;

const COASTER = /coaster|achterbahn/i;

/**
 * The ride a park's line names: its coaster with the longest waits, Parky being about to ride one,
 * else its top attraction; `null` for a park without a ranking. The list comes ranked from `/stats`.
 */
export function topCoaster(
  ranking: readonly { attractionName: string; attractionType?: string | null }[]
): string | null {
  const coaster = ranking.find((ride) => COASTER.test(ride.attractionType ?? ''));
  return (coaster ?? ranking[0])?.attractionName ?? null;
}

/**
 * The park's name as the page's own structured data gives it (`AmusementPark`, a root node or one
 * in `@graph`), so the line needs no request of its own; `null` where the page has none.
 */
export function parkNameIn(scripts: Iterable<{ textContent: string | null }>): string | null {
  for (const script of scripts) {
    let data: unknown;
    try {
      data = JSON.parse(script.textContent ?? '');
    } catch {
      continue;
    }
    const nodes = Array.isArray(data) ? data : [data];
    for (const node of nodes) {
      const graph = (node as { '@graph'?: unknown[] })?.['@graph'];
      for (const item of Array.isArray(graph) ? [node, ...graph] : [node]) {
        const thing = item as { '@type'?: unknown; name?: unknown };
        if (thing?.['@type'] === 'AmusementPark' && typeof thing.name === 'string') {
          return thing.name;
        }
      }
    }
  }
  return null;
}

/**
 * What `?parky=` asks for on this page, for trying the easter eggs out: `egg` for a park's line
 * whatever the chance, or an entrance's name. Browser only.
 */
export function parkySwitch(): string | null {
  try {
    return new URLSearchParams(window.location.search).get('parky');
  } catch {
    return null;
  }
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
