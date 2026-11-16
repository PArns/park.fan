import type { KeyGrant } from './forecast-access';
import 'server-only';
import { search, searchWithApiKey } from '@/lib/api/search';
import { isApiKeyRefusal, readWithApiKey } from '@/lib/api/keyed-read';
import { getParkByGeoPath, getParkByGeoPathForAgents, getParkSeasons } from '@/lib/api/parks';
import { eventSeasonsOn } from '@/lib/parks/park-season-days';
import { catchNonFatal } from '@/lib/api/client';
import { parkDayOf } from '@/lib/utils/park-day';
import { forecastCrowdLevel } from '@/lib/utils/calendar-utils';
import {
  nextWorksPeriod,
  ridesInWorksOn,
  worksPeriodOn,
  worksPeriodsOf,
} from '@/lib/utils/works-period';
import type { ParkSeason, ParkWithAttractions, WorksPeriod } from '@/lib/api/types';
import { getBestDaysCalendar, getBestDaysForApiKey } from '@/lib/api/integrated-calendar';
import { convertApiUrlToFrontendUrl } from '@/lib/utils/url-utils';
import { noLiveWaitTimesReason } from '@/lib/utils/live-wait-times';
import {
  TOOL_DESCRIPTORS,
  toolDescriptor,
  type ToolDescriptor,
} from '@/lib/agents/tool-descriptors';
import { SITE_URL } from '@/i18n/config';
import { DEVELOPER_PORTAL_URL } from '@/lib/developers/paths';
import type { SearchResultItem } from '@/lib/api/types';

/**
 * What the three tools in `tool-descriptors.ts` do. They read the public API through the same
 * functions the pages use, so a park with no wait-time source goes through
 * `noLiveWaitTimesReason` here too instead of reading as a park shut for the night. All three are
 * read-only, and nothing here reaches `/admin`.
 */

/** What the server knows about the caller when it runs a tool. */
export interface McpToolContext {
  /**
   * Whether the caller reads like a park.fan page or with its own key; absent for a caller with
   * neither, who gets the live wait times and nothing else.
   */
  keyGrant?: KeyGrant;
}

export type McpTool = ToolDescriptor & {
  execute: (input: Record<string, unknown>, context?: McpToolContext) => Promise<unknown>;
};

/** The site page for a search hit, or undefined when the hit resolves to no route. */
function pageUrl(item: Pick<SearchResultItem, 'url'>, locale: string): string | undefined {
  return item.url ? `${SITE_URL}/${locale}${convertApiUrlToFrontendUrl(item.url)}` : undefined;
}

/** `/parks/<continent>/<country>/<city>/<park>` → the four slugs the API endpoints take. */
function geoSegments(frontendPath: string): [string, string, string, string] | null {
  const parts = frontendPath.split('/').filter(Boolean);
  if (parts[0] !== 'parks' || parts.length < 5) return null;
  return [parts[1], parts[2], parts[3], parts[4]];
}

/**
 * The park a name or slug means, or null. Search is the site's own resolver, so "Europa Park",
 * "europa-park" and "Europapark" all land in the same place.
 */
async function resolvePark(query: string) {
  const results = await search(query, ['park']);
  const hit = results.results?.find((result) => result.type === 'park' && result.url);
  if (!hit?.url) return null;
  const path = convertApiUrlToFrontendUrl(hit.url);
  const segments = geoSegments(path);
  return segments ? { name: hit.name, path, segments } : null;
}

/** The API path of a park, from its four slugs. */
function parkApiPath(segments: readonly string[]): string {
  return `/v1/parks/${segments.join('/')}`;
}

/**
 * A maintenance window as an agent reads it: park-local days, both inclusive, and whether the end
 * is park.fan's estimate rather than a date the park published. `null` bounds are open.
 */
function maintenanceWindow(period: WorksPeriod) {
  return {
    from: period.from ?? null,
    until: period.to ?? null,
    untilIsEstimate: period.toUncertain,
  };
}

function localeOf(input: Record<string, unknown>): string {
  const locale = typeof input.locale === 'string' ? input.locale : 'en';
  return ['en', 'de', 'fr', 'it', 'nl', 'es'].includes(locale) ? locale : 'en';
}

/** Why a park reports no wait times, in words an agent can pass on rather than a flag. */
const NO_WAIT_TIMES_NOTE: Record<string, string> = {
  app_only:
    'This park publishes wait times only in its own app, inside the park. No numbers exist here — and no number is not a queue of zero.',
  not_published:
    'This park publishes no wait times at all. No numbers exist here — and no number is not a queue of zero.',
};

/** What a caller without the permissions reads instead of the extras. */
const WAITS_ONLY_NOTE = `Land, time zone, crowd level and maintenance dates need a park.fan data API key in the X-API-Key header with the matching permissions: ${DEVELOPER_PORTAL_URL}`;

/**
 * The park as this caller may read it. A park.fan page reads it like the page. A caller's own key
 * reads it from the API with that key and nothing of the server's, so the API leaves out every
 * field the key has no permission for (crowd level without `stats.live`, maintenance without
 * `parks.seasons`, land without `rides.details`). A key the API refuses for this park (403, no
 * `parks.details` or another park) and a caller without a key get the wait times only, which need
 * no key; an invalid key or a spent allowance is an error, as on the API.
 */
async function parkForCaller(
  segments: [string, string, string, string],
  grant: KeyGrant | undefined
): Promise<
  { data: ParkWithAttractions | null; waitsOnly: boolean; keyNote?: string } | { error: string }
> {
  if (grant?.via === 'key') {
    const keyed = await readWithApiKey<ParkWithAttractions>(parkApiPath(segments), grant.apiKey);
    if (!isApiKeyRefusal(keyed)) return { data: keyed, waitsOnly: false };
    if (keyed.status !== 403) return { error: keyed.message };
    return {
      data: await getParkByGeoPathForAgents(...segments),
      waitsOnly: true,
      keyNote: `${keyed.message} ${WAITS_ONLY_NOTE}`,
    };
  }
  const data = await getParkByGeoPathForAgents(...segments);
  return grant?.via === 'page'
    ? { data, waitsOnly: false }
    : { data, waitsOnly: true, keyNote: WAITS_ONLY_NOTE };
}

const EXECUTORS: Record<string, McpTool['execute']> = {
  async search_theme_parks(input, context) {
    const query = String(input.query ?? '').trim();
    if (query.length < 3) return { error: 'Query must be at least three characters.' };
    const locale = localeOf(input);
    const grant = context?.keyGrant;
    const data =
      grant?.via === 'key' ? await searchWithApiKey(query, grant.apiKey) : await search(query);
    if (isApiKeyRefusal(data)) return { error: data.message };
    return {
      query,
      results: (data.results ?? []).slice(0, 10).map((result) => ({
        type: result.type,
        name: result.name,
        park: result.parentPark?.name,
        city: result.city,
        country: result.country,
        status: result.status,
        waitMinutes: result.waitTime,
        url: pageUrl(result, locale),
      })),
    };
  },

  async get_park_wait_times(input, context) {
    const query = String(input.park ?? '');
    const park = await resolvePark(query);
    if (!park) return { error: `No park on park.fan matches "${query}".` };

    const read = await parkForCaller(park.segments, context?.keyGrant);
    if ('error' in read) return { error: read.error };
    const { data, waitsOnly, keyNote } = read;
    if (!data) return { error: `No live data for ${park.name}.` };

    // `effectiveStatus` is the API's own verdict and already accounts for a ride that is out of
    // season — the raw `status` does not, and an ice rink in August would otherwise come back as
    // one of the park's open rides.
    const today = parkDayOf(new Date(), data.timezone);
    const rides = (data.attractions ?? []).map((attraction) => {
      const standby = attraction.queues?.find((queue) => queue.queueType === 'STANDBY');
      // A curated window says why a ride reads CLOSED and until when; the next one says when it
      // will. Only where one exists, so a ride without says nothing rather than „none".
      const windows = worksPeriodsOf(attraction);
      const running = worksPeriodOn(windows, today);
      const next = running ? null : nextWorksPeriod(windows, today);
      return {
        name: attraction.name,
        ...(!waitsOnly && { land: attraction.land }),
        status: (attraction as { effectiveStatus?: string }).effectiveStatus ?? attraction.status,
        waitMinutes: standby && 'waitTime' in standby ? (standby.waitTime ?? null) : null,
        ...(!waitsOnly && running && { maintenance: maintenanceWindow(running) }),
        ...(!waitsOnly && next && { nextMaintenance: maintenanceWindow(next) }),
      };
    });

    // A park with no source of wait times aggregates to zero minutes over an empty set, which
    // reads as an empty park rather than an unreadable one. Report the reason and drop the
    // aggregates instead — the ride list and its statuses are still real.
    const noWaitTimes = noLiveWaitTimesReason(data);

    return {
      park: park.name,
      url: `${SITE_URL}/${localeOf(input)}${park.path}`,
      parkStatus: data.status,
      ...(!waitsOnly && { timezone: data.timezone }),
      ...(noWaitTimes
        ? {
            waitTimesAvailable: false,
            note: NO_WAIT_TIMES_NOTE[noWaitTimes] ?? NO_WAIT_TIMES_NOTE.not_published,
          }
        : {
            ...(!waitsOnly && {
              crowdLevel: data.analytics?.statistics?.crowdLevel ?? data.currentLoad?.crowdLevel,
              averageWaitMinutes:
                data.analytics?.statistics?.avgWaitTime ?? data.currentLoad?.currentWaitTime,
            }),
            note: 'Wait times are what the park published, rounded to five minutes. A null wait is a ride with no published number, not a queue of zero.',
          }),
      ...(keyNote && { keyNote }),
      maintenanceNote:
        'maintenance is a planned closure running today, nextMaintenance the next one: park-local days, both inclusive. A window can be one day or months; until null means no end is known yet, untilIsEstimate that the end is park.fan’s estimate.',
      ridesOpen: rides.filter((ride) => ride.status === 'OPERATING').length,
      ridesTotal: rides.length,
      // Longest queue first: the question behind this tool is almost always "what should I do
      // next", and the answer is at one end of that list or the other.
      rides: [...rides].sort((a, b) => (b.waitMinutes ?? -1) - (a.waitMinutes ?? -1)),
    };
  },

  async get_park_best_days(input, context) {
    const query = String(input.park ?? '');
    const park = await resolvePark(query);
    if (!park) return { error: `No park on park.fan matches "${query}".` };
    const grant = context?.keyGrant;
    const apiKey = grant?.via === 'key' ? grant.apiKey : null;

    const days = Math.min(Math.max(Number(input.days) || 30, 1), 90);
    // The rides come from the park's structure and the seasons from the park's list, a year from
    // today: for a page the cached entries the park page reads, for a key what that key may read,
    // so a key without `parks.seasons` gets no maintenance or seasons. A failed or refused read
    // costs the days their maintenance or season list, never the days.
    const [snapshot, structure, seasons] = await Promise.all([
      apiKey
        ? getBestDaysForApiKey(...park.segments, apiKey)
        : getBestDaysCalendar(...park.segments),
      apiKey
        ? readWithApiKey<ParkWithAttractions>(parkApiPath(park.segments), apiKey)
            .then((read) => (isApiKeyRefusal(read) ? null : read))
            .catch(() => null)
        : catchNonFatal(getParkByGeoPath(...park.segments)),
      apiKey
        ? readWithApiKey<{ seasons: ParkSeason[] }>(`${parkApiPath(park.segments)}/seasons`, apiKey)
            .then((read) => (isApiKeyRefusal(read) ? [] : (read.seasons ?? [])))
            .catch(() => [])
        : getParkSeasons(...park.segments),
    ]);
    if ('refused' in snapshot) return { error: snapshot.message };
    const rides = structure?.attractions ?? [];

    return {
      park: park.name,
      url: `${SITE_URL}/${localeOf(input)}${park.path}`,
      timezone: snapshot.meta?.timezone,
      // Taken from the days themselves rather than the snapshot's own window fields: the
      // window is what was returned, and a caller that asked for four days should be told it
      // got four, not that the forecast runs to November.
      window: {
        from: snapshot.days?.[0]?.date,
        to: snapshot.days?.slice(0, days).at(-1)?.date,
      },
      days: (snapshot.days ?? []).slice(0, days).map((day) => {
        // A closed day lists none: nothing runs on it anyway.
        const inMaintenance =
          day.status === 'CLOSED' ? [] : ridesInWorksOn(rides, day.date).map((ride) => ride.name);
        // What the calendar tile marks that day, and how settled where it is no promise yet.
        const daySeasons = eventSeasonsOn(seasons, day.date, day.status === 'CLOSED').map(
          (season) => ({
            kind: season.kind,
            name: season.name,
            ...(season.status !== 'confirmed' && { status: season.status }),
          })
        );
        return {
          date: day.date,
          status: day.status,
          // `crowdLevel` is overridden with the live reading on today only; the forecast is what a
          // date question wants, on every day including this one.
          crowdLevel: forecastCrowdLevel(day),
          isHoliday: day.isHoliday,
          isSchoolVacation: day.isSchoolVacation,
          isBridgeDay: day.isBridgeDay,
          ...(inMaintenance.length > 0 && { ridesInMaintenance: inMaintenance }),
          ...(daySeasons.length > 0 && { seasons: daySeasons }),
        };
      }),
      note: "A crowd level compares this park with itself, never one park with another. A closed day is a fact about the season, not a quiet day. ridesInMaintenance names the rides a planned maintenance closure shuts that day. seasons names the park's events running that day (Halloween, Christmas, a winter season, summer nights, a special event), with a status where the park has not confirmed the dates.",
    };
  },
};

export const MCP_TOOLS: McpTool[] = TOOL_DESCRIPTORS.map((descriptor) => ({
  ...toolDescriptor(descriptor.name),
  execute: EXECUTORS[descriptor.name],
}));
