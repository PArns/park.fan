import 'server-only';
import { search } from '@/lib/api/search';
import { getParkByGeoPathFresh } from '@/lib/api/parks';
import { getBestDaysSnapshotFresh } from '@/lib/api/integrated-calendar';
import { convertApiUrlToFrontendUrl } from '@/lib/utils/url-utils';
import { noLiveWaitTimesReason } from '@/lib/utils/live-wait-times';
import {
  TOOL_DESCRIPTORS,
  toolDescriptor,
  type ToolDescriptor,
} from '@/lib/agents/tool-descriptors';
import { SITE_URL } from '@/i18n/config';
import type { SearchResultItem } from '@/lib/api/types';

/**
 * What the three tools in `tool-descriptors.ts` actually do.
 *
 * They read the public API — the one at api.park.fan that needs no key — through the same
 * functions the site's own pages use, so a tool can never be looking at data the page is not.
 * That matters most where the data lies: a park that publishes no wait times comes back from
 * the API looking exactly like a park shut for the night, and the only thing that tells them
 * apart is the curated `liveWaitTimes` flag, read here through `noLiveWaitTimesReason` like
 * everywhere else in the app.
 *
 * Read-only, all three. Nothing here writes, and nothing reaches anything under `/admin`: the
 * administrative API authenticates a person with a password and a TOTP code, and a tool server
 * is the last place that credential should be reachable from.
 *
 * Each tool returns plain JSON. The MCP route serializes it into a `text` content block (the
 * lowest common denominator every client understands) and hands the same object back as
 * `structuredContent` for the clients that read it.
 */

export type McpTool = ToolDescriptor & {
  execute: (input: Record<string, unknown>) => Promise<unknown>;
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

const EXECUTORS: Record<string, McpTool['execute']> = {
  async search_theme_parks(input) {
    const query = String(input.query ?? '').trim();
    if (query.length < 3) return { error: 'Query must be at least three characters.' };
    const locale = localeOf(input);
    const data = await search(query);
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

  async get_park_wait_times(input) {
    const query = String(input.park ?? '');
    const park = await resolvePark(query);
    if (!park) return { error: `No park on park.fan matches "${query}".` };

    const data = await getParkByGeoPathFresh(...park.segments);
    if (!data) return { error: `No live data for ${park.name}.` };

    // `effectiveStatus` is the API's own verdict and already accounts for a ride that is out of
    // season — the raw `status` does not, and an ice rink in August would otherwise come back as
    // one of the park's open rides.
    const rides = (data.attractions ?? []).map((attraction) => {
      const standby = attraction.queues?.find((queue) => queue.queueType === 'STANDBY');
      return {
        name: attraction.name,
        land: attraction.land,
        status: (attraction as { effectiveStatus?: string }).effectiveStatus ?? attraction.status,
        waitMinutes: standby && 'waitTime' in standby ? (standby.waitTime ?? null) : null,
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
      timezone: data.timezone,
      ...(noWaitTimes
        ? {
            waitTimesAvailable: false,
            note: NO_WAIT_TIMES_NOTE[noWaitTimes] ?? NO_WAIT_TIMES_NOTE.not_published,
          }
        : {
            crowdLevel: data.analytics?.statistics?.crowdLevel ?? data.currentLoad?.crowdLevel,
            averageWaitMinutes:
              data.analytics?.statistics?.avgWaitTime ?? data.currentLoad?.currentWaitTime,
            note: 'Wait times are what the park published, rounded to five minutes. A null wait is a ride with no published number, not a queue of zero.',
          }),
      ridesOpen: rides.filter((ride) => ride.status === 'OPERATING').length,
      ridesTotal: rides.length,
      // Longest queue first: the question behind this tool is almost always "what should I do
      // next", and the answer is at one end of that list or the other.
      rides: [...rides].sort((a, b) => (b.waitMinutes ?? -1) - (a.waitMinutes ?? -1)),
    };
  },

  async get_park_best_days(input) {
    const query = String(input.park ?? '');
    const park = await resolvePark(query);
    if (!park) return { error: `No park on park.fan matches "${query}".` };

    const days = Math.min(Math.max(Number(input.days) || 30, 1), 90);
    const snapshot = await getBestDaysSnapshotFresh(...park.segments);

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
      days: (snapshot.days ?? []).slice(0, days).map((day) => ({
        date: day.date,
        status: day.status,
        // `crowdLevel` is overridden with the live reading on today only; `predictedCrowdLevel`
        // is the forecast on every day including this one, which is what a date question wants.
        crowdLevel: day.predictedCrowdLevel ?? day.crowdLevel,
        isHoliday: day.isHoliday,
        isSchoolVacation: day.isSchoolVacation,
        isBridgeDay: day.isBridgeDay,
      })),
      note: 'A crowd level compares this park with itself, never one park with another. A closed day is a fact about the season, not a quiet day.',
    };
  },
};

export const MCP_TOOLS: McpTool[] = TOOL_DESCRIPTORS.map((descriptor) => ({
  ...toolDescriptor(descriptor.name),
  execute: EXECUTORS[descriptor.name],
}));
