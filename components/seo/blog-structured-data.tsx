import { escapeJsonLd } from './structured-data';
import type { Blog, BlogPosting, ImageObject, NewsArticle, WithContext } from 'schema-dts';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import type { BlogFrontmatter, BlogListItem, BlogPost } from '@/lib/blog/types';
import { resolveAuthor } from '@/lib/blog/authors';
import type { Locale } from '@/i18n/config';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { versionedPath } from '@/lib/media/focus';
import { isNewsCategory, postPath } from '@/lib/blog/paths';
import { getBlogImageDimensions } from '@/lib/blog/image-dimensions';
import { fitWithin } from '@/lib/utils/metadata';

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

/** Google's limit for a `NewsArticle` headline; a longer one is dropped from Top Stories. */
const NEWS_HEADLINE_MAX = 110;
/** Google wants at least one `NewsArticle` image this wide for the large result card. */
const NEWS_IMAGE_MIN_WIDTH = 1200;
/** The generated card from `/api/og` is always this size. */
const OG_CARD_SIZE = { width: 1200, height: 630 } as const;

/** schema.org types `width`/`height` as Distance, which is Text; Google reads the number in it. */
function sizeOf(size: { width: number; height: number }): { width: string; height: string } {
  return { width: String(size.width), height: String(size.height) };
}
/**
 * Frontmatter dates are calendar days (`2026-09-23`) without a clock, written in Germany.
 * `NewsArticle` wants a timestamp with an offset, so a news date is read as local midnight
 * there. Berlin switches DST at 02:00, so `T00:00:00` always exists (see G-39 for the zones
 * where it does not).
 */
const NEWS_TIME_ZONE = 'Europe/Berlin';

/** `2026-09-23` → `2026-09-23T00:00:00+02:00`. Anything that is not a bare day passes through. */
function withZoneOffset(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  return formatInTimeZone(
    fromZonedTime(`${date}T00:00:00`, NEWS_TIME_ZONE),
    NEWS_TIME_ZONE,
    "yyyy-MM-dd'T'HH:mm:ssXXX"
  );
}

/**
 * Headline within {@link NEWS_HEADLINE_MAX}: the SEO title, else the title, and only when
 * both overrun, the shorter one cut at a word boundary.
 */
function newsHeadline(frontmatter: BlogFrontmatter): string {
  const headline = fitWithin(
    NEWS_HEADLINE_MAX,
    frontmatter.seo?.title ?? frontmatter.title,
    frontmatter.title
  );
  if (headline.length <= NEWS_HEADLINE_MAX) return headline;
  const cut = headline.slice(0, NEWS_HEADLINE_MAX - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > 0 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

/**
 * The `image` list of a news post: the post image with its size from the media database, then
 * the generated 1200 px OG card whenever the post image is narrower than
 * {@link NEWS_IMAGE_MIN_WIDTH} or its size is unknown. That keeps one image at 1200 px or more
 * in every list without dropping the real photo.
 */
function newsImages(
  locale: string,
  slug: string,
  frontmatter: BlogFrontmatter,
  primary: ImageObject,
  primaryUrl: string
): ImageObject[] {
  const ogCard = getOgImageUrl([locale, 'blog', slug]);
  if (primaryUrl === ogCard) return [{ ...primary, ...sizeOf(OG_CARD_SIZE) }];

  const src = frontmatter.seo?.ogImage ?? frontmatter.coverImage?.src;
  const size = src && !src.startsWith('http') ? getBlogImageDimensions(src) : null;
  const images: ImageObject[] = [size ? { ...primary, ...sizeOf(size) } : primary];
  if (!size || size.width < NEWS_IMAGE_MIN_WIDTH) {
    images.push({ '@type': 'ImageObject', url: ogCard, ...sizeOf(OG_CARD_SIZE) });
  }
  return images;
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
 *
 * A news post (`isNewsCategory`) sends `NewsArticle`, which Top Stories and Google News read,
 * with a headline of at most 110 characters, dates with an offset and an image list that holds
 * one image of 1200 px or more. Every other post sends `BlogPosting`, unchanged.
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
  const isNews = isNewsCategory(frontmatter.category);
  const image: ImageObject = {
    '@type': 'ImageObject',
    url: imageUrl,
    // Caption only when the image IS the cover photo (the OG-card fallback has none).
    ...(frontmatter.coverImage?.alt && imageUrl === coverUrl
      ? { caption: frontmatter.coverImage.alt }
      : {}),
  };
  const datePublished = frontmatter.date;
  const dateModified = frontmatter.updatedAt ?? frontmatter.date;

  const data: WithContext<BlogPosting | NewsArticle> = {
    '@context': 'https://schema.org',
    '@type': isNews ? 'NewsArticle' : 'BlogPosting',
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    headline: isNews ? newsHeadline(frontmatter) : (frontmatter.seo?.title ?? frontmatter.title),
    description: frontmatter.seo?.description ?? frontmatter.excerpt,
    url: canonical,
    inLanguage: locale,
    datePublished: isNews ? withZoneOffset(datePublished) : datePublished,
    dateModified: isNews ? withZoneOffset(dateModified) : dateModified,
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
    image: isNews ? newsImages(locale, post.slug, frontmatter, image, imageUrl) : image,
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
      url: `${SITE_URL}/${locale}${postPath(p)}`,
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
