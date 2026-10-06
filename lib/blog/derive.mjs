/**
 * Everything derived from a post's markdown body, in plain JS so the build-time manifest
 * generator and `lib/blog/park-resolver.ts` share one implementation: a second copy of these
 * regexes would drift the moment the `ref:` syntax grows an option.
 */

/**
 * Reading time in minutes, or the frontmatter override when it is set.
 *
 * @param {string} body
 * @param {number} [override]
 * @returns {number}
 */
export function calcReadingTimeMinutes(body, override) {
  if (typeof override === 'number' && override > 0) return Math.round(override);
  // Strip image and link syntax for a slightly more accurate word count.
  const text = body.replace(/!\[[^\]]*]\([^)]*\)/g, '').replace(/\[[^\]]*]\([^)]*\)/g, '$1');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

/**
 * Normalises a `ref:` value into `{ kind, key }`, from the short form (`slug`,
 * `parkSlug/rideSlug`) or the full path the editor writes (`/parks/<continent>/<country>/<city>/
 * <parkSlug>[/<rideSlug>]`). The full form also returns `geoPath`, for the few park slugs shared
 * by two parks (`disneyland-park` in Paris and Anaheim).
 *
 * @param {string} value
 * @returns {{ kind: 'park' | 'ride'; key: string; geoPath?: string }}
 */
export function parseRefKey(value) {
  if (value.startsWith('/parks/')) {
    const parts = value.slice('/parks/'.length).split('/').filter(Boolean);
    // [continent, country, city, parkSlug, rideSlug?]
    const geoPath = parts.length >= 4 ? parts.slice(0, 3).join('/') : undefined;
    if (parts.length === 4) return { kind: 'park', key: parts[3], geoPath };
    if (parts.length >= 5) return { kind: 'ride', key: `${parts[3]}/${parts[4]}`, geoPath };
  }
  return { kind: value.includes('/') ? 'ride' : 'park', key: value };
}

/**
 * Find every park/attraction reference in a markdown body — both inline link
 * references `[label](park:slug)` / `[label](attraction:parkSlug/slug)` and
 * embedded widget fences such as
 *
 *   ```park-widget slug=disney-magic-kingdom
 *   ```
 *   ```attraction-widget parkSlug=europa-park slug=voltron-nevera
 *   ```
 *
 * The link slug part stops at `?` so authors can pass options. Used at render
 * time to resolve a post's references in one batch, and at build time to index
 * the reverse direction (which park pages link back to this post).
 *
 * @param {string} markdown
 * @returns {{
 *   parkSlugs: Set<string>;
 *   attractions: Set<string>;
 *   parkGeoPaths: Map<string, string>;
 *   attractionGeoPaths: Map<string, string>;
 * }}
 */
export function extractInlineRefs(markdown) {
  /** @type {Set<string>} */
  const parks = new Set();
  /** @type {Set<string>} */
  const attractions = new Set();
  /** Bare park slug → `continent/country/city` geoPath, when a ref carried one. @type {Map<string, string>} */
  const parkGeoPaths = new Map();
  /** Bare `parkSlug/rideSlug` → geoPath, when a ref carried one. @type {Map<string, string>} */
  const attractionGeoPaths = new Map();

  // 1. Inline link references — [label](park:slug) / [label](attraction:p/s)
  //    plus the unified [label](ref:slug) / [label](ref:p/s) form.
  const linkRe = /\[[^\]]+]\(((?:park|attraction|ref):[^)\s]+)\)/g;
  /** @type {RegExpExecArray | null} */
  let match;
  while ((match = linkRe.exec(markdown)) !== null) {
    const href = match[1];
    const value = href.includes('?') ? href.slice(0, href.indexOf('?')) : href;
    if (value.startsWith('park:')) parks.add(value.slice('park:'.length));
    else if (value.startsWith('attraction:')) {
      attractions.add(value.slice('attraction:'.length));
    } else if (value.startsWith('ref:')) {
      const { kind, key, geoPath } = parseRefKey(value.slice('ref:'.length));
      if (kind === 'ride') {
        attractions.add(key);
        const parkSlug = key.split('/')[0];
        parks.add(parkSlug);
        if (geoPath) {
          attractionGeoPaths.set(key, geoPath);
          if (!parkGeoPaths.has(parkSlug)) parkGeoPaths.set(parkSlug, geoPath);
        }
      } else {
        parks.add(key);
        if (geoPath) parkGeoPaths.set(key, geoPath);
      }
    }
  }

  // 2. Widget fences — ```park-widget … ``` / ```attraction-widget … ```
  const widgetRe = /^```([a-z]+-widget)(?:[ \t]+([^\n`]+))?\n([\s\S]*?)\n?```$/gm;
  while ((match = widgetRe.exec(markdown)) !== null) {
    const name = match[1];
    const attrSource = `${match[2] ?? ''}\n${match[3] ?? ''}`;
    const slug = extractAttr(attrSource, 'slug');
    const parkAttr = extractAttr(attrSource, 'parkSlug') ?? extractAttr(attrSource, 'park');
    // A fence may name its park by full path, like a `ref:` link, for the one slug that means two
    // parks; normalised here, or the backlink index records the path as a slug. First geoPath
    // wins, as in the ride branch above, so a later reference cannot move it to the wrong park.
    if ((name === 'park-widget' || name === 'map-widget') && slug) {
      const ref = parseRefKey(slug);
      if (ref.kind === 'park') {
        parks.add(ref.key);
        if (ref.geoPath && !parkGeoPaths.has(ref.key)) parkGeoPaths.set(ref.key, ref.geoPath);
      }
    } else if (name === 'attraction-widget' && slug && parkAttr) {
      const ref = parseRefKey(parkAttr);
      // `parkSlug=` naming a ride path is a typo, not a reference: indexing it would put
      // `disneyland-park/phantom-manor/phantom-manor` into the backlink index.
      if (ref.kind === 'park') {
        const rideRef = `${ref.key}/${slug}`;
        parks.add(ref.key);
        attractions.add(rideRef);
        if (ref.geoPath) {
          if (!parkGeoPaths.has(ref.key)) parkGeoPaths.set(ref.key, ref.geoPath);
          if (!attractionGeoPaths.has(rideRef)) attractionGeoPaths.set(rideRef, ref.geoPath);
        }
      }
    }
  }

  return { parkSlugs: parks, attractions, parkGeoPaths, attractionGeoPaths };
}

/**
 * @param {string} source
 * @param {string} key
 * @returns {string | undefined}
 */
function extractAttr(source, key) {
  // Accepts `key=value`, `key="value"`, `key: value` formats.
  const re = new RegExp(`\\b${key}\\s*[:=]\\s*(?:"([^"]*)"|'([^']*)'|([^\\s]+))`, 'i');
  const m = source.match(re);
  if (!m) return undefined;
  return m[1] ?? m[2] ?? m[3];
}

/**
 * The parks one post's body points at, deduplicated and flattened for the
 * manifest: `{ slug, geo?, viaRide? }`. A ride reference counts for its parent
 * park (`viaRide`), which the park page uses as a small relevance signal.
 *
 * @param {string} markdown
 * @returns {Array<{ slug: string; geo?: string[]; viaRide?: true }>}
 */
export function extractParkRefs(markdown) {
  const { parkSlugs, attractions, parkGeoPaths, attractionGeoPaths } = extractInlineRefs(markdown);
  /** @type {Map<string, { slug: string; geo?: string[]; viaRide?: true }>} */
  const out = new Map();

  /**
   * @param {string} slug
   * @param {string | undefined} geoPath
   * @param {boolean} viaRide
   */
  const add = (slug, geoPath, viaRide) => {
    if (!slug) return;
    const entry = out.get(slug) ?? { slug };
    if (viaRide) entry.viaRide = true;
    if (geoPath) {
      entry.geo = entry.geo ?? [];
      if (!entry.geo.includes(geoPath)) entry.geo.push(geoPath);
    }
    out.set(slug, entry);
  };

  for (const slug of parkSlugs) add(slug, parkGeoPaths.get(slug), false);
  for (const ref of attractions) add(ref.split('/')[0], attractionGeoPaths.get(ref), true);

  return [...out.values()];
}

/**
 * The rides one post's body points at, as `{ slug: 'parkSlug/rideSlug', geo? }`.
 * Same shape as {@link extractParkRefs} so both sides of the catalog backlink
 * index read alike.
 *
 * @param {string} markdown
 * @returns {Array<{ slug: string; geo?: string[] }>}
 */
export function extractRideRefs(markdown) {
  const { attractions, attractionGeoPaths } = extractInlineRefs(markdown);
  /** @type {Map<string, { slug: string; geo?: string[] }>} */
  const out = new Map();

  for (const ref of attractions) {
    const [parkSlug, rideSlug] = ref.split('/');
    if (!parkSlug || !rideSlug) continue;
    const entry = out.get(ref) ?? { slug: ref };
    const geoPath = attractionGeoPaths.get(ref);
    if (geoPath) {
      entry.geo = entry.geo ?? [];
      if (!entry.geo.includes(geoPath)) entry.geo.push(geoPath);
    }
    out.set(ref, entry);
  }

  return [...out.values()];
}

/**
 * The glossary terms one post's body points at, in first-appearance order. Only `glossary-widget`
 * fences count: `GlossaryInject` highlights everyday terms in nearly every post, a reading aid
 * rather than a claim that the post is about the term. The fence's `slug=` is a term id, so one
 * post's refs answer for all six locales.
 *
 * @param {string} markdown
 * @returns {string[]}
 */
export function extractGlossaryRefs(markdown) {
  /** @type {Set<string>} */
  const terms = new Set();
  const widgetRe = /^```([a-z]+-widget)(?:[ \t]+([^\n`]+))?\n([\s\S]*?)\n?```$/gm;
  /** @type {RegExpExecArray | null} */
  let match;
  while ((match = widgetRe.exec(markdown)) !== null) {
    if (match[1] !== 'glossary-widget') continue;
    const attrSource = `${match[2] ?? ''}\n${match[3] ?? ''}`;
    // Same three spellings the renderer accepts (`attrs.slug ?? attrs.term ?? attrs.id`).
    const id =
      extractAttr(attrSource, 'slug') ??
      extractAttr(attrSource, 'term') ??
      extractAttr(attrSource, 'id');
    if (id) terms.add(id);
  }
  return [...terms];
}
