import { BLOG_POST_BODIES } from '@/lib/blog/manifest-bodies';

/**
 * Which blog posts point at an image, and how to repoint them when it moves. A move is the one
 * admin edit that changes an image's URL, and a post still naming the old path renders a 404
 * through a green build, so the references are rewritten in the same pull request. The lookup
 * reads the build-time bodies manifest, so it costs no GitHub calls.
 */

/** `de/phantasialand-tipps` → `content/blog/de/phantasialand-tipps.md`. */
export function postFilePath(key: string): string {
  return `content/blog/${key}.md`;
}

/**
 * Every path form an image occupies: the source and its three build-time crops, which posts
 * reference too. The extension is matched loosely because a `replace` can change it.
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
 * Rewrites every reference to an image so it points at where the image went. The crop suffix is
 * kept and the extension comes from the destination, because a move can also swap a PNG for a
 * JPEG.
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
