'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { TOOL_DESCRIPTORS } from '@/lib/agents/tool-descriptors';

/**
 * WebMCP: what park.fan can do, offered to an agent that is looking at the page rather than
 * crawling the site.
 *
 * The rest of this repo's machine-readable surface (llms.txt, the skills, the API catalog)
 * tells an agent where to go and leaves it to fetch things itself. This is the other half: an
 * assistant sitting in the browser gets to ask *this tab*.
 *
 * The three data tools are the MCP server's, not copies of it — they register the shared
 * descriptors and execute by calling `/api/mcp`, so a browser-side agent and a desktop client
 * get the same answer from the same code. That is not politeness: the rules those answers
 * depend on (a park that publishes no wait times looks identical to a park shut for the night;
 * a ride out of season is not one of today's rides) live on the server with the data, and a
 * second implementation in the browser would be a second place for them to go wrong.
 *
 * The fourth tool is the one that only exists here, because it is the one thing a tab can do
 * that a server cannot: move. It refuses `/admin` — the back office is fenced off in robots.txt,
 * in an `X-Robots-Tag` and in the layout's metadata, and this is the only one of those fences an
 * agent could otherwise walk through.
 *
 * Costs nothing where the API does not exist: the effect returns immediately on a browser
 * without `navigator.modelContext`, which today is nearly all of them.
 */

/** The slice of the not-yet-shipped API this uses, so it compiles without a global type. */
type ModelContextTool = {
  name: string;
  title?: string;
  description: string;
  inputSchema: object;
  annotations?: { readOnlyHint?: boolean };
  execute: (input: Record<string, unknown>) => Promise<unknown>;
};
type ModelContextCapableNavigator = Navigator & {
  modelContext?: {
    registerTool: (tool: ModelContextTool, options?: { signal?: AbortSignal }) => Promise<void>;
  };
};

/** One JSON-RPC call against our own MCP endpoint. */
async function callMcpTool(
  name: string,
  args: Record<string, unknown>,
  signal: AbortSignal
): Promise<unknown> {
  const response = await fetch('/api/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name, arguments: args },
    }),
    signal,
  });
  if (!response.ok) return { error: `park.fan could not answer (${response.status}).` };
  const body = await response.json();
  if (body.error) return { error: body.error.message };
  // `structuredContent` is the same object the text block holds; an agent that got here through
  // the browser has no reason to parse the string version.
  return body.result?.structuredContent ?? body.result;
}

export function WebMcpTools({ locale }: { locale: string }) {
  const router = useRouter();

  useEffect(() => {
    const modelContext = (navigator as ModelContextCapableNavigator).modelContext;
    if (!modelContext) return;

    const controller = new AbortController();
    const { signal } = controller;

    const tools: ModelContextTool[] = [
      ...TOOL_DESCRIPTORS.map((descriptor) => ({
        ...descriptor,
        execute: (input: Record<string, unknown>) =>
          // The page knows which language the reader is in; the tool schema still allows an
          // override, so an explicit `locale` wins.
          callMcpTool(descriptor.name, { locale, ...input }, signal),
      })),
      {
        name: 'open_park_fan_page',
        title: 'Open a park.fan page in this tab',
        description:
          'Navigate this tab to a park.fan page — a park, a ride, the best-time-to-visit comparison or a glossary term. Use a url returned by the other tools.',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'A park.fan URL, or a path beginning with /.' },
          },
          required: ['url'],
        },
        async execute({ url }) {
          let path: string;
          try {
            const target = new URL(String(url ?? ''), window.location.origin);
            if (target.origin !== window.location.origin) {
              return { error: 'This tool only opens pages on park.fan.' };
            }
            path = `${target.pathname}${target.search}`;
          } catch {
            return { error: 'Not a URL.' };
          }
          // The back office is not a destination an agent gets to pick.
          if (/^\/(admin|dev)(\/|$)/.test(path)) {
            return { error: 'The park.fan admin area is for human operators only.' };
          }
          // The router is locale-aware, so a locale prefix in the path would be doubled.
          const withoutLocale = path.replace(/^\/(en|de|fr|it|nl|es)(?=\/|$)/, '') || '/';
          router.push(withoutLocale as '/parks/europe');
          return { navigatedTo: new URL(path, window.location.origin).toString() };
        },
      },
    ];

    for (const tool of tools) {
      // Registration is per tool and resolves asynchronously; a browser shipping a partial
      // implementation should cost a rejected promise, not an uncaught error on every page.
      void modelContext.registerTool(tool, { signal }).catch(() => {});
    }

    return () => controller.abort();
  }, [locale, router]);

  return null;
}
