import { SITE_URL } from '@/i18n/config';

/**
 * What park.fan's MCP server says about itself — the server card (SEP-1649) and the two
 * constants the endpoint itself answers `initialize` with.
 *
 * One module for both, because the card is a promise about the endpoint: a client reads the
 * card, connects to the transport URL in it and expects the name and version it was told. Two
 * files would drift the first time either changed.
 */

/** The MCP revision this server implements. */
export const MCP_PROTOCOL_VERSION = '2025-06-18';

export const MCP_SERVER_CARD_PATH = '/.well-known/mcp/server-card.json';
export const MCP_ENDPOINT_PATH = '/api/mcp';

/**
 * Versioned independently of the site: it describes the tool contract, so it moves when a tool's
 * name, arguments or output shape moves — not when a park page gets a new section.
 */
export const MCP_SERVER_INFO = {
  name: 'park.fan',
  title: 'park.fan theme park wait times',
  version: '1.0.0',
  websiteUrl: SITE_URL,
} as const;

export function mcpServerCard(toolNames: string[]) {
  return {
    serverInfo: MCP_SERVER_INFO,
    description:
      'Live wait times, ride status and crowd forecasts for around 200 theme parks and 7,000 attractions worldwide. Read-only and public: no API key, no account, no authentication.',
    protocolVersion: MCP_PROTOCOL_VERSION,
    // Streamable HTTP, POST only — this server sends nothing a client did not ask for, so it
    // opens no SSE stream (see app/api/mcp/route.ts).
    endpoint: `${SITE_URL}${MCP_ENDPOINT_PATH}`,
    transport: { type: 'streamable-http', url: `${SITE_URL}${MCP_ENDPOINT_PATH}` },
    capabilities: { tools: { listChanged: false } },
    tools: toolNames,
    // Said out loud because the alternative is a client guessing: there is no authorization
    // server, no token endpoint and nothing to register. See /auth.md.
    authentication: { type: 'none' },
    documentation: `${SITE_URL}/.well-known/agent-skills/park-fan-data/SKILL.md`,
  };
}
