import { NextResponse } from 'next/server';
import { MCP_TOOLS } from '@/lib/agents/mcp-tools';
import { MCP_PROTOCOL_VERSION, MCP_SERVER_INFO } from '@/lib/agents/mcp-server-card';

/**
 * park.fan's MCP server: Streamable HTTP, stateless, read-only. Written out rather than taken from
 * the SDK, whose session store and SSE transport it does not need, so a cold start stays fast.
 * Stateless means no session id, so `initialize` returns capabilities only (within spec). GET is
 * 405 because it would open a server-to-client stream this server never writes to. The tools are
 * public and take no credential (`lib/agents/mcp-tools.ts`).
 */

// Live wait times: never cached, never prerendered.
export const dynamic = 'force-dynamic';

type JsonRpcId = string | number | null;
type JsonRpcRequest = { jsonrpc: '2.0'; id?: JsonRpcId; method: string; params?: unknown };

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, MCP-Protocol-Version, Accept',
  'Access-Control-Max-Age': '86400',
};

function result(id: JsonRpcId, value: unknown) {
  return NextResponse.json({ jsonrpc: '2.0', id, result: value }, { headers: CORS_HEADERS });
}

function failure(id: JsonRpcId, code: number, message: string, status = 200) {
  return NextResponse.json(
    { jsonrpc: '2.0', id, error: { code, message } },
    { status, headers: CORS_HEADERS }
  );
}

async function handle(request: JsonRpcRequest): Promise<NextResponse | null> {
  const id = request.id ?? null;

  switch (request.method) {
    case 'initialize':
      return result(id, {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: MCP_SERVER_INFO,
        instructions:
          'Wait times, crowd forecasts and ride status for around 200 theme parks. Resolve a name with search_theme_parks first; it returns the slugs and page URLs the other tools take.',
      });

    case 'ping':
      return result(id, {});

    case 'tools/list':
      return result(id, {
        tools: MCP_TOOLS.map(({ name, title, description, inputSchema, annotations }) => ({
          name,
          title,
          description,
          inputSchema,
          annotations,
        })),
      });

    case 'tools/call': {
      const params = (request.params ?? {}) as { name?: string; arguments?: unknown };
      const tool = MCP_TOOLS.find((candidate) => candidate.name === params.name);
      if (!tool) return failure(id, -32602, `Unknown tool: ${params.name}`);

      try {
        const output = await tool.execute((params.arguments ?? {}) as Record<string, unknown>);
        return result(id, {
          // Both shapes on purpose: `content` is what every client can read, `structuredContent`
          // is the same object for the ones that would otherwise re-parse the text block.
          content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        });
      } catch (error) {
        // A tool error is reported inside the result, not as a JSON-RPC error: the protocol
        // reserves those for the call itself failing, and the model is meant to see this one.
        console.error(`[MCP] ${tool.name} failed:`, error);
        return result(id, {
          content: [
            {
              type: 'text',
              text: `${tool.name} could not answer: ${error instanceof Error ? error.message : 'upstream error'}`,
            },
          ],
          isError: true,
        });
      }
    }

    default:
      // A notification (no id) needs no answer at all — `notifications/initialized` is the one
      // every client sends, and replying to it with an error is how a session starts badly.
      if (request.id === undefined) return null;
      return failure(id, -32601, `Method not found: ${request.method}`);
  }
}

export async function POST(request: Request): Promise<NextResponse | Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return failure(null, -32700, 'Parse error', 400);
  }

  // A batch is a JSON array. Notifications in it produce no entry, and a batch of nothing but
  // notifications gets 202 with no body, exactly like a single one.
  if (Array.isArray(body)) {
    const responses = await Promise.all(body.map((entry) => handle(entry as JsonRpcRequest)));
    const answered = await Promise.all(
      responses
        .filter((response): response is NextResponse => response !== null)
        .map((r) => r.json())
    );
    if (answered.length === 0) return new Response(null, { status: 202, headers: CORS_HEADERS });
    return NextResponse.json(answered, { headers: CORS_HEADERS });
  }

  const response = await handle(body as JsonRpcRequest);
  return response ?? new Response(null, { status: 202, headers: CORS_HEADERS });
}

export function GET(): Response {
  return new Response('This MCP endpoint speaks POST only; it opens no server-sent stream.', {
    status: 405,
    headers: { ...CORS_HEADERS, Allow: 'POST, OPTIONS' },
  });
}

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
