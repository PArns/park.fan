/**
 * The three tools park.fan offers an agent, described once because they are served twice: over
 * MCP at `/api/mcp` and through `navigator.modelContext` on the page. `lib/agents/mcp-tools.ts`
 * implements them. Pure data, so a Client Component can import it.
 */
import { DEVELOPER_PORTAL_URL } from '@/lib/developers/paths';

export type ToolDescriptor = {
  name: string;
  title: string;
  description: string;
  inputSchema: { type: 'object'; properties: Record<string, unknown>; required?: string[] };
  annotations: { readOnlyHint: true; openWorldHint: true };
};

const LOCALE_PROPERTY = {
  type: 'string',
  enum: ['en', 'de', 'fr', 'it', 'nl', 'es'],
  description: 'Language for the returned page URLs. The data is the same in all six.',
};

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const;

export const TOOL_DESCRIPTORS: ToolDescriptor[] = [
  {
    name: 'search_theme_parks',
    title: 'Search parks, rides and cities',
    description: `Find a theme park, ride, show or city on park.fan by name. Returns the page URL for each hit, plus the current wait time for rides that have one. Needs a park.fan data API key with the parks.directory permission in the X-API-Key header; request one at ${DEVELOPER_PORTAL_URL}.`,
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Name to look for, at least three characters.' },
        locale: LOCALE_PROPERTY,
      },
      required: ['query'],
    },
    annotations: READ_ONLY,
  },
  {
    name: 'get_park_wait_times',
    title: 'Live wait times for a park',
    description:
      'Current wait times for every ride in a theme park, with the park status. Takes a park name or slug and needs no key. With a park.fan data API key in the X-API-Key header it reads the park with that key and adds what the key’s permissions open: each ride’s land (rides.details), how busy the park is right now (stats.live) and, for a ride in planned maintenance, the dates running today (maintenance) or the next ones (nextMaintenance, parks.seasons).',
    inputSchema: {
      type: 'object',
      properties: {
        park: { type: 'string', description: 'Park name or slug, e.g. "Europa-Park".' },
        locale: LOCALE_PROPERTY,
      },
      required: ['park'],
    },
    annotations: READ_ONLY,
  },
  {
    name: 'get_park_best_days',
    title: 'Crowd forecast per day',
    description: `The crowd forecast for a park over the coming three months: one entry per day with the predicted crowd level, whether the park is open, whether it is a holiday or school vacation, which rides planned maintenance shuts that day, and which of the park's seasons and events (Halloween, Christmas, a winter season …) run that day. Use this to pick a date rather than to read a queue. Needs a park.fan data API key with the forecasts.crowd permission in the X-API-Key header; request one at ${DEVELOPER_PORTAL_URL}.`,
    inputSchema: {
      type: 'object',
      properties: {
        park: { type: 'string', description: 'Park name or slug.' },
        days: {
          type: 'integer',
          minimum: 1,
          maximum: 90,
          description: 'How many days from today to return. Default 30, at most 90.',
        },
        locale: LOCALE_PROPERTY,
      },
      required: ['park'],
    },
    annotations: READ_ONLY,
  },
];

/**
 * Returns the agent tool descriptor with the given name from `TOOL_DESCRIPTORS`, and throws when
 * there is none.
 */
export function toolDescriptor(name: string): ToolDescriptor {
  const descriptor = TOOL_DESCRIPTORS.find((candidate) => candidate.name === name);
  if (!descriptor) throw new Error(`No tool descriptor named ${name}`);
  return descriptor;
}

/**
 * The tools that read more than the live wait times. Like the API's routes beyond the wait times
 * they need a data key, unless the call comes from a park.fan page (`lib/agents/forecast-access.ts`).
 */
export const KEYED_TOOL_NAMES: readonly string[] = ['search_theme_parks', 'get_park_best_days'];
