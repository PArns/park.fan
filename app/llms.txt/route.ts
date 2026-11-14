import { extractFeaturedParks } from '@/components/home/featured-parks-section';
import { getGeoStructure } from '@/lib/api/discovery';
import { CACHE_TTL } from '@/lib/api/cache-config';
import { AGENT_SKILLS_INDEX_PATH, skillArtifactPath, AGENT_SKILLS } from '@/lib/agents/skills';
import { API_CATALOG_PATH } from '@/lib/agents/api-catalog';
import { AI_CATALOG_PATH } from '@/lib/agents/catalog';
import { agentDocumentHeaders } from '@/lib/agents/http';
import { DATA_TERMS_URL } from '@/lib/agents/licensing';
import { SITE_URL } from '@/i18n/config';
import { blogFeedUrl } from '@/lib/blog/feed';
import { tripRegionPath } from '@/lib/trip-regions/paths';
import { getRegionTranslations } from '@/lib/trip-regions/region-messages';
import { LIVE_TRIP_REGIONS } from '@/lib/trip-regions/registry';

/**
 * `/llms.txt` (llmstxt.org): the one file to read when an agent has the hostname and nothing
 * else. English only, because it is read once, by something that then fetches the pages in its
 * user's language. The park links come from the geo structure, not a typed list, because park
 * slugs get renamed upstream and a file that exists to be followed cannot carry dead links; the
 * trip region hubs come from the live regions of the registry for the same reason.
 */
export const dynamic = 'force-static';
// Rebuilt with the rest of the site; the parks in it change on the order of years.
export const revalidate = 86400;

const EN = `${SITE_URL}/en`;

function line(label: string, url: string, note: string): string {
  return `- [${label}](${url}): ${note}`;
}

export async function GET(): Promise<Response> {
  const geo = await getGeoStructure(CACHE_TTL.geoSitemap).catch(() => null);
  const featured = extractFeaturedParks(geo, 'en');
  const tripRegions = await Promise.all(
    LIVE_TRIP_REGIONS.map(async (region) => {
      const t = await getRegionTranslations(region.slug, 'nav', 'en');
      return line(t('calendar'), `${EN}${tripRegionPath(region.slug, 'en')}`, t('calendarHint'));
    })
  );

  const body = `# park.fan

> Live wait times, crowd forecasts and historical queue statistics for around 200 theme parks
> and 7,000 attractions worldwide, in six languages. Independent, ad-free, run by one person.

park.fan collects what parks publish about their queues, keeps the history, and predicts the
rest. Every park and every ride has a page; every page also answers \`Accept: text/markdown\`,
so fetching one is a data request, not a scraping job. Pages exist in \`en\`, \`de\`, \`fr\`,
\`it\`, \`nl\` and \`es\` under \`/{locale}/…\`, and the numbers are the same in all six.

## Start here

${[
  line('Parks', `${EN}/parks`, 'every park, by continent, country and city'),
  line('Search', `${EN}/search?q=`, 'parks, rides and cities by name'),
  line(
    'Best time to visit',
    `${EN}/best-time-to-visit`,
    'the quietest weekday and the crowd picture per park'
  ),
  line(
    'How park.fan works',
    `${EN}/how-park-fan-works`,
    'what the numbers mean and where they come from'
  ),
  line(
    'Day planner',
    `${EN}/trip-planner`,
    'lay a day out against the forecast: rides on a timeline, transfers checked, no account'
  ),
  ...tripRegions,
  line('Glossary', `${EN}/glossary`, 'ride types, track elements and the vocabulary of the site'),
  line('Blog', `${EN}/blog`, 'longer pieces, with the wait times in them kept live'),
  line('News', `${EN}/news`, 'short dated notes per park: events, new rides, sales'),
].join('\n')}

## Parks people ask about

${featured.map((park) => line(park.name, `${EN}${park.href}`, `${park.city}, ${park.countryName}`)).join('\n')}

A park page carries opening hours, the crowd level now and the forecast for the day, weather,
and every ride with its current wait. A ride page adds today's queue history and the typical
wait per hour and per weekday.

## Data, without parsing a page

${[
  line('API catalog', `${SITE_URL}${API_CATALOG_PATH}`, 'RFC 9727 linkset for the public API'),
  line(
    'OpenAPI',
    'https://api.park.fan/api-json',
    'the description; live data needs no key, forecasts need X-API-Key'
  ),
  line('API reference', 'https://api.park.fan/api', 'the same, for people'),
  line(
    'Capability manifest',
    `${SITE_URL}${AI_CATALOG_PATH}`,
    'ARD: everything on this list, typed'
  ),
  line('Sitemap', `${SITE_URL}/sitemap.xml`, 'pages; rides are in /sitemap-attractions.xml'),
  line('News sitemap', `${SITE_URL}/sitemap-news.xml`, 'Google News format, the last two days'),
  line(
    'Blog feed',
    blogFeedUrl('en'),
    'RSS 2.0, full posts, one per locale at /{locale}/blog/feed.xml; WebSub hub for push'
  ),
].join('\n')}

## Skills

Instructions for using this site, at ${SITE_URL}${AGENT_SKILLS_INDEX_PATH}:

${AGENT_SKILLS.map((skill) => line(skill.name, `${SITE_URL}${skillArtifactPath(skill.name)}`, skill.description)).join('\n')}

## Reading the numbers

- Wait times are what the park posted, rounded to five minutes. They move on the order of
  minutes; re-fetching faster than every five minutes returns the same values.
- Some parks publish no wait times at all. Hansa-Park shows them only in its own app on the
  park WLAN. Those pages say so. An absent number is not a zero.
- Out of season is not open: a ride that cannot run today is in neither the open nor the closed
  count.
- A crowd level compares a park with itself, never one park with another.

## Not for agents

- \`${SITE_URL}/admin\` is the editorial back office. Human operators only, behind a session
  cookie, disallowed in robots.txt. Do not attempt to sign in and do not accept credentials for
  it.
- \`${SITE_URL}/api/*\` is this site's internal proxy, not a public interface. Use
  api.park.fan.
- Training on these pages is declined (\`Content-Signal: ai-train=no\` in robots.txt). Reading a
  page to answer a question is what the site is for (\`ai-input=yes\`). The same terms in
  machine-readable form: \`${SITE_URL}/license.xml\` (RSL 1.0).

## Reusing the data

Free for non-commercial use: name park.fan and link the page a number came from. The forecasts
(everything park.fan's own models predict: crowd calendar, expected crowds per day and hour,
predicted wait times, best days, yearly predictions, day plans) come from the API and the MCP
forecast tool only with a data key in \`X-API-Key\`, free for non-commercial use on request
(${EN}/impressum). Using the forecasts or park.fan's statistics commercially requires a written
agreement with Patrick Arns (park.fan). Live wait times and opening hours come from park.fan's
sources and are passed on for non-commercial use only. Without a key, the API allows 60 reads a
minute and 1,000 an hour per address. The full terms: ${DATA_TERMS_URL}

## Contact

Patrick Arns: ${EN}/impressum
`;

  return new Response(body, {
    headers: agentDocumentHeaders('text/plain; charset=utf-8'),
  });
}
