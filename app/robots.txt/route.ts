import { SITE_URL } from '@/i18n/config';
import { AI_CATALOG_PATH } from '@/lib/agents/catalog';
import {
  CONTENT_SIGNAL,
  CONTENT_SIGNALS_PREAMBLE,
  CONTENT_SIGNAL_TRAINING_ONLY,
  ROBOTS_LICENSE_DIRECTIVE,
} from '@/lib/agents/licensing';

/**
 * robots.txt, written by hand rather than through `MetadataRoute.Robots`.
 *
 * Next's robots generator emits `User-agent`, `Allow`, `Disallow`, `Sitemap` and nothing else,
 * and two of the three things this file now has to say are not in that set: the
 * `Content-Signal` line (contentsignals.org, draft-romm-aipref-contentsignals) and the
 * `Agentmap` directive that points at the capability manifest. A route handler is the whole
 * format, so the file can carry them without a second file contradicting the first.
 *
 * The policy has three tiers and they are not the same question:
 *
 *   search      — may a crawler put park.fan in a result list? Yes, that is the point.
 *   ai-input    — may an assistant read a page to answer someone asking about a park?
 *                 Yes. A wait time is worth knowing at the moment somebody asks, and an
 *                 assistant that can read the page is a visitor who does not have to.
 *   ai-train    — may the pages become weights? No. The numbers on this site are hours old
 *                 by lunchtime; a model that memorised them would be wrong and confident,
 *                 and the site gets nothing back.
 *
 * The per-bot blocks below are the same three answers again, expressed the way each operator
 * reads them: crawlers that exist to collect a training corpus are disallowed, crawlers that
 * fetch a page because a person is waiting for an answer are allowed. Blocking the second
 * group would contradict every other machine-readable file this repo serves.
 */
export const dynamic = 'force-static';

/** Never crawled, by anyone: the administrative UI and everything it talks to. */
const PRIVATE_PATHS = ['/admin', '/api/admin/', '/dev'];

/**
 * Crawlers whose stated purpose is collecting text to train on. `Content-Signal: ai-train=no`
 * says this once for everyone; these blocks say it again in the form each operator documents,
 * because a bot that reads only its own `User-agent` block never sees the wildcard one.
 */
const TRAINING_CRAWLERS = [
  'GPTBot',
  'ClaudeBot',
  'anthropic-ai',
  'Claude-Web',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'Bytespider',
  'meta-externalagent',
  'Omgilibot',
];

/**
 * Crawlers that fetch a page on behalf of somebody who asked a question — search indexes for
 * assistants, and the user-triggered fetchers. They get what a search engine gets.
 */
const ANSWER_CRAWLERS = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'Amazonbot',
  'Applebot',
  'DuckAssistBot',
];

function block(userAgents: string[], lines: string[]): string {
  return [...userAgents.map((agent) => `User-agent: ${agent}`), ...lines].join('\n');
}

/**
 * `/api/og/` serves the Open Graph images every page's metadata points at, so it stays
 * crawlable — longest match wins over the `/api/` rule. `/_next/` is deliberately not
 * disallowed: Google renders pages in a headless browser and needs the JS, CSS and optimized
 * images.
 */
const CRAWLABLE_RULES = [
  'Allow: /',
  'Allow: /api/og/',
  'Disallow: /api/',
  ...PRIVATE_PATHS.map((path) => `Disallow: ${path}`),
];

export function GET(): Response {
  const body =
    [
      // The policy the signals below belong to, ahead of the first directive that uses one.
      CONTENT_SIGNALS_PREAMBLE,
      // One line, read by any crawler that has no block of its own.
      block(['*'], [CONTENT_SIGNAL, ...CRAWLABLE_RULES]),
      block(ANSWER_CRAWLERS, [CONTENT_SIGNAL, ...CRAWLABLE_RULES]),
      block(TRAINING_CRAWLERS, [CONTENT_SIGNAL_TRAINING_ONLY, 'Disallow: /']),
      [
        `Sitemap: ${SITE_URL}/sitemap.xml`,
        `Sitemap: ${SITE_URL}/sitemap-attractions.xml`,
        `Sitemap: ${SITE_URL}/sitemap-calendar.xml`,
        // The same permissions as the Content-Signal above, in the form licensing tooling
        // reads (RSL 1.0 §4.4).
        ROBOTS_LICENSE_DIRECTIVE,
        // Where an agent finds what park.fan can do for it, rather than which pages exist
        // (ARD §6.1). The manifest lists the API catalog, the skills and the data endpoints.
        `Agentmap: ${SITE_URL}${AI_CATALOG_PATH}`,
      ].join('\n'),
    ].join('\n\n') + '\n';

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
