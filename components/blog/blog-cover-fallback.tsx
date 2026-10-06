import { cn } from '@/lib/utils';

/**
 * The cover a blog post or news item gets when it has no photo of its own: the brand's dark ground
 * with lights in the logo's colours and the detailed pin, the same on every surface. One element,
 * all of it CSS (`.blog-cover-fallback` in `app/globals.css`), because the header's hidden news and
 * blog panels render it into every page and a background image is not fetched under
 * `display: none`. The slot decides where the pin goes (`mark`), and the hue comes from the slug,
 * so two coverless posts side by side differ and a post keeps its hue everywhere.
 */

const HUES = ['blue', 'green', 'cyan'] as const;
export type CoverFallbackHue = (typeof HUES)[number];

/** FNV-1a over the slug, three ways. */
export function coverFallbackHue(slug: string): CoverFallbackHue {
  let h = 0x811c9dc5;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return HUES[(h >>> 0) % HUES.length];
}

/** The slug of a post from its locale-relative path (`/blog/<slug>`, `/news/<slug>`). */
export function slugFromPostPath(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1);
}

interface BlogCoverFallbackProps {
  /** The post's slug; picks the hue. Not needed when `ground` is off. */
  slug?: string;
  /**
   * Where the pin goes. `center` for thumbnails and the card's photo strip; `side` for the
   * article banner, right of the headline column and only from `lg` up, where there is room for
   * it; `none` for the ground alone.
   */
  mark?: 'center' | 'side' | 'none';
  /**
   * Off draws the pin alone. The card needs that: its ground covers the whole card under the
   * glass, and a second ground in the photo strip would not line up with the first at its edges.
   */
  ground?: boolean;
  /** Positioning is the caller's; the element fills its box (`absolute inset-0`) by default. */
  className?: string;
}

/**
 * The cover drawn for a post or news item without a photo: one CSS-only element with the brand
 * ground, a hue picked from the slug and the pin placed by `mark`.
 */
export function BlogCoverFallback({
  slug = '',
  mark = 'center',
  ground = true,
  className,
}: BlogCoverFallbackProps) {
  return (
    <span
      aria-hidden="true"
      data-hue={ground ? coverFallbackHue(slug) : undefined}
      data-ground={ground ? undefined : 'none'}
      data-mark={mark === 'none' ? undefined : mark}
      className={cn('blog-cover-fallback absolute inset-0 block', className)}
    />
  );
}
