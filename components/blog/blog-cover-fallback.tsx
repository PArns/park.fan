import { cn } from '@/lib/utils';

/**
 * The cover a blog post or news item gets when it has no photo of its own.
 *
 * The brand's dark ground with four lights in the logo's colours and the detailed pin
 * (`logo-dark.svg`) on top — proposal "A" from the 2026-09-30 round. Before it, every surface drew
 * something different for a post without a cover: a pale wash in the banner, a grey gradient in
 * the card, and in every list no thumbnail at all, so a coverless news item read as a different
 * kind of row than its neighbours.
 *
 * **One element, and all of it in CSS** (`.blog-cover-fallback` in `app/globals.css`). The
 * gradient is six layers long and the pin is a background image, so a surface pays 119 bytes of
 * HTML and 137 of RSC payload per post, against 775 and 841 for an `<img>` plus an inline gradient. That matters here more than
 * usual: the header's news and blog panels are server-rendered, hidden, into every page. A
 * background image is also not fetched while its panel is `display: none`.
 *
 * **Not one raster image.** A single 1200×630 file was built and put into every slot first: in the
 * article banner the pin sat behind the teaser, in the card only its tip showed between the two
 * glass panels, and at 88 px it was too small to recognise. So the slot decides where the pin
 * goes (`mark`), and the ground scales to whatever box it is given.
 *
 * **The hue comes from the slug.** Two coverless posts next to each other would otherwise be the
 * same picture twice, which `docs/rules/media-database.md` counts as worse than none. The slug is
 * what every surface has — the lists carry it, the menus and the toast carry the post's path,
 * whose last segment it is (`slugFromPostPath`) — so a post keeps its hue wherever it is listed.
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
