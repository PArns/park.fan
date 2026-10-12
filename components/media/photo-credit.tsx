import { getPhotoAttribution } from '@/lib/media/attribution';
import { cn } from '@/lib/utils';

/**
 * The corner for a photo painted behind a page: top right, just under the 48 px header. The page's
 * cards cover the rest of the photo; the strip above the first card shows at every width.
 */
export const BACKDROP_CREDIT_POSITION = 'top-[calc(3rem+6px)] bottom-auto';

/** The corner for a tile whose label stands on the foot of the photo: top right instead. */
export const TILE_CREDIT_POSITION = 'top-1.5 bottom-auto';

interface PhotoCreditProps {
  /**
   * Ready-to-render attribution line, e.g. `© 2026 Anakin (hampter)`, for a caller that resolved
   * it already (a blog cover's frontmatter, a server-side `getCreditLine`). Wins over `src`.
   */
  credit?: string | null;
  /**
   * The path the photo is painted from. Its credit comes from the media database's attribution
   * table, which lists only photos that need one, so an own shoot renders nothing and the caller
   * never gates the render itself.
   */
  src?: string | null;
  /**
   * Link the line to the page the photo came from, when the sidecar records one. Leave it off
   * inside a link (a card, a menu tile): an `<a>` may not contain another.
   */
  linked?: boolean;
  className?: string;
}

/**
 * Small on-image credit badge for a photo that isn't ours — stock, press, a
 * contribution. Own shoots stay quiet; the sidecar already carries their
 * credit and nobody needs to be told the picture is park.fan's own.
 *
 * Needs a `relative` ancestor to place against — drop it inside the same
 * wrapper as the `<Image>` it credits.
 */
export function PhotoCredit({ credit, src, linked = false, className }: PhotoCreditProps) {
  const attribution = credit ? null : getPhotoAttribution(src);
  const line = credit ?? attribution?.line;
  if (!line) return null;

  const href = linked ? attribution?.url : null;
  const classes = cn(
    // `max-w` + `truncate`: on a narrow tile the line gives way at its end instead of
    // overflowing the photo.
    'absolute right-1.5 bottom-1.5 z-10 max-w-[calc(100%-0.75rem)] truncate rounded bg-black/55 px-1.5 py-0.5 text-[10px] leading-none text-white/90 backdrop-blur-sm',
    href ? 'pointer-events-auto hover:text-white hover:underline' : 'pointer-events-none',
    className
  );

  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer nofollow" className={classes}>
      {line}
    </a>
  ) : (
    <span className={classes}>{line}</span>
  );
}
