import { ogBackgroundSrc } from '@/lib/og/background-photo';
import type { Locale } from '@/i18n/config';
import { renderOgTextCard } from '@/lib/og/text-card';
// Frontmatter-only lookup: the OG route must not pull the post bodies
// (~900 KB) into its bundle — see lib/blog/listing.ts.
import { getListItemByLocaleSlug } from '@/lib/blog/listing';
import { findCanonicalTag } from '@/lib/blog/tags';
import { resolveCategoryLabel } from '@/lib/blog/categories';
import { getTranslations } from 'next-intl/server';
import { NEWS_CATEGORY } from '@/lib/blog/paths';

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://park.fan';

interface BlogOgParams {
  locale: Locale;
  /** path segments AFTER `<locale>/blog/`, e.g. ['my-post-slug'] or ['tag', 'disney']. */
  segments: string[];
  /** `news` renders the news overview's card (`/api/og/<locale>/news`); `segments` is then empty. */
  section?: 'blog' | 'news';
}

/**
 * Dynamic OG image renderer for every blog surface.
 *
 *   /api/og/<locale>/blog                       → blog index
 *   /api/og/<locale>/blog/<slug>                → single post
 *   /api/og/<locale>/blog/category/<path...>    → category archive
 *   /api/og/<locale>/blog/tag/<tag>             → tag archive
 *   /api/og/<locale>/news                       → news overview (`section: 'news'`)
 *
 * A news post's card is still asked for under `/blog/<slug>`: it is found by its slug either way,
 * and its kicker is its category's label ("News").
 *
 * The renderer is intentionally simple — title, kicker, brand bar — so it
 * works as a fallback when no editorial cover image is set, and as the
 * fall-through OG image for every category/tag listing.
 */
export async function renderBlogOg({
  locale,
  segments,
  section = 'blog',
}: BlogOgParams): Promise<Response> {
  const [first, ...rest] = segments;

  // Try to identify which blog surface we're rendering for. The kicker is a
  // section label only — the brand (park.fan wordmark) lives in the bottom
  // lockup, so it must never repeat "park.fan" here.
  let kicker = '';
  let title = 'Blog';
  let subtitle = '';
  let coverImage: string | null = null;
  let palette: PaletteName = 'cyan';

  if (section === 'news') {
    // /<locale>/news — the overview's own card. It used to be asked for as `blog/news`, which
    // took the post branch below, found no post called "news" and printed the slug as the title.
    title = resolveCategoryLabel(NEWS_CATEGORY, locale, 'News');
    subtitle = (await getTranslations({ locale, namespace: 'news' }))('intro');
    palette = paletteFromString(NEWS_CATEGORY);
  } else if (!first) {
    // /<locale>/blog — articles only; news has its own section and card.
    title = 'Blog';
    subtitle =
      locale === 'de'
        ? 'Reiseberichte, Daten-Deep-Dives & Park-Guides'
        : 'Trip reports, data dives & park guides';
  } else if (first === 'tag') {
    const tagSlug = rest[0];
    const canonical = tagSlug ? findCanonicalTag(locale, tagSlug) : null;
    title = canonical ? `#${canonical}` : `#${tagSlug ?? 'tag'}`;
    kicker = 'Blog · Tag';
    palette = paletteFromString(tagSlug ?? '');
  } else if (first === 'category') {
    const fullPath = rest.join('/');
    const last = rest[rest.length - 1] ?? '';
    title = resolveCategoryLabel(fullPath, locale, last);
    kicker = locale === 'de' ? 'Blog · Kategorie' : 'Blog · Category';
    palette = paletteFromString(fullPath);
  } else {
    // Post slug
    const post = getListItemByLocaleSlug(first, locale);
    if (post) {
      title = post.frontmatter.title;
      subtitle = post.frontmatter.excerpt;
      const coverSrc = post.frontmatter.coverImage?.src;
      // Satori (the renderer behind next/og) can't decode SVGs without an
      // explicit width/height, so we only use raster covers as the OG
      // background. SVG covers fall through to the gradient — which still
      // produces a clean, branded OG card.
      if (coverSrc && !/\.svg(\?|$)/i.test(coverSrc)) {
        // Read off disk when the cover ships with the deployment, exactly like the park/ride
        // cards — otherwise Satori fetches it over the public internet on every render (a
        // ~400 KB JPEG for the covers, now in the media database). Falls back to the absolute URL
        // for anything not traced into this function's bundle, which is the old behaviour.
        coverImage = ogBackgroundSrc(coverSrc, SITE_URL) ?? absoluteUrl(coverSrc);
      }
      const categoryPath = post.frontmatter.category ?? '';
      if (categoryPath) {
        const last = categoryPath.split('/').filter(Boolean).pop() ?? '';
        kicker = resolveCategoryLabel(categoryPath, locale, last);
        palette = paletteFromString(categoryPath);
      }
    } else {
      title = first;
    }
  }

  return renderOgTextCard({
    kicker: { text: kicker },
    title: {
      text: title,
      fontSize: title.length > 60 ? 56 : title.length > 30 ? 72 : 88,
      limit: 140,
    },
    subtitle: { text: subtitle, fontSize: 26, maxWidth: 980 },
    colors: PALETTES[palette],
    coverImage,
  });
}

function absoluteUrl(url: string): string {
  if (url.startsWith('http')) return url;
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

/** Deterministic palette pick from any input string (FNV-1a, 6-way). */
type PaletteName = 'cyan' | 'amber' | 'emerald' | 'rose' | 'violet' | 'fuchsia';
const PALETTES: Record<PaletteName, { kicker: string; glow: string }> = {
  cyan: { kicker: '#38bdf8', glow: 'rgba(56,189,248,0.35)' },
  amber: { kicker: '#fbbf24', glow: 'rgba(251,191,36,0.30)' },
  emerald: { kicker: '#34d399', glow: 'rgba(52,211,153,0.30)' },
  rose: { kicker: '#fb7185', glow: 'rgba(251,113,133,0.30)' },
  violet: { kicker: '#a78bfa', glow: 'rgba(167,139,250,0.30)' },
  fuchsia: { kicker: '#e879f9', glow: 'rgba(232,121,249,0.30)' },
};
function paletteFromString(s: string): PaletteName {
  if (!s) return 'cyan';
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  const keys: PaletteName[] = ['cyan', 'amber', 'emerald', 'rose', 'violet', 'fuchsia'];
  return keys[Math.abs(h) % keys.length];
}
