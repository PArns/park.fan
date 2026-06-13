import { ImageResponse } from 'next/og';
import type { Locale } from '@/i18n/config';
import { getPostByLocaleSlug } from '@/lib/blog';
import { findCanonicalTag } from '@/lib/blog/tags';
import { resolveCategoryLabel } from '@/lib/blog/categories';

const WIDTH = 1200;
const HEIGHT = 630;
const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://park.fan';

interface BlogOgParams {
  locale: Locale;
  /** path segments AFTER `<locale>/blog/`, e.g. ['my-post-slug'] or ['tag', 'disney']. */
  segments: string[];
}

/**
 * Dynamic OG image renderer for every blog surface.
 *
 *   /api/og/<locale>/blog                       → blog index
 *   /api/og/<locale>/blog/<slug>                → single post
 *   /api/og/<locale>/blog/category/<path...>    → category archive
 *   /api/og/<locale>/blog/tag/<tag>             → tag archive
 *
 * The renderer is intentionally simple — title, kicker, brand bar — so it
 * works as a fallback when no editorial cover image is set, and as the
 * fall-through OG image for every category/tag listing.
 */
export async function renderBlogOg({ locale, segments }: BlogOgParams): Promise<Response> {
  const [first, ...rest] = segments;

  // Try to identify which blog surface we're rendering for.
  let kicker = 'park.fan · Blog';
  let title = 'Blog';
  let subtitle = '';
  let coverImage: string | null = null;
  let palette: PaletteName = 'cyan';

  if (!first) {
    // /<locale>/blog
    title = locale === 'de' ? 'Blog' : 'Blog';
    subtitle =
      locale === 'de'
        ? 'Reiseberichte, Daten-Deep-Dives & Park-News'
        : 'Trip reports, data dives & theme-park news';
  } else if (first === 'tag') {
    const tagSlug = rest[0];
    const canonical = tagSlug ? findCanonicalTag(locale, tagSlug) : null;
    title = canonical ? `#${canonical}` : `#${tagSlug ?? 'tag'}`;
    kicker = locale === 'de' ? 'park.fan · Blog · Tag' : 'park.fan · Blog · Tag';
    palette = paletteFromString(tagSlug ?? '');
  } else if (first === 'category') {
    const fullPath = rest.join('/');
    const last = rest[rest.length - 1] ?? '';
    title = resolveCategoryLabel(fullPath, locale, last);
    kicker = locale === 'de' ? 'park.fan · Blog · Kategorie' : 'park.fan · Blog · Category';
    palette = paletteFromString(fullPath);
  } else {
    // Post slug
    const post = getPostByLocaleSlug(first, locale);
    if (post) {
      title = post.frontmatter.title;
      subtitle = post.frontmatter.excerpt;
      const coverSrc = post.frontmatter.coverImage?.src;
      // Satori (the renderer behind next/og) can't decode SVGs without an
      // explicit width/height, so we only use raster covers as the OG
      // background. SVG covers fall through to the gradient — which still
      // produces a clean, branded OG card.
      if (coverSrc && !/\.svg(\?|$)/i.test(coverSrc)) {
        coverImage = absoluteUrl(coverSrc);
      }
      const categoryPath = post.frontmatter.category ?? '';
      if (categoryPath) {
        const last = categoryPath.split('/').filter(Boolean).pop() ?? '';
        kicker = `park.fan · ${resolveCategoryLabel(categoryPath, locale, last)}`;
        palette = paletteFromString(categoryPath);
      }
    } else {
      title = first;
    }
  }

  const colors = PALETTES[palette];

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        backgroundColor: '#0f172a',
        color: 'white',
        fontFamily: '"Inter"',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Cover image (when available) */}
      {coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverImage}
          alt=""
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.45,
          }}
        />
      )}

      {/* Palette-tinted vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 80% 20%, ${colors.glow}, transparent 60%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, rgba(15,23,42,0.55) 0%, rgba(15,23,42,0.92) 100%)',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          height: '100%',
          width: '100%',
        }}
      >
        {/* Top kicker row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            color: colors.kicker,
          }}
        >
          <span
            style={{
              display: 'flex',
              width: 8,
              height: 8,
              borderRadius: 999,
              background: colors.kicker,
            }}
          />
          {kicker}
        </div>

        {/* Title block */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              fontSize: title.length > 60 ? 56 : title.length > 30 ? 72 : 88,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -1.5,
              maxWidth: 1050,
              color: '#ffffff',
            }}
          >
            {clamp(title, 140)}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: 26,
                fontWeight: 400,
                lineHeight: 1.35,
                maxWidth: 980,
                color: 'rgba(255,255,255,0.82)',
              }}
            >
              {clamp(subtitle, 180)}
            </div>
          )}
        </div>

        {/* Brand bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 0,
              fontSize: 38,
              fontWeight: 800,
              letterSpacing: -1,
            }}
          >
            <span style={{ color: '#ffffff' }}>park</span>
            <span style={{ color: colors.kicker }}>.fan</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 22,
              color: 'rgba(255,255,255,0.65)',
            }}
          >
            {SITE_URL.replace(/^https?:\/\//, '')}
          </div>
        </div>
      </div>
    </div>,
    { width: WIDTH, height: HEIGHT }
  );
}

function absoluteUrl(url: string): string {
  if (url.startsWith('http')) return url;
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

function clamp(text: string, limit: number): string {
  if (text.length <= limit) return text;
  return text.slice(0, limit - 1).trimEnd() + '…';
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
