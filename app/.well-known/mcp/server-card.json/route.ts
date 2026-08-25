import { MCP_TOOLS } from '@/lib/agents/mcp-tools';
import { mcpServerCard } from '@/lib/agents/mcp-server-card';
import { agentDocumentHeaders } from '@/lib/agents/http';

/**
 * The MCP server card (SEP-1649) — how an agent finds the endpoint without being handed its URL.
 *
 * The tool names come from the server's own tool list rather than a copy: the card is the first
 * thing a client reads and the tool list is the second, and a card naming a tool that is not
 * there is worse than a card naming none.
 */
export const dynamic = 'force-static';

export function GET(): Response {
  return new Response(
    `${JSON.stringify(mcpServerCard(MCP_TOOLS.map((tool) => tool.name)), null, 2)}\n`,
    { headers: agentDocumentHeaders('application/json; charset=utf-8') }
  );
}
