/**
 * The three tools park.fan offers an agent, described once.
 *
 * They are served twice — over MCP at `/api/mcp` for a client with no browser, and through
 * `navigator.modelContext` for an agent looking at the page — and the two must not describe
 * themselves differently. So the descriptions and schemas live here, without an implementation
 * attached: `lib/agents/mcp-tools.ts` gives them one on the server, and the WebMCP component
 * registers these and calls that.
 *
 * Import-safe from a Client Component: pure data, no imports, no `server-only`.
 */

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
    description:
      'Find a theme park, ride, show or city on park.fan by name. Returns the page URL for each hit, plus the current wait time for rides that have one. Use this to turn a name into something the other tools can take.',
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
      'Current wait times for every ride in a theme park, with the park status and how busy it is right now. Takes a park name or slug.',
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
    description:
      'The crowd forecast for a park over the coming three months: one entry per day with the predicted crowd level, whether the park is open, and whether it is a holiday or school vacation. Use this to pick a date rather than to read a queue.',
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

export function toolDescriptor(name: string): ToolDescriptor {
  const descriptor = TOOL_DESCRIPTORS.find((candidate) => candidate.name === name);
  if (!descriptor) throw new Error(`No tool descriptor named ${name}`);
  return descriptor;
}
