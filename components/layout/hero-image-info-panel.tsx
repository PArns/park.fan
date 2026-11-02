import { Link } from '@/i18n/navigation';
import { PhotoCredit } from '@/components/media/photo-credit';
import type { HeroImageMeta } from '@/lib/media/hero';

/**
 * Hero photo attribution panel (bottom-left, desktop only), pure markup shared by the server
 * caption and the client in-park caption. Bottom-left because Parky's button is fixed to the
 * bottom-right corner, where it would cover the caption on a hero as tall as the window; the hero
 * leaves room under its left column for it (`lg:pb-24` in `app/[locale]/page.tsx`). A photo that
 * is not ours gets its credit under the panel, and in the same corner on the widths that have no
 * panel.
 */
export function HeroImageInfoPanel({
  meta,
  country,
  src,
}: {
  meta: HeroImageMeta;
  country: string;
  /** The photo being captioned, for its credit. */
  src?: string | null;
}) {
  const titleParts = [meta.attractionName, meta.area].filter(Boolean);
  const subtitleParts = [meta.parkName, meta.city, country]
    .filter(Boolean)
    .map((s) => s!.toUpperCase());

  const panel = (
    <div className="rounded-lg bg-white/20 px-3 py-2 shadow-lg backdrop-blur-sm transition-colors dark:bg-black/30">
      {titleParts.length > 0 && (
        <p className="mb-0.5 text-lg leading-tight font-bold text-black/90 dark:text-white">
          {titleParts.join(' · ')}
        </p>
      )}
      <p className="font-mono text-[11px] font-semibold tracking-[0.2em] text-black/55 uppercase dark:text-white/70">
        {subtitleParts.join(' · ')}
      </p>
    </div>
  );

  // `left-4` lines it up with the panel, whose `bottom-6` leaves the badge room beneath it. A
  // sibling of the panel's link, not inside it, so it may link to the photo's source.
  const credit = <PhotoCredit src={src} linked className="right-auto left-4" />;

  if (meta.parkUrl) {
    return (
      <>
        {credit}
        <div className="absolute bottom-6 left-4 hidden lg:block">
          <Link
            href={meta.parkUrl}
            prefetch={false}
            className="block transition-opacity hover:opacity-80"
          >
            {panel}
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      {credit}
      <div className="pointer-events-none absolute bottom-6 left-4 hidden select-none lg:block">
        {panel}
      </div>
    </>
  );
}
