import { SITE_URL } from '@/i18n/config';
import { AI_CATALOG_PATH } from '@/lib/agents/catalog';
import {
  CONTENT_SIGNAL,
  CONTENT_SIGNALS_PREAMBLE,
  CONTENT_SIGNAL_TRAINING_ONLY,
  ROBOTS_LICENSE_DIRECTIVE,
} from '@/lib/agents/licensing';

/**
 * robots.txt, written by hand because `MetadataRoute.Robots` cannot emit the `Content-Signal`
 * line (draft-romm-aipref-contentsignals) or the `Agentmap` directive.
 *
 * Search: yes. ai-input: yes, an assistant reading a page answers somebody asking about a park.
 * ai-train: no, the numbers are hours old by lunchtime and a model that memorised them would be
 * confidently wrong. The per-bot blocks repeat these answers in the form each operator reads.
 */
export const dynamic = 'force-static';

/** Never crawled, by anyone: the administrative UI and everything it talks to. */
const PRIVATE_PATHS = ['/admin', '/api/admin/'];

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
      block(['*'], [CONTENT_SIGNAL, ...CRAWLABLE_RULES]),
      block(ANSWER_CRAWLERS, [CONTENT_SIGNAL, ...CRAWLABLE_RULES]),
      block(TRAINING_CRAWLERS, [CONTENT_SIGNAL_TRAINING_ONLY, 'Disallow: /']),
      [
        `Sitemap: ${SITE_URL}/sitemap.xml`,
        `Sitemap: ${SITE_URL}/sitemap-attractions.xml`,
        `Sitemap: ${SITE_URL}/sitemap-calendar.xml`,
        `Sitemap: ${SITE_URL}/sitemap-news.xml`,
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
