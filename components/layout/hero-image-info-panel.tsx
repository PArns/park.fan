import { Link } from '@/i18n/navigation';
import type { HeroImageMeta } from '@/lib/hero-images-meta';

/**
 * Presentational hero image attribution panel (bottom-left, desktop only). Pure markup with no data
 * fetching, so both the server caption ({@link HeroImageInfo}) and the client in-park caption can
 * reuse the exact same styling — only the resolved `country` string differs by caller.
 */
export function HeroImageInfoPanel({ meta, country }: { meta: HeroImageMeta; country: string }) {
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

  if (meta.parkUrl) {
    return (
      <div className="absolute bottom-14 left-4 hidden lg:block">
        <Link
          href={meta.parkUrl}
          prefetch={false}
          className="block transition-opacity hover:opacity-80"
        >
          {panel}
        </Link>
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute bottom-14 left-4 hidden select-none lg:block">
      {panel}
    </div>
  );
}
