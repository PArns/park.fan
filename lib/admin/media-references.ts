import { BLOG_POST_BODIES } from '@/lib/blog/manifest-bodies';

/**
 * Which blog posts point at an image, and how to repoint them when it moves.
 *
 * Moving an image is the one admin edit that changes its URL. Retagging does not:
 * `park`, `ride`, `roles` and text are not part of the path, and the content
 * version is `sha1(bytes + focus)`, so even assigning a park leaves `?v=` alone.
 * A move renames the file, and a post still naming the old path renders a 404 with
 * a green build — which is exactly what happened when four duplicate images were
 * merged and a gallery kept pointing at the file that went away.
 *
 * That left an unpleasant trade: leave the tree disorganised, or tidy it up and
 * break articles. Rewriting the references in the same pull request removes the
 * trade — the tree can be filed by park, and moving stops costing anything.
 *
 * The lookup runs against the build-time bodies manifest rather than GitHub, so
 * finding the affected posts costs no API calls; only the posts that actually
 * match are then fetched and rewritten.
 */

/** `de/phantasialand-tipps` → `content/blog/de/phantasialand-tipps.md`. */
export function postFilePath(key: string): string {
  return `content/blog/${key}.md`;
}

/**
 * Every path form an image occupies: the source and its three build-time crops.
 *
 * A post may legitimately reference `…-16x9.jpg` — several do — and those move
 * with the source even though they are generated, so the pattern has to cover
 * them. The extension is matched loosely because a `replace` can change it.
 */
function pathPattern(collection: string, name: string): RegExp {
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(
    `/media/${escape(collection)}/${escape(name)}(-(?:16x9|4x3|1x1))?\\.([a-z0-9]+)`,
    'gi'
  );
}

/** The post keys (`<locale>/<slug>`) whose body references the image. */
export function postsReferencing(collection: string, name: string): string[] {
  const pattern = pathPattern(collection, name);
  return Object.entries(BLOG_POST_BODIES)
    .filter(([, body]) => {
      pattern.lastIndex = 0;
      return pattern.test(body ?? '');
    })
    .map(([key]) => key);
}

/**
 * Rewrite every reference to an image so it points at where the image went.
 *
 * The crop suffix is preserved and the extension is taken from the destination,
 * because a move can be a `replace` at the same time — a PNG swapped for a JPEG
 * lands under a new extension, and a reference kept at `.png` would 404 just as
 * hard as one kept in the old folder.
 */
export function rewriteReferences(
  body: string,
  from: { collection: string; name: string },
  to: { collection: string; name: string; ext: string }
): { body: string; changed: number } {
  let changed = 0;
  const next = body.replace(pathPattern(from.collection, from.name), (_match, crop) => {
    changed += 1;
    return `/media/${to.collection}/${to.name}${crop ?? ''}.${to.ext}`;
  });
  return { body: next, changed };
}
