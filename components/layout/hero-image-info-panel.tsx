import { Link } from '@/i18n/navigation';
import { PhotoCredit } from '@/components/media/photo-credit';
import type { HeroImageMeta } from '@/lib/media/hero';

/**
 * Hero photo attribution panel (desktop only), pure markup shared by the server caption and the
 * client in-park caption, in the photo's top-right corner. A photo that is not ours gets its credit
 * under it, and in the same corner on the widths that have no caption.
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

  // In the photo's top-right corner, under the header: the text stands at the left and low, the
  // cards over the photo's lower edge, so the corner is the part of the photo nothing covers. The
  // credit, for a photo that is not ours, follows under the caption, and stands there alone on the
  // widths without a caption; a sibling of the caption's link, so it may link to the source.
  const credit = <PhotoCredit src={src} linked className="static max-w-full" />;
  const caption = meta.parkUrl ? (
    <Link
      href={meta.parkUrl}
      prefetch={false}
      className="block transition-opacity hover:opacity-80"
    >
      {panel}
    </Link>
  ) : (
    <div className="pointer-events-none select-none">{panel}</div>
  );

  return (
    <div className="absolute top-16 right-4 z-10 flex max-w-sm flex-col items-end gap-1.5 text-right lg:top-20 lg:right-6">
      <div className="hidden lg:block">{caption}</div>
      {credit}
    </div>
  );
}
