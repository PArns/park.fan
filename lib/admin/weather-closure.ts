/**
 * The admin's weather-closure board (`/admin/weather-closure`): the API's answer and the pure
 * decisions the page makes from it, kept apart from React so they can be tested. Contract:
 * `GET /v1/admin/weather-closure` in the backend repo.
 */

/** One cause's learned profile for one ride; null on the ride when the data is too thin. */
export interface WeatherClosureProfile {
  /** The temperature from which the ride usually runs; null for snow. */
  thresholdC: number | null;
  /** Share of the cold (or snowy) open hours the ride was closed. */
  closedShare: number;
  /** The lower bound of that share, which the bar is checked against. */
  closedShareLower: number;
  /** Share of the other open hours it was closed. */
  baselineShare: number;
  /** How likely the weather is the reason when it is closed; the probability the page shows. */
  attributableShare: number;
  hours: number;
  days: number;
  publishable: boolean;
}

/** One ride on the board. */
export interface WeatherClosureRide {
  attractionId: string;
  attractionName: string;
  attractionSlug: string;
  parkId: string;
  parkName: string;
  parkSlug: string;
  /** `continent/country/city/park`, the public page's path under `/de/parks/`. */
  parkPath: string;
  publishable: boolean;
  bestProbability: number;
  cold: WeatherClosureProfile | null;
  snow: WeatherClosureProfile | null;
}

/** `GET /v1/admin/weather-closure`. */
export interface WeatherClosureReport {
  bar: { probability: number; closedShareLower: number };
  /** The newest profile; null while the job has never run. */
  generatedAt: string | null;
  totals: { rides: number; publishable: number; near: number };
  rides: WeatherClosureRide[];
}

/** From this probability on, a ride that is not shown counts as close to the bar. */
export const NEAR_PROBABILITY = 0.75;

/** Shown on the site, close to the bar, or neither: the colour of a ride's bar and chip. */
export type WeatherClosureState = 'shown' | 'near' | 'below';

/** The ride's state; `publishable` is the API's verdict and wins over the probability. */
export function weatherClosureState(ride: WeatherClosureRide): WeatherClosureState {
  if (ride.publishable) return 'shown';
  return ride.bestProbability >= NEAR_PROBABILITY ? 'near' : 'below';
}

/** The filters of the board. */
export type WeatherClosureFilter = 'all' | 'shown' | 'near' | 'cold' | 'snow';

/**
 * The rides a filter and a search keep, in the API's order. The search matches the park or the
 * ride name, without case.
 */
export function filterWeatherClosureRides(
  rides: readonly WeatherClosureRide[],
  filter: WeatherClosureFilter,
  query: string
): WeatherClosureRide[] {
  const needle = query.trim().toLocaleLowerCase('de');
  return rides.filter((ride) => {
    if (filter === 'shown' && weatherClosureState(ride) !== 'shown') return false;
    if (filter === 'near' && weatherClosureState(ride) !== 'near') return false;
    if (filter === 'cold' && !ride.cold) return false;
    if (filter === 'snow' && !ride.snow) return false;
    if (!needle) return true;
    return (
      ride.parkName.toLocaleLowerCase('de').includes(needle) ||
      ride.attractionName.toLocaleLowerCase('de').includes(needle)
    );
  });
}

/** The cause whose profile explains the ride best, for the row's figures; null without either. */
export function leadingProfile(
  ride: WeatherClosureRide
): { cause: 'cold' | 'snow'; profile: WeatherClosureProfile } | null {
  const { cold, snow } = ride;
  if (cold && (!snow || cold.attributableShare >= snow.attributableShare)) {
    return { cause: 'cold', profile: cold };
  }
  return snow ? { cause: 'snow', profile: snow } : null;
}
