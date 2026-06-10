import { escapeJsonLd } from './structured-data';
import type { Blog, BlogPosting, WithContext } from 'schema-dts';
import type { BlogListItem, BlogPost } from '@/lib/blog/types';

const SITE_URL = 'https://park.fan';
const ORG = {
  '@type': 'Organization',
  name: 'park.fan',
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/logo-big.svg`,
  },
};

function absoluteUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
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
  const author =
    typeof frontmatter.author === 'string'
      ? { name: frontmatter.author }
      : (frontmatter.author ?? { name: 'park.fan' });

  const canonical = `${SITE_URL}/${locale}${path}`;
  const cover = absoluteUrl(frontmatter.coverImage?.src);

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
    keywords: frontmatter.tags && frontmatter.tags.length > 0 ? frontmatter.tags.join(', ') : undefined,
    wordCount: post.content ? post.content.split(/\s+/).filter(Boolean).length : undefined,
    timeRequired: `PT${post.readingTimeMinutes}M`,
    articleSection: frontmatter.category,
    author: {
      '@type': 'Person',
      name: author.name,
      ...(author.url ? { url: author.url } : {}),
      ...(author.bio ? { description: author.bio } : {}),
      ...(author.avatar ? { image: absoluteUrl(author.avatar) } : {}),
    },
    publisher: ORG,
    ...(cover
      ? {
          image: {
            '@type': 'ImageObject',
            url: cover,
            ...(frontmatter.coverImage?.alt ? { caption: frontmatter.coverImage.alt } : {}),
          },
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: escapeJsonLd(data) }}
    />
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
      ...(p.frontmatter.coverImage?.src
        ? { image: absoluteUrl(p.frontmatter.coverImage.src) }
        : {}),
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: escapeJsonLd(data) }}
    />
  );
}
