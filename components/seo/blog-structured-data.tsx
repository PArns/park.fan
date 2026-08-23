import { escapeJsonLd } from './structured-data';
import type { Blog, BlogPosting, WithContext } from 'schema-dts';
import type { BlogFrontmatter, BlogListItem, BlogPost } from '@/lib/blog/types';
import { resolveAuthor } from '@/lib/blog/authors';
import type { Locale } from '@/i18n/config';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { versionedPath } from '@/lib/media/focus';

const SITE_URL = 'https://park.fan';
const ORG = {
  '@type': 'Organization',
  name: 'park.fan',
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/logo-big.svg`,
  },
} as const;

function absoluteUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * Representative image for a post's structured data. Prefers real imagery (an
 * explicit `seo.ogImage` override, then the cover photo) and falls back to the
 * post's generated OG card, so every linked post still carries an image. Mirrors
 * the OG-metadata chain in the blog post page.
 *
 * Content-versioned, like the park and ride structured data already is. A cover
 * is usually a build-time crop, `/media` is served with a month of `max-age`, and
 * a crawler re-fetches on its own schedule on top of that — so an unversioned URL
 * means a retargeted focal point shows up in search results as the old framing for
 * as long as everyone's caches feel like it.
 */
function resolvePostImage(locale: string, slug: string, frontmatter: BlogFrontmatter): string {
  return (
    absoluteUrl(frontmatter.seo?.ogImage) ??
    absoluteUrl(versionedPath(frontmatter.coverImage?.src)) ??
    getOgImageUrl([locale, 'blog', slug])
  );
}

interface BlogPostingStructuredDataProps {
  post: BlogPost;
  locale: string;
  /** Locale-relative path of the post (e.g. `/blog/my-post`). */
  path: string;
}

/**
 * Article-shaped JSON-LD for a single blog post. Surfaces author, publisher,
 * publish/update dates, the cover image, keywords (tags) and a few internal
 * links so Google can build rich-result cards for the post.
 */
export function BlogPostingStructuredData({ post, locale, path }: BlogPostingStructuredDataProps) {
  const { frontmatter } = post;
  // `author: patrick` in frontmatter is a REGISTRY KEY, not a display name. Taking it verbatim
  // published `"author": {"name": "patrick"}` — the byline Google shows in article results —
  // and dropped the url/avatar/bio the registry has. The visible page already resolves it
  // (`resolveAuthor` in the post page); the JSON-LD has to do the same.
  const author = resolveAuthor(frontmatter.author, locale as Locale);
  // Google wants `author.url` to point at a page ABOUT the author. For a registry author that
  // is our own profile page; the personal site then belongs in `sameAs`.
  const authorProfile = author.key ? `${SITE_URL}/${locale}/blog/authors/${author.key}` : undefined;
  // Deduped: `url` and `links.website` are usually the same address, which otherwise
  // listed the personal site twice.
  const authorSameAs = [
    ...new Set(
      [author.url, ...Object.values(author.links ?? {})].filter(
        (u): u is string => typeof u === 'string' && u.length > 0 && u !== authorProfile
      )
    ),
  ];

  const canonical = `${SITE_URL}/${locale}${path}`;
  const imageUrl = resolvePostImage(locale, post.slug, frontmatter);
  // Versioned the same way `resolvePostImage` is, or the identity check below stops
  // matching and the cover's caption silently disappears from the structured data.
  const coverUrl = absoluteUrl(versionedPath(frontmatter.coverImage?.src));

  const data: WithContext<BlogPosting> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    headline: frontmatter.seo?.title ?? frontmatter.title,
    description: frontmatter.seo?.description ?? frontmatter.excerpt,
    url: canonical,
    inLanguage: locale,
    datePublished: frontmatter.date,
    dateModified: frontmatter.updatedAt ?? frontmatter.date,
    keywords:
      frontmatter.tags && frontmatter.tags.length > 0 ? frontmatter.tags.join(', ') : undefined,
    wordCount: post.content ? post.content.split(/\s+/).filter(Boolean).length : undefined,
    timeRequired: `PT${post.readingTimeMinutes}M`,
    articleSection: frontmatter.category,
    author: {
      '@type': 'Person',
      name: author.name,
      ...((authorProfile ?? author.url) ? { url: authorProfile ?? author.url } : {}),
      ...(authorSameAs.length > 0 ? { sameAs: authorSameAs } : {}),
      ...(author.role ? { jobTitle: author.role } : {}),
      ...(author.bio ? { description: author.bio } : {}),
      ...(author.avatar ? { image: absoluteUrl(author.avatar) } : {}),
    },
    publisher: ORG,
    image: {
      '@type': 'ImageObject',
      url: imageUrl,
      // Caption only when the image IS the cover photo (the OG-card fallback has none).
      ...(frontmatter.coverImage?.alt && imageUrl === coverUrl
        ? { caption: frontmatter.coverImage.alt }
        : {}),
    },
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escapeJsonLd(data) }} />
  );
}

interface BlogStructuredDataProps {
  locale: string;
  description: string;
  posts: BlogListItem[];
  /** Locale-relative path (`/blog` or `/blog/category/foo`). */
  path: string;
  /** Heading for this listing (e.g. "Blog" or the category label). */
  name: string;
}

/**
 * Blog-shaped JSON-LD for listing pages (index + category). Includes
 * `blogPost` references for the visible items so Google can connect the
 * listing back to the individual posts.
 */
export function BlogStructuredData({
  locale,
  description,
  posts,
  path,
  name,
}: BlogStructuredDataProps) {
  const canonical = `${SITE_URL}/${locale}${path}`;
  const data: WithContext<Blog> = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name,
    description,
    url: canonical,
    inLanguage: locale,
    publisher: ORG,
    blogPost: posts.map((p) => ({
      '@type': 'BlogPosting',
      headline: p.frontmatter.title,
      url: `${SITE_URL}/${locale}/blog/${p.slug}`,
      datePublished: p.frontmatter.date,
      dateModified: p.frontmatter.updatedAt ?? p.frontmatter.date,
      // Real cover photo preferred; generated OG card as fallback so every listed
      // post carries an image when linked.
      image: resolvePostImage(locale, p.slug, p.frontmatter),
    })),
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escapeJsonLd(data) }} />
  );
}
