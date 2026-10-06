import { isSimulationEnabled } from '@/lib/nearby-simulation';
import type {
  InfluencingHoliday,
  ParkWithAttractions,
  ScheduleItem,
  WeatherNowcast,
  WeatherWarning,
} from '@/lib/api/types';

/**
 * Dev- and preview-only park-state simulation: `?state=` on any park page, for header states
 * (warnings, holidays, neighbouring breaks) almost no park is in when you look.
 *
 * Unlike `?sim=` in `lib/nearby-simulation.ts`, which only moves the caller, this patches the
 * payload, so every scenario is a lie the visitor must never be told. Two fences:
 * {@link isSimulationEnabled} (off in production) and the `<ParkSimulationNotice>` banner the page
 * renders while a scenario is active. Scenarios compose: `?state=warning,holiday,neighbors,busy`.
 *
 * `weather` is in the live poll's projection, so `/api/parks/[…]` applies the same scenarios to its
 * snapshot and `useLiveParkData` forwards the param; otherwise the first poll would drop them.
 */

/** One simulated park state `?state=` can switch on. */
export type ParkSimScenario =
  | 'warning'
  | 'extreme'
  | 'holiday'
  | 'bridge'
  | 'school'
  | 'neighbors'
  | 'busy'
  | 'closed'
  | 'rain';

const SCENARIOS = new Set<ParkSimScenario>([
  'warning',
  'extreme',
  'holiday',
  'bridge',
  'school',
  'neighbors',
  'busy',
  'closed',
  'rain',
]);

/**
 * `all` expands to everything that can co-exist: not `closed` (contradicts `busy`), and not
 * `rain`, which replaces the nowcast's rain forecast.
 */
const ALL: ParkSimScenario[] = ['warning', 'holiday', 'bridge', 'school', 'neighbors', 'busy'];

/**
 * Parse `?state=` into the scenarios to apply. Empty when simulation is off, the param is absent
 * or nothing in it is known, so callers apply the result unconditionally and a typo degrades to
 * the real park.
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

/** The `?state=` value as the client should forward it, or null. Kept raw so one parser decides
 *  which scenarios are known. */
export function readParkSimulationParam(search: string | null | undefined): string | null {
  if (!isSimulationEnabled() || !search) return null;
  const value = new URLSearchParams(search).get('state');
  return value && parseParkSimulation(value).length > 0 ? value : null;
}

/**
 * A DWD-shaped warning with German text and `*En` translations, the exact shape
 * `WeatherWarningBanner` reads, so the simulation exercises the branch the real feed takes.
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
 * Neighbouring school breaks from four regions in three countries, a case the real feed rarely
 * shows (German parks usually get a single Dutch entry).
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

/** Patch every schedule entry, so the panel finds its holiday whichever entry the park clock
 *  picks. */
function patchSchedule(
  schedule: ScheduleItem[] | null | undefined,
  patch: Partial<ScheduleItem>
): ScheduleItem[] | null | undefined {
  if (!schedule) return schedule;
  return schedule.map((entry) => ({ ...entry, ...patch }));
}

/**
 * Apply the parsed scenarios to a park payload. Pure: never mutates the response, because the
 * same park object is the React Query seed.
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
    // A public holiday inside a school break is named for the public holiday.
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
          baseline90thPercentile: 0,
          updatedAt: '',
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
 * The same scenarios applied to the nowcast payload. The warning banner and the rain strip read
 * the nowcast while the weather tile reads `park.weather.warnings`, so both must be patched; the
 * two sources can disagree in production too.
 */
export function applyNowcastSimulation(
  nowcast: WeatherNowcast | null,
  scenarios: ParkSimScenario[]
): WeatherNowcast | null {
  if (!nowcast || scenarios.length === 0) return nowcast;
  const has = (s: ParkSimScenario) => scenarios.includes(s);
  let next = nowcast;
  if (has('warning') || has('extreme')) {
    next = {
      ...next,
      warnings: [
        ...(has('extreme') ? [warning('Extreme')] : []),
        ...(has('warning') ? [warning('Severe')] : []),
      ],
    };
  }
  // Moderate rain from ten minutes after the request for an hour, inside the banner's and the
  // covered-ride offer's lead time. Stamped per request, so it stays ten minutes ahead.
  if (has('rain')) {
    const now = Date.now();
    next = {
      ...next,
      currentlyRaining: false,
      rainStartsAt: new Date(now + 10 * 60_000).toISOString(),
      rainStartsIntensity: 'moderate',
      rainEndsAt: new Date(now + 70 * 60_000).toISOString(),
    };
  }
  return next;
}
