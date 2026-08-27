import { isSimulationEnabled } from '@/lib/nearby-simulation';
import type {
  InfluencingHoliday,
  ParkWithAttractions,
  ScheduleItem,
  WeatherNowcast,
  WeatherWarning,
} from '@/lib/api/types';

/**
 * Dev-/preview-only park-state simulation — `?state=` on any park page.
 *
 * The park header is built around states almost no park is in when you happen to look at it. A
 * DWD warning was live on none of the 212 parks on the three afternoons this row was designed;
 * a public holiday plus a bridge day plus neighbouring school breaks all landing on one day is a
 * handful of dates a year. So the row that carries them was drawn from the one park that had a
 * single Dutch summer break, and shipped with three of its four branches never once rendered.
 *
 * This is the `?sim=` idea from `lib/nearby-simulation.ts` pointed at the park payload instead of
 * at the request coordinates, and it differs from that one in a way worth stating: `?sim=`
 * fabricates NOTHING — it moves the caller and lets the real backend answer. There is no such
 * trick here. A warning that is not currently in force cannot be conjured out of a real response,
 * so these scenarios patch the payload, and every one of them is therefore a lie the visitor must
 * never be told. Two fences: {@link isSimulationEnabled} (off on the production deployment, on
 * for local dev and Vercel previews — the same gate `?sim=` uses), and the banner
 * `<ParkSimulationNotice>` the page renders whenever a scenario is active, so a screenshot taken
 * from a preview carries the word "simuliert" in it.
 *
 * Scenarios compose, comma-separated: `?state=warning,holiday,neighbors,busy`.
 *
 * Where it is applied matters. `weather` is in the live poll's projection and `schedule` is not
 * (see `leanParkForLivePoll`), so patching only the server render would leave a simulated warning
 * on screen until the first poll landed and then silently drop it. `/api/parks/[…]` therefore
 * applies the same scenarios to its snapshot, and `useLiveParkData` forwards the param.
 */

export type ParkSimScenario =
  'warning' | 'extreme' | 'holiday' | 'bridge' | 'school' | 'neighbors' | 'busy' | 'closed';

const SCENARIOS = new Set<ParkSimScenario>([
  'warning',
  'extreme',
  'holiday',
  'bridge',
  'school',
  'neighbors',
  'busy',
  'closed',
]);

/** `all` expands to everything that can co-exist — `closed` is left out, it contradicts `busy`. */
const ALL: ParkSimScenario[] = ['warning', 'holiday', 'bridge', 'school', 'neighbors', 'busy'];

/**
 * Parse `?state=` into the scenarios to apply. Returns an empty array when simulation is off, the
 * param is absent, or nothing in it is a known scenario — so every caller can apply the result
 * unconditionally and a typo degrades to the real park rather than to an error.
 */
export function parseParkSimulation(raw: string | null | undefined): ParkSimScenario[] {
  if (!isSimulationEnabled() || !raw) return [];
  const parts = raw
    .toLowerCase()
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.includes('all')) return ALL;
  const picked = parts.filter((p): p is ParkSimScenario => SCENARIOS.has(p as ParkSimScenario));
  return [...new Set(picked)];
}

/** The `?state=` value as the client should forward it, or null. Keeps the raw string so an
 *  unknown scenario reaches one parser rather than being dropped in three places. */
export function readParkSimulationParam(search: string | null | undefined): string | null {
  if (!isSimulationEnabled() || !search) return null;
  const value = new URLSearchParams(search).get('state');
  return value && parseParkSimulation(value).length > 0 ? value : null;
}

/**
 * A DWD-shaped warning. The German fields carry the text and the `*En` ones the translation,
 * which is the exact shape `WeatherWarningBanner` reads — a simulated warning that filled only
 * `headline` would exercise a branch the real feed never takes.
 */
function warning(severity: 'Severe' | 'Extreme'): WeatherWarning {
  const severe: WeatherWarning = {
    alertId: 'sim-severe-thunderstorm',
    event: 'STARKES GEWITTER',
    eventEn: 'SEVERE THUNDERSTORM',
    severity: 'Severe',
    urgency: 'Immediate',
    category: 'Met',
    headline: 'Amtliche WARNUNG vor STARKEM GEWITTER',
    headlineEn: 'Official WARNING of SEVERE THUNDERSTORM',
    description:
      'Es treten Gewitter mit Windböen bis 70 km/h, Starkregen um 25 l/m² pro Stunde und Hagel um 2 cm auf.',
    descriptionEn:
      'Thunderstorms with wind gusts up to 70 km/h, heavy rain around 25 l/m² per hour and hail around 2 cm.',
    instruction: 'Meiden Sie freie Flächen und halten Sie Abstand zu Bäumen.',
    instructionEn: 'Avoid open spaces and keep clear of trees.',
    onset: null,
    expires: null,
    area: 'Simulation',
    source: 'simulation',
  };
  if (severity === 'Severe') return severe;
  return {
    ...severe,
    alertId: 'sim-extreme-heat',
    event: 'EXTREME HITZE',
    eventEn: 'EXTREME HEAT',
    severity: 'Extreme',
    headline: 'Amtliche WARNUNG vor EXTREMER HITZE',
    headlineEn: 'Official WARNING of EXTREME HEAT',
    description:
      'Es besteht eine extreme Wärmebelastung. Die gefühlte Temperatur liegt über 38 °C.',
    descriptionEn: 'Extreme heat stress. The apparent temperature exceeds 38 °C.',
    instruction: 'Trinken Sie ausreichend und meiden Sie die Mittagssonne.',
    instructionEn: 'Drink enough and stay out of the midday sun.',
  };
}

/**
 * Neighbouring school breaks from four regions in three countries, which is the case the panel
 * was written for and the one nobody could see: the real feed hands the German parks a single
 * Dutch entry most of the year.
 */
const NEIGHBOR_HOLIDAYS: InfluencingHoliday[] = [
  {
    name: 'Summer Holidays',
    source: { countryCode: 'NL', regionCode: 'GE' },
    holidayType: 'school',
  },
  {
    name: 'Summer Holidays',
    source: { countryCode: 'BE', regionCode: 'VLG' },
    holidayType: 'school',
  },
  {
    name: 'Summer Holidays',
    source: { countryCode: 'DE', regionCode: 'RP' },
    holidayType: 'school',
  },
  {
    name: 'Autumn Holidays',
    source: { countryCode: 'LU', regionCode: null },
    holidayType: 'school',
  },
];

/** Patch every schedule entry that is today or later, so the panel finds its holiday whichever
 *  entry the park clock picks. */
function patchSchedule(
  schedule: ScheduleItem[] | null | undefined,
  patch: Partial<ScheduleItem>
): ScheduleItem[] | null | undefined {
  if (!schedule) return schedule;
  return schedule.map((entry) => ({ ...entry, ...patch }));
}

/**
 * Apply the parsed scenarios to a park payload. Pure — returns a new object and never mutates
 * the response it was handed, because the same park object is the React Query seed.
 */
export function applyParkSimulation(
  park: ParkWithAttractions,
  scenarios: ParkSimScenario[]
): ParkWithAttractions {
  if (scenarios.length === 0) return park;
  const has = (s: ParkSimScenario) => scenarios.includes(s);
  const next: ParkWithAttractions = { ...park };

  if (has('warning') || has('extreme')) {
    next.weather = {
      ...next.weather,
      warnings: [
        ...(has('extreme') ? [warning('Extreme')] : []),
        ...(has('warning') ? [warning('Severe')] : []),
      ],
    };
  }

  const schedulePatch: Partial<ScheduleItem> = {};
  if (has('holiday')) {
    schedulePatch.isHoliday = true;
    schedulePatch.isPublicHoliday = true;
    schedulePatch.holidayName = 'Corpus Christi';
    schedulePatch.holidayType = 'public';
  }
  if (has('school')) {
    schedulePatch.isHoliday = true;
    schedulePatch.isSchoolHoliday = true;
    schedulePatch.isSchoolVacation = true;
    // Only names the break when `holiday` has not already claimed the name field: a day that is
    // both is a public holiday inside a school break, and the public one is what gets named.
    if (!has('holiday')) {
      schedulePatch.holidayName = 'Autumn Holidays';
      schedulePatch.holidayType = 'school';
    }
  }
  if (has('bridge')) schedulePatch.isBridgeDay = true;
  if (has('neighbors')) schedulePatch.influencingHolidays = NEIGHBOR_HOLIDAYS;

  if (Object.keys(schedulePatch).length > 0) {
    next.schedule = patchSchedule(next.schedule, schedulePatch) ?? next.schedule;
  }

  if (has('busy')) {
    next.currentLoad = {
      baseline: next.currentLoad?.baseline ?? 32,
      crowdLevel: 'very_high',
      currentWaitTime: 55,
      trend: 'increasing',
      comparisonStatus: 'much_higher',
    };
    if (next.analytics) {
      next.analytics = {
        ...next.analytics,
        occupancy: {
          ...next.analytics.occupancy,
          current: 87,
          trend: 'increasing',
          comparedToTypical: 34,
          comparisonStatus: 'much_higher',
        },
        statistics: {
          ...next.analytics.statistics,
          avgWaitTime: 55,
          avgWaitToday: 55,
          crowdLevel: 'very_high',
          peakWaitToday: 110,
        },
      };
    }
  }

  if (has('closed')) {
    next.status = 'CLOSED';
    next.schedule = patchSchedule(next.schedule, { scheduleType: 'CLOSED' }) ?? next.schedule;
  }

  return next;
}

/**
 * The same scenarios applied to the nowcast payload.
 *
 * `WeatherWarningBanner` and the "es regnet gleich" strip both read the NOWCAST, while the
 * weather tile's hint reads `park.weather.warnings` — one claim, two sources, and simulating only
 * the park left the tile saying "Unwetterwarnung" above a panel with no banner in it. That split
 * is worth keeping in mind beyond the simulation: the two can disagree in production too.
 */
export function applyNowcastSimulation(
  nowcast: WeatherNowcast | null,
  scenarios: ParkSimScenario[]
): WeatherNowcast | null {
  if (!nowcast || scenarios.length === 0) return nowcast;
  const has = (s: ParkSimScenario) => scenarios.includes(s);
  if (!has('warning') && !has('extreme')) return nowcast;
  return {
    ...nowcast,
    warnings: [
      ...(has('extreme') ? [warning('Extreme')] : []),
      ...(has('warning') ? [warning('Severe')] : []),
    ],
  };
}
