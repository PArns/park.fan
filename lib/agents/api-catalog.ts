/**
 * What park.fan tells machines about its API: the catalog document served at
 * /.well-known/api-catalog (RFC 9727) and the `Link` header the homepage answers with
 * (RFC 8288, RFC 9727 §3).
 *
 * Both are built from `PARK_FAN_API` below because they make the same claim twice, and a
 * `Link` header is invisible — nothing renders it, no page breaks when it rots — so a URL
 * corrected in the document and forgotten in the header would keep pointing agents at a 404
 * with a green build.
 *
 * Keep this file import-free: next.config.ts reads `HOMEPAGE_LINK_HEADER` from here and is
 * loaded outside the app's module graph, so an `@/…` alias in here would break the config.
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
 * Titles stay ASCII. They are copied into the `Link` header, and Node rejects a header value
 * with a character outside Latin-1 — an em dash in one of these threw ERR_INVALID_CHAR and
 * turned the homepage into a 500, not into a page missing a header.
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
 * One entry, because there is one API. `anchor` is the API itself (every endpoint lives under
 * /v1; the origin root serves the README as HTML), and the three relations come from RFC 8631:
 * `service-desc` is for machines, `service-doc` for people, `status` for whatever is checking
 * whether it is up.
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
 * The homepage's `Link` header. `api-catalog` is the one that matters — it is the relation
 * RFC 9727 defines and the reason the header exists at all; the OpenAPI and docs links save an
 * agent the second round trip through the catalog for the only API in it.
 *
 * Comma-separated in a single header: RFC 8288 §3 allows either, and one header is what
 * next.config's `headers()` can express (repeating a key there overwrites rather than appends).
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
