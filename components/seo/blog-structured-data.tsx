import { escapeJsonLd } from './structured-data';
import type {
  Blog,
  BlogPosting,
  CollectionPage,
  ImageObject,
  NewsArticle,
  WithContext,
} from 'schema-dts';
import type { BlogFrontmatter, BlogListItem, BlogPost } from '@/lib/blog/types';
import { resolveAuthor } from '@/lib/blog/authors';
import type { Locale } from '@/i18n/config';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { versionedPath } from '@/lib/media/focus';
import { isNewsCategory, postPath } from '@/lib/blog/paths';
import { getBlogImageDimensions } from '@/lib/blog/image-dimensions';
import { fitWithin } from '@/lib/utils/metadata';
import { withZoneOffset } from '@/lib/blog/published-at';

const SITE_URL = 'https://park.fan';
/**
 * The publisher of every post, article and news alike. The logo is the PNG, not the SVG: Google
 * wants `publisher.logo` in a format Google Images supports, and SVG is not one.
 */
const ORG = {
  '@type': 'Organization',
  // The `@id` of the Organization node every page emits (`ORGANIZATION_ID` in
  // `components/seo/structured-data.tsx`), so a crawler reads the publisher of a post and the
  // site's Organization as one entity instead of two that happen to share a name.
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

function absoluteUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * Representative image for a post's structured data: the `seo.ogImage` override, then the cover
 * photo, then the generated OG card, as in the post page's OG metadata. Content-versioned, so a
 * re-cropped cover does not linger in search results behind long-lived caches.
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
 * `datePublished` and `dateModified` for one post. A post without `updatedAt` (every news post) was
 * last modified when it went out, time included.
 */
function articleDates(fm: BlogFrontmatter): { datePublished: string; dateModified: string } {
  const datePublished = withZoneOffset(fm.date, fm.time);
  return {
    datePublished,
    dateModified: fm.updatedAt ? withZoneOffset(fm.updatedAt) : datePublished,
  };
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
 * Article JSON-LD for a single blog post: `NewsArticle` for a news post, which Top Stories and
 * Google News read, and `BlogPosting` for every other post.
 */
export function BlogPostingStructuredData({ post, locale, path }: BlogPostingStructuredDataProps) {
  const { frontmatter } = post;
  // `author: patrick` is a registry key, not a display name; it is resolved as on the visible page,
  // because `author.name` is the byline Google shows.
  const author = resolveAuthor(frontmatter.author, locale as Locale);
  // Google wants `author.url` to point at a page ABOUT the author. For a registry author that
  // is our own profile page; the personal site then belongs in `sameAs`.
  const authorProfile = author.key ? `${SITE_URL}/${locale}/blog/authors/${author.key}` : undefined;
  // Deduped: `url` and `links.website` are usually the same address.
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
  const { datePublished, dateModified } = articleDates(frontmatter);

  const data: WithContext<BlogPosting | NewsArticle> = {
    '@context': 'https://schema.org',
    '@type': isNews ? 'NewsArticle' : 'BlogPosting',
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    headline: isNews ? newsHeadline(frontmatter) : (frontmatter.seo?.title ?? frontmatter.title),
    description: frontmatter.seo?.description ?? frontmatter.excerpt,
    url: canonical,
    inLanguage: locale,
    datePublished,
    dateModified,
    keywords:
      frontmatter.tags && frontmatter.tags.length > 0 ? frontmatter.tags.join(', ') : undefined,
    wordCount: post.content ? post.content.split(/\s+/).filter(Boolean).length : undefined,
    timeRequired: `PT${post.readingTimeMinutes}M`,
    articleSection: frontmatter.category,
    author: {
      '@type': 'Person',
      // One node per registry author across every post and locale.
      ...(author.key ? { '@id': `${SITE_URL}/#person-${author.key}` } : {}),
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
 * `Blog` JSON-LD for the blog index and category pages, with `blogPost` references to the listed
 * posts.
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
      ...articleDates(p.frontmatter),
      image: resolvePostImage(locale, p.slug, p.frontmatter),
    })),
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escapeJsonLd(data) }} />
  );
}

interface NewsListingStructuredDataProps {
  locale: string;
  description: string;
  posts: readonly BlogListItem[];
  /** Locale-relative path of the overview, `/news`. */
  path: string;
  name: string;
}

/**
 * JSON-LD for the news overview: a `CollectionPage` whose main entity is an `ItemList` of the news
 * posts, newest first, each a `NewsArticle` reference. Not `Blog`, whose entries are
 * `BlogPosting`s, while each post it lists calls itself a `NewsArticle`.
 */
export function NewsListingStructuredData({
  locale,
  description,
  posts,
  path,
  name,
}: NewsListingStructuredDataProps) {
  const canonical = `${SITE_URL}/${locale}${path}`;
  const data: WithContext<CollectionPage> = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: canonical,
    inLanguage: locale,
    publisher: ORG,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: posts.length,
      itemListElement: posts.map((p, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'NewsArticle',
          headline: newsHeadline(p.frontmatter),
          url: `${SITE_URL}/${locale}${postPath(p)}`,
          ...articleDates(p.frontmatter),
          image: resolvePostImage(locale, p.slug, p.frontmatter),
        },
      })),
    },
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escapeJsonLd(data) }} />
  );
}
