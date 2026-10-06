/**
 * What park.fan tells machines about its API: the catalog document served at
 * /.well-known/api-catalog (RFC 9727) and the `Link` header the homepage answers with
 * (RFC 8288, RFC 9727 §3). Both are built from `PARK_FAN_API`, because a `Link` header rots
 * unseen and a URL fixed in only one of them would point agents at a 404.
 *
 * Keep this file import-free: next.config.ts reads `HOMEPAGE_LINK_HEADER` from here and is
 * loaded outside the app's module graph.
 */

/** Where the catalog lives. Fixed by RFC 9727 §2 — agents try this path, not a link. */
export const API_CATALOG_PATH = '/.well-known/api-catalog';

/**
 * RFC 9727 §4.2: the Linkset media type, plus the profile parameter that says the linkset is
 * an API catalog rather than any other set of links. Only a SHOULD, but it is what tells a
 * client that stumbled on the document what it is holding.
 */
export const API_CATALOG_CONTENT_TYPE =
  'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"';

/**
 * The public API, named as a literal rather than read from `NEXT_PUBLIC_API_URL`: the catalog
 * describes what park.fan publishes, so a preview deployment should hand out the same document
 * production does — not advertise whichever backend that build happens to talk to.
 */
const API_ORIGIN = 'https://api.park.fan';

/**
 * Titles stay ASCII: they are copied into the `Link` header, and Node throws ERR_INVALID_CHAR,
 * a 500 on the homepage, for a header character outside Latin-1.
 */
type CatalogLink = { href: string; type: string; title: string };

/** One API, described by the RFC 8631 relations RFC 9727 §4 builds a catalog out of. */
type CatalogEntry = {
  anchor: string;
  'service-desc': CatalogLink[];
  'service-doc': CatalogLink[];
  status: CatalogLink[];
};

/**
 * One entry, because there is one API. `anchor` is /v1, where every endpoint lives (the origin
 * root serves the README as HTML).
 */
const PARK_FAN_API: CatalogEntry = {
  anchor: `${API_ORIGIN}/v1`,
  'service-desc': [
    {
      href: `${API_ORIGIN}/api-json`,
      type: 'application/json',
      title: 'OpenAPI description of the park.fan API',
    },
  ],
  'service-doc': [
    { href: `${API_ORIGIN}/api`, type: 'text/html', title: 'park.fan API reference' },
  ],
  status: [
    { href: `${API_ORIGIN}/v1/health`, type: 'application/json', title: 'park.fan API health' },
  ],
};

/** The catalog document itself — RFC 9264 Linkset, serialized as-is by the route handler. */
export const apiCatalog = { linkset: [PARK_FAN_API] };

function linkHeaderValue(uri: string, rel: string, type: string, title?: string): string {
  const params = [`rel="${rel}"`, `type="${type}"`];
  if (title) params.push(`title="${title}"`);
  return `<${uri}>; ${params.join('; ')}`;
}

/**
 * The homepage's `Link` header: the `api-catalog` relation, plus the OpenAPI and docs links that
 * save an agent a round trip. One comma-separated header, because repeating a key in
 * next.config's `headers()` overwrites it.
 */
export const HOMEPAGE_LINK_HEADER = [
  linkHeaderValue(API_CATALOG_PATH, 'api-catalog', 'application/linkset+json'),
  ...(['service-desc', 'service-doc'] as const).flatMap((rel) =>
    PARK_FAN_API[rel].map((link) => linkHeaderValue(link.href, rel, link.type, link.title))
  ),
].join(', ');

/**
 * What the catalog document itself answers with. RFC 9727 §2 requires a HEAD request to
 * /.well-known/api-catalog to come back carrying the `api-catalog` relation, which means the
 * document has to link to itself.
 */
export const API_CATALOG_LINK_HEADER = linkHeaderValue(
  API_CATALOG_PATH,
  'api-catalog',
  'application/linkset+json'
);
