import 'server-only';
import type { Person } from 'schema-dts';
import type { Locale } from '@/i18n/config';
import type { ResolvedAuthor } from '@/lib/blog/authors';

const SITE_URL = 'https://park.fan';

/**
 * The publisher of every article, blog post and guide page alike. The logo is the PNG, not the
 * SVG: Google wants `publisher.logo` in a format Google Images supports, and SVG is not one. The
 * `@id` is the Organization node every page emits (`ORGANIZATION_ID` in
 * `components/seo/structured-data.tsx`), so a crawler reads one entity instead of two.
 */
export const PUBLISHER_ORGANIZATION = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'park.fan',
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/logo-big.png`,
    width: '1024',
    height: '1024',
  },
} as const;

/**
 * The author of the pages that are not blog posts (the guide, the best-time hub, the fancast).
 * park.fan is one person's project with no organisation behind it, so these name him too.
 */
export const SITE_AUTHOR_KEY = 'patrick';

/**
 * The `Person` node for an article's author: one `@id` per registry author across every post,
 * guide and locale. Google wants `url` to point at a page about the author, which for a registry
 * author is our own profile page; the personal site then belongs in `sameAs`.
 */
export function authorPersonNode(author: ResolvedAuthor, locale: Locale): Person {
  const profile = author.key ? `${SITE_URL}/${locale}/blog/authors/${author.key}` : undefined;
  // Deduped: `url` and `links.website` are usually the same address.
  const sameAs = [
    ...new Set(
      [author.url, ...Object.values(author.links ?? {})].filter(
        (u): u is string => typeof u === 'string' && u.length > 0 && u !== profile
      )
    ),
  ];
  const url = profile ?? author.url;

  return {
    '@type': 'Person',
    ...(author.key ? { '@id': `${SITE_URL}/#person-${author.key}` } : {}),
    name: author.name,
    ...(url ? { url } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    ...(author.role ? { jobTitle: author.role } : {}),
    ...(author.bio ? { description: author.bio } : {}),
    ...(author.avatar ? { image: absoluteUrl(author.avatar) } : {}),
  };
}

/** A site-relative path made absolute on park.fan; an absolute URL passes through. */
export function absoluteUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}
